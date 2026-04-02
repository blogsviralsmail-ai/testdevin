"""Admin panel routes - user management, analytics, coin management, ban system."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.game import Game, GamePlayer
from app.models.transaction import Transaction
from app.routers.users import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class BanUserRequest(BaseModel):
    user_id: int
    reason: str


class UnbanUserRequest(BaseModel):
    user_id: int


class AdjustCoinsRequest(BaseModel):
    user_id: int
    amount: int
    reason: str = "Admin adjustment"


class MakeAdminRequest(BaseModel):
    user_id: int


@router.get("/dashboard")
async def admin_dashboard(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = await db.execute(select(func.count()).select_from(User))
    online_users = await db.execute(
        select(func.count()).select_from(User).where(User.is_online == True)
    )
    total_games = await db.execute(select(func.count()).select_from(Game))
    active_games = await db.execute(
        select(func.count()).select_from(Game).where(Game.status == "playing")
    )
    total_coins = await db.execute(select(func.sum(User.coins)).select_from(User))
    banned_users = await db.execute(
        select(func.count()).select_from(User).where(User.is_banned == True)
    )

    return {
        "dashboard": {
            "total_users": total_users.scalar() or 0,
            "online_users": online_users.scalar() or 0,
            "total_games": total_games.scalar() or 0,
            "active_games": active_games.scalar() or 0,
            "total_coins_in_circulation": total_coins.scalar() or 0,
            "banned_users": banned_users.scalar() or 0,
        }
    }


@router.get("/users")
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    search: str = "",
    page: int = 1,
    limit: int = 20,
):
    query = select(User)
    if search:
        query = query.where(
            User.username.ilike(f"%{search}%") | User.display_name.ilike(f"%{search}%")
        )
    query = query.order_by(desc(User.created_at)).limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    users = result.scalars().all()

    count_query = select(func.count()).select_from(User)
    if search:
        count_query = count_query.where(
            User.username.ilike(f"%{search}%") | User.display_name.ilike(f"%{search}%")
        )
    total = await db.execute(count_query)

    return {
        "users": [u.to_dict() for u in users],
        "total": total.scalar() or 0,
        "page": page,
        "limit": limit,
    }


@router.post("/ban")
async def ban_user(
    req: BanUserRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot ban an admin")

    user.is_banned = True
    user.ban_reason = req.reason
    await db.commit()
    return {"message": f"User {user.username} banned", "user": user.to_dict()}


@router.post("/unban")
async def unban_user(
    req: UnbanUserRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_banned = False
    user.ban_reason = None
    await db.commit()
    return {"message": f"User {user.username} unbanned", "user": user.to_dict()}


@router.post("/adjust-coins")
async def adjust_coins(
    req: AdjustCoinsRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.coins += req.amount
    if user.coins < 0:
        user.coins = 0

    transaction = Transaction(
        user_id=user.id,
        type="credit" if req.amount > 0 else "debit",
        category="admin",
        amount=abs(req.amount),
        currency="coins",
        balance_after=user.coins,
        description=req.reason,
    )
    db.add(transaction)
    await db.commit()
    return {"message": f"Adjusted {req.amount} coins for {user.username}", "user": user.to_dict()}


@router.post("/make-admin")
async def make_admin(
    req: MakeAdminRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == req.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = True
    await db.commit()
    return {"message": f"User {user.username} is now an admin", "user": user.to_dict()}


@router.get("/games")
async def list_games(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    query = select(Game)
    if status:
        query = query.where(Game.status == status)
    query = query.order_by(desc(Game.created_at)).limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    games = result.scalars().all()
    return {"games": [g.to_dict() for g in games]}


@router.get("/transactions")
async def list_transactions(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
):
    query = select(Transaction)
    if user_id:
        query = query.where(Transaction.user_id == user_id)
    query = query.order_by(desc(Transaction.created_at)).limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    transactions = result.scalars().all()
    return {"transactions": [t.to_dict() for t in transactions]}
