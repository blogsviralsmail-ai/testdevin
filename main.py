import asyncio
import hashlib
import io
import json
import logging
import os
import re
import secrets
import sqlite3
import sys
import time
import uuid
import zipfile
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote as urlquote

import httpx
from fastapi import FastAPI, File, Form, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO, stream=sys.stderr, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seedance")

app = FastAPI(title="Seedance Video Generator")
app.mount("/static", StaticFiles(directory="static"), name="static")

LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest"
DOWNLOADS_DIR = Path("/var/www/seedance.kkhsmedia.com/downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path("/var/www/seedance.kkhsmedia.com/seedance.db")

# In-memory store for generation jobs
jobs: dict = {}
# WebSocket connections for real-time updates
ws_connections: list = []

# ======================== DATABASE ========================

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            prompt TEXT,
            generation_id TEXT,
            size INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, h = password_hash.split(":")
        h2 = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return h == h2.hex()
    except Exception:
        return False

def create_default_users():
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    if not existing:
        conn.execute("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                     ("admin", "hari@kkhsmedia.com", hash_password("Hari@123"), "admin"))
    existing2 = conn.execute("SELECT id FROM users WHERE username='hari'").fetchone()
    if not existing2:
        conn.execute("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                     ("hari", "harisoniofficial@gmail.com", hash_password("Hari@123"), "user"))
    conn.commit()
    conn.close()


def migrate_to_user_folders():
    """Move existing videos from root downloads to admin/ subfolder."""
    conn = get_db()
    admin = conn.execute("SELECT id FROM users WHERE username='admin'").fetchone()
    if not admin:
        conn.close()
        return
    admin_id = admin["id"]
    admin_dir = DOWNLOADS_DIR / "admin"
    admin_dir.mkdir(parents=True, exist_ok=True)

    # Move mp4 files from root downloads dir to admin/
    root_mp4s = [f for f in DOWNLOADS_DIR.glob("*.mp4") if f.is_file()]
    for f in root_mp4s:
        dest = admin_dir / f.name
        if not dest.exists():
            f.rename(dest)
        elif f.exists():
            f.unlink()

    # Update DB: any filename that doesn't contain "/" → prepend "admin/"
    videos = conn.execute("SELECT id, filename FROM videos").fetchall()
    for v in videos:
        if "/" not in v["filename"]:
            new_path = f"admin/{v['filename']}"
            conn.execute("UPDATE videos SET filename=? WHERE id=?", (new_path, v["id"]))
    conn.commit()

    # Also check for mp4 files in admin/ not tracked in DB
    existing_files = [f.name for f in admin_dir.glob("*.mp4")]
    tracked = [r["filename"] for r in conn.execute("SELECT filename FROM videos").fetchall()]
    for fname in existing_files:
        rel_path = f"admin/{fname}"
        if rel_path not in tracked:
            size = (admin_dir / fname).stat().st_size
            conn.execute("INSERT INTO videos (filename, user_id, prompt, size) VALUES (?, ?, ?, ?)",
                         (rel_path, admin_id, "recovered", size))
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()
create_default_users()
migrate_to_user_folders()

# ======================== AUTH HELPERS ========================

def get_current_user(request: Request) -> Optional[dict]:
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None
    conn = get_db()
    row = conn.execute("""
        SELECT u.id, u.username, u.email, u.role FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_id = ?
    """, (session_id,)).fetchone()
    conn.close()
    if row:
        return {"id": row["id"], "username": row["username"], "email": row["email"], "role": row["role"]}
    return None

def require_auth(request: Request):
    user = get_current_user(request)
    if not user:
        return None
    return user

# ======================== AUTH MIDDLEWARE ========================

from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow these paths without auth
        path = request.url.path
        public_paths = ["/login", "/static", "/favicon.ico", "/ws"]
        if any(path.startswith(p) for p in public_paths):
            return await call_next(request)
        
        user = get_current_user(request)
        if not user:
            if path.startswith("/api/"):
                return JSONResponse({"error": "Not authenticated"}, status_code=401)
            return RedirectResponse("/login", status_code=302)
        
        request.state.user = user
        return await call_next(request)

app.add_middleware(AuthMiddleware)

# ======================== LEONARDO API ========================

def leo_headers(api_key: str):
    return {
        "accept": "application/json",
        "authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }


async def upload_image_to_leonardo(api_key: str, file_bytes: bytes, filename: str, extension: str) -> Optional[str]:
    """Upload an image to Leonardo AI and return the image ID."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{LEONARDO_BASE}/v1/init-image",
            headers=leo_headers(api_key),
            json={"extension": extension},
        )
        if resp.status_code != 200:
            raise Exception(f"Init image failed: {resp.status_code} {resp.text}")

        data = resp.json()
        upload_info = data.get("uploadInitImage", {})
        image_id = upload_info.get("id")
        fields = json.loads(upload_info.get("fields", "{}"))
        upload_url = upload_info.get("url")

        if not image_id or not upload_url:
            raise Exception(f"Invalid upload response: {data}")

        form_data = {}
        for k, v in fields.items():
            form_data[k] = v

        resp2 = await client.post(
            upload_url,
            data=form_data,
            files={"file": (filename, file_bytes, f"image/{extension}")},
        )
        if resp2.status_code not in (200, 204):
            raise Exception(f"S3 upload failed: {resp2.status_code} {resp2.text}")

        return image_id


async def create_video_generation(
    api_key: str,
    prompt: str,
    model: str,
    duration: int,
    mode: str,
    width: int,
    height: int,
    image_ids: Optional[List[str]] = None,
    image_mode: str = "start_frame",
    prompt_enhance: str = "OFF",
) -> dict:
    """Create a video generation request."""
    params = {
        "prompt": prompt,
        "duration": duration,
        "mode": mode,
        "width": width,
        "height": height,
        "prompt_enhance": prompt_enhance,
    }

    if image_ids:
        if image_mode == "start_frame":
            params["guidances"] = {
                "start_frame": [{"image": {"id": image_ids[0], "type": "UPLOADED"}}]
            }
        elif image_mode == "image_reference":
            params["guidances"] = {
                "image_reference": [{"image": {"id": img_id, "type": "UPLOADED"}} for img_id in image_ids]
            }

    body = {
        "model": model,
        "public": False,
        "parameters": params,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{LEONARDO_BASE}/v2/generations",
            headers=leo_headers(api_key),
            json=body,
        )
        return {"status_code": resp.status_code, "data": resp.json()}


async def get_generation_status(api_key: str, generation_id: str) -> dict:
    """Poll generation status. Try v1 first, then v2 if v1 fails."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{LEONARDO_BASE}/v1/generations/{generation_id}",
            headers=leo_headers(api_key),
        )
        if resp.status_code == 200:
            data = resp.json()
            gen = data.get("generations_by_pk")
            if gen is not None:
                return data
            logger.info(f"[POLL] v1 returned null generations_by_pk, trying v2...")

        resp2 = await client.get(
            f"{LEONARDO_BASE}/v2/generations/{generation_id}",
            headers=leo_headers(api_key),
        )
        if resp2.status_code == 200:
            data2 = resp2.json()
            logger.info(f"[POLL] v2 response: {str(data2)[:300]}")
            return data2

        return {"error": f"v1: {resp.status_code}, v2: {resp2.status_code}"}


# ======================== HELPERS ========================

def sanitize_filename(text: str, max_len: int = 80) -> str:
    text = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', text)
    text = re.sub(r'\s+', ' ', text).strip(' ._')
    if len(text) > max_len:
        text = text[:max_len].rstrip(' ._')
    return text or 'video'


def get_username_by_id(user_id: int) -> str:
    conn = get_db()
    user = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return user["username"] if user else "admin"


async def download_video_to_server(video_url: str, prompt: str, idx: int, user_id: int = 1, generation_id: str = "") -> str:
    """Download video from Leonardo CDN to user-specific folder."""
    username = get_username_by_id(user_id)
    user_dir = DOWNLOADS_DIR / username
    user_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"[DOWNLOAD] Starting download for prompt #{idx+1} (user={username}): {video_url[:80]}...")
    safe_name = sanitize_filename(prompt)
    filename = f"{idx+1:03d}_{safe_name}.mp4"
    filepath = user_dir / filename
    if filepath.exists():
        filename = f"{idx+1:03d}_{safe_name}_{int(time.time())}.mp4"
        filepath = user_dir / filename
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(video_url)
            logger.info(f"[DOWNLOAD] Response: HTTP {resp.status_code}, size={len(resp.content)} bytes")
            if resp.status_code == 200 and len(resp.content) > 0:
                filepath.write_bytes(resp.content)
                # Store relative path: username/filename
                rel_path = f"{username}/{filename}"
                logger.info(f"[DOWNLOAD] Saved: {rel_path} ({len(resp.content)} bytes)")
                conn = get_db()
                conn.execute("INSERT INTO videos (filename, user_id, prompt, generation_id, size) VALUES (?, ?, ?, ?, ?)",
                             (rel_path, user_id, prompt, generation_id, len(resp.content)))
                conn.commit()
                conn.close()
                return rel_path
            else:
                logger.error(f"[DOWNLOAD] Failed HTTP {resp.status_code} for prompt #{idx+1}")
    except Exception as e:
        logger.error(f"[DOWNLOAD] Error downloading prompt #{idx+1}: {e}")
    return None


async def broadcast(msg: dict):
    """Send update to all connected WebSocket clients."""
    dead = []
    for ws in ws_connections:
        try:
            await ws.send_json(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_connections.remove(ws)


# ======================== GENERATION LOGIC ========================

async def process_single_job(session_id: str, idx: int, job_info: dict):
    """Process a single video generation job."""
    api_key = job_info["api_key"]
    prompt = job_info["prompt"]
    model = job_info["model"]
    duration = job_info["duration"]
    mode = job_info["mode"]
    width = job_info["width"]
    height = job_info["height"]
    image_ids = job_info.get("image_ids", [])
    image_mode = job_info.get("image_mode", "start_frame")
    user_id = job_info.get("user_id", 1)

    job_key = f"{session_id}_{idx}"

    try:
        logger.info(f"[JOB {idx+1}] Starting generation for: {prompt[:60]}")
        jobs[job_key]["status"] = "generating"
        await broadcast({"type": "status", "session": session_id, "index": idx, "status": "generating", "prompt": prompt})

        result = await create_video_generation(
            api_key=api_key,
            prompt=prompt,
            model=model,
            duration=duration,
            mode=mode,
            width=width,
            height=height,
            image_ids=image_ids,
            image_mode=image_mode,
        )

        logger.info(f"[JOB {idx+1}] API response status: {result['status_code']}, data: {str(result['data'])[:300]}")

        if result["status_code"] != 200:
            jobs[job_key]["status"] = "failed"
            jobs[job_key]["error"] = str(result["data"])
            logger.error(f"[JOB {idx+1}] Generation failed: {result['data']}")
            await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": str(result["data"]), "prompt": prompt})
            return

        gen_data = result["data"]
        generation_id = (
            gen_data.get("generationId")
            or gen_data.get("sdGenerationJob", {}).get("generationId")
            or gen_data.get("generate", {}).get("generationId")
        )
        logger.info(f"[JOB {idx+1}] generation_id: {generation_id}")

        if not generation_id:
            jobs[job_key]["status"] = "failed"
            jobs[job_key]["error"] = f"No generation ID returned: {gen_data}"
            logger.error(f"[JOB {idx+1}] No generation ID in response: {gen_data}")
            await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": jobs[job_key]["error"], "prompt": prompt})
            return

        jobs[job_key]["generation_id"] = generation_id
        await broadcast({"type": "status", "session": session_id, "index": idx, "status": "generating", "generation_id": generation_id, "prompt": prompt})

        # Poll for completion
        max_polls = 300
        poll_count = 0
        for _ in range(max_polls):
            await asyncio.sleep(3)
            poll_count += 1

            session_data = jobs.get(f"{session_id}_meta", {})
            if session_data.get("cancelled"):
                jobs[job_key]["status"] = "cancelled"
                await broadcast({"type": "status", "session": session_id, "index": idx, "status": "cancelled", "prompt": prompt})
                return

            status_data = await get_generation_status(api_key, generation_id)

            if "error" in status_data:
                logger.warning(f"[JOB {idx+1}] Poll #{poll_count} error: {str(status_data)[:200]}")
                continue

            gen = status_data.get("generations_by_pk") or status_data.get("generation") or {}
            if gen is None:
                gen = {}
            status = gen.get("status", status_data.get("status", ""))
            if poll_count % 10 == 0 or poll_count == 1:
                logger.info(f"[JOB {idx+1}] Poll #{poll_count}: status={status}")

            if status == "COMPLETE":
                video_url = None
                generated_images = gen.get("generated_images", [])
                if generated_images:
                    img = generated_images[0]
                    video_url = img.get("motionMP4URL") or img.get("url") or img.get("videoUrl") or img.get("video_url")
                else:
                    video_url = gen.get("videoUrl") or gen.get("video_url") or gen.get("motionMP4URL") or gen.get("url")
                    if not video_url:
                        outputs = gen.get("outputs", [])
                        if outputs:
                            video_url = outputs[0].get("url") or outputs[0].get("videoUrl")

                local_file = None
                if video_url:
                    local_file = await download_video_to_server(video_url, prompt, idx, user_id=user_id, generation_id=generation_id)
                else:
                    logger.error(f"[JOB {idx+1}] No video_url found in response")

                jobs[job_key]["status"] = "done"
                jobs[job_key]["video_url"] = video_url
                jobs[job_key]["local_file"] = local_file
                await broadcast({
                    "type": "status", "session": session_id, "index": idx,
                    "status": "done", "video_url": video_url, "prompt": prompt,
                    "generation_id": generation_id, "local_file": local_file,
                })
                return

            elif status == "FAILED":
                jobs[job_key]["status"] = "failed"
                jobs[job_key]["error"] = "Generation failed on Leonardo"
                await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": "Generation failed", "prompt": prompt})
                return

        jobs[job_key]["status"] = "failed"
        jobs[job_key]["error"] = "Polling timeout"
        await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": "Timeout", "prompt": prompt})

    except Exception as e:
        jobs[job_key]["status"] = "failed"
        jobs[job_key]["error"] = str(e)
        await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": str(e), "prompt": prompt})


async def run_batch(session_id: str, job_list: list, parallel: int):
    """Run batch video generation with concurrency limit."""
    sem = asyncio.Semaphore(parallel)

    async def limited(idx, info):
        async with sem:
            await process_single_job(session_id, idx, info)

    tasks = [limited(i, j) for i, j in enumerate(job_list)]
    await asyncio.gather(*tasks)
    await broadcast({"type": "batch_complete", "session": session_id})


# ======================== LOGIN ROUTES ========================

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    # If already logged in, redirect
    user = get_current_user(request)
    if user:
        return RedirectResponse("/", status_code=302)
    return LOGIN_HTML

@app.post("/login")
async def login_submit(
    username: str = Form(...),
    password: str = Form(...),
):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=? OR email=?", (username, username)).fetchone()
    conn.close()
    if not user or not verify_password(password, user["password_hash"]):
        return HTMLResponse(LOGIN_HTML.replace("<!--ERROR-->", '<div class="error">Invalid username or password</div>'))
    
    # Create session
    session_id = secrets.token_hex(32)
    conn = get_db()
    conn.execute("INSERT INTO sessions (session_id, user_id) VALUES (?, ?)", (session_id, user["id"]))
    conn.commit()
    conn.close()
    
    response = RedirectResponse("/", status_code=302)
    response.set_cookie("session_id", session_id, httponly=True, max_age=86400*30, samesite="lax")
    return response

@app.get("/logout")
async def logout(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id:
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE session_id=?", (session_id,))
        conn.commit()
        conn.close()
    response = RedirectResponse("/login", status_code=302)
    response.delete_cookie("session_id")
    return response


# ======================== MAIN ROUTES ========================

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    user = request.state.user
    with open("templates/index.html", "r") as f:
        html = f.read()
    # Inject admin link and user badge
    admin_link = '<a href="/admin"><i class="fas fa-users-cog"></i> Admin</a>' if user["role"] == "admin" else ""
    user_badge = f'<span class="user-badge"><i class="fas fa-user"></i> {user["username"]} ({user["role"]})</span>'
    nav_replacement = f'''<div class="nav-links">
        {user_badge}
        <a href="/download"><i class="fas fa-folder-open"></i> Downloads</a>
        {admin_link}
        <a href="/logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </div>'''
    html = html.replace('''<div class="nav-links">
        <a href="/download"><i class="fas fa-folder-open"></i> Downloads</a>
        <a href="/logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </div>''', nav_replacement)
    return html


@app.post("/api/upload-image")
async def upload_image(
    request: Request,
    api_key: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        file_bytes = await file.read()
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "png"
        if ext not in ("png", "jpg", "jpeg", "webp"):
            ext = "png"
        image_id = await upload_image_to_leonardo(api_key, file_bytes, file.filename, ext)
        return JSONResponse({"success": True, "image_id": image_id})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=400)


@app.post("/api/start-generation")
async def start_generation(
    request: Request,
    api_key: str = Form(...),
    prompts: str = Form(...),
    model: str = Form("seedance-2.0"),
    duration: int = Form(8),
    resolution: str = Form("720p"),
    ratio: str = Form("16:9"),
    parallel: int = Form(10),
    image_ids: str = Form(""),
    image_mode: str = Form("start_frame"),
    prompt_enhance: str = Form("OFF"),
):
    user = request.state.user
    res_map = {"720p": "RESOLUTION_720", "1080p": "RESOLUTION_1080", "480p": "RESOLUTION_480"}
    mode = res_map.get(resolution, "RESOLUTION_720")

    ratio_map = {
        "16:9": (1280, 720) if resolution == "720p" else (1920, 1080),
        "9:16": (720, 1280) if resolution == "720p" else (1080, 1920),
        "1:1": (720, 720) if resolution == "720p" else (1080, 1080),
        "4:3": (960, 720) if resolution == "720p" else (1440, 1080),
        "3:4": (720, 960) if resolution == "720p" else (1080, 1440),
    }
    width, height = ratio_map.get(ratio, (1280, 720))

    prompt_list = [p.strip() for p in prompts.strip().split("\n") if p.strip()]
    if not prompt_list:
        return JSONResponse({"success": False, "error": "No prompts provided"}, status_code=400)
    if len(prompt_list) > 200:
        return JSONResponse({"success": False, "error": "Maximum 200 prompts allowed"}, status_code=400)

    session_id = str(uuid.uuid4())[:8]
    job_list = []
    for i, prompt in enumerate(prompt_list):
        job_key = f"{session_id}_{i}"
        jobs[job_key] = {"prompt": prompt, "status": "queued", "created": time.time()}
        job_list.append({
            "api_key": api_key, "prompt": prompt, "model": model,
            "duration": duration, "mode": mode, "width": width, "height": height,
            "image_ids": [x.strip() for x in image_ids.split(",") if x.strip()] if image_ids else [],
            "image_mode": image_mode,
            "user_id": user["id"],
        })

    jobs[f"{session_id}_meta"] = {"total": len(prompt_list), "parallel": parallel, "cancelled": False}
    asyncio.create_task(run_batch(session_id, job_list, parallel))

    return JSONResponse({"success": True, "session_id": session_id, "total": len(prompt_list)})


@app.post("/api/stop-generation")
async def stop_generation(session_id: str = Form(...)):
    meta_key = f"{session_id}_meta"
    if meta_key in jobs:
        jobs[meta_key]["cancelled"] = True
        return JSONResponse({"success": True})
    return JSONResponse({"success": False, "error": "Session not found"}, status_code=404)


@app.post("/api/check-status")
async def check_status(
    request: Request,
    api_key: str = Form(...),
    generation_id: str = Form(...),
    prompt: str = Form("video"),
    index: int = Form(0),
):
    user = request.state.user
    try:
        status_data = await get_generation_status(api_key, generation_id)
        if "error" in status_data:
            return JSONResponse({"success": False, "error": status_data["error"]})
        gen = status_data.get("generations_by_pk") or status_data.get("generation") or {}
        if gen is None:
            gen = {}
        status = gen.get("status", status_data.get("status", "UNKNOWN"))
        video_url = None
        local_file = None
        if status == "COMPLETE":
            generated_images = gen.get("generated_images", [])
            if generated_images:
                video_url = generated_images[0].get("motionMP4URL") or generated_images[0].get("url")
                if video_url:
                    local_file = await download_video_to_server(video_url, prompt, index, user_id=user["id"], generation_id=generation_id)
        return JSONResponse({"success": True, "status": status, "video_url": video_url, "local_file": local_file, "generation_id": generation_id})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=400)


@app.post("/api/recover-videos")
async def recover_videos(
    request: Request,
    api_key: str = Form(...),
    generation_ids: str = Form(...),
):
    user = request.state.user
    ids = [gid.strip() for gid in generation_ids.strip().split("\n") if gid.strip()]
    results = []
    for i, gid in enumerate(ids):
        try:
            status_data = await get_generation_status(api_key, gid)
            gen = status_data.get("generations_by_pk") or status_data.get("generation") or {}
            if gen is None:
                gen = {}
            status = gen.get("status", status_data.get("status", "UNKNOWN"))
            video_url = None
            local_file = None
            if status == "COMPLETE":
                generated_images = gen.get("generated_images", [])
                if generated_images:
                    video_url = generated_images[0].get("motionMP4URL") or generated_images[0].get("url") or generated_images[0].get("videoUrl")
                else:
                    video_url = gen.get("videoUrl") or gen.get("video_url") or gen.get("url")
                    outputs = gen.get("outputs", [])
                    if not video_url and outputs:
                        video_url = outputs[0].get("url") or outputs[0].get("videoUrl")
                if video_url:
                    local_file = await download_video_to_server(video_url, f"recovered_{gid[:8]}", i, user_id=user["id"], generation_id=gid)
            results.append({"id": gid, "status": status, "video_url": video_url, "local_file": local_file})
        except Exception as e:
            results.append({"id": gid, "status": "error", "error": str(e)})
    downloaded = sum(1 for r in results if r.get("local_file"))
    return JSONResponse({"total": len(ids), "downloaded": downloaded, "results": results})


# ======================== DOWNLOAD MANAGEMENT ========================

@app.get("/downloads/{filepath_str:path}")
async def serve_download(filepath_str: str, request: Request):
    """Serve download files with auth check."""
    from urllib.parse import unquote
    filepath_str = unquote(filepath_str)
    user = request.state.user
    # filepath_str can be "username/filename.mp4" or legacy "filename.mp4"
    filepath = DOWNLOADS_DIR / filepath_str
    if not filepath.exists() or filepath.suffix != ".mp4":
        logger.error(f"[SERVE] File not found: {filepath_str}")
        return JSONResponse({"error": "File not found"}, status_code=404)
    # Ensure the file is within DOWNLOADS_DIR (prevent path traversal)
    if not filepath.resolve().is_relative_to(DOWNLOADS_DIR.resolve()):
        return JSONResponse({"error": "Access denied"}, status_code=403)
    if user["role"] != "admin":
        conn = get_db()
        video = conn.execute("SELECT * FROM videos WHERE filename=? AND user_id=?", (filepath_str, user["id"])).fetchone()
        conn.close()
        if not video:
            return JSONResponse({"error": "Access denied"}, status_code=403)
    return FileResponse(filepath, filename=Path(filepath_str).name, media_type="video/mp4")


@app.post("/api/delete-videos")
async def delete_videos(request: Request, filenames: str = Form(...)):
    user = request.state.user
    names = [n.strip() for n in filenames.split(",") if n.strip()]
    deleted = []
    for name in names:
        fp = DOWNLOADS_DIR / name
        conn = get_db()
        if user["role"] == "admin":
            video = conn.execute("SELECT * FROM videos WHERE filename=?", (name,)).fetchone()
        else:
            video = conn.execute("SELECT * FROM videos WHERE filename=? AND user_id=?", (name, user["id"])).fetchone()
        if fp.exists() and fp.suffix == ".mp4" and video:
            fp.unlink()
            conn.execute("DELETE FROM videos WHERE filename=?", (name,))
            conn.commit()
            deleted.append(name)
        conn.close()
    return JSONResponse({"deleted": len(deleted)})


@app.get("/api/download-all")
async def download_all_zip(request: Request):
    user = request.state.user
    conn = get_db()
    if user["role"] == "admin":
        videos = conn.execute("SELECT filename FROM videos ORDER BY created_at DESC").fetchall()
    else:
        videos = conn.execute("SELECT filename FROM videos WHERE user_id=? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    
    files = [DOWNLOADS_DIR / r["filename"] for r in videos if (DOWNLOADS_DIR / r["filename"]).exists()]
    if not files:
        return JSONResponse({"error": "No files to download"}, status_code=404)

    def generate_zip():
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_STORED) as zf:
            for f in files:
                zf.write(f, f.name)
        buffer.seek(0)
        return buffer.getvalue()

    zip_bytes = await asyncio.get_event_loop().run_in_executor(None, generate_zip)
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=seedance_videos_{int(time.time())}.zip"}
    )


@app.post("/api/download-selected")
async def download_selected_zip(request: Request, filenames: str = Form(...)):
    user = request.state.user
    names = [n.strip() for n in filenames.split(",") if n.strip()]
    files = []
    conn = get_db()
    for name in names:
        if user["role"] == "admin":
            video = conn.execute("SELECT * FROM videos WHERE filename=?", (name,)).fetchone()
        else:
            video = conn.execute("SELECT * FROM videos WHERE filename=? AND user_id=?", (name, user["id"])).fetchone()
        fp = DOWNLOADS_DIR / name
        if fp.exists() and fp.suffix == ".mp4" and video:
            files.append(fp)
    conn.close()
    
    if not files:
        return JSONResponse({"error": "No valid files selected"}, status_code=404)

    def generate_zip():
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_STORED) as zf:
            for f in files:
                zf.write(f, f.name)
        buffer.seek(0)
        return buffer.getvalue()

    zip_bytes = await asyncio.get_event_loop().run_in_executor(None, generate_zip)
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=seedance_selected_{int(time.time())}.zip"}
    )


