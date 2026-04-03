"""User model."""
import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True, default="")
    avatar_id = Column(Integer, default=1)

    # Auth providers
    auth_provider = Column(String(20), default="local")  # local, google, facebook, phone, guest
    provider_id = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)

    # Game stats
    coins = Column(Integer, default=1000)
    gems = Column(Integer, default=10)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    total_games = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    games_lost = Column(Integer, default=0)
    win_streak = Column(Integer, default=0)
    best_win_streak = Column(Integer, default=0)
    total_kills = Column(Integer, default=0)
    rating = Column(Float, default=1000.0)

    # Status
    is_online = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String(500), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_vip = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "avatar_id": self.avatar_id,
            "coins": self.coins,
            "gems": self.gems,
            "xp": self.xp,
            "level": self.level,
            "total_games": self.total_games,
            "games_won": self.games_won,
            "games_lost": self.games_lost,
            "win_streak": self.win_streak,
            "best_win_streak": self.best_win_streak,
            "total_kills": self.total_kills,
            "rating": self.rating,
            "is_online": self.is_online,
            "is_banned": self.is_banned,
            "is_vip": self.is_vip,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def to_public_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "avatar_id": self.avatar_id,
            "level": self.level,
            "total_games": self.total_games,
            "games_won": self.games_won,
            "rating": self.rating,
            "is_online": self.is_online,
            "is_vip": self.is_vip,
        }
