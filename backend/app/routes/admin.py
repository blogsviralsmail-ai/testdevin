from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models import AdminLogin, TokenResponse, SettingUpdate
from app.auth import verify_token, verify_password, hash_password, create_access_token

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/login", response_model=TokenResponse)
async def admin_login(login: AdminLogin):
    conn = get_db()
    user = conn.execute("SELECT * FROM admin_users WHERE username = ?", (login.username,)).fetchone()
    conn.close()
    if not user or not verify_password(login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_admin_me(username: str = Depends(verify_token)):
    return {"username": username}


@router.post("/change-password")
async def change_password(old_password: str, new_password: str, username: str = Depends(verify_token)):
    conn = get_db()
    user = conn.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()
    if not user or not verify_password(old_password, user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid old password")
    conn.execute("UPDATE admin_users SET password_hash = ? WHERE username = ?", (hash_password(new_password), username))
    conn.commit()
    conn.close()
    return {"message": "Password changed successfully"}


@router.get("/dashboard")
async def get_dashboard(admin: str = Depends(verify_token)):
    conn = get_db()
    stats = {
        "total_categories": conn.execute("SELECT COUNT(*) as cnt FROM categories").fetchone()["cnt"],
        "total_designs": conn.execute("SELECT COUNT(*) as cnt FROM designs").fetchone()["cnt"],
        "active_designs": conn.execute("SELECT COUNT(*) as cnt FROM designs WHERE is_active = 1").fetchone()["cnt"],
        "featured_designs": conn.execute("SELECT COUNT(*) as cnt FROM designs WHERE is_featured = 1").fetchone()["cnt"],
        "total_blogs": conn.execute("SELECT COUNT(*) as cnt FROM blogs").fetchone()["cnt"],
        "published_blogs": conn.execute("SELECT COUNT(*) as cnt FROM blogs WHERE is_published = 1").fetchone()["cnt"],
        "total_views": conn.execute("SELECT COALESCE(SUM(views), 0) as total FROM designs").fetchone()["total"],
        "blog_views": conn.execute("SELECT COALESCE(SUM(views), 0) as total FROM blogs").fetchone()["total"],
    }
    recent_designs = conn.execute(
        "SELECT id, title, title_hi, views, created_at FROM designs ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    recent_blogs = conn.execute(
        "SELECT id, title, title_hi, views, is_published, created_at FROM blogs ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    latest_rate = conn.execute("SELECT * FROM gold_rates ORDER BY date DESC LIMIT 1").fetchone()
    conn.close()
    return {
        "stats": stats,
        "recent_designs": [dict(d) for d in recent_designs],
        "recent_blogs": [dict(b) for b in recent_blogs],
        "latest_rate": dict(latest_rate) if latest_rate else None
    }


@router.get("/settings")
async def get_settings(admin: str = Depends(verify_token)):
    conn = get_db()
    settings = conn.execute("SELECT * FROM settings").fetchall()
    conn.close()
    return {"data": {s["key"]: s["value"] for s in settings}}


@router.post("/settings")
async def update_setting(setting: SettingUpdate, admin: str = Depends(verify_token)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM settings WHERE key = ?", (setting.key,)).fetchone()
    if existing:
        conn.execute("UPDATE settings SET value = ? WHERE key = ?", (setting.value, setting.key))
    else:
        conn.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (setting.key, setting.value))
    conn.commit()
    conn.close()
    return {"message": "Setting updated"}


@router.get("/public-settings")
async def get_public_settings():
    conn = get_db()
    settings = conn.execute("SELECT * FROM settings WHERE key IN ('site_title', 'site_title_hi', 'site_description', 'site_description_hi', 'google_analytics_id', 'adsense_client_id', 'adsense_slot_id', 'contact_email', 'contact_phone', 'social_facebook', 'social_instagram', 'social_youtube', 'social_twitter')").fetchall()
    conn.close()
    return {"data": {s["key"]: s["value"] for s in settings}}
