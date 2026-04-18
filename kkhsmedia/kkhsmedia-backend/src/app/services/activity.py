"""User activity logging service."""
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


async def log_activity(
    user_id: str,
    action: str,
    details: str = "",
    ip: str = "",
    resource_type: str = "",
    resource_id: str = "",
):
    """Log user activity to database."""
    try:
        from app.database import get_db
        db = get_db()
        await db.activity_logs.insert_one({
            "userId": user_id,
            "action": action,
            "details": details,
            "ip": ip,
            "resourceType": resource_type,
            "resourceId": resource_id,
            "createdAt": datetime.utcnow(),
        })
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")


async def log_stream_event(
    slot_id: str,
    user_id: str,
    event: str,
    details: str = "",
    duration_seconds: int = 0,
):
    """Log streaming events for analytics."""
    try:
        from app.database import get_db
        db = get_db()
        await db.stream_logs.insert_one({
            "slotId": slot_id,
            "userId": user_id,
            "event": event,  # started, stopped, crashed, restarted, error
            "details": details,
            "durationSeconds": duration_seconds,
            "createdAt": datetime.utcnow(),
        })
    except Exception as e:
        logger.error(f"Failed to log stream event: {e}")
