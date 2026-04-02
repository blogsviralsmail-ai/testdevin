"""
Ludo Live King - Core Game Engine
Complete Ludo game logic with all rules:
- 4 players (Red, Green, Yellow, Blue)
- Each player has 4 pieces
- Dice rolling (1-6)
- Piece movement on the board
- Safe zones / star positions
- Capturing opponent pieces
- Home column movement
- Finishing (reaching home)
- Win detection
- Turn management
"""
import random
from typing import Optional

# Board layout constants
BOARD_SIZE = 52  # Main track squares
HOME_COLUMN_SIZE = 6  # 6 squares in home column before finish
PIECES_PER_PLAYER = 4
MAX_PLAYERS = 4

# Colors and their start/entry positions on the main track
PLAYER_COLORS = ["red", "green", "yellow", "blue"]

# Starting position on main track for each color (where piece enters the board)
START_POSITIONS = {
    "red": 1,
    "green": 14,
    "yellow": 27,
    "blue": 40,
}

# Safe positions (star squares) - pieces cannot be captured here
SAFE_POSITIONS = {1, 9, 14, 22, 27, 35, 40, 48}

# Home entry position for each color (last square before home column)
HOME_ENTRY = {
    "red": 51,
    "green": 12,
    "yellow": 25,
    "blue": 38,
}

# Home column position offsets per color (avoids collision with main track 1-52)
HOME_COLUMN_OFFSET = {
    "red": 100,
    "green": 200,
    "yellow": 300,
    "blue": 400,
}

# Piece states
PIECE_HOME = -1  # In the starting yard
PIECE_FINISHED = 999  # Reached the center/finished


class LudoPiece:
    """Represents a single game piece."""

    def __init__(self, color: str, index: int):
        self.color = color
        self.index = index
        self.position = PIECE_HOME  # -1 = home, 1-52 = main track, 100-105/200-205/300-305/400-405 = home column, 999 = finished
        self.steps_taken = 0
        self.is_safe = False

    def to_dict(self):
        return {
            "color": self.color,
            "index": self.index,
            "position": self.position,
            "steps_taken": self.steps_taken,
            "is_safe": self.is_safe,
        }


class LudoPlayer:
    """Represents a player in the game."""

    def __init__(self, user_id: int, color: str, position_index: int, display_name: str = "", is_bot: bool = False):
        self.user_id = user_id
        self.color = color
        self.position_index = position_index
        self.display_name = display_name
        self.is_bot = is_bot
        self.pieces = [LudoPiece(color, i) for i in range(PIECES_PER_PLAYER)]
        self.pieces_finished = 0
        self.kills = 0
        self.has_won = False
        self.rank: Optional[int] = None
        self.consecutive_sixes = 0
        self.can_roll = True

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "color": self.color,
            "position_index": self.position_index,
            "display_name": self.display_name,
            "is_bot": self.is_bot,
            "pieces": [p.to_dict() for p in self.pieces],
            "pieces_finished": self.pieces_finished,
            "kills": self.kills,
            "has_won": self.has_won,
            "rank": self.rank,
            "consecutive_sixes": self.consecutive_sixes,
        }


