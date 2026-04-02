"""Game Room Manager - manages active game rooms, matchmaking, and Socket.io events."""
import random
import string
import asyncio
from typing import Optional
import socketio

from app.game.engine import LudoGame
from app.services.auth import get_user_id_from_token

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
)

# Active game rooms: room_code -> LudoGame
active_games: dict[str, LudoGame] = {}

# User session mapping: sid -> {user_id, username, room_code}
user_sessions: dict[str, dict] = {}

# User to sid mapping: user_id -> sid
user_sids: dict[int, str] = {}

# Matchmaking queues: game_mode -> list of {user_id, sid, display_name}
matchmaking_queues: dict[str, list] = {
    "classic": [],
    "quick": [],
    "master": [],
    "rush": [],
}


def generate_room_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@sio.event
async def connect(sid, environ, auth=None):
    """Handle client connection."""
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")
    if not token:
        # Try query string
        query = environ.get("QUERY_STRING", "")
        for param in query.split("&"):
            if param.startswith("token="):
                token = param.split("=")[1]
                break

    if token:
        user_id = get_user_id_from_token(token)
        if user_id:
            user_sessions[sid] = {"user_id": user_id, "room_code": None}
            user_sids[user_id] = sid
            await sio.emit("connected", {"message": "Connected to Ludo Live King"}, room=sid)
            return True

    # Allow anonymous connection
    user_sessions[sid] = {"user_id": None, "room_code": None}
    await sio.emit("connected", {"message": "Connected (anonymous)"}, room=sid)
    return True


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    session = user_sessions.pop(sid, None)
    if session:
        user_id = session.get("user_id")
        room_code = session.get("room_code")

        if user_id:
            user_sids.pop(user_id, None)

        # Remove from matchmaking queues
        for queue in matchmaking_queues.values():
            queue[:] = [q for q in queue if q.get("sid") != sid]

        # Handle game disconnection
        if room_code and room_code in active_games:
            game = active_games[room_code]
            if game.status == "waiting":
                game.remove_player(user_id)
                await sio.emit("player_left", {
                    "user_id": user_id,
                    "game_state": game.to_dict(),
                }, room=room_code)
                if len(game.players) == 0:
                    del active_games[room_code]


@sio.event
async def create_room(sid, data):
    """Create a new game room."""
    session = user_sessions.get(sid)
    if not session or not session.get("user_id"):
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    game_mode = data.get("game_mode", "classic")
    max_players = data.get("max_players", 4)
    is_private = data.get("is_private", False)
    entry_fee = data.get("entry_fee", 0)
    display_name = data.get("display_name", "Player")

    room_code = generate_room_code()
    while room_code in active_games:
        room_code = generate_room_code()

    game = LudoGame(room_code, game_mode, max_players)
    game.add_player(session["user_id"], display_name)
    active_games[room_code] = game

    session["room_code"] = room_code
    await sio.enter_room(sid, room_code)

    await sio.emit("room_created", {
        "room_code": room_code,
        "game_state": game.to_dict(),
    }, room=sid)


@sio.event
async def join_room(sid, data):
    """Join an existing game room."""
    session = user_sessions.get(sid)
    if not session or not session.get("user_id"):
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    room_code = data.get("room_code", "").upper()
    display_name = data.get("display_name", "Player")

    if room_code not in active_games:
        await sio.emit("error", {"message": "Room not found"}, room=sid)
        return

    game = active_games[room_code]
    if game.status != "waiting":
        await sio.emit("error", {"message": "Game already started"}, room=sid)
        return

    player = game.add_player(session["user_id"], display_name)
    if not player:
        await sio.emit("error", {"message": "Room is full"}, room=sid)
        return

    session["room_code"] = room_code
    await sio.enter_room(sid, room_code)

    await sio.emit("player_joined", {
        "user_id": session["user_id"],
        "display_name": display_name,
        "color": player.color,
        "game_state": game.to_dict(),
    }, room=room_code)

    # Auto-start if room is full
    if len(game.players) >= game.max_players:
        game.start_game()
        await sio.emit("game_started", {
            "game_state": game.to_dict(),
        }, room=room_code)


