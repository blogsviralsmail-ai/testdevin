import asyncio
import logging
import os
import re
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

# Per-stream-key asyncio locks to prevent duplicate FFmpeg spawns.
# Even within a single worker/event loop, concurrent coroutines (scheduler +
# watchdog + API) can race between the pgrep check and the actual spawn.
_stream_key_locks: dict[str, asyncio.Lock] = {}



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


def _check_rtmp_connection_health(pid: int) -> bool:
    """Check if FFmpeg's RTMP connection is healthy (ESTABLISHED, not CLOSE-WAIT/dead).

    Uses `ss` to inspect the TCP state of the FFmpeg process's RTMP socket.
    Returns False if connection is in CLOSE-WAIT, FIN-WAIT, or no connection found.
    """
    try:
        result = subprocess.run(
            ["ss", "-tnp"],
            capture_output=True, text=True, timeout=5,
        )
        for line in result.stdout.splitlines():
            if f"pid={pid}," in line and ":1935" in line:
                state = line.split()[0]
                if state == "ESTAB":
                    return True
                else:
                    logger.warning(f"RTMP connection for PID {pid} is in state: {state}")
                    return False
        # No RTMP connection found for this PID - might be starting up or already dead
        return True  # Give benefit of doubt during startup
    except Exception as e:
        logger.warning(f"RTMP health check failed for PID {pid}: {e}")
        return True  # Don't kill on check failure


