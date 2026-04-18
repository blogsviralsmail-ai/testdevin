"""Custom RTMP Server config and Auto-Restream improvements."""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rtmp", tags=["RTMP Configuration"])


class CustomRtmpRequest(BaseModel):
    name: str
    rtmpUrl: str
    streamKey: str
    description: Optional[str] = ""


class AutoRestreamConfig(BaseModel):
    slotId: str
    enabled: bool = True
    maxRetries: int = 50
    retryDelaySeconds: int = 10
    monitorInterval: int = 30
    autoRestartOnKeyChange: bool = False
    newStreamKey: Optional[str] = None


# ============ CUSTOM RTMP SERVERS ============

@router.get("/servers")
async def list_custom_rtmp_servers(user=Depends(get_current_user)):
    """List user's custom RTMP server configurations."""
    db = get_db()
    servers = await db.rtmp_servers.find({"userId": user["id"]}).sort("createdAt", -1).to_list(50)
    return [
        {
            "id": str(s["_id"]),
            "name": s.get("name", ""),
            "rtmpUrl": s.get("rtmpUrl", ""),
            "streamKey": s.get("streamKey", ""),
            "description": s.get("description", ""),
            "createdAt": s.get("createdAt", ""),
        }
        for s in servers
    ]


@router.post("/servers")
async def add_custom_rtmp_server(req: CustomRtmpRequest, user=Depends(get_current_user)):
    """Add a custom RTMP server configuration."""
    db = get_db()
    result = await db.rtmp_servers.insert_one({
        "userId": user["id"],
        "name": req.name,
        "rtmpUrl": req.rtmpUrl,
        "streamKey": req.streamKey,
        "description": req.description,
        "createdAt": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id), "message": "RTMP server added"}


@router.put("/servers/{server_id}")
async def update_custom_rtmp_server(server_id: str, req: CustomRtmpRequest, user=Depends(get_current_user)):
    """Update a custom RTMP server configuration."""
    db = get_db()
    result = await db.rtmp_servers.update_one(
        {"_id": ObjectId(server_id), "userId": user["id"]},
        {"$set": {
            "name": req.name,
            "rtmpUrl": req.rtmpUrl,
            "streamKey": req.streamKey,
            "description": req.description,
            "updatedAt": datetime.utcnow(),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "RTMP server updated"}


@router.delete("/servers/{server_id}")
async def delete_custom_rtmp_server(server_id: str, user=Depends(get_current_user)):
    """Delete a custom RTMP server configuration."""
    db = get_db()
    result = await db.rtmp_servers.delete_one({"_id": ObjectId(server_id), "userId": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Server not found")
    return {"message": "RTMP server deleted"}


# ============ AUTO-RESTREAM CONFIG ============

@router.get("/auto-restream/{slot_id}")
async def get_auto_restream_config(slot_id: str, user=Depends(get_current_user)):
    """Get auto-restream configuration for a slot."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    config = slot.get("autoRestream", {})
    return {
        "enabled": config.get("enabled", True),
        "maxRetries": config.get("maxRetries", 50),
        "retryDelaySeconds": config.get("retryDelaySeconds", 10),
        "monitorInterval": config.get("monitorInterval", 30),
        "autoRestartOnKeyChange": config.get("autoRestartOnKeyChange", False),
        "currentRetryCount": config.get("currentRetryCount", 0),
        "lastRestartAt": config.get("lastRestartAt"),
    }


@router.put("/auto-restream")
async def update_auto_restream_config(req: AutoRestreamConfig, user=Depends(get_current_user)):
    """Update auto-restream configuration for a slot."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    update_data = {
        "autoRestream.enabled": req.enabled,
        "autoRestream.maxRetries": req.maxRetries,
        "autoRestream.retryDelaySeconds": req.retryDelaySeconds,
        "autoRestream.monitorInterval": req.monitorInterval,
        "autoRestream.autoRestartOnKeyChange": req.autoRestartOnKeyChange,
        "updatedAt": datetime.utcnow(),
    }

    # If new stream key provided and auto-restart on key change is enabled
    if req.newStreamKey and req.autoRestartOnKeyChange:
        update_data["streamKey"] = req.newStreamKey
        update_data["autoRestream.keyChangedAt"] = datetime.utcnow()

        # If currently streaming, restart with new key
        if slot.get("isStreaming"):
            try:
                from app.services.streaming import stop_stream, start_stream
                await stop_stream(req.slotId, user["id"])
                # Update key first, then restart
                await db.slots.update_one(
                    {"_id": ObjectId(req.slotId)},
                    {"$set": {"streamKey": req.newStreamKey}}
                )
                await start_stream(req.slotId, user["id"])
                update_data["autoRestream.restartedForKeyChange"] = True
            except Exception as e:
                logger.error(f"Failed to restart stream for key change: {e}")

    await db.slots.update_one(
        {"_id": ObjectId(req.slotId)},
        {"$set": update_data}
    )

    return {"message": "Auto-restream config updated"}


# ============ ADMIN: RTMP Server Stats ============

@router.get("/admin/stats")
async def admin_rtmp_stats(admin=Depends(get_admin_user)):
    """Admin: Get RTMP server usage statistics."""
    db = get_db()
    total_custom = await db.rtmp_servers.count_documents({})
    total_slots = await db.slots.count_documents({})
    streaming_slots = await db.slots.count_documents({"isStreaming": True})

    # Platform distribution
    platforms = {}
    async for slot in db.slots.find({}, {"platform": 1}):
        p = slot.get("platform", "youtube")
        platforms[p] = platforms.get(p, 0) + 1

    return {
        "totalCustomServers": total_custom,
        "totalSlots": total_slots,
        "streamingSlots": streaming_slots,
        "platformDistribution": platforms,
    }