@sio.event
async def start_game(sid, data):
    """Start the game (host only)."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code or room_code not in active_games:
        await sio.emit("error", {"message": "Not in a room"}, room=sid)
        return

    game = active_games[room_code]
    # Only host (first player) can start
    if game.players[0].user_id != session["user_id"]:
        await sio.emit("error", {"message": "Only the host can start the game"}, room=sid)
        return

    if not game.start_game():
        await sio.emit("error", {"message": "Need at least 2 players"}, room=sid)
        return

    await sio.emit("game_started", {
        "game_state": game.to_dict(),
    }, room=room_code)


@sio.event
async def roll_dice(sid, data):
    """Roll the dice."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code or room_code not in active_games:
        await sio.emit("error", {"message": "Not in a game"}, room=sid)
        return

    game = active_games[room_code]
    result = game.roll_dice(session["user_id"])
    if not result:
        await sio.emit("error", {"message": "Not your turn"}, room=sid)
        return

    await sio.emit("dice_rolled", {
        "result": result,
        "game_state": game.to_dict(),
    }, room=room_code)

    # If no movable pieces and rolled 6 (three sixes case handled in engine)
    if not result["movable_pieces"] and result["value"] == 6 and not result.get("three_sixes"):
        # Player gets another turn with a 6 but no movable pieces
        pass


@sio.event
async def move_piece(sid, data):
    """Move a piece."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code or room_code not in active_games:
        await sio.emit("error", {"message": "Not in a game"}, room=sid)
        return

    game = active_games[room_code]
    piece_index = data.get("piece_index", 0)
    result = game.move_piece(session["user_id"], piece_index)

    if not result:
        await sio.emit("error", {"message": "Invalid move"}, room=sid)
        return

    await sio.emit("piece_moved", {
        "result": result,
        "game_state": game.to_dict(),
    }, room=room_code)

    # Check if game is over
    if game.status == "finished":
        await sio.emit("game_over", {
            "winner": game.winner.to_dict() if game.winner else None,
            "game_state": game.to_dict(),
        }, room=room_code)
        # Clean up after a delay
        asyncio.get_event_loop().call_later(60, lambda: active_games.pop(room_code, None))


@sio.event
async def join_matchmaking(sid, data):
    """Join the matchmaking queue."""
    session = user_sessions.get(sid)
    if not session or not session.get("user_id"):
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    game_mode = data.get("game_mode", "classic")
    display_name = data.get("display_name", "Player")
    max_players = data.get("max_players", 4)

    if game_mode not in matchmaking_queues:
        await sio.emit("error", {"message": "Invalid game mode"}, room=sid)
        return

    # Remove from any existing queue
    for queue in matchmaking_queues.values():
        queue[:] = [q for q in queue if q.get("user_id") != session["user_id"]]

    matchmaking_queues[game_mode].append({
        "user_id": session["user_id"],
        "sid": sid,
        "display_name": display_name,
        "max_players": max_players,
    })

    await sio.emit("matchmaking_joined", {
        "game_mode": game_mode,
        "queue_size": len(matchmaking_queues[game_mode]),
    }, room=sid)

    # Try to match players
    await try_match(game_mode, max_players)


@sio.event
async def leave_matchmaking(sid, data):
    """Leave the matchmaking queue."""
    session = user_sessions.get(sid)
    if not session:
        return

    for queue in matchmaking_queues.values():
        queue[:] = [q for q in queue if q.get("sid") != sid]

    await sio.emit("matchmaking_left", {}, room=sid)


async def try_match(game_mode: str, max_players: int = 4):
    """Try to match players in queue."""
    queue = matchmaking_queues.get(game_mode, [])
    min_players = 2

    # Filter by same max_players preference
    matching = [q for q in queue if q.get("max_players", 4) == max_players]

    if len(matching) >= min_players:
        # Take players for this match (up to max_players)
        matched = matching[:max_players]

        # Create room
        room_code = generate_room_code()
        while room_code in active_games:
            room_code = generate_room_code()

        game = LudoGame(room_code, game_mode, max_players)

        for player_data in matched:
            game.add_player(player_data["user_id"], player_data["display_name"])
            player_sid = player_data["sid"]
            if player_sid in user_sessions:
                user_sessions[player_sid]["room_code"] = room_code
            await sio.enter_room(player_sid, room_code)

            # Remove from queue
            queue[:] = [q for q in queue if q.get("user_id") != player_data["user_id"]]

        active_games[room_code] = game

        # Start game if we have enough players
        if len(game.players) >= min_players:
            game.start_game()

        await sio.emit("match_found", {
            "room_code": room_code,
            "game_state": game.to_dict(),
        }, room=room_code)


@sio.event
async def add_bot(sid, data):
    """Add a bot player to the room."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code or room_code not in active_games:
        await sio.emit("error", {"message": "Not in a room"}, room=sid)
        return

    game = active_games[room_code]
    if game.status != "waiting":
        await sio.emit("error", {"message": "Game already started"}, room=sid)
        return

    bot_names = ["Bot Alpha", "Bot Beta", "Bot Gamma", "Bot Delta"]
    bot_id = -(len(game.players) + 1)  # Negative IDs for bots
    bot_name = bot_names[len(game.players) - 1] if len(game.players) - 1 < len(bot_names) else f"Bot {len(game.players)}"

    player = game.add_player(bot_id, bot_name, is_bot=True)
    if not player:
        await sio.emit("error", {"message": "Room is full"}, room=sid)
        return

    await sio.emit("player_joined", {
        "user_id": bot_id,
        "display_name": bot_name,
        "color": player.color,
        "is_bot": True,
        "game_state": game.to_dict(),
    }, room=room_code)