def _find_ffmpeg_pids_for_stream_key(stream_key: str) -> list:
    """Find all FFmpeg PIDs streaming to a given stream key."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", f"ffmpeg.*{re.escape(stream_key)}"],
            capture_output=True, text=True, timeout=5
        )
        if result.stdout.strip():
            return [int(p) for p in result.stdout.strip().split("\n") if p.strip()]
    except Exception as e:
        logger.warning(f"Error finding FFmpeg PIDs: {e}")
    return []


async def _kill_existing_stream_by_destination(destination: str) -> None:
    """Kill any existing FFmpeg process streaming to the same destination.
    
    Uses the stream key (last path segment of RTMP URL) for reliable matching,
    since full RTMP URLs contain special characters that break pgrep patterns.
    """
    stream_key = destination.rsplit("/", 1)[-1] if "/" in destination else destination
    pids = _find_ffmpeg_pids_for_stream_key(stream_key)
    for pid in pids:
        try:
            os.kill(pid, signal.SIGKILL)
            logger.info(f"Killed existing FFmpeg process {pid} for stream key {stream_key}")
        except (ProcessLookupError, ValueError):
            pass
    if pids:
        await asyncio.sleep(2)  # Wait for processes to die


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

    # Acquire per-stream-key lock so only ONE coroutine at a time can
    # check-then-spawn for a given stream key (prevents scheduler + watchdog race).
    if stream_key not in _stream_key_locks:
        _stream_key_locks[stream_key] = asyncio.Lock()
    async with _stream_key_locks[stream_key]:
        # Double-check after acquiring lock: is FFmpeg already running?
        existing_pids = _find_ffmpeg_pids_for_stream_key(stream_key)
        if existing_pids:
            logger.info(f"FFmpeg already running for stream key {stream_key[:10]}... (PIDs: {existing_pids}), skipping spawn")
            return existing_pids[0]

        # Kill any stale/zombie FFmpeg streaming to the same destination
        await _kill_existing_stream_by_destination(destination)

        # FFmpeg command for infinite loop streaming
        # Re-encode video to ensure -stream_loop works reliably.
        # With -c:v copy, some MP4 files fail to loop because FFmpeg
        # cannot seek back to the start properly, causing the stream
        # to stop after one playthrough (~video duration).
        cmd = [
            ffmpeg,
            "-re",
            "-fflags", "+genpts+igndts",
            "-stream_loop", "-1",
            "-i", video_url,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-b:v", "6000k",
            "-maxrate", "6800k",
            "-bufsize", "12000k",
            "-g", "60",
            "-keyint_min", "60",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-f", "flv",
            "-flvflags", "no_duration_filesize",
            destination,
        ]

        logger.info(f"FFmpeg cmd: {' '.join(cmd)}")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
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
    (network glitch, memory issue, RTMP disconnect, etc.), it auto-restarts.
    Stream only stops when explicitly stopped by user or scheduledEnd is reached.

    Also monitors RTMP connection health - detects CLOSE-WAIT/dead sockets
    where FFmpeg process is alive but YouTube has dropped the connection.
    """
    # Wait initial 10 seconds to detect early failures
    await asyncio.sleep(10)
    rtmp_dead_count = 0  # consecutive unhealthy checks

    while slot_id in active_streams:
        info = active_streams.get(slot_id)
        if not info:
            break

        proc = info.get("process")
        if proc is None:
            break

        # Check RTMP connection health (detect CLOSE-WAIT/dead sockets)
        if proc.returncode is None:
            pid = info.get("pid", proc.pid)
            rtmp_healthy = _check_rtmp_connection_health(pid)
            if not rtmp_healthy:
                rtmp_dead_count += 1
                logger.warning(f"Watchdog: Slot {slot_id} RTMP unhealthy (count={rtmp_dead_count}/3)")
                if rtmp_dead_count >= 3:
                    # RTMP connection is dead for 3 consecutive checks (~45s)
                    # Kill the zombie FFmpeg and let restart logic handle it
                    logger.error(f"Watchdog: Slot {slot_id} RTMP connection dead, killing FFmpeg PID {pid}")
                    try:
                        os.kill(pid, signal.SIGKILL)
                    except (ProcessLookupError, PermissionError):
                        pass
                    # Wait briefly for process to die, with timeout
                    try:
                        await asyncio.wait_for(proc.wait(), timeout=5)
                    except asyncio.TimeoutError:
                        logger.warning(f"Watchdog: proc.wait() timed out for PID {pid}, proceeding with restart")
                    rtmp_dead_count = 0
                    # Fall through to the restart logic below
                else:
                    await asyncio.sleep(15)
                    continue
            else:
                rtmp_dead_count = 0  # Reset on healthy check

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

            # Restart the stream – delegate to start_ffmpeg_stream which
            # holds the per-stream-key lock and does a pgrep guard.
            logger.warning(f"Watchdog: FFmpeg crashed for slot {slot_id} (restart #{restart_count + 1}), restarting...")

            await asyncio.sleep(3)  # Brief pause before restart

            try:
                new_pid = await start_ffmpeg_stream(
                    slot_id=slot_id,
                    video_url=info["video_url"],
                    stream_key=info["stream_key"],
                    rtmp_url=info["rtmp_url"],
                    platform=info["platform"],
                )
                if new_pid:
                    # Update restart count in active_streams (start_ffmpeg_stream reset it to 0)
                    if slot_id in active_streams:
                        active_streams[slot_id]["restart_count"] = restart_count + 1
                    await db.slots.update_one(
                        {"_id": bson.ObjectId(slot_id)},
                        {"$set": {"streamProcessId": new_pid, "updatedAt": datetime.utcnow()}}
                    )
                    logger.info(f"Watchdog: Restarted FFmpeg for slot {slot_id}, new PID: {new_pid}")
                else:
                    logger.error(f"Watchdog: Failed to restart FFmpeg for slot {slot_id}")
                    await asyncio.sleep(10)
                    continue
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
                "streamStartedAt": datetime.utcnow().isoformat() + "Z",
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
            "streamStartedAt": None,
            "updatedAt": datetime.utcnow(),
        }}
    )

    return killed


async def check_stream_status(process_id: Optional[int]) -> bool:
    """Check if FFmpeg process is still running AND has a healthy RTMP connection."""
    if not process_id:
        return False
    try:
        os.kill(process_id, 0)  # Signal 0 = check if process exists
        # Also check RTMP connection health
        if not _check_rtmp_connection_health(process_id):
            return False
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
    
    Runs with --workers 1 so only one instance exists. Per-stream-key asyncio
    locks inside start_ffmpeg_stream() prevent duplicate FFmpeg spawns even
    when scheduler + watchdog + API coroutines race.
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
                                "streamStartedAt": now.isoformat() + "Z",
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
                            "streamStartedAt": None,
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
