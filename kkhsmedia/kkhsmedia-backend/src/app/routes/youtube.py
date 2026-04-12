"""YouTube Data API v3 integration for custom thumbnails on live streams.

Flow:
1. Admin configures Google OAuth2 Client ID/Secret in admin settings
2. User clicks "Connect YouTube" → redirected to Google OAuth2 consent screen
3. After consent, we store access_token + refresh_token in user's DB record
4. When starting a stream on YouTube, we find the active broadcast and set custom thumbnail
"""
import os
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse

from app.database import get_db
from app.utils.auth import get_current_user, serialize_doc
from app.config import API_URL, APP_URL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/youtube", tags=["YouTube"])

YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


async def _get_google_credentials():
    """Get Google OAuth2 client credentials from admin settings."""
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    client_id = (settings or {}).get("googleClientId", "")
    client_secret = (settings or {}).get("googleClientSecret", "")
    if not client_id or not client_secret:
        return None, None
    return client_id, client_secret


@router.get("/auth-url")
async def get_youtube_auth_url(user=Depends(get_current_user)):
    """Generate Google OAuth2 URL for YouTube channel connection."""
    client_id, client_secret = await _get_google_credentials()
    if not client_id:
        raise HTTPException(status_code=400, detail="Google OAuth2 not configured. Admin must set Google Client ID and Secret in Settings.")

    redirect_uri = f"{API_URL}/api/youtube/callback"

    # Build OAuth2 URL manually (no need for google-auth library for URL generation)
    from urllib.parse import urlencode
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": user["id"],  # Pass user ID in state
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"authUrl": auth_url}


@router.get("/callback")
async def youtube_oauth_callback(code: str = "", state: str = "", error: str = ""):
    """Handle Google OAuth2 callback after user grants permission."""
    if error:
        return RedirectResponse(f"{APP_URL}/live-slots?youtube_error={error}")

    if not code or not state:
        return RedirectResponse(f"{APP_URL}/live-slots?youtube_error=missing_code")

    user_id = state
    client_id, client_secret = await _get_google_credentials()
    if not client_id:
        return RedirectResponse(f"{APP_URL}/live-slots?youtube_error=not_configured")

    redirect_uri = f"{API_URL}/api/youtube/callback"

    # Exchange code for tokens
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })

    if resp.status_code != 200:
        logger.error(f"YouTube OAuth token exchange failed: {resp.text}")
        return RedirectResponse(f"{APP_URL}/live-slots?youtube_error=token_exchange_failed")

    tokens = resp.json()
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")

    if not access_token:
        return RedirectResponse(f"{APP_URL}/live-slots?youtube_error=no_access_token")

    # Get channel info
    channel_info = {}
    try:
        async with httpx.AsyncClient() as client:
            ch_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={"part": "snippet", "mine": "true"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if ch_resp.status_code == 200:
                items = ch_resp.json().get("items", [])
                if items:
                    snippet = items[0].get("snippet", {})
                    channel_info = {
                        "channelId": items[0].get("id", ""),
                        "channelTitle": snippet.get("title", ""),
                        "channelThumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                    }
    except Exception as e:
        logger.warning(f"Failed to get YouTube channel info: {e}")

    # Store tokens in user record
    from bson import ObjectId
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "youtubeTokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "expiresAt": tokens.get("expires_in", 3600),
                "tokenType": tokens.get("token_type", "Bearer"),
                "connectedAt": datetime.utcnow().isoformat(),
            },
            "youtubeChannel": channel_info,
            "updatedAt": datetime.utcnow(),
        }}
    )

    logger.info(f"YouTube connected for user {user_id}: {channel_info.get('channelTitle', 'Unknown')}")
    return RedirectResponse(f"{APP_URL}/live-slots?youtube_connected=true")


@router.get("/status")
async def get_youtube_status(user=Depends(get_current_user)):
    """Check if user has YouTube connected."""
    from bson import ObjectId
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    tokens = user_doc.get("youtubeTokens")
    channel = user_doc.get("youtubeChannel", {})

    return {
        "connected": bool(tokens and tokens.get("accessToken")),
        "channel": channel,
    }


