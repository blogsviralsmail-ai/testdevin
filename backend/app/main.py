from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import os

from app.database import init_db
from app.seed import seed_data
from app.routes import gold_rate, categories, designs, blogs, admin, sitemap

STATIC_DIR = Path(__file__).parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_data()
    yield


app = FastAPI(title="Aabhooshan Bazaar API", version="1.0.0", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(gold_rate.router)
app.include_router(categories.router)
app.include_router(designs.router)
app.include_router(blogs.router)
app.include_router(admin.router)
app.include_router(sitemap.router)

os.makedirs("uploads", exist_ok=True)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api")
async def api_info():
    return {
        "name": "Aabhooshan Bazaar API",
        "version": "1.0.0",
    }


# Serve frontend static files
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(str(STATIC_DIR / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path in ("healthz", "sitemap.xml", "robots.txt"):
            return None
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
