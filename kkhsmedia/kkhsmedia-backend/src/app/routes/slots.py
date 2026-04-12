from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.models.schemas import CreateSlotRequest, UpdateSlotRequest
from app.utils.auth import get_current_user, serialize_doc, serialize_docs

router = APIRouter(prefix="/api/slots", tags=["Slots"])


@router.get("")
async def get_slots(user=Depends(get_current_user)):
    db = get_db()
    slots = await db.slots.find({"userId": user["id"]}).sort("createdAt", -1).to_list(100)
    return serialize_docs(slots)


@router.get("/{slot_id}")
async def get_slot(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    return serialize_doc(slot)


@router.post("")
async def create_slot(req: CreateSlotRequest, user=Depends(get_current_user)):
    db = get_db()
    # Check if user has active/paid slots available
    slot = {
        "userId": user["id"],
        "name": req.name,
        "platform": req.platform,
        "streamKey": req.streamKey,
        "rtmpUrl": req.rtmpUrl or get_default_rtmp(req.platform),
        "videoId": None,
        "status": "inactive",  # Will be activated after payment
        "isStreaming": False,
        "streamProcessId": None,
        "expiryDate": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.slots.insert_one(slot)
    slot["id"] = str(result.inserted_id)
    return serialize_doc(slot)


@router.put("/{slot_id}")
async def update_slot(slot_id: str, req: UpdateSlotRequest, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    update = {"updatedAt": datetime.utcnow()}
    if req.name is not None:
        update["name"] = req.name
    if req.platform is not None:
        update["platform"] = req.platform
        if not req.rtmpUrl:
            update["rtmpUrl"] = get_default_rtmp(req.platform)
    if req.streamKey is not None:
        update["streamKey"] = req.streamKey
    if req.rtmpUrl is not None:
        update["rtmpUrl"] = req.rtmpUrl
    if req.videoId is not None:
        update["videoId"] = req.videoId

    await db.slots.update_one({"_id": ObjectId(slot_id)}, {"$set": update})
    updated = await db.slots.find_one({"_id": ObjectId(slot_id)})
    return serialize_doc(updated)


@router.delete("/{slot_id}")
async def delete_slot(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("isStreaming"):
        raise HTTPException(status_code=400, detail="Stop streaming before deleting")

    await db.slots.delete_one({"_id": ObjectId(slot_id)})
    return {"message": "Slot deleted successfully"}


@router.post("/{slot_id}/stream")
async def start_stream(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("status") != "active":
        raise HTTPException(status_code=400, detail="Slot is not active. Please renew.")
    if slot.get("isStreaming"):
        raise HTTPException(status_code=400, detail="Slot is already streaming")
    if not slot.get("videoId"):
        raise HTTPException(status_code=400, detail="No video assigned to slot")
    if not slot.get("streamKey"):
        raise HTTPException(status_code=400, detail="No stream key set")

    # Check expiry
    if slot.get("expiryDate") and slot["expiryDate"] < datetime.utcnow():
        await db.slots.update_one({"_id": ObjectId(slot_id)}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=400, detail="Slot has expired. Please renew.")

    # Get video
    video = await db.videos.find_one({"_id": ObjectId(slot["videoId"]), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=400, detail="Assigned video not found")

    # Start FFmpeg stream (via service)
    from app.services.streaming import start_ffmpeg_stream
    process_id = await start_ffmpeg_stream(
        slot_id=slot_id,
        video_url=video.get("fileUrl", video.get("s3Key", "")),
        stream_key=slot["streamKey"],
        rtmp_url=slot.get("rtmpUrl", ""),
        platform=slot["platform"],
    )

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {"isStreaming": True, "streamProcessId": process_id, "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Stream started", "processId": process_id}


@router.post("/{slot_id}/stop")
async def stop_stream(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if not slot.get("isStreaming"):
        raise HTTPException(status_code=400, detail="Slot is not streaming")

    from app.services.streaming import stop_ffmpeg_stream
    await stop_ffmpeg_stream(slot.get("streamProcessId"))

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Stream stopped"}


@router.get("/{slot_id}/status")
async def get_stream_status(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    is_live = False
    if slot.get("isStreaming") and slot.get("streamProcessId"):
        from app.services.streaming import check_stream_status
        is_live = await check_stream_status(slot["streamProcessId"])
        if not is_live:
            await db.slots.update_one(
                {"_id": ObjectId(slot_id)},
                {"$set": {"isStreaming": False, "streamProcessId": None}}
            )

    return {"isStreaming": is_live, "slotId": slot_id}


def get_default_rtmp(platform: str) -> str:
    rtmp_urls = {
        "youtube": "rtmp://a.rtmp.youtube.com/live2",
        "facebook": "rtmps://live-api-s.facebook.com:443/rtmp",
        "twitch": "rtmp://live.twitch.tv/app",
        "instagram": "rtmps://live-upload.instagram.com:443/rtmp",
        "custom": "",
    }
    return rtmp_urls.get(platform, "")
