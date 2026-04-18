from fastapi import APIRouter
from datetime import datetime

from app.database import get_db
from app.models.schemas import ContactMessageRequest
from app.utils.auth import serialize_docs

router = APIRouter(prefix="/api/public", tags=["Public"])


@router.get("/settings")
async def get_public_settings():
    """Get public site settings (brand, colors, hero text, etc.)"""
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    if not settings:
        return {
            "brandName": "KKHS Media",
            "companyName": "KKHS Media Private Limited",
            "contactEmail": "info@kkhsmedia.com",
            "address": "190A Krishna Kunj, Kalwar Road, Jaipur",
            "primaryColor": "#6366f1",
            "secondaryColor": "#8b5cf6",
            "heroTitle": "Stream Live 24/7 - YouTube & Facebook Automation",
            "heroSubtitle": "Stream your Pre-Recorded videos 24x7 & get more suggested and browse feature views.",
            "footerText": "The Best Professional Pre-Recorded Video Live Streaming Platform.",
            "socialLinks": {},
            "metaTitle": "KKHS Media - 24/7 Live Streaming Platform",
            "metaDescription": "Stream your pre-recorded videos 24x7 on YouTube, Facebook, Twitch & more.",
            "logoUrl": "",
            "faviconUrl": "",
            "maintenanceMode": False,
        }

    # Return only public-safe fields
    return {
        "brandName": settings.get("brandName", "KKHS Media"),
        "companyName": settings.get("companyName", ""),
        "contactEmail": settings.get("contactEmail", ""),
        "supportEmail": settings.get("supportEmail", ""),
        "address": settings.get("address", ""),
        "phone": settings.get("phone", ""),
        "primaryColor": settings.get("primaryColor", "#6366f1"),
        "secondaryColor": settings.get("secondaryColor", "#8b5cf6"),
        "heroTitle": settings.get("heroTitle", ""),
        "heroSubtitle": settings.get("heroSubtitle", ""),
        "footerText": settings.get("footerText", ""),
        "socialLinks": settings.get("socialLinks", {}),
        "metaTitle": settings.get("metaTitle", ""),
        "metaDescription": settings.get("metaDescription", ""),
        "logoUrl": settings.get("logoUrl", ""),
        "faviconUrl": settings.get("faviconUrl", ""),
        "headerLogoUrl": settings.get("headerLogoUrl", ""),
        "footerLogoUrl": settings.get("footerLogoUrl", ""),
        "maintenanceMode": settings.get("maintenanceMode", False),
        "gstRate": settings.get("gstRate", 18),
        "currency": settings.get("currency", "INR"),
    }


@router.get("/products")
async def get_public_products():
    """Get active pricing plans."""
    db = get_db()
    products = await db.products.find({"isActive": True}).sort("sortOrder", 1).to_list(20)
    return serialize_docs(products)


@router.post("/contact")
async def submit_contact(req: ContactMessageRequest):
    """Submit a contact form message."""
    db = get_db()
    contact = {
        "name": req.name,
        "email": req.email,
        "message": req.message,
        "status": "new",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    await db.contacts.insert_one(contact)
    return {"message": "Thank you for contacting us! We will get back to you soon."}
