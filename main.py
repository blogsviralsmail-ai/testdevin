import asyncio
import json
import os
import re
import time
import uuid
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Seedance Video Generator")
app.mount("/static", StaticFiles(directory="static"), name="static")

LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest"
DOWNLOADS_DIR = Path("/var/www/seedance.kkhsmedia.com/downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store for generation jobs
jobs: dict = {}
# WebSocket connections for real-time updates
ws_connections: list = []


def leo_headers(api_key: str):
    return {
        "accept": "application/json",
        "authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }


async def upload_image_to_leonardo(api_key: str, file_bytes: bytes, filename: str, extension: str) -> Optional[str]:
    """Upload an image to Leonardo AI and return the image ID."""
    async with httpx.AsyncClient(timeout=60) as client:
        # Step 1: Get presigned URL
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

        # Step 2: Upload to S3 using presigned URL
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
    image_id: Optional[str] = None,
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

    if image_id:
        if image_mode == "start_frame":
            params["guidances"] = {
                "start_frame": [{"image": {"id": image_id, "type": "UPLOADED"}}]
            }
        elif image_mode == "image_reference":
            params["guidances"] = {
                "image_reference": [{"image": {"id": image_id, "type": "UPLOADED"}}]
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
    """Poll generation status."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{LEONARDO_BASE}/v1/generations/{generation_id}",
            headers=leo_headers(api_key),
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": resp.text, "status_code": resp.status_code}


def sanitize_filename(text: str, max_len: int = 80) -> str:
    text = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', text)
    text = re.sub(r'\s+', ' ', text).strip(' ._')
    if len(text) > max_len:
        text = text[:max_len].rstrip(' ._')
    return text or 'video'


async def download_video_to_server(video_url: str, prompt: str, idx: int) -> str:
    """Download video from Leonardo CDN to local server."""
    safe_name = sanitize_filename(prompt)
    filename = f"{idx+1:03d}_{safe_name}.mp4"
    filepath = DOWNLOADS_DIR / filename
    if filepath.exists():
        filename = f"{idx+1:03d}_{safe_name}_{int(time.time())}.mp4"
        filepath = DOWNLOADS_DIR / filename
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(video_url)
            if resp.status_code == 200 and len(resp.content) > 0:
                filepath.write_bytes(resp.content)
                print(f"[DOWNLOAD] Saved: {filename} ({len(resp.content)} bytes)")
                return filename
            else:
                print(f"[DOWNLOAD] Failed HTTP {resp.status_code} for prompt #{idx+1}")
    except Exception as e:
        print(f"[DOWNLOAD] Error downloading prompt #{idx+1}: {e}")
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


async def process_single_job(session_id: str, idx: int, job_info: dict):
    """Process a single video generation job."""
    api_key = job_info["api_key"]
    prompt = job_info["prompt"]
    model = job_info["model"]
    duration = job_info["duration"]
    mode = job_info["mode"]
    width = job_info["width"]
    height = job_info["height"]
    image_id = job_info.get("image_id")
    image_mode = job_info.get("image_mode", "start_frame")

    job_key = f"{session_id}_{idx}"

    try:
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
            image_id=image_id,
            image_mode=image_mode,
        )

        if result["status_code"] != 200:
            jobs[job_key]["status"] = "failed"
            jobs[job_key]["error"] = str(result["data"])
            await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": str(result["data"]), "prompt": prompt})
            return

        gen_data = result["data"]
        generation_id = gen_data.get("generationId") or gen_data.get("sdGenerationJob", {}).get("generationId")

        if not generation_id:
            jobs[job_key]["status"] = "failed"
            jobs[job_key]["error"] = f"No generation ID returned: {gen_data}"
            await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": jobs[job_key]["error"], "prompt": prompt})
            return

        jobs[job_key]["generation_id"] = generation_id
        await broadcast({"type": "status", "session": session_id, "index": idx, "status": "generating", "generation_id": generation_id, "prompt": prompt})

        # Poll for completion
        max_polls = 300  # 15 minutes max
        for _ in range(max_polls):
            await asyncio.sleep(3)

            # Check if session was cancelled
            session_data = jobs.get(f"{session_id}_meta", {})
            if session_data.get("cancelled"):
                jobs[job_key]["status"] = "cancelled"
                await broadcast({"type": "status", "session": session_id, "index": idx, "status": "cancelled", "prompt": prompt})
                return

            status_data = await get_generation_status(api_key, generation_id)

            if "error" in status_data:
                continue

            gen = status_data.get("generations_by_pk", {})
            status = gen.get("status", "")

            if status == "COMPLETE":
                video_url = None
                generated_images = gen.get("generated_images", [])
                if generated_images:
                    video_url = generated_images[0].get("motionMP4URL") or generated_images[0].get("url")

                # Download video to server
                local_file = None
                if video_url:
                    local_file = await download_video_to_server(video_url, prompt, idx)

                jobs[job_key]["status"] = "done"
                jobs[job_key]["video_url"] = video_url
                jobs[job_key]["local_file"] = local_file
                await broadcast({
                    "type": "status", "session": session_id, "index": idx,
                    "status": "done", "video_url": video_url, "prompt": prompt,
                    "generation_id": generation_id,
                    "local_file": local_file,
                })
                return

            elif status == "FAILED":
                jobs[job_key]["status"] = "failed"
                jobs[job_key]["error"] = "Generation failed on Leonardo"
                await broadcast({"type": "status", "session": session_id, "index": idx, "status": "failed", "error": "Generation failed", "prompt": prompt})
                return

        # Timeout
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


@app.get("/", response_class=HTMLResponse)
async def index():
    with open("templates/index.html", "r") as f:
        return f.read()


@app.post("/api/upload-image")
async def upload_image(
    api_key: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a reference image to Leonardo AI."""
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
    api_key: str = Form(...),
    prompts: str = Form(...),
    model: str = Form("seedance-2.0"),
    duration: int = Form(8),
    resolution: str = Form("720p"),
    ratio: str = Form("16:9"),
    parallel: int = Form(10),
    image_id: str = Form(""),
    image_mode: str = Form("start_frame"),
    prompt_enhance: str = Form("OFF"),
):
    """Start batch video generation."""
    # Parse resolution and ratio to width/height
    res_map = {
        "720p": "RESOLUTION_720",
        "1080p": "RESOLUTION_1080",
        "480p": "RESOLUTION_480",
    }
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

    # Create job entries
    job_list = []
    for i, prompt in enumerate(prompt_list):
        job_key = f"{session_id}_{i}"
        jobs[job_key] = {
            "prompt": prompt,
            "status": "queued",
            "created": time.time(),
        }
        job_list.append({
            "api_key": api_key,
            "prompt": prompt,
            "model": model,
            "duration": duration,
            "mode": mode,
            "width": width,
            "height": height,
            "image_id": image_id if image_id else None,
            "image_mode": image_mode,
        })

    jobs[f"{session_id}_meta"] = {
        "total": len(prompt_list),
        "parallel": parallel,
        "cancelled": False,
    }

    # Start batch in background
    asyncio.create_task(run_batch(session_id, job_list, parallel))

    return JSONResponse({
        "success": True,
        "session_id": session_id,
        "total": len(prompt_list),
    })


@app.post("/api/stop-generation")
async def stop_generation(session_id: str = Form(...)):
    """Stop a running generation session."""
    meta_key = f"{session_id}_meta"
    if meta_key in jobs:
        jobs[meta_key]["cancelled"] = True
        return JSONResponse({"success": True})
    return JSONResponse({"success": False, "error": "Session not found"}, status_code=404)


@app.post("/api/check-status")
async def check_status(
    api_key: str = Form(...),
    generation_id: str = Form(...),
):
    """Manually check the status of a generation."""
    try:
        status_data = await get_generation_status(api_key, generation_id)
        if "error" in status_data:
            return JSONResponse({"success": False, "error": status_data["error"]})
        gen = status_data.get("generations_by_pk", {})
        status = gen.get("status", "UNKNOWN")
        video_url = None
        if status == "COMPLETE":
            generated_images = gen.get("generated_images", [])
            if generated_images:
                video_url = generated_images[0].get("motionMP4URL") or generated_images[0].get("url")
        return JSONResponse({
            "success": True,
            "status": status,
            "video_url": video_url,
            "generation_id": generation_id,
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=400)


@app.get("/download", response_class=HTMLResponse)
async def download_page():
    """Page listing all downloaded videos."""
    files = sorted(DOWNLOADS_DIR.glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True)
    rows = ""
    for i, f in enumerate(files):
        size_mb = f.stat().st_size / (1024 * 1024)
        mtime = time.strftime("%Y-%m-%d %H:%M", time.localtime(f.stat().st_mtime))
        rows += f'''<tr>
            <td>{i+1}</td>
            <td class="fname">{f.name}</td>
            <td>{size_mb:.1f} MB</td>
            <td>{mtime}</td>
            <td><a href="/downloads/{f.name}" download class="dl-btn"><i class="fas fa-download"></i> Download</a></td>
        </tr>'''

    if not rows:
        rows = '<tr><td colspan="5" style="text-align:center;color:#666;padding:40px;">No videos downloaded yet. Generate some videos first!</td></tr>'

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
        .back-btn {{ color:#7c6ef0; text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px; }}
        .back-btn:hover {{ color:#9b8fff; }}
        .content {{ max-width:1200px; margin:30px auto; padding:0 20px; }}
        h2 {{ margin-bottom:20px; font-size:20px; color:#fff; }}
        .count {{ color:#7c6ef0; font-size:14px; }}
        table {{ width:100%; border-collapse:collapse; background:#10112a; border-radius:8px; overflow:hidden; }}
        th {{ background:#12132d; padding:12px 16px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#888; }}
        td {{ padding:10px 16px; font-size:13px; border-bottom:1px solid #1a1b3a; }}
        tr:hover td {{ background:rgba(124,110,240,0.03); }}
        .fname {{ max-width:400px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
        .dl-btn {{ color:#7c6ef0; text-decoration:none; display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:4px; background:rgba(124,110,240,0.1); }}
        .dl-btn:hover {{ background:rgba(124,110,240,0.2); color:#9b8fff; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"><i class="fas fa-video"></i> Seedance Downloads</div>
        <a href="/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Generator</a>
    </div>
    <div class="content">
        <h2>Downloaded Videos <span class="count">({len(files)} files)</span></h2>
        <table>
            <thead><tr><th>#</th><th>Filename</th><th>Size</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>{rows}</tbody>
        </table>
    </div>
</body>
</html>'''


@app.get("/api/downloads")
async def list_downloads():
    """API to list downloaded videos."""
    files = sorted(DOWNLOADS_DIR.glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True)
    result = []
    for f in files:
        result.append({
            "name": f.name,
            "size": f.stat().st_size,
            "url": f"/downloads/{f.name}",
            "date": time.strftime("%Y-%m-%d %H:%M", time.localtime(f.stat().st_mtime)),
        })
    return JSONResponse({"files": result})


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep alive
    except WebSocketDisconnect:
        if websocket in ws_connections:
            ws_connections.remove(websocket)
