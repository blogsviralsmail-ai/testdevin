"""User profile and leaderboard routes."""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.services.auth import get_user_id_from_token

router = APIRouter(prefix="/api/users", tags=["users"])


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    user_id = get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Account banned")
    return user


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_id: Optional[int] = None


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {"user": user.to_dict()}


@router.put("/me")
async def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.display_name:
        user.display_name = req.display_name
    if req.avatar_id is not None:
        user.avatar_id = req.avatar_id
    await db.commit()
    await db.refresh(user)
    return {"user": user.to_dict()}


@router.get("/profile/{user_id}")
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user.to_public_dict()}


@router.get("/leaderboard")
async def get_leaderboard(
    sort_by: str = "rating",
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    if sort_by == "wins":
        order = desc(User.games_won)
    elif sort_by == "kills":
        order = desc(User.total_kills)
    elif sort_by == "streak":
        order = desc(User.best_win_streak)
    else:
        order = desc(User.rating)

    result = await db.execute(
        select(User)
        .where(User.is_banned == False, User.total_games > 0)
        .order_by(order)
        .limit(limit)
    )
    users = result.scalars().all()
    return {
        "leaderboard": [
            {
                "rank": i + 1,
                **u.to_public_dict(),
            }
            for i, u in enumerate(users)
        ]
    }


@router.get("/me/transactions")
async def get_transactions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    transactions = result.scalars().all()
    return {"transactions": [t.to_dict() for t in transactions]}


@router.post("/me/daily-reward")
async def claim_daily_reward(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import datetime

    # Check if already claimed today
    today = datetime.datetime.utcnow().date()
    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == user.id,
            Transaction.category == "daily_reward",
        )
        .order_by(desc(Transaction.created_at))
        .limit(1)
    )
    last_reward = result.scalar_one_or_none()
    if last_reward and last_reward.created_at.date() == today:
        raise HTTPException(status_code=400, detail="Daily reward already claimed today")

    # Award coins
    reward_amount = 100
    user.coins += reward_amount
    transaction = Transaction(
        user_id=user.id,
        type="credit",
        category="daily_reward",
        amount=reward_amount,
        currency="coins",
        balance_after=user.coins,
        description="Daily login reward",
    )
    db.add(transaction)
    await db.commit()
    return {"coins": user.coins, "reward": reward_amount}
