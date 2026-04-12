from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
import uuid
import os

from app.database import get_db
from app.models.schemas import ConfirmUploadRequest, UpdateVideoRequest
from app.utils.auth import get_current_user, serialize_doc, serialize_docs
from app.config import AWS_BUCKET_NAME, AWS_REGION

router = APIRouter(prefix="/api/videos", tags=["Videos"])


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
    upload_dir = "/tmp/kkhsmedia_uploads"
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

    db = get_db()
    video = {
        "userId": user["id"],
        "name": file.filename,
        "originalName": file.filename,
        "s3Key": s3_key,
        "fileUrl": file_path,
        "fileSize": file_size,
        "duration": 0,
        "thumbnailUrl": "",
        "status": "ready",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.videos.insert_one(video)
    video["id"] = str(result.inserted_id)

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
    if video.get("fileUrl") and video["fileUrl"].startswith("/tmp/"):
        try:
            os.remove(video["fileUrl"])
        except Exception:
            pass

    await db.videos.delete_one({"_id": ObjectId(video_id)})
    # Remove video reference from slots
    await db.slots.update_many({"videoId": video_id}, {"$set": {"videoId": None}})

    return {"message": "Video deleted successfully"}


@router.get("/{video_id}")
async def get_video(video_id: str, user=Depends(get_current_user)):
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return serialize_doc(video)
