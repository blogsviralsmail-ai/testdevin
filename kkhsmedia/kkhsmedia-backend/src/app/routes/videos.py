from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from datetime import datetime
from bson import ObjectId
import uuid
import os
import subprocess
import shutil
import logging
import glob as glob_mod
import asyncio
import threading

from app.database import get_db
from app.models.schemas import ConfirmUploadRequest, UpdateVideoRequest
from app.utils.auth import get_current_user, get_current_user_from_token_param, serialize_doc, serialize_docs
from app.config import AWS_BUCKET_NAME, AWS_REGION

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/videos", tags=["Videos"])


def _get_ffmpeg_path() -> str:
    """Get FFmpeg binary path - try system first, then imageio-ffmpeg bundle."""
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"  # fallback


def _get_ffprobe_path() -> str:
    """Get FFprobe binary path."""
    if shutil.which("ffprobe"):
        return "ffprobe"
    # imageio-ffmpeg bundles ffmpeg but not ffprobe, use ffmpeg -i as fallback
    return "ffprobe"


def generate_thumbnail(video_path: str, thumbnail_path: str) -> bool:
    """Generate a thumbnail from a video file using FFmpeg."""
    try:
        ffmpeg = _get_ffmpeg_path()
        cmd = [
            ffmpeg, "-i", video_path,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-y", thumbnail_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0 and os.path.exists(thumbnail_path)
    except Exception as e:
        logger.warning(f"Thumbnail generation failed: {e}")
        return False


def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds using FFmpeg."""
    try:
        ffmpeg = _get_ffmpeg_path()
        # Use ffmpeg -i to get duration (works even without ffprobe)
        cmd = [ffmpeg, "-i", video_path, "-f", "null", "-"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        # Parse duration from stderr: Duration: HH:MM:SS.ms
        import re
        match = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", result.stderr)
        if match:
            h, m, s = float(match.group(1)), float(match.group(2)), float(match.group(3))
            return h * 3600 + m * 60 + s
    except Exception as e:
        logger.warning(f"Duration detection failed: {e}")
    return 0


@router.get("")
async def get_videos(user=Depends(get_current_user)):
    db = get_db()
    videos = await db.videos.find({"userId": user["id"]}).sort("createdAt", -1).to_list(200)
    return serialize_docs(videos)


@router.get("/upload-url")
async def get_upload_url(fileName: str, fileType: str = "video/mp4", user=Depends(get_current_user)):
    """Generate a pre-signed S3 upload URL."""
    ext = fileName.rsplit(".", 1)[-1] if "." in fileName else "mp4"
    s3_key = f"videos/{user['id']}/{uuid.uuid4().hex}.{ext}"

    # For now, return a local upload endpoint since S3 keys not configured yet
    # When S3 is configured, this will generate pre-signed URL
    from app.config import AWS_ACCESS_KEY
    if AWS_ACCESS_KEY:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=os.getenv("AWS_SECRET_KEY", ""),
            )
            url = s3.generate_presigned_url(
                "put_object",
                Params={"Bucket": AWS_BUCKET_NAME, "Key": s3_key, "ContentType": fileType},
                ExpiresIn=3600,
            )
            return {"uploadUrl": url, "s3Key": s3_key, "method": "PUT"}
        except Exception:
            pass

    # Fallback: use local upload
    return {
        "uploadUrl": f"/api/videos/upload-local",
        "s3Key": s3_key,
        "method": "POST",
        "local": True,
    }


@router.post("/upload-local")
async def upload_local(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Local file upload fallback when S3 is not configured."""
    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "mp4"
    file_id = uuid.uuid4().hex
    file_path = f"{upload_dir}/{file_id}.{ext}"

    # Stream to disk in chunks to avoid OOM on limited memory servers
    file_size = 0
    chunk_size = 1024 * 256  # 256KB chunks
    with open(file_path, "wb") as f:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
            file_size += len(chunk)

    s3_key = f"local/{user['id']}/{file_id}.{ext}"

    # Generate thumbnail using FFmpeg
    thumb_dir = f"{upload_dir}/thumbnails"
    os.makedirs(thumb_dir, exist_ok=True)
    thumb_path = f"{thumb_dir}/{file_id}.jpg"
    thumbnail_url = ""
    if generate_thumbnail(file_path, thumb_path):
        thumbnail_url = f"/api/videos/file/thumbnails/{file_id}.jpg"

    # Get video duration
    duration = get_video_duration(file_path)

    db = get_db()
    video = {
        "userId": user["id"],
        "name": file.filename,
        "originalName": file.filename,
        "s3Key": s3_key,
        "fileUrl": file_path,
        "fileSize": file_size,
        "duration": duration,
        "thumbnailUrl": thumbnail_url,
        "status": "ready",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.videos.insert_one(video)
    video["id"] = str(result.inserted_id)

    return serialize_doc(video)


@router.post("/upload-chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    uploadId: str = Form(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    fileName: str = Form(...),
    user=Depends(get_current_user),
):
    """Chunked upload - receives individual chunks and assembles when all received.
    Bypasses Cloudflare's 100MB per-request limit by splitting into smaller chunks.
    """
    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    chunks_dir = f"{upload_dir}/chunks/{uploadId}"
    os.makedirs(chunks_dir, exist_ok=True)

    # Save this chunk to disk
    chunk_path = f"{chunks_dir}/{chunkIndex:06d}"
    chunk_size = 0
    with open(chunk_path, "wb") as f:
        while True:
            data = await file.read(1024 * 256)
            if not data:
                break
            f.write(data)
            chunk_size += len(data)

    # Check if all chunks have been received
    received = len(glob_mod.glob(f"{chunks_dir}/*"))
    if received < totalChunks:
        return {"status": "chunk_received", "received": received, "total": totalChunks}

    # All chunks received - assemble the file
    ext = fileName.rsplit(".", 1)[-1] if "." in fileName else "mp4"
    file_id = uuid.uuid4().hex
    file_path = f"{upload_dir}/{file_id}.{ext}"

    total_size = 0
    with open(file_path, "wb") as out_f:
        for i in range(totalChunks):
            cp = f"{chunks_dir}/{i:06d}"
            if not os.path.exists(cp):
                raise HTTPException(status_code=400, detail=f"Missing chunk {i}")
            with open(cp, "rb") as cf:
                while True:
                    data = cf.read(1024 * 256)
                    if not data:
                        break
                    out_f.write(data)
                    total_size += len(data)

    # Clean up chunk files
    shutil.rmtree(chunks_dir, ignore_errors=True)

    s3_key = f"local/{user['id']}/{file_id}.{ext}"

    # Insert video record immediately (without thumbnail/duration) to avoid Cloudflare timeout
    db = get_db()
    video = {
        "userId": user["id"],
        "name": fileName,
        "originalName": fileName,
        "s3Key": s3_key,
        "fileUrl": file_path,
        "fileSize": total_size,
        "duration": 0,
        "thumbnailUrl": "",
        "status": "processing",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.videos.insert_one(video)
    video_id = str(result.inserted_id)
    video["id"] = video_id

    # Process thumbnail and duration in background thread to not block response
    def _process_video_bg(vid_id: str, fpath: str, updir: str, fid: str):
        try:
            thumb_dir = f"{updir}/thumbnails"
            os.makedirs(thumb_dir, exist_ok=True)
            thumb_path = f"{thumb_dir}/{fid}.jpg"
            thumbnail_url = ""
            if generate_thumbnail(fpath, thumb_path):
                thumbnail_url = f"/api/videos/file/thumbnails/{fid}.jpg"
            duration = get_video_duration(fpath)
            # Update the video record with thumbnail and duration
            import asyncio as _aio
            from motor.motor_asyncio import AsyncIOMotorClient
            from app.config import MONGODB_URL, DATABASE_NAME
            loop = _aio.new_event_loop()
            _aio.set_event_loop(loop)
            client = AsyncIOMotorClient(MONGODB_URL)
            _db = client[DATABASE_NAME]
            loop.run_until_complete(_db.videos.update_one(
                {"_id": ObjectId(vid_id)},
                {"$set": {
                    "duration": duration,
                    "thumbnailUrl": thumbnail_url,
                    "status": "ready",
                    "updatedAt": datetime.utcnow(),
                }}
            ))
            client.close()
            loop.close()
            logger.info(f"Background processing done for video {vid_id}: duration={duration}, thumb={thumbnail_url}")
        except Exception as e:
            logger.error(f"Background video processing failed for {vid_id}: {e}")

    thread = threading.Thread(target=_process_video_bg, args=(video_id, file_path, upload_dir, file_id), daemon=True)
    thread.start()

    return serialize_doc(video)


@router.post("/confirm-upload")
async def confirm_upload(req: ConfirmUploadRequest, user=Depends(get_current_user)):
    db = get_db()
    video = {
        "userId": user["id"],
        "name": req.fileName,
        "originalName": req.fileName,
        "s3Key": req.s3Key,
        "fileUrl": f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{req.s3Key}",
        "fileSize": req.fileSize,
        "duration": 0,
        "thumbnailUrl": "",
        "status": "ready",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.videos.insert_one(video)
    video["id"] = str(result.inserted_id)
    return serialize_doc(video)


@router.patch("/{video_id}")
async def update_video(video_id: str, req: UpdateVideoRequest, user=Depends(get_current_user)):
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    await db.videos.update_one(
        {"_id": ObjectId(video_id)},
        {"$set": {"name": req.name, "updatedAt": datetime.utcnow()}}
    )
    updated = await db.videos.find_one({"_id": ObjectId(video_id)})
    return serialize_doc(updated)


@router.delete("/{video_id}")
async def delete_video(video_id: str, user=Depends(get_current_user)):
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if video is assigned to any active streaming slot
    streaming_slot = await db.slots.find_one({
        "userId": user["id"],
        "videoId": video_id,
        "isStreaming": True,
    })
    if streaming_slot:
        raise HTTPException(status_code=400, detail="Video is currently being streamed. Stop the stream first.")

    # Delete from S3 if configured
    from app.config import AWS_ACCESS_KEY
    if AWS_ACCESS_KEY and video.get("s3Key") and not video["s3Key"].startswith("local/"):
        try:
            import boto3
            s3 = boto3.client("s3", region_name=AWS_REGION,
                              aws_access_key_id=AWS_ACCESS_KEY,
                              aws_secret_access_key=os.getenv("AWS_SECRET_KEY", ""))
            s3.delete_object(Bucket=AWS_BUCKET_NAME, Key=video["s3Key"])
        except Exception:
            pass

    # Delete local file if exists
    if video.get("fileUrl") and os.path.exists(video["fileUrl"]):
        try:
            os.remove(video["fileUrl"])
            # Also delete thumbnail if exists
            thumb_path = video["fileUrl"].replace(os.path.basename(video["fileUrl"]), f"thumbnails/{os.path.basename(video['fileUrl']).rsplit('.', 1)[0]}.jpg")
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
        except Exception:
            pass

    await db.videos.delete_one({"_id": ObjectId(video_id)})
    # Remove video reference from slots
    await db.slots.update_many({"videoId": video_id}, {"$set": {"videoId": None}})

    return {"message": "Video deleted successfully"}


@router.get("/file/{filename:path}")
async def serve_file(filename: str, user=Depends(get_current_user_from_token_param)):
    """Serve uploaded video or thumbnail files."""
    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    file_path = os.path.realpath(os.path.join(upload_dir, filename))
    if not file_path.startswith(os.path.realpath(upload_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    # Determine media type
    if filename.endswith(".jpg") or filename.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".mp4"):
        media_type = "video/mp4"
    elif filename.endswith(".mkv"):
        media_type = "video/x-matroska"
    elif filename.endswith(".webm"):
        media_type = "video/webm"
    else:
        media_type = "application/octet-stream"
    return FileResponse(file_path, media_type=media_type)


@router.get("/{video_id}")
async def get_video(video_id: str, user=Depends(get_current_user)):
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return serialize_doc(video)


@router.get("/{video_id}/stream")
async def stream_video(video_id: str, user=Depends(get_current_user_from_token_param)):
    """Stream/serve the video file for playback."""
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    file_path = video.get("fileUrl", "")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else "mp4"
    media_types = {"mp4": "video/mp4", "mkv": "video/x-matroska", "webm": "video/webm", "avi": "video/x-msvideo"}
    return FileResponse(file_path, media_type=media_types.get(ext, "video/mp4"))