@app.get("/download", response_class=HTMLResponse)
async def download_page(request: Request):
    user = request.state.user
    conn = get_db()
    if user["role"] == "admin":
        videos = conn.execute("SELECT v.*, u.username as owner FROM videos v JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC").fetchall()
    else:
        videos = conn.execute("SELECT v.*, u.username as owner FROM videos v JOIN users u ON v.user_id = u.id WHERE v.user_id=? ORDER BY v.created_at DESC", (user["id"],)).fetchall()
    conn.close()

    rows = ""
    file_count = 0
    for i, v in enumerate(videos):
        fp = DOWNLOADS_DIR / v["filename"]
        if not fp.exists():
            continue
        file_count += 1
        size_mb = fp.stat().st_size / (1024 * 1024)
        mtime = v["created_at"] or ""
        display_name = Path(v["filename"]).name
        owner_badge = f' <span style="color:#7c6ef0;font-size:11px;">({v["owner"]})</span>' if user["role"] == "admin" else ""
        rows += f'''<tr data-filename="{v['filename']}">
            <td><input type="checkbox" class="video-checkbox" value="{v['filename']}"></td>
            <td>{i+1}</td>
            <td class="fname" title="{display_name}">{display_name}{owner_badge}</td>
            <td>{size_mb:.1f} MB</td>
            <td>{mtime}</td>
            <td><a href="/downloads/{urlquote(v['filename'], safe='/')}" download class="dl-btn"><i class="fas fa-download"></i></a></td>
        </tr>'''

    if not rows:
        rows = '<tr><td colspan="6" style="text-align:center;color:#666;padding:40px;">No videos yet. Generate some videos first!</td></tr>'
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Downloaded Videos - Seedance</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family:'Segoe UI',system-ui,sans-serif; background:#0a0b1a; color:#e0e0e0; min-height:100vh; }}
        .header {{ background:linear-gradient(135deg,#12132d,#1a1b3a); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #2a2b4a; }}
        .header .logo {{ display:flex; align-items:center; gap:10px; font-size:18px; font-weight:700; color:#fff; }}
        .header .logo i {{ color:#7c6ef0; }}
        .nav-links {{ display:flex; gap:16px; align-items:center; }}
        .nav-links a {{ color:#7c6ef0; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px; }}
        .nav-links a:hover {{ color:#9b8fff; }}
        .user-badge {{ color:#888; font-size:12px; padding:4px 10px; background:rgba(124,110,240,0.1); border-radius:4px; }}
        .content {{ max-width:1200px; margin:30px auto; padding:0 20px; }}
        .top-bar {{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; }}
        h2 {{ font-size:20px; color:#fff; }}
        .count {{ color:#7c6ef0; font-size:14px; }}
        .actions {{ display:flex; gap:8px; flex-wrap:wrap; }}
        .action-btn {{ padding:8px 16px; border-radius:6px; border:none; cursor:pointer; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s; }}
        .btn-select-all {{ background:rgba(124,110,240,0.15); color:#9b8fff; border:1px solid rgba(124,110,240,0.3); }}
        .btn-select-all:hover {{ background:rgba(124,110,240,0.25); }}
        .btn-download-all {{ background:rgba(46,204,113,0.15); color:#2ecc71; border:1px solid rgba(46,204,113,0.3); }}
        .btn-download-all:hover {{ background:rgba(46,204,113,0.25); }}
        .btn-download-selected {{ background:rgba(52,152,219,0.15); color:#3498db; border:1px solid rgba(52,152,219,0.3); }}
        .btn-download-selected:hover {{ background:rgba(52,152,219,0.25); }}
        .btn-delete {{ background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); }}
        .btn-delete:hover {{ background:rgba(231,76,60,0.25); }}
        .btn-disabled {{ opacity:0.4; pointer-events:none; }}
        table {{ width:100%; border-collapse:collapse; background:#10112a; border-radius:8px; overflow:hidden; }}
        th {{ background:#12132d; padding:12px 16px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#888; }}
        td {{ padding:10px 16px; font-size:13px; border-bottom:1px solid #1a1b3a; }}
        tr:hover td {{ background:rgba(124,110,240,0.03); }}
        tr.selected td {{ background:rgba(124,110,240,0.08); }}
        .fname {{ max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
        .dl-btn {{ color:#7c6ef0; text-decoration:none; display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:4px; background:rgba(124,110,240,0.1); }}
        .dl-btn:hover {{ background:rgba(124,110,240,0.2); color:#9b8fff; }}
        .video-checkbox {{ width:16px; height:16px; cursor:pointer; accent-color:#7c6ef0; }}
        .selected-count {{ color:#7c6ef0; font-size:13px; }}
        .loading {{ display:none; color:#7c6ef0; font-size:13px; padding:10px; text-align:center; }}
        .loading.active {{ display:block; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"><i class="fas fa-video"></i> Seedance Downloads</div>
        <div class="nav-links">
            <span class="user-badge"><i class="fas fa-user"></i> {user["username"]} ({user["role"]})</span>
            <a href="/"><i class="fas fa-home"></i> Generator</a>
            {"<a href='/admin'><i class='fas fa-users-cog'></i> Admin</a>" if user["role"] == "admin" else ""}
            <a href="/logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </div>
    <div class="content">
        <div class="top-bar">
            <h2>{"All" if user["role"] == "admin" else "My"} Videos <span class="count">({file_count} files)</span></h2>
            <div class="actions">
                <button class="action-btn btn-select-all" onclick="toggleSelectAll()"><i class="fas fa-check-double"></i> Select All</button>
                <button class="action-btn btn-download-all" onclick="downloadAll()"><i class="fas fa-download"></i> Download All (ZIP)</button>
                <button class="action-btn btn-download-selected btn-disabled" id="btn-dl-selected" onclick="downloadSelected()"><i class="fas fa-file-archive"></i> Download Selected</button>
                <button class="action-btn btn-delete btn-disabled" id="btn-delete" onclick="deleteSelected()"><i class="fas fa-trash"></i> Delete Selected</button>
            </div>
        </div>
        <span class="selected-count" id="selected-count"></span>
        <div class="loading" id="loading"><i class="fas fa-spinner fa-spin"></i> Processing...</div>
        <table>
            <thead><tr><th><input type="checkbox" id="header-checkbox" class="video-checkbox" onchange="toggleSelectAll(this.checked)"></th><th>#</th><th>Filename</th><th>Size</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>{rows}</tbody>
        </table>
    </div>
    <script>
        function getSelectedFiles() {{
            return [...document.querySelectorAll('.video-checkbox:checked:not(#header-checkbox)')].map(cb => cb.value);
        }}
        function updateButtons() {{
            const selected = getSelectedFiles();
            document.getElementById('btn-dl-selected').classList.toggle('btn-disabled', !selected.length);
            document.getElementById('btn-delete').classList.toggle('btn-disabled', !selected.length);
            document.getElementById('selected-count').textContent = selected.length ? selected.length + ' selected' : '';
        }}
        document.querySelectorAll('.video-checkbox:not(#header-checkbox)').forEach(cb => {{
            cb.addEventListener('change', function() {{ this.closest('tr').classList.toggle('selected', this.checked); updateButtons(); }});
        }});
        function toggleSelectAll(checked) {{
            if (typeof checked === 'undefined') {{
                const cbs = document.querySelectorAll('.video-checkbox:not(#header-checkbox)');
                checked = ![...cbs].every(cb => cb.checked);
                document.getElementById('header-checkbox').checked = checked;
            }}
            document.querySelectorAll('.video-checkbox:not(#header-checkbox)').forEach(cb => {{ cb.checked = checked; cb.closest('tr').classList.toggle('selected', checked); }});
            updateButtons();
        }}
        function showLoading(s) {{ document.getElementById('loading').classList.toggle('active', s); }}
        function downloadAll() {{ showLoading(true); window.location.href='/api/download-all'; setTimeout(()=>showLoading(false),3000); }}
        async function downloadSelected() {{
            const files = getSelectedFiles(); if(!files.length) return;
            showLoading(true);
            const form = document.createElement('form'); form.method='POST'; form.action='/api/download-selected'; form.style.display='none';
            const input = document.createElement('input'); input.name='filenames'; input.value=files.join(',');
            form.appendChild(input); document.body.appendChild(form); form.submit();
            setTimeout(()=>{{ document.body.removeChild(form); showLoading(false); }}, 3000);
        }}
        async function deleteSelected() {{
            const files = getSelectedFiles(); if(!files.length) return;
            if(!confirm('Delete '+files.length+' video(s)? This cannot be undone!')) return;
            showLoading(true);
            const fd = new FormData(); fd.append('filenames', files.join(','));
            const resp = await fetch('/api/delete-videos', {{method:'POST', body:fd}});
            const data = await resp.json();
            if(data.deleted>0) {{ alert(data.deleted+' deleted!'); location.reload(); }}
            showLoading(false);
        }}
    </script>
</body>
</html>'''


# ======================== ADMIN ROUTES ========================

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    user = request.state.user
    if user["role"] != "admin":
        return RedirectResponse("/", status_code=302)
    
    conn = get_db()
    users = conn.execute("SELECT id, username, email, role, created_at FROM users ORDER BY id").fetchall()
    conn.close()
    
    user_rows = ""
    for u in users:
        user_rows += f'''<tr>
            <td>{u["id"]}</td>
            <td>{u["username"]}</td>
            <td>{u["email"]}</td>
            <td><span class="role-badge role-{u['role']}">{u["role"]}</span></td>
            <td>{u["created_at"] or ""}</td>
            <td>
                {"" if u["username"] == "admin" else '<button class="action-btn btn-delete" onclick="deleteUser(' + str(u["id"]) + ')"><i class="fas fa-trash"></i></button>'}
            </td>
        </tr>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Seedance</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family:'Segoe UI',system-ui,sans-serif; background:#0a0b1a; color:#e0e0e0; min-height:100vh; }}
        .header {{ background:linear-gradient(135deg,#12132d,#1a1b3a); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #2a2b4a; }}
        .header .logo {{ display:flex; align-items:center; gap:10px; font-size:18px; font-weight:700; color:#fff; }}
        .header .logo i {{ color:#7c6ef0; }}
        .nav-links {{ display:flex; gap:16px; align-items:center; }}
        .nav-links a {{ color:#7c6ef0; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px; }}
        .nav-links a:hover {{ color:#9b8fff; }}
        .content {{ max-width:900px; margin:30px auto; padding:0 20px; }}
        h2 {{ margin-bottom:20px; font-size:20px; color:#fff; }}
        .card {{ background:#10112a; border-radius:8px; padding:24px; margin-bottom:24px; border:1px solid #1a1b3a; }}
        .form-row {{ display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap; }}
        .form-row input, .form-row select {{ flex:1; min-width:150px; padding:10px 14px; background:#0a0b1a; border:1px solid #2a2b4a; border-radius:6px; color:#e0e0e0; font-size:14px; }}
        .form-row input:focus, .form-row select:focus {{ outline:none; border-color:#7c6ef0; }}
        .submit-btn {{ padding:10px 24px; background:#7c6ef0; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; }}
        .submit-btn:hover {{ background:#6b5ce7; }}
        table {{ width:100%; border-collapse:collapse; background:#10112a; border-radius:8px; overflow:hidden; }}
        th {{ background:#12132d; padding:12px 16px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#888; }}
        td {{ padding:10px 16px; font-size:13px; border-bottom:1px solid #1a1b3a; }}
        .role-badge {{ padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }}
        .role-admin {{ background:rgba(231,76,60,0.15); color:#e74c3c; }}
        .role-user {{ background:rgba(46,204,113,0.15); color:#2ecc71; }}
        .action-btn {{ padding:6px 12px; border-radius:4px; border:none; cursor:pointer; font-size:12px; }}
        .btn-delete {{ background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); }}
        .btn-delete:hover {{ background:rgba(231,76,60,0.25); }}
        .msg {{ padding:10px; margin:10px 0; border-radius:6px; font-size:13px; display:none; }}
        .msg.success {{ display:block; background:rgba(46,204,113,0.15); color:#2ecc71; border:1px solid rgba(46,204,113,0.3); }}
        .msg.error {{ display:block; background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); }}
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"><i class="fas fa-users-cog"></i> Admin Panel</div>
        <div class="nav-links">
            <a href="/"><i class="fas fa-home"></i> Generator</a>
            <a href="/download"><i class="fas fa-video"></i> Downloads</a>
            <a href="/logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </div>
    <div class="content">
        <h2>User Management</h2>
        <div class="card">
            <h3 style="margin-bottom:16px;font-size:16px;color:#9b8fff;">Create New User</h3>
            <div id="msg" class="msg"></div>
            <div class="form-row">
                <input type="text" id="new-username" placeholder="Username">
                <input type="email" id="new-email" placeholder="Email">
                <input type="password" id="new-password" placeholder="Password">
                <select id="new-role"><option value="user">User</option><option value="admin">Admin</option></select>
            </div>
            <button class="submit-btn" onclick="createUser()"><i class="fas fa-plus"></i> Create User</button>
        </div>
        <table>
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>{user_rows}</tbody>
        </table>
    </div>
    <script>
        async function createUser() {{
            const username = document.getElementById('new-username').value.trim();
            const email = document.getElementById('new-email').value.trim();
            const password = document.getElementById('new-password').value;
            const role = document.getElementById('new-role').value;
            if(!username||!email||!password) {{ showMsg('Fill all fields','error'); return; }}
            const fd = new FormData();
            fd.append('username', username); fd.append('email', email);
            fd.append('password', password); fd.append('role', role);
            const resp = await fetch('/api/admin/create-user', {{method:'POST', body:fd}});
            const data = await resp.json();
            if(data.success) {{ showMsg('User created!','success'); setTimeout(()=>location.reload(),1000); }}
            else {{ showMsg(data.error||'Failed','error'); }}
        }}
        async function deleteUser(id) {{
            if(!confirm('Delete this user?')) return;
            const fd = new FormData(); fd.append('user_id', id);
            const resp = await fetch('/api/admin/delete-user', {{method:'POST', body:fd}});
            const data = await resp.json();
            if(data.success) location.reload();
            else alert(data.error||'Failed');
        }}
        function showMsg(text, type) {{
            const el = document.getElementById('msg');
            el.textContent = text; el.className = 'msg ' + type;
            setTimeout(()=>{{ el.className='msg'; }}, 3000);
        }}
    </script>
</body>
</html>'''


@app.post("/api/admin/create-user")
async def admin_create_user(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("user"),
):
    user = request.state.user
    if user["role"] != "admin":
        return JSONResponse({"success": False, "error": "Access denied"}, status_code=403)
    if role not in ("user", "admin"):
        return JSONResponse({"success": False, "error": "Invalid role"}, status_code=400)
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                     (username, email, hash_password(password), role))
        conn.commit()
        return JSONResponse({"success": True})
    except sqlite3.IntegrityError as e:
        return JSONResponse({"success": False, "error": "Username or email already exists"})
    finally:
        conn.close()


@app.post("/api/admin/delete-user")
async def admin_delete_user(
    request: Request,
    user_id: int = Form(...),
):
    user = request.state.user
    if user["role"] != "admin":
        return JSONResponse({"success": False, "error": "Access denied"}, status_code=403)
    conn = get_db()
    target = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not target:
        conn.close()
        return JSONResponse({"success": False, "error": "User not found"})
    if target["username"] == "admin":
        conn.close()
        return JSONResponse({"success": False, "error": "Cannot delete admin"})
    conn.execute("DELETE FROM sessions WHERE user_id=?", (user_id,))
    conn.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return JSONResponse({"success": True})


# ======================== WEBSOCKET ========================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_connections:
            ws_connections.remove(websocket)


# ======================== LOGIN PAGE HTML ========================

LOGIN_HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Seedance</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',system-ui,sans-serif; background:#0a0b1a; color:#e0e0e0; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        .login-box { background:#10112a; border:1px solid #2a2b4a; border-radius:12px; padding:40px; width:100%; max-width:400px; }
        .login-box .logo { text-align:center; margin-bottom:30px; }
        .login-box .logo i { font-size:36px; color:#7c6ef0; }
        .login-box .logo h1 { font-size:22px; margin-top:10px; color:#fff; }
        .login-box .logo p { color:#666; font-size:13px; margin-top:4px; }
        .form-group { margin-bottom:16px; }
        .form-group label { display:block; font-size:12px; font-weight:600; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px; }
        .form-group input { width:100%; padding:12px 14px; background:#0a0b1a; border:1px solid #2a2b4a; border-radius:6px; color:#e0e0e0; font-size:14px; }
        .form-group input:focus { outline:none; border-color:#7c6ef0; }
        .login-btn { width:100%; padding:14px; background:#7c6ef0; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:700; font-size:15px; margin-top:8px; }
        .login-btn:hover { background:#6b5ce7; }
        .error { background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); padding:10px; border-radius:6px; margin-bottom:16px; font-size:13px; text-align:center; }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="logo">
            <i class="fas fa-video"></i>
            <h1>Seedance</h1>
            <p>Video Generator - Login</p>
        </div>
        <!--ERROR-->
        <form method="POST" action="/login">
            <div class="form-group">
                <label>Username or Email</label>
                <input type="text" name="username" required placeholder="Enter username or email">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="Enter password">
            </div>
            <button type="submit" class="login-btn"><i class="fas fa-sign-in-alt"></i> Login</button>
        </form>
    </div>
</body>
</html>'''
