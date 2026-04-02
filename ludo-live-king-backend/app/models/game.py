"""Game and GamePlayer models."""
import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from app.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_code = Column(String(10), unique=True, nullable=False, index=True)
    game_mode = Column(String(20), default="classic")  # classic, quick, master, rush
    board_type = Column(String(20), default="classic")  # classic, 3d, nature, space
    max_players = Column(Integer, default=4)
    current_players = Column(Integer, default=0)
    entry_fee = Column(Integer, default=0)
    prize_pool = Column(Integer, default=0)
    status = Column(String(20), default="waiting")  # waiting, playing, finished, abandoned
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    turn_index = Column(Integer, default=0)
    current_turn_user_id = Column(Integer, nullable=True)
    dice_value = Column(Integer, nullable=True)
    game_state = Column(JSON, nullable=True)
    is_private = Column(Boolean, default=False)
    timer_seconds = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "room_code": self.room_code,
            "game_mode": self.game_mode,
            "board_type": self.board_type,
            "max_players": self.max_players,
            "current_players": self.current_players,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "status": self.status,
            "winner_id": self.winner_id,
            "turn_index": self.turn_index,
            "current_turn_user_id": self.current_turn_user_id,
            "dice_value": self.dice_value,
            "is_private": self.is_private,
            "timer_seconds": self.timer_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
        }


class GamePlayer(Base):
    __tablename__ = "game_players"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color = Column(String(10), nullable=False)  # red, green, yellow, blue
    position_index = Column(Integer, nullable=False)  # 0-3 player slot
    pieces = Column(JSON, default=lambda: [-1, -1, -1, -1])  # -1=home, 0-56=board, 57=finished
    pieces_finished = Column(Integer, default=0)
    kills = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    is_winner = Column(Boolean, default=False)
    is_bot = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "game_id": self.game_id,
            "user_id": self.user_id,
            "color": self.color,
            "position_index": self.position_index,
            "pieces": self.pieces,
            "pieces_finished": self.pieces_finished,
            "kills": self.kills,
            "rank": self.rank,
            "is_winner": self.is_winner,
            "is_bot": self.is_bot,
        }
