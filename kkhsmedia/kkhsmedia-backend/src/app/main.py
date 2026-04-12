from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.slots import router as slots_router
from app.routes.videos import router as videos_router
from app.routes.orders import router as orders_router
from app.routes.admin import router as admin_router
from app.routes.public import router as public_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    # Start background scheduler for auto-start/stop/crash-recovery
    from app.services.streaming import start_scheduler
    await start_scheduler()
    yield
    await close_db()


app = FastAPI(
    title="KKHS Media API",
    description="24/7 Live Streaming Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(slots_router)
app.include_router(videos_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(public_router)


@app.get("/")
async def root():
    return {"message": "KKHS Media API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
