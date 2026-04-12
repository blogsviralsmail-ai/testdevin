from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime, timedelta
from bson import ObjectId
from dateutil import parser as dateutil_parser
import os
import uuid
import subprocess
import shutil
import logging

from app.database import get_db
from app.models.schemas import CreateSlotRequest, UpdateSlotRequest
from app.utils.auth import get_current_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
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
    # Parse schedule dates
    scheduled_start = None
    scheduled_end = None
    if req.scheduledStart:
        try:
            scheduled_start = dateutil_parser.isoparse(req.scheduledStart).replace(tzinfo=None)
        except (ValueError, AttributeError):
            scheduled_start = req.scheduledStart
    if req.scheduledEnd:
        try:
            scheduled_end = dateutil_parser.isoparse(req.scheduledEnd).replace(tzinfo=None)
        except (ValueError, AttributeError):
            scheduled_end = req.scheduledEnd

    slot = {
        "userId": user["id"],
        "name": req.name,
        "platform": req.platform,
        "streamKey": req.streamKey,
        "rtmpUrl": req.rtmpUrl or get_default_rtmp(req.platform),
        "videoId": req.videoId,
        "status": "active",  # Auto-activated, no admin approval needed
        "isStreaming": False,
        "streamProcessId": None,
        "scheduledStart": scheduled_start,
        "scheduledEnd": scheduled_end,
        "expiryDate": datetime.utcnow() + timedelta(days=365),  # 1 year default
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
    if req.scheduledStart is not None:
        if req.scheduledStart == "":
            update["scheduledStart"] = None
        else:
            try:
                update["scheduledStart"] = dateutil_parser.isoparse(req.scheduledStart).replace(tzinfo=None)
            except (ValueError, AttributeError):
                update["scheduledStart"] = req.scheduledStart
    if req.scheduledEnd is not None:
        if req.scheduledEnd == "":
            update["scheduledEnd"] = None
        else:
            try:
                update["scheduledEnd"] = dateutil_parser.isoparse(req.scheduledEnd).replace(tzinfo=None)
            except (ValueError, AttributeError):
                update["scheduledEnd"] = req.scheduledEnd

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

    video_file_url = video.get("fileUrl", video.get("s3Key", ""))

    # Auto-generate thumbnail from video if no custom thumbnail set
    if not slot.get("customThumbnail"):
        upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
        thumb_dir = f"{upload_dir}/stream_thumbnails"
        os.makedirs(thumb_dir, exist_ok=True)
        thumb_id = uuid.uuid4().hex
        thumb_path = f"{thumb_dir}/{thumb_id}.jpg"
        if video_file_url and os.path.exists(video_file_url):
            if generate_stream_thumbnail(video_file_url, thumb_path):
                auto_thumb_url = f"/api/videos/file/stream_thumbnails/{thumb_id}.jpg"
                await db.slots.update_one(
                    {"_id": ObjectId(slot_id)},
                    {"$set": {"autoThumbnail": auto_thumb_url}}
                )
                logger.info(f"Auto-generated stream thumbnail for slot {slot_id}")

    # Start FFmpeg stream (via service)
    from app.services.streaming import start_ffmpeg_stream
    process_id = await start_ffmpeg_stream(
        slot_id=slot_id,
        video_url=video_file_url,
        stream_key=slot["streamKey"],
        rtmp_url=slot.get("rtmpUrl", ""),
        platform=slot["platform"],
    )

    if process_id is None:
        raise HTTPException(
            status_code=500,
            detail="FFmpeg streaming failed to start. The server may not support RTMP streaming. Please contact support."
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


def _get_ffmpeg_path() -> str:
    """Get FFmpeg binary path."""
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def generate_stream_thumbnail(video_path: str, thumbnail_path: str) -> bool:
    """Generate a thumbnail from best part of video (25% in) using FFmpeg."""
    try:
        ffmpeg = _get_ffmpeg_path()
        # First get video duration
        import re
        cmd_dur = [ffmpeg, "-i", video_path, "-f", "null", "-"]
        result = subprocess.run(cmd_dur, capture_output=True, text=True, timeout=30)
        duration = 0.0
        match = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", result.stderr)
        if match:
            h, m, s = float(match.group(1)), float(match.group(2)), float(match.group(3))
            duration = h * 3600 + m * 60 + s

        # Extract frame at 25% into video for best quality
        seek_time = max(1, duration * 0.25) if duration > 4 else 1
        minutes = int(seek_time // 60)
        seconds = seek_time % 60

        cmd = [
            ffmpeg, "-i", video_path,
            "-ss", f"00:{minutes:02d}:{seconds:05.2f}",
            "-vframes", "1",
            "-vf", "scale=1280:-1",  # HD thumbnail
            "-q:v", "2",  # High quality JPEG
            "-y", thumbnail_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0 and os.path.exists(thumbnail_path)
    except Exception as e:
        logger.warning(f"Stream thumbnail generation failed: {e}")
        return False


@router.post("/{slot_id}/thumbnail")
async def upload_slot_thumbnail(slot_id: str, thumbnail: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload a custom thumbnail for a slot's stream."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    thumb_dir = f"{upload_dir}/stream_thumbnails"
    os.makedirs(thumb_dir, exist_ok=True)

    ext = thumbnail.filename.rsplit(".", 1)[-1] if "." in thumbnail.filename else "jpg"
    thumb_id = uuid.uuid4().hex
    thumb_path = f"{thumb_dir}/{thumb_id}.{ext}"

    # Save thumbnail file
    with open(thumb_path, "wb") as f:
        content = await thumbnail.read()
        f.write(content)

    thumb_url = f"/api/videos/file/stream_thumbnails/{thumb_id}.{ext}"
    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {"customThumbnail": thumb_url, "updatedAt": datetime.utcnow()}}
    )

    return {"message": "Thumbnail uploaded", "thumbnailUrl": thumb_url}


def get_default_rtmp(platform: str) -> str:
    rtmp_urls = {
        "youtube": "rtmp://a.rtmp.youtube.com/live2",
        "facebook": "rtmps://live-api-s.facebook.com:443/rtmp",
        "twitch": "rtmp://live.twitch.tv/app",
        "instagram": "rtmps://live-upload.instagram.com:443/rtmp",
        "custom": "",
    }
    return rtmp_urls.get(platform, "")
