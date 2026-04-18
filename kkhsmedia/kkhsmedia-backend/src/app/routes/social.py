"""Facebook Live and Instagram Live API OAuth integration."""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/social", tags=["Social Platforms"])


# ============ FACEBOOK LIVE ============

@router.get("/facebook/auth-url")
async def get_facebook_auth_url(user=Depends(get_current_user)):
    """Get Facebook OAuth URL for connecting."""
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    fb_app_id = (settings or {}).get("facebookAppId", "")
    if not fb_app_id:
        raise HTTPException(status_code=400, detail="Facebook App ID not configured in admin settings")

    from app.config import APP_URL
    redirect_uri = f"{APP_URL}/live-slots?facebook_callback=true"
    scopes = "publish_video,pages_show_list,pages_read_engagement"

    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={fb_app_id}&redirect_uri={redirect_uri}"
        f"&scope={scopes}&response_type=code"
    )
    return {"authUrl": auth_url}


@router.post("/facebook/callback")
async def facebook_oauth_callback(code: str, user=Depends(get_current_user)):
    """Handle Facebook OAuth callback."""
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    fb_app_id = (settings or {}).get("facebookAppId", "")
    fb_app_secret = (settings or {}).get("facebookAppSecret", "")

    if not fb_app_id or not fb_app_secret:
        raise HTTPException(status_code=400, detail="Facebook credentials not configured")

    from app.config import APP_URL
    redirect_uri = f"{APP_URL}/live-slots?facebook_callback=true"

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            resp = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": fb_app_id,
                    "client_secret": fb_app_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
            )
            token_data = resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="Failed to get Facebook access token")

            # Get user info
            user_resp = await client.get(
                "https://graph.facebook.com/v18.0/me",
                params={"access_token": access_token, "fields": "id,name,picture"},
            )
            fb_user = user_resp.json()

            # Get pages
            pages_resp = await client.get(
                "https://graph.facebook.com/v18.0/me/accounts",
                params={"access_token": access_token},
            )
            pages = pages_resp.json().get("data", [])

            # Store tokens
            await db.social_tokens.update_one(
                {"userId": user["id"], "platform": "facebook"},
                {"$set": {
                    "userId": user["id"],
                    "platform": "facebook",
                    "accessToken": access_token,
                    "fbUserId": fb_user.get("id"),
                    "fbUserName": fb_user.get("name"),
                    "pages": pages,
                    "connectedAt": datetime.utcnow(),
                }},
                upsert=True,
            )

            return {
                "connected": True,
                "userName": fb_user.get("name"),
                "pages": [{"id": p["id"], "name": p["name"]} for p in pages],
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Facebook OAuth error: {str(e)}")


@router.get("/facebook/status")
async def get_facebook_status(user=Depends(get_current_user)):
    """Check Facebook connection status."""
    db = get_db()
    token_doc = await db.social_tokens.find_one({"userId": user["id"], "platform": "facebook"})
    if not token_doc:
        return {"connected": False}
    return {
        "connected": True,
        "userName": token_doc.get("fbUserName", ""),
        "pages": [{"id": p["id"], "name": p["name"]} for p in token_doc.get("pages", [])],
    }


@router.post("/facebook/disconnect")
async def disconnect_facebook(user=Depends(get_current_user)):
    db = get_db()
    await db.social_tokens.delete_one({"userId": user["id"], "platform": "facebook"})
    return {"message": "Facebook disconnected"}


@router.post("/facebook/go-live")
async def facebook_go_live(page_id: str, title: str = "Live Stream", user=Depends(get_current_user)):
    """Create a Facebook Live video and get stream key."""
    db = get_db()
    token_doc = await db.social_tokens.find_one({"userId": user["id"], "platform": "facebook"})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Facebook not connected")

    # Find page token
    page_token = None
    for page in token_doc.get("pages", []):
        if page["id"] == page_id:
            page_token = page.get("access_token")
            break

    if not page_token:
        page_token = token_doc.get("accessToken")

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://graph.facebook.com/v18.0/{page_id}/live_videos",
                params={"access_token": page_token},
                json={"title": title, "status": "LIVE_NOW"},
            )
            data = resp.json()
            return {
                "streamUrl": data.get("stream_url", ""),
                "secureStreamUrl": data.get("secure_stream_url", ""),
                "liveVideoId": data.get("id", ""),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ INSTAGRAM LIVE ============

@router.get("/instagram/auth-url")
async def get_instagram_auth_url(user=Depends(get_current_user)):
    """Get Instagram OAuth URL."""
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    ig_app_id = (settings or {}).get("instagramAppId") or (settings or {}).get("facebookAppId", "")
    if not ig_app_id:
        raise HTTPException(status_code=400, detail="Instagram/Facebook App ID not configured")

    from app.config import APP_URL
    redirect_uri = f"{APP_URL}/live-slots?instagram_callback=true"
    scopes = "instagram_basic,instagram_content_publish,pages_show_list"

    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={ig_app_id}&redirect_uri={redirect_uri}"
        f"&scope={scopes}&response_type=code"
    )
    return {"authUrl": auth_url}


@router.get("/instagram/status")
async def get_instagram_status(user=Depends(get_current_user)):
    db = get_db()
    token_doc = await db.social_tokens.find_one({"userId": user["id"], "platform": "instagram"})
    if not token_doc:
        return {"connected": False}
    return {"connected": True, "userName": token_doc.get("igUserName", "")}


@router.post("/instagram/disconnect")
async def disconnect_instagram(user=Depends(get_current_user)):
    db = get_db()
    await db.social_tokens.delete_one({"userId": user["id"], "platform": "instagram"})
    return {"message": "Instagram disconnected"}


# ============ ADMIN: Social Platform Settings ============

@router.get("/admin/config")
async def admin_get_social_config(admin=Depends(get_admin_user)):
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    return {
        "facebookAppId": (settings or {}).get("facebookAppId", ""),
        "facebookAppSecret": (settings or {}).get("facebookAppSecret", ""),
        "instagramAppId": (settings or {}).get("instagramAppId", ""),
    }


@router.put("/admin/config")
async def admin_update_social_config(
    facebookAppId: str = "", facebookAppSecret: str = "", instagramAppId: str = "",
    admin=Depends(get_admin_user)
):
    db = get_db()
    await db.settings.update_one(
        {"key": "site"},
        {"$set": {
            "facebookAppId": facebookAppId,
            "facebookAppSecret": facebookAppSecret,
            "instagramAppId": instagramAppId,
            "updatedAt": datetime.utcnow(),
        }},
        upsert=True,
    )
    return {"message": "Social platform settings updated"}
