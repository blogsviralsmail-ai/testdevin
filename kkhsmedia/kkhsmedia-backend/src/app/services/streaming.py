import asyncio
import logging
import os
import shutil
import signal
from typing import Optional

logger = logging.getLogger(__name__)

# Store active FFmpeg processes
active_streams: dict = {}

# Cache for FFmpeg RTMP capability
_ffmpeg_rtmp_ok: Optional[bool] = None


def _get_ffmpeg_path() -> str:
    """Get FFmpeg binary path - try system first, then imageio-ffmpeg bundle."""
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


async def _check_ffmpeg_rtmp() -> bool:
    """Quick smoke-test: can FFmpeg open an RTMP output without crashing?"""
    global _ffmpeg_rtmp_ok
    if _ffmpeg_rtmp_ok is not None:
        return _ffmpeg_rtmp_ok

    ffmpeg = _get_ffmpeg_path()
    try:
        proc = await asyncio.create_subprocess_exec(
            ffmpeg, "-protocols",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
        _ffmpeg_rtmp_ok = b"rtmp" in stdout
        if not _ffmpeg_rtmp_ok:
            logger.error("FFmpeg does not support RTMP protocol")
        return _ffmpeg_rtmp_ok
    except Exception as e:
        logger.error(f"FFmpeg RTMP check failed: {e}")
        _ffmpeg_rtmp_ok = False
        return False


async def start_ffmpeg_stream(
    slot_id: str,
    video_url: str,
    stream_key: str,
    rtmp_url: str,
    platform: str,
) -> Optional[int]:
    """Start an FFmpeg process to stream a video in loop."""

    ffmpeg = _get_ffmpeg_path()
    logger.info(f"Using FFmpeg at: {ffmpeg}")

    # Pre-check RTMP support
    if not await _check_ffmpeg_rtmp():
        logger.error("FFmpeg RTMP not supported on this server - streaming unavailable")
        return None

    # Build RTMP destination
    if platform == "custom" and rtmp_url:
        destination = f"{rtmp_url}/{stream_key}" if stream_key else rtmp_url
    elif rtmp_url:
        destination = f"{rtmp_url}/{stream_key}"
    else:
        rtmp_urls = {
            "youtube": "rtmp://a.rtmp.youtube.com/live2",
            "facebook": "rtmps://live-api-s.facebook.com:443/rtmp",
            "twitch": "rtmp://live.twitch.tv/app",
            "instagram": "rtmps://live-upload.instagram.com:443/rtmp",
        }
        base = rtmp_urls.get(platform, "rtmp://a.rtmp.youtube.com/live2")
        destination = f"{base}/{stream_key}"

    logger.info(f"Streaming video: {video_url} -> {destination}")

    # FFmpeg command for 24/7 loop streaming
    # Use copy codec first (no re-encoding = low memory). Fall back to
    # lightweight re-encode only if the input isn't already h264/aac.
    cmd = [
        ffmpeg,
        "-re",                          # Read at native frame rate
        "-stream_loop", "-1",           # Infinite loop
        "-i", video_url,                # Input video (S3 URL or local path)
        "-c:v", "copy",                # Copy video (no re-encoding = low RAM)
        "-c:a", "aac",                # Audio codec (re-encode to aac for RTMP compat)
        "-b:a", "128k",
        "-ar", "44100",
        "-f", "flv",                   # Output format for RTMP
        "-flvflags", "no_duration_filesize",
        destination,
    ]

    logger.info(f"FFmpeg cmd: {' '.join(cmd)}")

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        active_streams[slot_id] = {
            "process": process,
            "pid": process.pid,
            "platform": platform,
            "video_url": video_url,
        }

        # Monitor FFmpeg process in background for early failures
        async def _monitor():
            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10)
                if process.returncode != 0:
                    logger.error(f"FFmpeg exited with code {process.returncode} for slot {slot_id}")
                    logger.error(f"FFmpeg stderr: {stderr.decode('utf-8', errors='replace')[-2000:]}")
                    # Clean up DB
                    from app.database import get_db
                    db = get_db()
                    await db.slots.update_one(
                        {"_id": __import__('bson').ObjectId(slot_id)},
                        {"$set": {"isStreaming": False, "streamProcessId": None}}
                    )
            except asyncio.TimeoutError:
                # Still running after 10s = good, it's streaming
                logger.info(f"FFmpeg still running for slot {slot_id} after 10s - stream is active")

        asyncio.create_task(_monitor())
        return process.pid
    except Exception as e:
        logger.error(f"FFmpeg start error for slot {slot_id}: {e}")
        return None


async def stop_ffmpeg_stream(process_id: Optional[int]) -> bool:
    """Stop an FFmpeg process."""
    if not process_id:
        return False

    # Find and kill by PID
    try:
        os.kill(process_id, signal.SIGTERM)
        # Remove from active streams
        for slot_id, info in list(active_streams.items()):
            if info.get("pid") == process_id:
                del active_streams[slot_id]
                break
        return True
    except ProcessLookupError:
        # Process already dead
        for slot_id, info in list(active_streams.items()):
            if info.get("pid") == process_id:
                del active_streams[slot_id]
                break
        return True
    except Exception as e:
        print(f"FFmpeg stop error for PID {process_id}: {e}")
        return False


async def check_stream_status(process_id: Optional[int]) -> bool:
    """Check if FFmpeg process is still running."""
    if not process_id:
        return False
    try:
        os.kill(process_id, 0)  # Signal 0 = check if process exists
        return True
    except (ProcessLookupError, PermissionError):
        return False


def get_active_streams() -> dict:
    """Get all active streams info."""
    result = {}
    for slot_id, info in active_streams.items():
        result[slot_id] = {
            "pid": info.get("pid"),
            "platform": info.get("platform"),
            "video_url": info.get("video_url"),
        }
    return result
