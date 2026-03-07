from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        notifications = conn.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (current_user["user_id"],)
        ).fetchall()

        unread_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0",
            (current_user["user_id"],)
        ).fetchone()["cnt"]

        return {
            "notifications": [
                {
                    "id": n["id"],
                    "title": n["title"],
                    "message": n["message"],
                    "type": n["type"],
                    "is_read": bool(n["is_read"]),
                    "created_at": n["created_at"]
                } for n in notifications
            ],
            "unread_count": unread_count
        }


@router.put("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            (current_user["user_id"],)
        )
        return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read")
def mark_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute(
            "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
            (notification_id, current_user["user_id"])
        )
        return {"message": "Notification marked as read"}
