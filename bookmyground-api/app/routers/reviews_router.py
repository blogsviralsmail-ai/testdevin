from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class CreateReviewRequest(BaseModel):
    booking_id: int
    rating: float
    review_text: str = ""
    ground_quality: float | None = None
    facilities: float | None = None
    staff: float | None = None
    value_for_money: float | None = None


class CustomerReviewRequest(BaseModel):
    booking_id: int
    rating: float
    punctuality: float | None = None
    behavior: float | None = None
    ground_care: float | None = None


@router.post("/ground")
async def review_ground(req: CreateReviewRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        booking = db.execute(
            "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = 'completed'",
            (req.booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=400, detail="Invalid booking or not completed")
        if booking["rated"]:
            raise HTTPException(status_code=400, detail="Already rated")

        db.execute(
            """INSERT INTO reviews (booking_id, reviewer_id, target_type, target_id, rating, review_text,
            ground_quality, facilities, staff, value_for_money)
            VALUES (?, ?, 'ground', ?, ?, ?, ?, ?, ?, ?)""",
            (req.booking_id, user["user_id"], booking["ground_id"], req.rating, req.review_text,
             req.ground_quality, req.facilities, req.staff, req.value_for_money),
        )
        db.execute("UPDATE bookings SET rated = 1 WHERE id = ?", (req.booking_id,))

        # Update ground rating
        avg = db.execute(
            "SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE target_type='ground' AND target_id=?",
            (booking["ground_id"],),
        ).fetchone()
        db.execute(
            "UPDATE grounds SET rating = ?, rating_count = ? WHERE id = ?",
            (round(avg["avg_r"], 1), avg["cnt"], booking["ground_id"]),
        )
        return {"message": "Review submitted"}


@router.post("/customer")
async def review_customer(req: CustomerReviewRequest, user: dict = Depends(get_current_user)):
    """Owner reviews a customer"""
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.id = ? AND g.owner_id = ? AND b.status = 'completed'""",
            (req.booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=400, detail="Invalid booking")

        db.execute(
            """INSERT INTO reviews (booking_id, reviewer_id, target_type, target_id, rating,
            punctuality, behavior, ground_care)
            VALUES (?, ?, 'user', ?, ?, ?, ?, ?)""",
            (req.booking_id, user["user_id"], booking["user_id"], req.rating,
             req.punctuality, req.behavior, req.ground_care),
        )

        avg = db.execute(
            "SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE target_type='user' AND target_id=?",
            (booking["user_id"],),
        ).fetchone()
        db.execute(
            "UPDATE users SET rating = ?, rating_count = ? WHERE id = ?",
            (round(avg["avg_r"], 1), avg["cnt"], booking["user_id"]),
        )
        return {"message": "Customer review submitted"}


@router.get("/ground/{ground_id}")
async def get_ground_reviews(ground_id: int):
    with get_db() as db:
        rows = db.execute(
            """SELECT r.*, u.name as reviewer_name FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.target_type = 'ground' AND r.target_id = ?
            ORDER BY r.created_at DESC""",
            (ground_id,),
        ).fetchall()
        return [dict(r) for r in rows]
