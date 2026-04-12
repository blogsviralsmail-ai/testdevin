import asyncio
import os
import signal
from typing import Optional

# Store active FFmpeg processes
active_streams: dict = {}


async def start_ffmpeg_stream(
    slot_id: str,
    video_url: str,
    stream_key: str,
    rtmp_url: str,
    platform: str,
) -> Optional[int]:
    """Start an FFmpeg process to stream a video in loop."""

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

    # FFmpeg command for 24/7 loop streaming
    cmd = [
        "ffmpeg",
        "-re",                          # Read at native frame rate
        "-stream_loop", "-1",           # Infinite loop
        "-i", video_url,                # Input video (S3 URL or local path)
        "-c:v", "libx264",             # Video codec
        "-preset", "veryfast",          # Fast encoding
        "-b:v", "2500k",              # Video bitrate
        "-maxrate", "3000k",
        "-bufsize", "6000k",
        "-pix_fmt", "yuv420p",
        "-g", "50",                    # Keyframe interval
        "-c:a", "aac",                # Audio codec
        "-b:a", "128k",
        "-ar", "44100",
        "-f", "flv",                   # Output format
        destination,
    ]

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
        return process.pid
    except Exception as e:
        print(f"FFmpeg start error for slot {slot_id}: {e}")
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
