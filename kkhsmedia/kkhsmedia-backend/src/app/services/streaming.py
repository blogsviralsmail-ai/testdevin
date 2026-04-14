import asyncio
import logging
import os
import shutil
import signal
import subprocess
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Store active FFmpeg processes
active_streams: dict = {}

# Cache for FFmpeg RTMP capability - None means unchecked
_ffmpeg_rtmp_ok: Optional[bool] = None

# Background scheduler task reference
_scheduler_task: Optional[asyncio.Task] = None


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


async def _kill_existing_stream_by_destination(destination: str) -> None:
    """Kill any existing FFmpeg process streaming to the same destination."""
    import re as _re
    try:
        result = subprocess.run(
            ["pgrep", "-f", f"ffmpeg.*{_re.escape(destination)}"],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip():
            pids = result.stdout.strip().split("\n")
            for pid in pids:
                try:
                    os.kill(int(pid), signal.SIGKILL)
                    logger.info(f"Killed existing FFmpeg process {pid} for destination {destination}")
                except (ProcessLookupError, ValueError):
                    pass
            await asyncio.sleep(1)
    except Exception as e:
        logger.warning(f"Error killing existing streams: {e}")


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

    # Kill any existing FFmpeg streaming to the same destination
    await _kill_existing_stream_by_destination(destination)

    # FFmpeg command for infinite loop streaming
    # -c:v copy = preserve original video quality (supports up to 4K)
    # -stream_loop -1 = infinite loop (video repeats forever until killed)
    cmd = [
        ffmpeg,
        "-re",                          # Read at native frame rate
        "-fflags", "+genpts",           # Regenerate PTS to fix timestamp jumps on loop
        "-stream_loop", "-1",           # Infinite loop - NEVER stops until killed
        "-i", video_url,                # Input video (S3 URL or local path)
        "-c:v", "copy",                 # Copy video codec (preserves 4K/1080p/720p quality)
        "-c:a", "aac",                  # Audio codec (re-encode to aac for RTMP compat)
        "-b:a", "128k",
        "-ar", "44100",
        "-f", "flv",                    # Output format for RTMP
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
            "destination": destination,
            "stream_key": stream_key,
            "rtmp_url": rtmp_url,
            "started_at": datetime.utcnow().isoformat(),
            "restart_count": 0,
        }

        # Start watchdog monitor for this stream (auto-restarts on crash)
        asyncio.create_task(_stream_watchdog(slot_id))
        return process.pid
    except Exception as e:
        logger.error(f"FFmpeg start error for slot {slot_id}: {e}")
        return None


async def _stream_watchdog(slot_id: str):
    """Watchdog that monitors FFmpeg and restarts it if it crashes.

    Ensures truly infinite streaming - if FFmpeg crashes for any reason
    (network glitch, memory issue, etc.), it auto-restarts.
    Stream only stops when explicitly stopped by user or scheduledEnd is reached.
    """
    # Wait initial 10 seconds to detect early failures
    await asyncio.sleep(10)

    while slot_id in active_streams:
        info = active_streams.get(slot_id)
        if not info:
            break

        proc = info.get("process")
        if proc is None:
            break

        # Check if process is still running
        if proc.returncode is not None:
            # Process has exited - check if we should restart
            restart_count = info.get("restart_count", 0)

            from app.database import get_db
            import bson
            db = get_db()
            slot = await db.slots.find_one({"_id": bson.ObjectId(slot_id)})

            if not slot or not slot.get("isStreaming"):
                active_streams.pop(slot_id, None)
                logger.info(f"Watchdog: Slot {slot_id} no longer streaming, stopping watchdog")
                break

            # Check if scheduledEnd has passed
            scheduled_end = slot.get("scheduledEnd")
            if scheduled_end:
                if isinstance(scheduled_end, str):
                    try:
                        scheduled_end = datetime.fromisoformat(scheduled_end.replace("Z", "+00:00")).replace(tzinfo=None)
                    except (ValueError, AttributeError):
                        scheduled_end = None
                if scheduled_end and datetime.utcnow() >= scheduled_end:
                    await db.slots.update_one(
                        {"_id": bson.ObjectId(slot_id)},
                        {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": datetime.utcnow()}}
                    )
                    active_streams.pop(slot_id, None)
                    logger.info(f"Watchdog: Slot {slot_id} reached scheduledEnd, stopped streaming")
                    break

            if restart_count >= 50:
                await db.slots.update_one(
                    {"_id": bson.ObjectId(slot_id)},
                    {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": datetime.utcnow()}}
                )
                active_streams.pop(slot_id, None)
                logger.error(f"Watchdog: Slot {slot_id} exceeded max restarts ({restart_count}), stopping")
                break

            # Restart the stream
            logger.warning(f"Watchdog: FFmpeg crashed for slot {slot_id} (restart #{restart_count + 1}), restarting...")

            video_url = info["video_url"]
            destination = info["destination"]

            ffmpeg = _get_ffmpeg_path()
            cmd = [
                ffmpeg, "-re", "-fflags", "+genpts",
                "-stream_loop", "-1",
                "-i", video_url,
                "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
                "-f", "flv", "-flvflags", "no_duration_filesize",
                destination,
            ]

            try:
                await asyncio.sleep(3)  # Brief pause before restart
                new_process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                active_streams[slot_id] = {
                    "process": new_process,
                    "pid": new_process.pid,
                    "platform": info["platform"],
                    "video_url": video_url,
                    "destination": destination,
                    "stream_key": info["stream_key"],
                    "rtmp_url": info["rtmp_url"],
                    "started_at": info.get("started_at"),
                    "restart_count": restart_count + 1,
                }
                await db.slots.update_one(
                    {"_id": bson.ObjectId(slot_id)},
                    {"$set": {"streamProcessId": new_process.pid, "updatedAt": datetime.utcnow()}}
                )
                logger.info(f"Watchdog: Restarted FFmpeg for slot {slot_id}, new PID: {new_process.pid}")
            except Exception as e:
                logger.error(f"Watchdog: Failed to restart FFmpeg for slot {slot_id}: {e}")
                await asyncio.sleep(10)
                continue

        # Check every 15 seconds
        await asyncio.sleep(15)


async def stop_ffmpeg_stream(process_id: Optional[int]) -> bool:
    """Stop an FFmpeg process. Uses multiple strategies to ensure it's killed."""
    if not process_id:
        return False

    killed = False

    # Strategy 1: Kill by stored asyncio Process object
    for slot_id, info in list(active_streams.items()):
        if info.get("pid") == process_id:
            proc = info.get("process")
            if proc and proc.returncode is None:
                try:
                    proc.kill()  # SIGKILL via asyncio
                    logger.info(f"Killed FFmpeg via asyncio process for slot {slot_id}")
                    killed = True
                except Exception:
                    pass
            del active_streams[slot_id]
            break

    # Strategy 2: Kill by PID with SIGTERM then SIGKILL
    try:
        os.kill(process_id, signal.SIGTERM)
        logger.info(f"Sent SIGTERM to FFmpeg PID {process_id}")
        killed = True
        # Give it 2 seconds to terminate gracefully
        await asyncio.sleep(2)
        # Check if still alive, force kill
        try:
            os.kill(process_id, 0)
            os.kill(process_id, signal.SIGKILL)
            logger.info(f"Sent SIGKILL to FFmpeg PID {process_id}")
        except ProcessLookupError:
            pass  # Already dead
    except ProcessLookupError:
        killed = True  # Already dead
    except Exception as e:
        logger.warning(f"FFmpeg stop error for PID {process_id}: {e}")

    # Strategy 3: Kill only the specific PID as last resort (not all FFmpeg processes)
    if not killed:
        try:
            subprocess.run(
                ["kill", "-9", str(process_id)],
                capture_output=True, timeout=5
            )
            logger.info(f"Used kill -9 as last resort for PID {process_id}")
            killed = True
        except Exception:
            pass

    return killed


async def start_stream(slot_id: str, user_id: str) -> Optional[int]:
    """High-level wrapper: look up slot + video from DB and start FFmpeg stream.

    Used by bulk.py and rtmp_config.py to start a stream without needing
    to know the low-level start_ffmpeg_stream arguments.
    """
    from app.database import get_db
    from bson import ObjectId

    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user_id})
    if not slot:
        raise ValueError(f"Slot {slot_id} not found for user {user_id}")

    video_id = slot.get("videoId")
    if not video_id:
        raise ValueError(f"Slot {slot_id} has no video assigned")

    video = await db.videos.find_one({"_id": ObjectId(video_id)})
    if not video:
        raise ValueError(f"Video {video_id} not found")

    video_url = video.get("localPath") or video.get("fileUrl") or video.get("s3Key", "")
    if not video_url:
        raise ValueError(f"Video {video_id} has no file URL")

    process_id = await start_ffmpeg_stream(
        slot_id=slot_id,
        video_url=video_url,
        stream_key=slot.get("streamKey", ""),
        rtmp_url=slot.get("rtmpUrl", ""),
        platform=slot.get("platform", "youtube"),
    )

    if process_id:
        await db.slots.update_one(
            {"_id": ObjectId(slot_id)},
            {"$set": {
                "isStreaming": True,
                "streamProcessId": process_id,
                "updatedAt": datetime.utcnow(),
            }}
        )

    return process_id


async def stop_stream(slot_id: str, user_id: str) -> bool:
    """High-level wrapper: look up slot from DB and stop its FFmpeg stream.

    Used by bulk.py and rtmp_config.py to stop a stream without needing
    to know the low-level stop_ffmpeg_stream arguments.
    """
    from app.database import get_db
    from bson import ObjectId

    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id), "userId": user_id})
    if not slot:
        raise ValueError(f"Slot {slot_id} not found for user {user_id}")

    process_id = slot.get("streamProcessId")
    killed = await stop_ffmpeg_stream(process_id)

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {
            "isStreaming": False,
            "streamProcessId": None,
            "updatedAt": datetime.utcnow(),
        }}
    )

    return killed


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
            "restart_count": info.get("restart_count", 0),
            "started_at": info.get("started_at"),
        }
    return result


