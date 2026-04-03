"""Ludo Live King - Backend Server"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.database import init_db
from app.routers import auth, users, games, admin
from app.game.manager import sio


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    # Create default admin user
    from app.database import async_session
    from app.models.user import User
    from app.services.auth import hash_password
    from sqlalchemy import select

    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin_user = User(
                username="admin",
                email="admin@ludoliveking.com",
                password_hash=hash_password("admin123"),
                display_name="Admin",
                is_admin=True,
                coins=999999,
                gems=999,
                avatar_id=1,
            )
            db.add(admin_user)
            await db.commit()
    yield


fastapi_app = FastAPI(
    title="Ludo Live King",
    description="Real-time multiplayer Ludo game backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Disable CORS. Do not remove this for full-stack development.
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
fastapi_app.include_router(auth.router)
fastapi_app.include_router(users.router)
fastapi_app.include_router(games.router)
fastapi_app.include_router(admin.router)


@fastapi_app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@fastapi_app.get("/api/info")
async def app_info():
    return {
        "name": "Ludo Live King",
        "version": "1.0.0",
        "company": "KKHS Media",
        "description": "Real-time multiplayer Ludo game",
    }


# Wrap FastAPI with Socket.IO - this is the ASGI entry point
# Named 'app' so the deployment server picks it up
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
