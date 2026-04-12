"""Bulk Stream Management and API Access routes."""
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bulk", tags=["Bulk Management"])


class BulkStartRequest(BaseModel):
    slotIds: List[str]


class BulkStopRequest(BaseModel):
    slotIds: List[str]


class BulkAssignVideoRequest(BaseModel):
    slotIds: List[str]
    videoId: str


class BulkDeleteRequest(BaseModel):
    slotIds: List[str]


# ============ BULK STREAM OPERATIONS ============

@router.post("/start")
async def bulk_start_streams(req: BulkStartRequest, user=Depends(get_current_user)):
    """Start streaming on multiple slots at once."""
    db = get_db()
    results = []
    for slot_id in req.slotIds:
        try:
            slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
            if not slot:
                results.append({"slotId": slot_id, "success": False, "error": "Slot not found"})
                continue
            if slot.get("isStreaming"):
                results.append({"slotId": slot_id, "success": True, "message": "Already streaming"})
                continue
            if not slot.get("videoId") and not slot.get("videoPath"):
                results.append({"slotId": slot_id, "success": False, "error": "No video assigned"})
                continue

            # Trigger stream start
            from app.services.streaming import start_stream
            await start_stream(slot_id, user["id"])
            results.append({"slotId": slot_id, "success": True})
        except Exception as e:
            results.append({"slotId": slot_id, "success": False, "error": str(e)})

    return {"results": results, "total": len(req.slotIds), "success": sum(1 for r in results if r.get("success"))}


@router.post("/stop")
async def bulk_stop_streams(req: BulkStopRequest, user=Depends(get_current_user)):
    """Stop streaming on multiple slots at once."""
    db = get_db()
    results = []
    for slot_id in req.slotIds:
        try:
            slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
            if not slot:
                results.append({"slotId": slot_id, "success": False, "error": "Slot not found"})
                continue

            from app.services.streaming import stop_stream
            await stop_stream(slot_id, user["id"])
            results.append({"slotId": slot_id, "success": True})
        except Exception as e:
            results.append({"slotId": slot_id, "success": False, "error": str(e)})

    return {"results": results, "total": len(req.slotIds), "success": sum(1 for r in results if r.get("success"))}


@router.post("/assign-video")
async def bulk_assign_video(req: BulkAssignVideoRequest, user=Depends(get_current_user)):
    """Assign a video to multiple slots at once."""
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(req.videoId), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    results = []
    for slot_id in req.slotIds:
        try:
            result = await db.slots.update_one(
                {"_id": ObjectId(slot_id), "userId": user["id"]},
                {"$set": {
                    "videoId": req.videoId,
                    "videoPath": video.get("localPath", ""),
                    "videoName": video.get("name", ""),
                    "updatedAt": datetime.utcnow(),
                }}
            )
            results.append({"slotId": slot_id, "success": result.modified_count > 0})
        except Exception as e:
            results.append({"slotId": slot_id, "success": False, "error": str(e)})

    return {"results": results, "total": len(req.slotIds), "success": sum(1 for r in results if r.get("success"))}


@router.post("/delete")
async def bulk_delete_slots(req: BulkDeleteRequest, user=Depends(get_current_user)):
    """Delete multiple slots at once."""
    db = get_db()
    results = []
    for slot_id in req.slotIds:
        try:
            # Stop streaming first if active
            slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
            if not slot:
                results.append({"slotId": slot_id, "success": False, "error": "Slot not found"})
                continue

            if slot.get("isStreaming"):
                from app.services.streaming import stop_stream
                await stop_stream(slot_id, user["id"])

            await db.slots.delete_one({"_id": ObjectId(slot_id), "userId": user["id"]})
            results.append({"slotId": slot_id, "success": True})
        except Exception as e:
            results.append({"slotId": slot_id, "success": False, "error": str(e)})

    return {"results": results, "total": len(req.slotIds), "success": sum(1 for r in results if r.get("success"))}


# ============ API ACCESS / DOCS ============

