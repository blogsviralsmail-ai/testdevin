"""Stream analytics and health monitoring."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ============ USER ANALYTICS ============

@router.get("/stream-stats")
async def get_stream_stats(user=Depends(get_current_user)):
    """Get user's streaming statistics."""
    db = get_db()
    user_id = user["id"]

    total_slots = await db.slots.count_documents({"userId": user_id})
    active_slots = await db.slots.count_documents({"userId": user_id, "status": "active"})
    streaming_now = await db.slots.count_documents({"userId": user_id, "isStreaming": True})

    # Stream logs
    total_streams = await db.stream_logs.count_documents({"userId": user_id, "event": "started"})
    total_errors = await db.stream_logs.count_documents({"userId": user_id, "event": "error"})
    total_restarts = await db.stream_logs.count_documents({"userId": user_id, "event": "restarted"})

    # Total streaming hours
    pipeline = [
        {"$match": {"userId": user_id, "durationSeconds": {"$gt": 0}}},
        {"$group": {"_id": None, "totalSeconds": {"$sum": "$durationSeconds"}}}
    ]
    duration_result = await db.stream_logs.aggregate(pipeline).to_list(1)
    total_seconds = duration_result[0]["totalSeconds"] if duration_result else 0
    total_hours = round(total_seconds / 3600, 1)

    # Last 30 days stream activity
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_pipeline = [
        {"$match": {"userId": user_id, "event": "started", "createdAt": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_activity = await db.stream_logs.aggregate(daily_pipeline).to_list(31)

    # Per-slot stats
    slots = await db.slots.find({"userId": user_id}).to_list(100)
    slot_stats = []
    for slot in slots:
        sid = str(slot["_id"])
        starts = await db.stream_logs.count_documents({"slotId": sid, "event": "started"})
        errors = await db.stream_logs.count_documents({"slotId": sid, "event": "error"})

        dur_pipeline = [
            {"$match": {"slotId": sid, "durationSeconds": {"$gt": 0}}},
            {"$group": {"_id": None, "total": {"$sum": "$durationSeconds"}}}
        ]
        dur_result = await db.stream_logs.aggregate(dur_pipeline).to_list(1)
        slot_hours = round((dur_result[0]["total"] if dur_result else 0) / 3600, 1)

        slot_stats.append({
            "slotId": sid,
            "slotName": slot.get("name", ""),
            "platform": slot.get("platform", ""),
            "isStreaming": slot.get("isStreaming", False),
            "totalStarts": starts,
            "totalErrors": errors,
            "totalHours": slot_hours,
        })

    return {
        "summary": {
            "totalSlots": total_slots,
            "activeSlots": active_slots,
            "streamingNow": streaming_now,
            "totalStreams": total_streams,
            "totalErrors": total_errors,
            "totalRestarts": total_restarts,
            "totalHours": total_hours,
        },
        "dailyActivity": [{"date": d["_id"], "count": d["count"]} for d in daily_activity],
        "slotStats": slot_stats,
    }


@router.get("/stream-health/{slot_id}")
async def get_stream_health(slot_id: str, user=Depends(get_current_user)):
    """Get real-time health metrics for a streaming slot."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    from app.services.streaming import active_streams, check_stream_status

    is_running = await check_stream_status(slot.get("streamProcessId"))
    info = active_streams.get(slot_id, {})

    # Calculate uptime
    started_at = info.get("started_at")
    uptime_seconds = 0
    if started_at and is_running:
        try:
            start_time = datetime.fromisoformat(started_at)
            uptime_seconds = int((datetime.utcnow() - start_time).total_seconds())
        except (ValueError, TypeError):
            pass

    # Get recent logs
    recent_logs = await db.stream_logs.find(
        {"slotId": slot_id}
    ).sort("createdAt", -1).limit(20).to_list(20)

    return {
        "slotId": slot_id,
        "slotName": slot.get("name", ""),
        "platform": slot.get("platform", ""),
        "isStreaming": slot.get("isStreaming", False),
        "processRunning": is_running,
        "pid": slot.get("streamProcessId"),
        "uptimeSeconds": uptime_seconds,
        "restartCount": info.get("restart_count", 0),
        "videoUrl": info.get("video_url", ""),
        "recentLogs": serialize_docs(recent_logs),
    }


# ============ USER ACTIVITY LOGS ============

@router.get("/activity-logs")
async def get_activity_logs(page: int = 1, limit: int = 50, user=Depends(get_current_user)):
    """Get user's activity logs."""
    db = get_db()
    total = await db.activity_logs.count_documents({"userId": user["id"]})
    skip = (page - 1) * limit
    logs = await db.activity_logs.find(
        {"userId": user["id"]}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return {"logs": serialize_docs(logs), "total": total, "page": page}


# ============ ADMIN ANALYTICS ============

@router.get("/admin/overview")
async def admin_analytics_overview(period: str = "30d", admin=Depends(get_admin_user)):
    """Admin analytics overview with stream and revenue data."""
    db = get_db()
    now = datetime.utcnow()
    days = int(period.replace("d", "")) if period.endswith("d") else 30
    since = now - timedelta(days=days)

    # Stream stats
    total_streams = await db.stream_logs.count_documents({"event": "started", "createdAt": {"$gte": since}})
    total_errors = await db.stream_logs.count_documents({"event": "error", "createdAt": {"$gte": since}})
    currently_streaming = await db.slots.count_documents({"isStreaming": True})

    # Streaming hours
    pipeline = [
        {"$match": {"durationSeconds": {"$gt": 0}, "createdAt": {"$gte": since}}},
        {"$group": {"_id": None, "total": {"$sum": "$durationSeconds"}}}
    ]
    dur_result = await db.stream_logs.aggregate(pipeline).to_list(1)
    total_hours = round((dur_result[0]["total"] if dur_result else 0) / 3600, 1)

    # Daily stream starts
    daily_pipeline = [
        {"$match": {"event": "started", "createdAt": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_streams = await db.stream_logs.aggregate(daily_pipeline).to_list(days + 1)

    # Revenue
    rev_pipeline = [
        {"$match": {"status": "paid", "createdAt": {"$gte": since}}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}, "count": {"$sum": 1}}}
    ]
    rev_result = await db.orders.aggregate(rev_pipeline).to_list(1)
    total_revenue = rev_result[0]["total"] if rev_result else 0
    total_orders = rev_result[0]["count"] if rev_result else 0

    # Top streamers
    top_pipeline = [
        {"$match": {"event": "started", "createdAt": {"$gte": since}}},
        {"$group": {"_id": "$userId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_streamers = await db.stream_logs.aggregate(top_pipeline).to_list(10)
    enriched_top = []
    for t in top_streamers:
        u = await db.users.find_one({"_id": ObjectId(t["_id"])}) if t["_id"] else None
        enriched_top.append({
            "userId": t["_id"],
            "userName": f"{u.get('firstName','')} {u.get('lastName','')}" if u else "Unknown",
            "streamCount": t["count"],
        })

    return {
        "period": period,
        "streams": {
            "total": total_streams,
            "errors": total_errors,
            "currentlyLive": currently_streaming,
            "totalHours": total_hours,
        },
        "revenue": {"total": total_revenue, "orders": total_orders},
        "dailyStreams": [{"date": d["_id"], "count": d["count"]} for d in daily_streams],
        "topStreamers": enriched_top,
    }
