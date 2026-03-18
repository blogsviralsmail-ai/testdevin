from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_db
from app.seed import seed_data
from app.routers import auth_router, grounds_router, bookings_router, user_router, owner_router, admin_router, reviews_router, teams_router, features_router, payment_router
import os
from pathlib import Path
from datetime import timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

app = FastAPI(title="BookAGround API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

STATIC_DIR = Path(__file__).parent.parent / "static"

# Include routers
app.include_router(auth_router.router)
app.include_router(grounds_router.router)
app.include_router(bookings_router.router)
app.include_router(user_router.router)
app.include_router(owner_router.router)
app.include_router(admin_router.router)
app.include_router(reviews_router.router)
app.include_router(teams_router.router)
app.include_router(features_router.router)
app.include_router(payment_router.router)


@app.on_event("startup")
async def startup():
    init_db()
    from app.database import add_missing_columns
    add_missing_columns()
    seed_data()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/payment-gateways")
async def public_gateways():
    from app.database import get_db
    with get_db() as db:
        rows = db.execute(
            "SELECT id, name, display_name, is_test_mode, priority FROM payment_gateways WHERE is_active = 1 ORDER BY priority"
        ).fetchall()
        return [dict(r) for r in rows]


@app.get("/api/promos/validate/{code}")
async def validate_promo(code: str, amount: float = 0):
    from app.database import get_db
    from datetime import datetime
    with get_db() as db:
        promo = db.execute(
            "SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND used_count < usage_limit",
            (code.upper(),),
        ).fetchone()
        if not promo:
            return {"valid": False, "message": "Invalid promo code"}
        now = datetime.now(IST).strftime("%Y-%m-%d")
        if not (promo["valid_from"] <= now <= promo["valid_to"]):
            return {"valid": False, "message": "Promo code expired"}
        if amount > 0 and amount < promo["min_booking"]:
            return {"valid": False, "message": f"Minimum booking ₹{promo['min_booking']} required"}

        if promo["discount_type"] == "percentage":
            discount = min(amount * promo["discount_value"] / 100, promo["max_discount"] or 99999)
        else:
            discount = min(promo["discount_value"], promo["max_discount"] or 99999)

        return {
            "valid": True,
            "code": promo["code"],
            "discount_type": promo["discount_type"],
            "discount_value": promo["discount_value"],
            "calculated_discount": discount,
            "message": f"₹{discount:.0f} off applied!",
        }


@app.get("/api/settings/public")
async def public_settings():
    from app.database import get_db
    with get_db() as db:
        rows = db.execute("SELECT key, value FROM settings").fetchall()
        return {r["key"]: r["value"] for r in rows}


@app.get("/api/promos/active")
async def active_promos():
    from app.database import get_db
    from datetime import datetime
    with get_db() as db:
        now = datetime.now(IST).strftime("%Y-%m-%d")
        rows = db.execute(
            "SELECT id, code, discount_type, discount_value, min_booking, max_discount, valid_from, valid_to FROM promo_codes WHERE is_active = 1 AND valid_from <= ? AND valid_to >= ?",
            (now, now),
        ).fetchall()
        return [dict(r) for r in rows]


# Serve KYC uploads
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
if UPLOADS_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Also serve from /opt/bookaground/uploads if exists (production)
PROD_UPLOADS = Path("/opt/bookaground/uploads")
if PROD_UPLOADS.exists():
    app.mount("/uploads", StaticFiles(directory=str(PROD_UPLOADS)), name="prod-uploads")

# Serve /data/uploads for withdrawal proofs and other uploads (production persistent volume)
DATA_UPLOADS = Path("/data/uploads")
if DATA_UPLOADS.exists():
    app.mount("/uploads", StaticFiles(directory=str(DATA_UPLOADS)), name="data-uploads")

# Serve static frontend assets (JS, CSS, images)
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # If the path points to an actual file in static dir, serve it
        file_path = STATIC_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise serve index.html for SPA routing
        return FileResponse(str(STATIC_DIR / "index.html"))