@router.get("/api-docs")
async def get_api_docs(user=Depends(get_current_user)):
    """Get API documentation for client integration."""
    base_url = "/api"
    return {
        "version": "1.0",
        "description": "KKHS Media Streaming API",
        "authentication": {
            "type": "Bearer Token",
            "header": "Authorization: Bearer <token>",
            "login": f"{base_url}/auth/login",
        },
        "endpoints": {
            "auth": {
                "login": {"method": "POST", "url": f"{base_url}/auth/login", "body": {"email": "string", "password": "string"}},
                "register": {"method": "POST", "url": f"{base_url}/auth/register", "body": {"firstName": "string", "lastName": "string", "email": "string", "password": "string"}},
                "me": {"method": "GET", "url": f"{base_url}/auth/me"},
            },
            "slots": {
                "list": {"method": "GET", "url": f"{base_url}/slots"},
                "create": {"method": "POST", "url": f"{base_url}/slots", "body": {"name": "string", "platform": "youtube|facebook|custom", "streamKey": "string"}},
                "start": {"method": "POST", "url": f"{base_url}/slots/{{id}}/stream"},
                "stop": {"method": "POST", "url": f"{base_url}/slots/{{id}}/stop"},
                "status": {"method": "GET", "url": f"{base_url}/slots/{{id}}/status"},
            },
            "videos": {
                "list": {"method": "GET", "url": f"{base_url}/videos"},
                "upload": {"method": "POST", "url": f"{base_url}/videos/upload-chunk", "body": "multipart/form-data"},
            },
            "streaming": {
                "youtube_url": {"method": "POST", "url": f"{base_url}/streaming/youtube-url", "body": {"slotId": "string", "url": "string", "loop": "boolean"}},
                "multi_stream": {"method": "POST", "url": f"{base_url}/streaming/multi-stream", "body": {"videoId": "string", "targets": [{"platform": "string", "streamKey": "string", "rtmpUrl": "string"}]}},
                "playlist": {"method": "POST", "url": f"{base_url}/streaming/playlist-queue", "body": {"slotId": "string", "videoIds": ["string"]}},
            },
            "bulk": {
                "start": {"method": "POST", "url": f"{base_url}/bulk/start", "body": {"slotIds": ["string"]}},
                "stop": {"method": "POST", "url": f"{base_url}/bulk/stop", "body": {"slotIds": ["string"]}},
                "assign_video": {"method": "POST", "url": f"{base_url}/bulk/assign-video", "body": {"slotIds": ["string"], "videoId": "string"}},
            },
            "analytics": {
                "stats": {"method": "GET", "url": f"{base_url}/analytics/stream-stats"},
                "health": {"method": "GET", "url": f"{base_url}/analytics/stream-health/{{slotId}}"},
            },
            "webhooks": {
                "list": {"method": "GET", "url": f"{base_url}/webhooks"},
                "create": {"method": "POST", "url": f"{base_url}/webhooks", "body": {"url": "string", "events": ["string"], "secret": "string"}},
            },
        },
        "webhook_events": [
            "stream.started", "stream.stopped", "stream.error",
            "stream.restarted", "payment.success", "slot.expired",
        ],
        "rate_limits": {
            "requests_per_minute": 60,
            "upload_max_size": "unlimited (chunked)",
        },
    }


@router.get("/api-key")
async def get_api_key(user=Depends(get_current_user)):
    """Get or generate API key for programmatic access."""
    import secrets
    db = get_db()
    existing = await db.api_keys.find_one({"userId": user["id"], "isActive": True})
    if existing:
        return {"apiKey": existing["key"], "createdAt": existing["createdAt"].isoformat()}

    # Generate new key
    key = f"kkhs_{secrets.token_urlsafe(32)}"
    await db.api_keys.insert_one({
        "userId": user["id"],
        "key": key,
        "isActive": True,
        "createdAt": datetime.utcnow(),
    })
    return {"apiKey": key, "createdAt": datetime.utcnow().isoformat()}


@router.post("/api-key/regenerate")
async def regenerate_api_key(user=Depends(get_current_user)):
    """Regenerate API key (invalidates old key)."""
    import secrets
    db = get_db()
    await db.api_keys.update_many(
        {"userId": user["id"]},
        {"$set": {"isActive": False, "deactivatedAt": datetime.utcnow()}}
    )
    key = f"kkhs_{secrets.token_urlsafe(32)}"
    await db.api_keys.insert_one({
        "userId": user["id"],
        "key": key,
        "isActive": True,
        "createdAt": datetime.utcnow(),
    })
    return {"apiKey": key, "message": "New API key generated. Old key is now invalid."}
