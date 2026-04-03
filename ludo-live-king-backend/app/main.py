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


app = FastAPI(
    title="Ludo Live King",
    description="Real-time multiplayer Ludo game backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(games.router)
app.include_router(admin.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/info")
async def app_info():
    return {
        "name": "Ludo Live King",
        "version": "1.0.0",
        "company": "KKHS Media",
        "description": "Real-time multiplayer Ludo game",
    }


# Mount Socket.IO within FastAPI so both work with same entry point
# When mounted at /socket.io, Starlette strips the prefix before forwarding,
# so we set socketio_path="" to match on the stripped path "/"
sio_asgi_app = socketio.ASGIApp(sio, socketio_path="")
app.mount("/socket.io", sio_asgi_app)
