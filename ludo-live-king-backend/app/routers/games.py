"""Game history and stats routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.game import Game, GamePlayer
from app.models.user import User
from app.routers.users import get_current_user

router = APIRouter(prefix="/api/games", tags=["games"])


@router.get("/history")
async def get_game_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    result = await db.execute(
        select(GamePlayer)
        .where(GamePlayer.user_id == user.id)
        .order_by(desc(GamePlayer.joined_at))
        .limit(limit)
        .offset(offset)
    )
    game_players = result.scalars().all()

    games = []
    for gp in game_players:
        game_result = await db.execute(select(Game).where(Game.id == gp.game_id))
        game = game_result.scalar_one_or_none()
        if game:
            games.append({
                "game": game.to_dict(),
                "player_data": gp.to_dict(),
            })

    return {"games": games, "total": len(games)}


@router.get("/stats")
async def get_game_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "stats": {
            "total_games": user.total_games,
            "games_won": user.games_won,
            "games_lost": user.games_lost,
            "win_rate": round(user.games_won / max(user.total_games, 1) * 100, 1),
            "win_streak": user.win_streak,
            "best_win_streak": user.best_win_streak,
            "total_kills": user.total_kills,
            "rating": user.rating,
            "level": user.level,
            "xp": user.xp,
        }
    }


@router.get("/active")
async def get_active_games(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Game)
        .where(Game.status.in_(["waiting", "playing"]))
        .order_by(desc(Game.created_at))
        .limit(20)
    )
    games = result.scalars().all()
    return {"games": [g.to_dict() for g in games]}


@router.get("/online-count")
async def get_online_count(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.count()).select_from(User).where(User.is_online == True)
    )
    count = result.scalar()
    active_games = await db.execute(
        select(func.count()).select_from(Game).where(Game.status == "playing")
    )
    games_count = active_games.scalar()
    return {
        "online_players": count or 0,
        "active_games": games_count or 0,
    }