@router.post("/disconnect")
async def disconnect_youtube(user=Depends(get_current_user)):
    """Disconnect YouTube channel."""
    from bson import ObjectId
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$unset": {"youtubeTokens": "", "youtubeChannel": ""},
         "$set": {"updatedAt": datetime.utcnow()}}
    )
    return {"message": "YouTube disconnected"}


async def _refresh_youtube_token(user_id: str) -> Optional[str]:
    """Refresh YouTube access token using refresh token."""
    from bson import ObjectId
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return None

    tokens = user_doc.get("youtubeTokens", {})
    refresh_token = tokens.get("refreshToken")
    if not refresh_token:
        return None

    client_id, client_secret = await _get_google_credentials()
    if not client_id:
        return None

    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        })

    if resp.status_code != 200:
        logger.error(f"YouTube token refresh failed: {resp.text}")
        return None

    new_tokens = resp.json()
    new_access_token = new_tokens.get("access_token", "")

    # Update stored token
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "youtubeTokens.accessToken": new_access_token,
            "youtubeTokens.expiresAt": new_tokens.get("expires_in", 3600),
            "updatedAt": datetime.utcnow(),
        }}
    )

    return new_access_token


async def set_youtube_thumbnail(user_id: str, thumbnail_path: str) -> bool:
    """Set custom thumbnail on the active YouTube live broadcast.

    Steps:
    1. Get user's YouTube access token
    2. Find the active live broadcast
    3. Upload the custom thumbnail to that broadcast
    """
    from bson import ObjectId
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        logger.warning(f"User {user_id} not found for YouTube thumbnail")
        return False

    tokens = user_doc.get("youtubeTokens", {})
    access_token = tokens.get("accessToken")
    if not access_token:
        logger.warning(f"User {user_id} has no YouTube tokens")
        return False

    import httpx

    # Step 1: Find active live broadcast
    async def _find_broadcast(token: str) -> Optional[str]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/youtube/v3/liveBroadcasts",
                params={
                    "part": "id,snippet,status",
                    "broadcastStatus": "active",
                    "broadcastType": "all",
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
            if resp.status_code == 401:
                return "EXPIRED"
            if resp.status_code != 200:
                logger.error(f"YouTube liveBroadcasts.list failed: {resp.status_code} {resp.text}")
                return None
            items = resp.json().get("items", [])
            if not items:
                # Try upcoming broadcasts too
                resp2 = await client.get(
                    "https://www.googleapis.com/youtube/v3/liveBroadcasts",
                    params={
                        "part": "id,snippet,status",
                        "broadcastStatus": "upcoming",
                        "broadcastType": "all",
                    },
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=15,
                )
                if resp2.status_code == 200:
                    items = resp2.json().get("items", [])
            if items:
                return items[0]["id"]
            return None

    broadcast_id = await _find_broadcast(access_token)

    # If token expired, refresh and retry
    if broadcast_id == "EXPIRED":
        access_token = await _refresh_youtube_token(user_id)
        if not access_token:
            logger.error("Failed to refresh YouTube token")
            return False
        broadcast_id = await _find_broadcast(access_token)

    if not broadcast_id or broadcast_id == "EXPIRED":
        logger.warning(f"No active/upcoming YouTube broadcast found for user {user_id}")
        return False

    # Step 2: Upload thumbnail
    if not os.path.exists(thumbnail_path):
        logger.warning(f"Thumbnail file not found: {thumbnail_path}")
        return False

    # Read thumbnail file
    with open(thumbnail_path, "rb") as f:
        thumb_data = f.read()

    # Determine content type
    if thumbnail_path.endswith(".png"):
        content_type = "image/png"
    else:
        content_type = "image/jpeg"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://www.googleapis.com/upload/youtube/v3/thumbnails/set",
                params={"videoId": broadcast_id},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": content_type,
                },
                content=thumb_data,
                timeout=30,
            )
            if resp.status_code == 200:
                logger.info(f"YouTube thumbnail set successfully for broadcast {broadcast_id}")
                return True
            else:
                logger.error(f"YouTube thumbnail upload failed: {resp.status_code} {resp.text}")
                return False
    except Exception as e:
        logger.error(f"YouTube thumbnail upload error: {e}")
        return False