@sio.event
async def chat_message(sid, data):
    """Send a chat message in the game room."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code:
        return

    message = data.get("message", "")[:200]  # Limit message length
    display_name = data.get("display_name", "Player")

    await sio.emit("chat_message", {
        "user_id": session["user_id"],
        "display_name": display_name,
        "message": message,
    }, room=room_code)


@sio.event
async def emoji_reaction(sid, data):
    """Send an emoji reaction in the game."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code:
        return

    emoji = data.get("emoji", "")
    await sio.emit("emoji_reaction", {
        "user_id": session["user_id"],
        "emoji": emoji,
    }, room=room_code)


@sio.event
async def play_vs_computer(sid, data):
    """Start a game against computer bots."""
    session = user_sessions.get(sid)
    if not session or not session.get("user_id"):
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    display_name = data.get("display_name", "Player")
    num_bots = data.get("num_bots", 3)
    game_mode = data.get("game_mode", "classic")

    room_code = generate_room_code()
    game = LudoGame(room_code, game_mode, num_bots + 1)
    game.add_player(session["user_id"], display_name)

    bot_names = ["CPU Easy", "CPU Medium", "CPU Hard"]
    for i in range(num_bots):
        bot_id = -(i + 1)
        bot_name = bot_names[i] if i < len(bot_names) else f"CPU {i + 1}"
        game.add_player(bot_id, bot_name, is_bot=True)

    active_games[room_code] = game
    session["room_code"] = room_code
    await sio.enter_room(sid, room_code)

    game.start_game()

    await sio.emit("game_started", {
        "room_code": room_code,
        "game_state": game.to_dict(),
        "vs_computer": True,
    }, room=sid)


@sio.event
async def bot_turn(sid, data):
    """Request bot to take its turn."""
    session = user_sessions.get(sid)
    if not session:
        return

    room_code = session.get("room_code")
    if not room_code or room_code not in active_games:
        return

    game = active_games[room_code]
    current = game.get_current_player()
    if not current or not current.is_bot:
        return

    # Bot rolls dice
    roll_result = game.roll_dice(current.user_id)
    if not roll_result:
        return

    await sio.emit("dice_rolled", {
        "result": roll_result,
        "game_state": game.to_dict(),
    }, room=room_code)

    # Small delay for animation
    await asyncio.sleep(0.5)

    # Bot moves piece
    if roll_result["movable_pieces"]:
        piece_idx = game.get_bot_move(current)
        if piece_idx is not None:
            move_result = game.move_piece(current.user_id, piece_idx)
            if move_result:
                await sio.emit("piece_moved", {
                    "result": move_result,
                    "game_state": game.to_dict(),
                }, room=room_code)

                if game.status == "finished":
                    await sio.emit("game_over", {
                        "winner": game.winner.to_dict() if game.winner else None,
                        "game_state": game.to_dict(),
                    }, room=room_code)
