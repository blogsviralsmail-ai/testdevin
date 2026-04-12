"""Advanced streaming features: YouTube URL, multi-stream, playlist queue, overlays, recording, etc."""
import asyncio
import logging
import os
import shutil
import subprocess
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs
from app.services.streaming import _get_ffmpeg_path, active_streams, stop_ffmpeg_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/streaming", tags=["Advanced Streaming"])


# ============ YOUTUBE PLAYLIST/URL STREAMING (yt-dlp) ============

class YTUrlStreamRequest(BaseModel):
    slotId: str
    url: str  # YouTube video/playlist URL
    loop: bool = True


@router.post("/youtube-url")
async def stream_from_youtube_url(req: YTUrlStreamRequest, user=Depends(get_current_user)):
    """Stream from a YouTube video/playlist URL using yt-dlp (no download needed)."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if not slot.get("streamKey"):
        raise HTTPException(status_code=400, detail="Stream key not set")

    # Get stream URL using yt-dlp
    yt_dlp = shutil.which("yt-dlp")
    if not yt_dlp:
        raise HTTPException(status_code=500, detail="yt-dlp not installed on server")

    try:
        # Get best stream URL (no download)
        result = subprocess.run(
            [yt_dlp, "--get-url", "-f", "best[ext=mp4]/best", "--no-playlist", req.url],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            # Try playlist mode
            result = subprocess.run(
                [yt_dlp, "--get-url", "-f", "best[ext=mp4]/best", "--flat-playlist", req.url],
                capture_output=True, text=True, timeout=30,
            )
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Failed to get stream URL: {result.stderr[:200]}")

        stream_urls = [u.strip() for u in result.stdout.strip().split("\n") if u.strip()]
        if not stream_urls:
            raise HTTPException(status_code=400, detail="No stream URLs found")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=400, detail="Timeout getting stream URL")

    # Build RTMP destination
    platform = slot.get("platform", "youtube")
    stream_key = slot["streamKey"]
    rtmp_url = slot.get("rtmpUrl", "")
    if platform == "custom" and rtmp_url:
        destination = f"{rtmp_url}/{stream_key}" if stream_key else rtmp_url
    elif rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    else:
        rtmp_urls = {
            "youtube": "rtmp://a.rtmp.youtube.com/live2",
            "facebook": "rtmps://live-api-s.facebook.com:443/rtmp",
            "twitch": "rtmp://live.twitch.tv/app",
        }
        base = rtmp_urls.get(platform, "rtmp://a.rtmp.youtube.com/live2")
        destination = f"{base}/{stream_key}"

    # Stop existing stream if any
    if slot.get("streamProcessId"):
        await stop_ffmpeg_stream(slot["streamProcessId"])

    # Start FFmpeg with the stream URL
    ffmpeg = _get_ffmpeg_path()
    video_url = stream_urls[0]

    loop_args = ["-stream_loop", "-1"] if req.loop else []
    cmd = [
        ffmpeg, "-re", *loop_args,
        "-i", video_url,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-f", "flv", "-flvflags", "no_duration_filesize",
        destination,
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )

        slot_id = str(slot["_id"])
        active_streams[slot_id] = {
            "process": process, "pid": process.pid, "platform": platform,
            "video_url": video_url, "destination": destination,
            "stream_key": stream_key, "rtmp_url": rtmp_url,
            "started_at": datetime.utcnow().isoformat(), "restart_count": 0,
            "source_type": "youtube_url", "source_url": req.url,
        }

        await db.slots.update_one(
            {"_id": ObjectId(req.slotId)},
            {"$set": {
                "isStreaming": True, "streamProcessId": process.pid,
                "sourceType": "youtube_url", "sourceUrl": req.url,
                "updatedAt": datetime.utcnow(),
            }}
        )
        return {"message": "Streaming from YouTube URL", "pid": process.pid}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start stream: {str(e)}")


@router.post("/youtube-url/extract")
async def extract_youtube_info(url: str, user=Depends(get_current_user)):
    """Extract video/playlist info from YouTube URL."""
    yt_dlp = shutil.which("yt-dlp")
    if not yt_dlp:
        raise HTTPException(status_code=500, detail="yt-dlp not installed")

    try:
        result = subprocess.run(
            [yt_dlp, "--dump-json", "--flat-playlist", "--no-download", url],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail="Failed to extract info")

        import json
        lines = [l for l in result.stdout.strip().split("\n") if l.strip()]
        videos = []
        for line in lines[:50]:  # Limit to 50 items
            try:
                data = json.loads(line)
                videos.append({
                    "title": data.get("title", "Unknown"),
                    "url": data.get("url") or data.get("webpage_url", ""),
                    "duration": data.get("duration", 0),
                    "thumbnail": data.get("thumbnail", ""),
                })
            except json.JSONDecodeError:
                continue

        return {"videos": videos, "count": len(videos)}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=400, detail="Timeout extracting info")


# ============ MULTI-STREAM (same video to multiple platforms) ============

class MultiStreamRequest(BaseModel):
    videoId: str
    destinations: list  # [{"platform": "youtube", "streamKey": "xxx", "rtmpUrl": ""}]
    loop: bool = True


@router.post("/multi-stream")
async def start_multi_stream(req: MultiStreamRequest, user=Depends(get_current_user)):
    """Stream same video to multiple platforms simultaneously."""
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(req.videoId), "userId": user["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video_url = video.get("fileUrl", video.get("s3Key", ""))
    if not video_url:
        raise HTTPException(status_code=400, detail="Video file not found")

    ffmpeg = _get_ffmpeg_path()
    started = []

    for dest in req.destinations:
        platform = dest.get("platform", "youtube")
        stream_key = dest.get("streamKey", "")
        rtmp_url = dest.get("rtmpUrl", "")

        if not stream_key:
            continue

        if platform == "custom" and rtmp_url:
            destination = f"{rtmp_url}/{stream_key}" if stream_key else rtmp_url
        elif rtmp_url:
            destination = f"{rtmp_url}/{stream_key}"
        else:
            urls = {
                "youtube": "rtmp://a.rtmp.youtube.com/live2",
                "facebook": "rtmps://live-api-s.facebook.com:443/rtmp",
                "twitch": "rtmp://live.twitch.tv/app",
            }
            base = urls.get(platform, "rtmp://a.rtmp.youtube.com/live2")
            destination = f"{base}/{stream_key}"

        loop_args = ["-stream_loop", "-1"] if req.loop else []
        cmd = [
            ffmpeg, "-re", *loop_args,
            "-i", video_url,
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            "-f", "flv", "-flvflags", "no_duration_filesize",
            destination,
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
            )
            stream_id = f"multi_{req.videoId}_{platform}_{len(started)}"
            active_streams[stream_id] = {
                "process": process, "pid": process.pid, "platform": platform,
                "video_url": video_url, "destination": destination,
                "stream_key": stream_key, "rtmp_url": rtmp_url,
                "started_at": datetime.utcnow().isoformat(), "restart_count": 0,
                "source_type": "multi_stream",
            }
            started.append({"platform": platform, "pid": process.pid, "streamId": stream_id})
        except Exception as e:
            logger.error(f"Multi-stream error for {platform}: {e}")

    return {"message": f"Started streaming to {len(started)} platforms", "streams": started}


@router.post("/multi-stream/stop")
async def stop_multi_stream(stream_ids: list, user=Depends(get_current_user)):
    """Stop multi-stream processes."""
    stopped = 0
    for sid in stream_ids:
        info = active_streams.get(sid)
        if info:
            proc = info.get("process")
            if proc and proc.returncode is None:
                proc.kill()
            active_streams.pop(sid, None)
            stopped += 1
    return {"message": f"Stopped {stopped} streams"}


# ============ VIDEO PLAYLIST/QUEUE ============

class PlaylistQueueRequest(BaseModel):
    slotId: str
    videoIds: list  # ordered list of video IDs to play in sequence


@router.post("/playlist-queue")
async def start_playlist_queue(req: PlaylistQueueRequest, user=Depends(get_current_user)):
    """Stream multiple videos in sequence (playlist queue)."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if not slot.get("streamKey"):
        raise HTTPException(status_code=400, detail="Stream key not set")

    # Get all video URLs
    video_files = []
    for vid in req.videoIds:
        video = await db.videos.find_one({"_id": ObjectId(vid), "userId": user["id"]})
        if video:
            url = video.get("fileUrl", video.get("s3Key", ""))
            if url:
                video_files.append(url)

    if not video_files:
        raise HTTPException(status_code=400, detail="No valid videos found")

    # Create concat file for FFmpeg
    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    concat_file = os.path.join(upload_dir, f"playlist_{req.slotId}.txt")
    with open(concat_file, "w") as f:
        for vf in video_files:
            f.write(f"file '{vf}'\n")

    # Build destination
    platform = slot.get("platform", "youtube")
    stream_key = slot["streamKey"]
    rtmp_url = slot.get("rtmpUrl", "")
    if platform == "custom" and rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    elif rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    else:
        urls = {"youtube": "rtmp://a.rtmp.youtube.com/live2", "facebook": "rtmps://live-api-s.facebook.com:443/rtmp", "twitch": "rtmp://live.twitch.tv/app"}
        destination = f"{urls.get(platform, 'rtmp://a.rtmp.youtube.com/live2')}/{stream_key}"

    # Stop existing
    if slot.get("streamProcessId"):
        await stop_ffmpeg_stream(slot["streamProcessId"])

    ffmpeg = _get_ffmpeg_path()
    cmd = [
        ffmpeg, "-re", "-stream_loop", "-1",
        "-f", "concat", "-safe", "0", "-i", concat_file,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-f", "flv", "-flvflags", "no_duration_filesize",
        destination,
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        slot_id = str(slot["_id"])
        active_streams[slot_id] = {
            "process": process, "pid": process.pid, "platform": platform,
            "video_url": concat_file, "destination": destination,
            "stream_key": stream_key, "rtmp_url": rtmp_url,
            "started_at": datetime.utcnow().isoformat(), "restart_count": 0,
            "source_type": "playlist_queue",
        }

        await db.slots.update_one(
            {"_id": ObjectId(req.slotId)},
            {"$set": {
                "isStreaming": True, "streamProcessId": process.pid,
                "sourceType": "playlist_queue", "playlistVideos": req.videoIds,
                "updatedAt": datetime.utcnow(),
            }}
        )
        return {"message": f"Playlist streaming started with {len(video_files)} videos", "pid": process.pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ SCHEDULED PLAYLIST ============

class ScheduledPlaylistItem(BaseModel):
    videoId: str
    startTime: str  # ISO datetime
    endTime: str  # ISO datetime


class ScheduledPlaylistRequest(BaseModel):
    slotId: str
    schedule: list  # List of ScheduledPlaylistItem


@router.post("/scheduled-playlist")
async def save_scheduled_playlist(req: ScheduledPlaylistRequest, user=Depends(get_current_user)):
    """Save a scheduled playlist (different videos at different times)."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    schedule = []
    for item in req.schedule:
        video = await db.videos.find_one({"_id": ObjectId(item.videoId)})
        schedule.append({
            "videoId": item.videoId,
            "videoName": video.get("name", "") if video else "",
            "startTime": item.startTime,
            "endTime": item.endTime,
        })

    await db.slots.update_one(
        {"_id": ObjectId(req.slotId)},
        {"$set": {"scheduledPlaylist": schedule, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Scheduled playlist saved with {len(schedule)} items"}


# ============ OVERLAY / WATERMARK ============

@router.post("/overlay/{slot_id}")
async def upload_overlay(slot_id: str, file: UploadFile = File(...), position: str = "topright", user=Depends(get_current_user)):
    """Upload overlay/watermark image for a stream."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    overlay_dir = os.path.join(upload_dir, "overlays")
    os.makedirs(overlay_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "overlay.png")[1]
    filename = f"overlay_{slot_id}{ext}"
    filepath = os.path.join(overlay_dir, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    positions = {
        "topleft": "10:10",
        "topright": "main_w-overlay_w-10:10",
        "bottomleft": "10:main_h-overlay_h-10",
        "bottomright": "main_w-overlay_w-10:main_h-overlay_h-10",
        "center": "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
    }

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {
            "overlayImage": filepath,
            "overlayPosition": positions.get(position, positions["topright"]),
            "overlayPositionName": position,
            "updatedAt": datetime.utcnow(),
        }}
    )
    return {"message": "Overlay uploaded", "position": position}


@router.delete("/overlay/{slot_id}")
async def remove_overlay(slot_id: str, user=Depends(get_current_user)):
    db = get_db()
    await db.slots.update_one(
        {"_id": ObjectId(slot_id), "userId": user["id"]},
        {"$unset": {"overlayImage": "", "overlayPosition": "", "overlayPositionName": ""}}
    )
    return {"message": "Overlay removed"}


# ============ STREAM RECORDING ============

@router.post("/record/{slot_id}/start")
async def start_recording(slot_id: str, user=Depends(get_current_user)):
    """Start recording a stream simultaneously."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot or not slot.get("isStreaming"):
        raise HTTPException(status_code=400, detail="Slot not streaming")

    info = active_streams.get(slot_id)
    if not info:
        raise HTTPException(status_code=400, detail="Stream not found in active streams")

    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    recordings_dir = os.path.join(upload_dir, "recordings")
    os.makedirs(recordings_dir, exist_ok=True)
    recording_file = os.path.join(recordings_dir, f"rec_{slot_id}_{int(datetime.utcnow().timestamp())}.mp4")

    ffmpeg = _get_ffmpeg_path()
    video_url = info.get("video_url", "")
    cmd = [
        ffmpeg, "-re", "-i", video_url,
        "-c:v", "copy", "-c:a", "copy",
        recording_file,
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        rec_id = f"rec_{slot_id}"
        active_streams[rec_id] = {
            "process": process, "pid": process.pid,
            "recording_file": recording_file, "source_type": "recording",
        }

        await db.slots.update_one(
            {"_id": ObjectId(slot_id)},
            {"$set": {"isRecording": True, "recordingPid": process.pid, "recordingFile": recording_file}}
        )
        return {"message": "Recording started", "file": recording_file}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/{slot_id}/stop")
async def stop_recording(slot_id: str, user=Depends(get_current_user)):
    """Stop recording a stream."""
    rec_id = f"rec_{slot_id}"
    info = active_streams.get(rec_id)
    if info:
        proc = info.get("process")
        if proc and proc.returncode is None:
            proc.terminate()
        active_streams.pop(rec_id, None)

    db = get_db()
    await db.slots.update_one(
        {"_id": ObjectId(slot_id), "userId": user["id"]},
        {"$set": {"isRecording": False, "recordingPid": None}}
    )
    return {"message": "Recording stopped"}


# ============ MULTI-BITRATE STREAMING ============

class MultiBitrateRequest(BaseModel):
    slotId: str
    bitrates: list = ["1080p", "720p", "480p"]  # quality levels


@router.post("/multi-bitrate")
async def start_multi_bitrate(req: MultiBitrateRequest, user=Depends(get_current_user)):
    """Start multi-bitrate streaming (adaptive quality)."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Store bitrate config
    bitrate_config = {
        "1080p": {"width": 1920, "height": 1080, "bitrate": "4500k"},
        "720p": {"width": 1280, "height": 720, "bitrate": "2500k"},
        "480p": {"width": 854, "height": 480, "bitrate": "1000k"},
        "360p": {"width": 640, "height": 360, "bitrate": "500k"},
    }

    selected = [bitrate_config[b] for b in req.bitrates if b in bitrate_config]

    await db.slots.update_one(
        {"_id": ObjectId(req.slotId)},
        {"$set": {"multiBitrate": selected, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Multi-bitrate config saved with {len(selected)} quality levels", "bitrates": selected}


# ============ STREAM PREVIEW ============

@router.get("/preview/{slot_id}")
async def get_stream_preview(slot_id: str, user=Depends(get_current_user)):
    """Get a preview frame of the current stream."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user["id"]})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    info = active_streams.get(slot_id)
    video_url = None
    if info:
        video_url = info.get("video_url")
    elif slot.get("videoId"):
        video = await db.videos.find_one({"_id": ObjectId(slot["videoId"])})
        if video:
            video_url = video.get("fileUrl", video.get("s3Key", ""))

    if not video_url:
        raise HTTPException(status_code=400, detail="No video available for preview")

    # Generate preview frame
    upload_dir = os.getenv("UPLOAD_DIR", "/tmp/kkhsmedia_uploads")
    preview_file = os.path.join(upload_dir, f"preview_{slot_id}.jpg")

    ffmpeg = _get_ffmpeg_path()
    try:
        subprocess.run([
            ffmpeg, "-y", "-i", video_url, "-vframes", "1", "-q:v", "2", preview_file,
        ], capture_output=True, timeout=10)

        if os.path.exists(preview_file):
            return {"previewUrl": f"/api/videos/file/{os.path.basename(preview_file)}"}
    except Exception:
        pass

    return {"previewUrl": None, "message": "Preview not available"}


# ============ RTSP/HLS RE-STREAMING ============

class RestreamRequest(BaseModel):
    slotId: str
    sourceUrl: str  # RTSP or HLS URL
    loop: bool = False


@router.post("/restream")
async def start_restream(req: RestreamRequest, user=Depends(get_current_user)):
    """Re-stream from RTSP/HLS source to RTMP destination."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot or not slot.get("streamKey"):
        raise HTTPException(status_code=400, detail="Slot not found or no stream key")

    platform = slot.get("platform", "youtube")
    stream_key = slot["streamKey"]
    rtmp_url = slot.get("rtmpUrl", "")
    if rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    else:
        urls = {"youtube": "rtmp://a.rtmp.youtube.com/live2", "facebook": "rtmps://live-api-s.facebook.com:443/rtmp", "twitch": "rtmp://live.twitch.tv/app"}
        destination = f"{urls.get(platform, 'rtmp://a.rtmp.youtube.com/live2')}/{stream_key}"

    if slot.get("streamProcessId"):
        await stop_ffmpeg_stream(slot["streamProcessId"])

    ffmpeg = _get_ffmpeg_path()
    cmd = [
        ffmpeg, "-re",
        "-i", req.sourceUrl,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        "-f", "flv", destination,
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        slot_id = str(slot["_id"])
        active_streams[slot_id] = {
            "process": process, "pid": process.pid, "platform": platform,
            "video_url": req.sourceUrl, "destination": destination,
            "stream_key": stream_key, "rtmp_url": rtmp_url,
            "started_at": datetime.utcnow().isoformat(), "restart_count": 0,
            "source_type": "restream",
        }

        await db.slots.update_one(
            {"_id": ObjectId(req.slotId)},
            {"$set": {
                "isStreaming": True, "streamProcessId": process.pid,
                "sourceType": "restream", "sourceUrl": req.sourceUrl,
                "updatedAt": datetime.utcnow(),
            }}
        )
        return {"message": "Re-streaming started", "pid": process.pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ GOOGLE DRIVE / DROPBOX / ONEDRIVE STREAMING ============

class CloudStreamRequest(BaseModel):
    slotId: str
    cloudUrl: str  # Google Drive / Dropbox / OneDrive share link
    provider: str = "gdrive"  # gdrive, dropbox, onedrive


@router.post("/cloud-stream")
async def stream_from_cloud(req: CloudStreamRequest, user=Depends(get_current_user)):
    """Stream directly from Google Drive/Dropbox/OneDrive share link."""
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(req.slotId), "userId": user["id"]})
    if not slot or not slot.get("streamKey"):
        raise HTTPException(status_code=400, detail="Slot not found or no stream key")

    # Convert share links to direct download URLs
    direct_url = req.cloudUrl
    if req.provider == "gdrive":
        # Convert Google Drive share link to direct download
        if "drive.google.com" in req.cloudUrl:
            file_id = ""
            if "/file/d/" in req.cloudUrl:
                file_id = req.cloudUrl.split("/file/d/")[1].split("/")[0]
            elif "id=" in req.cloudUrl:
                file_id = req.cloudUrl.split("id=")[1].split("&")[0]
            if file_id:
                direct_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    elif req.provider == "dropbox":
        direct_url = req.cloudUrl.replace("dl=0", "dl=1").replace("www.dropbox.com", "dl.dropboxusercontent.com")
    elif req.provider == "onedrive":
        direct_url = req.cloudUrl.replace("embed", "download")

    # Use yt-dlp to handle the URL if possible, fallback to direct
    yt_dlp = shutil.which("yt-dlp")
    if yt_dlp and req.provider == "gdrive":
        try:
            result = subprocess.run(
                [yt_dlp, "--get-url", direct_url],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                direct_url = result.stdout.strip()
        except Exception:
            pass

    # Build destination and start streaming
    platform = slot.get("platform", "youtube")
    stream_key = slot["streamKey"]
    rtmp_url = slot.get("rtmpUrl", "")
    if rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    else:
        urls = {"youtube": "rtmp://a.rtmp.youtube.com/live2", "facebook": "rtmps://live-api-s.facebook.com:443/rtmp", "twitch": "rtmp://live.twitch.tv/app"}
        destination = f"{urls.get(platform, 'rtmp://a.rtmp.youtube.com/live2')}/{stream_key}"

    if slot.get("streamProcessId"):
        await stop_ffmpeg_stream(slot["streamProcessId"])

    ffmpeg = _get_ffmpeg_path()
    cmd = [
        ffmpeg, "-re", "-stream_loop", "-1",
        "-i", direct_url,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-f", "flv", "-flvflags", "no_duration_filesize",
        destination,
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        slot_id = str(slot["_id"])
        active_streams[slot_id] = {
            "process": process, "pid": process.pid, "platform": platform,
            "video_url": direct_url, "destination": destination,
            "stream_key": stream_key, "rtmp_url": rtmp_url,
            "started_at": datetime.utcnow().isoformat(), "restart_count": 0,
            "source_type": f"cloud_{req.provider}", "source_url": req.cloudUrl,
        }

        await db.slots.update_one(
            {"_id": ObjectId(req.slotId)},
            {"$set": {
                "isStreaming": True, "streamProcessId": process.pid,
                "sourceType": f"cloud_{req.provider}", "sourceUrl": req.cloudUrl,
                "updatedAt": datetime.utcnow(),
            }}
        )
        return {"message": f"Streaming from {req.provider}", "pid": process.pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