class LudoGame:
    """Complete Ludo game engine with all rules."""

    def __init__(self, room_code: str, game_mode: str = "classic", max_players: int = 4):
        self.room_code = room_code
        self.game_mode = game_mode
        self.max_players = max_players
        self.players: list[LudoPlayer] = []
        self.current_turn_index = 0
        self.dice_value: Optional[int] = None
        self.status = "waiting"  # waiting, playing, finished
        self.winner: Optional[LudoPlayer] = None
        self.turn_count = 0
        self.next_rank = 1
        self.last_action: Optional[dict] = None
        self.move_history: list[dict] = []
        self.timer_seconds = 30 if game_mode == "classic" else 15

    def add_player(self, user_id: int, display_name: str = "", is_bot: bool = False) -> Optional[LudoPlayer]:
        """Add a player to the game."""
        if len(self.players) >= self.max_players:
            return None
        if any(p.user_id == user_id for p in self.players):
            return None

        position_index = len(self.players)
        color = PLAYER_COLORS[position_index]
        player = LudoPlayer(user_id, color, position_index, display_name, is_bot)
        self.players.append(player)
        return player

    def remove_player(self, user_id: int) -> bool:
        """Remove a player from the game (before it starts)."""
        if self.status != "waiting":
            return False
        self.players = [p for p in self.players if p.user_id != user_id]
        # Reassign positions and colors
        for i, player in enumerate(self.players):
            player.position_index = i
            player.color = PLAYER_COLORS[i]
            for piece in player.pieces:
                piece.color = PLAYER_COLORS[i]
        return True

    def start_game(self) -> bool:
        """Start the game if enough players have joined."""
        if len(self.players) < 2:
            return False
        self.status = "playing"
        self.current_turn_index = 0
        return True

    def get_current_player(self) -> Optional[LudoPlayer]:
        """Get the player whose turn it is."""
        if not self.players or self.status != "playing":
            return None
        active_players = [p for p in self.players if not p.has_won]
        if not active_players:
            return None
        return self.players[self.current_turn_index % len(self.players)]

    def roll_dice(self, user_id: int) -> Optional[dict]:
        """Roll the dice for the current player."""
        current = self.get_current_player()
        if not current or current.user_id != user_id:
            return None
        if current.has_won:
            self._advance_turn()
            return None
        if self.dice_value is not None:
            return None  # Already rolled, must move first

        # Roll dice
        self.dice_value = random.randint(1, 6)
        self.turn_count += 1

        # Track consecutive sixes
        if self.dice_value == 6:
            current.consecutive_sixes += 1
            # Three consecutive sixes - lose turn
            if current.consecutive_sixes >= 3:
                current.consecutive_sixes = 0
                result = {
                    "type": "dice_roll",
                    "player": current.color,
                    "user_id": user_id,
                    "value": self.dice_value,
                    "three_sixes": True,
                    "movable_pieces": [],
                }
                self.dice_value = None
                self._advance_turn()
                self.last_action = result
                return result
        else:
            current.consecutive_sixes = 0

        # Find movable pieces
        movable = self._get_movable_pieces(current, self.dice_value)

        result = {
            "type": "dice_roll",
            "player": current.color,
            "user_id": user_id,
            "value": self.dice_value,
            "three_sixes": False,
            "movable_pieces": movable,
        }

        # If no movable pieces, reset dice and advance turn
        if not movable:
            rolled_value = self.dice_value
            self.dice_value = None
            if rolled_value != 6:
                self._advance_turn()

        self.last_action = result
        return result

    def _get_movable_pieces(self, player: LudoPlayer, dice_value: int) -> list[int]:
        """Get indices of pieces that can be moved with the given dice value."""
        movable = []
        for i, piece in enumerate(player.pieces):
            if piece.position == PIECE_FINISHED:
                continue
            if piece.position == PIECE_HOME:
                # Can only leave home with a 6
                if dice_value == 6:
                    movable.append(i)
            else:
                # Check if move is valid
                new_steps = piece.steps_taken + dice_value
                if new_steps <= BOARD_SIZE + HOME_COLUMN_SIZE:
                    movable.append(i)
        return movable

    def move_piece(self, user_id: int, piece_index: int) -> Optional[dict]:
        """Move a piece for the current player."""
        current = self.get_current_player()
        if not current or current.user_id != user_id:
            return None
        if self.dice_value is None:
            return None
        if piece_index < 0 or piece_index >= PIECES_PER_PLAYER:
            return None

        piece = current.pieces[piece_index]
        dice = self.dice_value

        # Validate move
        if piece.position == PIECE_FINISHED:
            return None

        result = {
            "type": "move",
            "player": current.color,
            "user_id": user_id,
            "piece_index": piece_index,
            "dice_value": dice,
            "from_position": piece.position,
            "to_position": None,
            "captured": None,
            "finished": False,
            "won": False,
            "extra_turn": False,
        }

        if piece.position == PIECE_HOME:
            # Move piece out of home to start position
            if dice != 6:
                return None
            start_pos = START_POSITIONS[current.color]
            # Check for capture at start position
            captured = self._check_capture(current, start_pos)
            piece.position = start_pos
            piece.steps_taken = 1
            piece.is_safe = start_pos in SAFE_POSITIONS
            result["to_position"] = start_pos
            result["captured"] = captured
            result["extra_turn"] = True  # 6 gives extra turn
        else:
            # Move piece on the board
            new_steps = piece.steps_taken + dice
            if new_steps > BOARD_SIZE + HOME_COLUMN_SIZE:
                return None  # Can't move beyond finish

            color_offset = HOME_COLUMN_OFFSET[current.color]

            if new_steps == BOARD_SIZE + HOME_COLUMN_SIZE:
                # Piece reaches home (finished)
                piece.position = PIECE_FINISHED
                piece.steps_taken = new_steps
                piece.is_safe = True
                current.pieces_finished += 1
                result["to_position"] = PIECE_FINISHED
                result["finished"] = True

                # Check if player has won
                if current.pieces_finished == PIECES_PER_PLAYER:
                    current.has_won = True
                    current.rank = self.next_rank
                    self.next_rank += 1
                    result["won"] = True
                    # Check if game is over
                    active = [p for p in self.players if not p.has_won]
                    if len(active) <= 1:
                        if active:
                            active[0].rank = self.next_rank
                        self.status = "finished"
                        self.winner = current
                        result["game_over"] = True
            elif new_steps > BOARD_SIZE:
                # In home column (use color-specific offset to avoid position collision)
                home_pos = color_offset + (new_steps - BOARD_SIZE - 1)
                piece.position = home_pos
                piece.steps_taken = new_steps
                piece.is_safe = True  # Home column is always safe
                result["to_position"] = home_pos
            else:
                # Regular move on main track
                new_pos = (START_POSITIONS[current.color] + new_steps - 1) % BOARD_SIZE
                if new_pos == 0:
                    new_pos = BOARD_SIZE
                # Check if entering home column
                home_entry = HOME_ENTRY[current.color]
                steps_to_entry = self._steps_to_position(current.color, piece.position, home_entry)

                if piece.steps_taken < BOARD_SIZE and new_steps > BOARD_SIZE:
                    # Entering home column (use > not >= to avoid step 52 bug)
                    home_progress = new_steps - BOARD_SIZE
                    if home_progress > HOME_COLUMN_SIZE:
                        return None
                    home_pos = color_offset + home_progress - 1
                    piece.position = home_pos
                    piece.steps_taken = new_steps
                    piece.is_safe = True
                    result["to_position"] = home_pos
                else:
                    new_pos = self._calculate_new_position(current.color, piece.steps_taken, dice)
                    captured = self._check_capture(current, new_pos)
                    piece.position = new_pos
                    piece.steps_taken = new_steps
                    piece.is_safe = new_pos in SAFE_POSITIONS
                    result["to_position"] = new_pos
                    result["captured"] = captured
                    if captured:
                        result["extra_turn"] = True  # Capture gives extra turn

        # Record move
        self.move_history.append(result)
        self.last_action = result

        # Determine if extra turn
        if dice == 6 or result.get("extra_turn"):
            result["extra_turn"] = True
            # Don't advance turn on 6 or capture
        else:
            self._advance_turn()

        self.dice_value = None
        return result

    def _calculate_new_position(self, color: str, current_steps: int, dice: int) -> int:
        """Calculate new absolute board position."""
        start = START_POSITIONS[color]
        new_steps = current_steps + dice
        new_pos = (start + new_steps - 1) % BOARD_SIZE
        if new_pos == 0:
            new_pos = BOARD_SIZE
        return new_pos

    def _steps_to_position(self, color: str, from_pos: int, to_pos: int) -> int:
        """Calculate steps between two positions for a given color."""
        start = START_POSITIONS[color]
        if from_pos >= start:
            steps_from = from_pos - start + 1
        else:
            steps_from = BOARD_SIZE - start + from_pos + 1
        if to_pos >= start:
            steps_to = to_pos - start + 1
        else:
            steps_to = BOARD_SIZE - start + to_pos + 1
        return steps_to - steps_from

    def _check_capture(self, attacker: LudoPlayer, position: int) -> Optional[dict]:
        """Check if moving to a position captures an opponent's piece."""
        if position in SAFE_POSITIONS:
            return None

        for player in self.players:
            if player.color == attacker.color:
                continue
            for i, piece in enumerate(player.pieces):
                # Only capture pieces on main track (positions 1-52), not in home columns or yard
                if piece.position == position and 1 <= piece.position <= BOARD_SIZE:
                    # Check for blockade (two pieces of same color on same position)
                    same_color_count = sum(1 for p in player.pieces if p.position == position)
                    if same_color_count >= 2:
                        continue  # Can't capture a blockade

                    # Capture!
                    piece.position = PIECE_HOME
                    piece.steps_taken = 0
                    piece.is_safe = False
                    attacker.kills += 1
                    return {
                        "player": player.color,
                        "user_id": player.user_id,
                        "piece_index": i,
                        "position": position,
                    }
        return None

    def _advance_turn(self):
        """Advance to the next player's turn."""
        attempts = 0
        while attempts < len(self.players):
            self.current_turn_index = (self.current_turn_index + 1) % len(self.players)
            player = self.players[self.current_turn_index]
            if not player.has_won:
                return
            attempts += 1

    def get_bot_move(self, player: LudoPlayer) -> Optional[int]:
        """AI logic for bot players - returns piece index to move."""
        if self.dice_value is None:
            return None

        movable = self._get_movable_pieces(player, self.dice_value)
        if not movable:
            return None

        # Simple AI strategy:
        # 1. If can capture, capture
        # 2. If piece near home, move it
        # 3. If 6 and piece at home, bring it out
        # 4. Move the most advanced piece

        best_move = movable[0]
        best_score = -1

        for pi in movable:
            piece = player.pieces[pi]
            score = 0

            if piece.position == PIECE_HOME and self.dice_value == 6:
                score = 50  # Bringing out a piece is good

            if piece.position != PIECE_HOME:
                new_steps = piece.steps_taken + self.dice_value
                # Prioritize pieces close to finishing
                if new_steps >= BOARD_SIZE:
                    score = 100 + new_steps

                # Check if can capture
                if new_steps <= BOARD_SIZE:
                    new_pos = self._calculate_new_position(player.color, piece.steps_taken, self.dice_value)
                    for other in self.players:
                        if other.color == player.color:
                            continue
                        for op in other.pieces:
                            if op.position == new_pos and new_pos not in SAFE_POSITIONS:
                                score = 200  # Capture is highest priority

                # Move pieces that are in danger
                if piece.position not in SAFE_POSITIONS:
                    score += 10

            if score > best_score:
                best_score = score
                best_move = pi

        return best_move

    def to_dict(self) -> dict:
        """Serialize game state."""
        current = self.get_current_player()
        return {
            "room_code": self.room_code,
            "game_mode": self.game_mode,
            "max_players": self.max_players,
            "status": self.status,
            "players": [p.to_dict() for p in self.players],
            "current_turn_index": self.current_turn_index,
            "current_turn_color": current.color if current else None,
            "current_turn_user_id": current.user_id if current else None,
            "dice_value": self.dice_value,
            "turn_count": self.turn_count,
            "last_action": self.last_action,
            "timer_seconds": self.timer_seconds,
        }
