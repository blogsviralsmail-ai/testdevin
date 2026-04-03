"""Database configuration using SQLAlchemy with SQLite."""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Use /data/app.db for persistent storage in production, local for dev
DB_PATH = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./ludo_live_king.db")

engine = create_async_engine(DB_PATH, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
