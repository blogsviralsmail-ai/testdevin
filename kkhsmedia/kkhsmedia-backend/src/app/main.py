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
from app.routes.youtube import router as youtube_router
from app.routes.coupons import router as coupons_router
from app.routes.invoices import router as invoices_router
from app.routes.affiliates import router as affiliates_router
from app.routes.webhooks import router as webhooks_router
from app.routes.notifications import router as notifications_router
from app.routes.analytics import router as analytics_router
from app.routes.streaming_advanced import router as streaming_adv_router
from app.routes.social import router as social_router
from app.routes.reseller import router as reseller_router
from app.routes.bulk import router as bulk_router
from app.routes.rtmp_config import router as rtmp_router


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

# CORS - Restrict to known origins in production
import os as _os
_allowed_origins = _os.environ.get(
    "CORS_ORIGINS",
    "https://app.golivepro.in,https://app.kkhsmedia.com,http://localhost:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
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
app.include_router(youtube_router)
app.include_router(coupons_router)
app.include_router(invoices_router)
app.include_router(affiliates_router)
app.include_router(webhooks_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(streaming_adv_router)
app.include_router(social_router)
app.include_router(reseller_router)
app.include_router(bulk_router)
app.include_router(rtmp_router)


@app.get("/")
async def root():
    return {"message": "KKHS Media API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
