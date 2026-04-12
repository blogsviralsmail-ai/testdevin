from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, DATABASE_NAME
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Test connection
        await client.admin.command("ping")
        db = client[DATABASE_NAME]
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("App will start but database features will be unavailable")
        db = None
        return
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.slots.create_index("userId")
    await db.videos.create_index("userId")
    await db.orders.create_index("userId")
    await db.otp_codes.create_index("email")
    await db.otp_codes.create_index("createdAt", expireAfterSeconds=600)
    # Seed default admin if not exists
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        from app.utils.auth import hash_password
        await db.users.insert_one({
            "firstName": "Admin",
            "lastName": "User",
            "email": "admin@kkhsmedia.com",
            "password": hash_password("admin123"),
            "phone": "",
            "address": {},
            "role": "admin",
            "emailVerified": True,
            "status": "active",
            "createdAt": __import__("datetime").datetime.utcnow(),
            "updatedAt": __import__("datetime").datetime.utcnow(),
        })
    # Seed default settings if not exists
    settings = await db.settings.find_one({"key": "site"})
    if not settings:
        await db.settings.insert_one({
            "key": "site",
            "brandName": "KKHS Media",
            "companyName": "KKHS Media Private Limited",
            "contactEmail": "info@kkhsmedia.com",
            "supportEmail": "support@kkhsmedia.com",
            "address": "190A Krishna Kunj, Kalwar Road, Jaipur",
            "phone": "",
            "logoUrl": "",
            "faviconUrl": "",
            "primaryColor": "#6366f1",
            "secondaryColor": "#8b5cf6",
            "heroTitle": "Stream Live 24/7 - YouTube & Facebook Automation",
            "heroSubtitle": "Stream your Pre-Recorded videos 24x7 & get more suggested and browse feature views.",
            "footerText": "The Best Professional Pre-Recorded Video Live Streaming Platform.",
            "socialLinks": {"youtube": "", "twitter": "", "instagram": "", "facebook": ""},
            "gstRate": 18,
            "gstNumber": "",
            "maintenanceMode": False,
            "currency": "INR",
            "metaTitle": "KKHS Media - 24/7 Live Streaming Platform",
            "metaDescription": "Stream your pre-recorded videos 24x7 on YouTube, Facebook, Twitch & more.",
        })
    # Seed default products if none exist
    products_count = await db.products.count_documents({})
    if products_count == 0:
        from datetime import datetime
        now = datetime.utcnow()
        await db.products.insert_many([
            {
                "name": "Basic",
                "durationType": "day",
                "durationValue": 1,
                "price": {"INR": 33.10, "USD": 0.40},
                "features": ["1 Stream Slot", "720p Quality", "YouTube & Facebook"],
                "streamQuality": "720p",
                "isActive": True,
                "sortOrder": 1,
                "createdAt": now,
            },
            {
                "name": "Popular",
                "durationType": "week",
                "durationValue": 1,
                "price": {"INR": 169.00, "USD": 2.00},
                "features": ["1 Stream Slot", "1080p Quality", "All Platforms"],
                "streamQuality": "1080p",
                "isActive": True,
                "sortOrder": 2,
                "createdAt": now,
            },
            {
                "name": "Business",
                "durationType": "month",
                "durationValue": 1,
                "price": {"INR": 592.00, "USD": 7.00},
                "features": ["1 Stream Slot", "1080p Quality", "All Platforms", "Priority Support"],
                "streamQuality": "1080p",
                "isActive": True,
                "sortOrder": 3,
                "createdAt": now,
            },
        ])


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