async def start_scheduler():
    """Start background scheduler that handles auto-start, auto-stop, and crash recovery."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        return  # Already running
    _scheduler_task = asyncio.create_task(_scheduler_loop())
    logger.info("Stream scheduler started")


async def _scheduler_loop():
    """Background loop that checks every 30 seconds for:
    1. Scheduled streams that need to start
    2. Streams that need to stop (scheduledEnd reached)
    3. Crashed streams that need restart (orphan recovery)
    """
    await asyncio.sleep(5)  # Wait for app to fully start

    while True:
        try:
            from app.database import get_db
            import bson
            db = get_db()
            now = datetime.utcnow()

            # 1. Auto-start scheduled streams
            all_slots = await db.slots.find({
                "status": "active",
                "isStreaming": False,
                "scheduledStart": {"$exists": True, "$ne": None},
            }).to_list(100)

            for slot in all_slots:
                scheduled_start = slot.get("scheduledStart")
                if not scheduled_start:
                    continue

                if isinstance(scheduled_start, str):
                    try:
                        scheduled_start = datetime.fromisoformat(scheduled_start.replace("Z", "+00:00")).replace(tzinfo=None)
                    except (ValueError, AttributeError):
                        continue

                if now >= scheduled_start:
                    # Check if scheduledEnd already passed
                    scheduled_end = slot.get("scheduledEnd")
                    if scheduled_end:
                        if isinstance(scheduled_end, str):
                            try:
                                scheduled_end = datetime.fromisoformat(scheduled_end.replace("Z", "+00:00")).replace(tzinfo=None)
                            except (ValueError, AttributeError):
                                scheduled_end = None
                        if scheduled_end and now >= scheduled_end:
                            await db.slots.update_one(
                                {"_id": slot["_id"]},
                                {"$set": {"scheduledStart": None, "updatedAt": now}}
                            )
                            continue

                    if not slot.get("videoId") or not slot.get("streamKey"):
                        continue

                    video = await db.videos.find_one({"_id": bson.ObjectId(slot["videoId"])})
                    if not video:
                        continue

                    video_file_url = video.get("fileUrl", video.get("s3Key", ""))
                    slot_id = str(slot["_id"])

                    logger.info(f"Scheduler: Auto-starting stream for slot {slot_id}")

                    process_id = await start_ffmpeg_stream(
                        slot_id=slot_id,
                        video_url=video_file_url,
                        stream_key=slot["streamKey"],
                        rtmp_url=slot.get("rtmpUrl", ""),
                        platform=slot["platform"],
                    )

                    if process_id:
                        await db.slots.update_one(
                            {"_id": slot["_id"]},
                            {"$set": {
                                "isStreaming": True,
                                "streamProcessId": process_id,
                                "scheduledStart": None,
                                "updatedAt": now,
                            }}
                        )
                        logger.info(f"Scheduler: Stream auto-started for slot {slot_id}, PID: {process_id}")

            # 2. Auto-stop streams that reached scheduledEnd
            streaming_slots = await db.slots.find({
                "isStreaming": True,
                "scheduledEnd": {"$exists": True, "$ne": None},
            }).to_list(100)

            for slot in streaming_slots:
                scheduled_end = slot.get("scheduledEnd")
                if not scheduled_end:
                    continue

                if isinstance(scheduled_end, str):
                    try:
                        scheduled_end = datetime.fromisoformat(scheduled_end.replace("Z", "+00:00")).replace(tzinfo=None)
                    except (ValueError, AttributeError):
                        continue

                if now >= scheduled_end:
                    slot_id = str(slot["_id"])
                    logger.info(f"Scheduler: Auto-stopping stream for slot {slot_id} (end: {scheduled_end})")

                    await stop_ffmpeg_stream(slot.get("streamProcessId"))

                    await db.slots.update_one(
                        {"_id": slot["_id"]},
                        {"$set": {
                            "isStreaming": False,
                            "streamProcessId": None,
                            "scheduledEnd": None,
                            "updatedAt": now,
                        }}
                    )
                    logger.info(f"Scheduler: Stream auto-stopped for slot {slot_id}")

            # 3. Orphan recovery - DB says streaming but FFmpeg not running
            all_streaming = await db.slots.find({"isStreaming": True}).to_list(100)
            for slot in all_streaming:
                slot_id = str(slot["_id"])
                pid = slot.get("streamProcessId")

                if slot_id in active_streams:
                    continue  # Watchdog handles these

                is_running = False
                if pid:
                    try:
                        os.kill(pid, 0)
                        is_running = True
                    except (ProcessLookupError, PermissionError):
                        pass

                if not is_running:
                    if not slot.get("videoId") or not slot.get("streamKey"):
                        await db.slots.update_one(
                            {"_id": slot["_id"]},
                            {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": now}}
                        )
                        continue

                    # Check scheduledEnd
                    scheduled_end = slot.get("scheduledEnd")
                    if scheduled_end:
                        if isinstance(scheduled_end, str):
                            try:
                                scheduled_end = datetime.fromisoformat(scheduled_end.replace("Z", "+00:00")).replace(tzinfo=None)
                            except (ValueError, AttributeError):
                                scheduled_end = None
                        if scheduled_end and now >= scheduled_end:
                            await db.slots.update_one(
                                {"_id": slot["_id"]},
                                {"$set": {"isStreaming": False, "streamProcessId": None, "scheduledEnd": None, "updatedAt": now}}
                            )
                            continue

                    video = await db.videos.find_one({"_id": bson.ObjectId(slot["videoId"])})
                    if not video:
                        await db.slots.update_one(
                            {"_id": slot["_id"]},
                            {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": now}}
                        )
                        continue

                    video_file_url = video.get("fileUrl", video.get("s3Key", ""))
                    logger.info(f"Scheduler: Recovering orphaned stream for slot {slot_id}")

                    new_pid = await start_ffmpeg_stream(
                        slot_id=slot_id,
                        video_url=video_file_url,
                        stream_key=slot["streamKey"],
                        rtmp_url=slot.get("rtmpUrl", ""),
                        platform=slot["platform"],
                    )

                    if new_pid:
                        await db.slots.update_one(
                            {"_id": slot["_id"]},
                            {"$set": {"streamProcessId": new_pid, "updatedAt": now}}
                        )
                        logger.info(f"Scheduler: Recovered stream for slot {slot_id}, new PID: {new_pid}")
                    else:
                        await db.slots.update_one(
                            {"_id": slot["_id"]},
                            {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": now}}
                        )

        except Exception as e:
            logger.error(f"Scheduler error: {e}")

        await asyncio.sleep(30)  # Check every 30 seconds
