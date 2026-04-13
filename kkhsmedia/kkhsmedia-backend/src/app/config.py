import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kkhsmedia")

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "kkhsmedia-secret-key-change-in-production-2024")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# AWS S3 (env var defaults, overridden by DB settings)
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY", "")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "kkhsmedia-videos")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Email (env var defaults, overridden by DB settings)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@kkhsmedia.com")

# Payment Gateways (env var defaults, overridden by DB settings)
CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID", "")
CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY", "")
CASHFREE_ENV = os.getenv("CASHFREE_ENV", "sandbox")  # sandbox or production

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

# App
APP_URL = os.getenv("APP_URL", "http://localhost:5173")
API_URL = os.getenv("API_URL", "http://localhost:8000")


async def get_setting(key: str, env_fallback: str = "") -> str:
    """Get a config value from DB settings (key='site') with env var fallback."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    if settings and settings.get(key):
        return settings[key]
    return env_fallback


async def get_smtp_config() -> dict:
    """Get SMTP config from DB, fallback to env vars."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    s = settings or {}
    return {
        "host": s.get("smtpHost") or SMTP_HOST,
        "port": int(s.get("smtpPort") or SMTP_PORT),
        "user": s.get("smtpUser") or SMTP_USER,
        "password": s.get("smtpPassword") or SMTP_PASSWORD,
        "from_email": s.get("fromEmail") or FROM_EMAIL,
    }


async def get_cashfree_config() -> dict:
    """Get Cashfree config from DB, fallback to env vars."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    s = settings or {}
    return {
        "app_id": s.get("cashfreeAppId") or CASHFREE_APP_ID,
        "secret_key": s.get("cashfreeSecretKey") or CASHFREE_SECRET_KEY,
        "env": s.get("cashfreeEnv") or CASHFREE_ENV,
    }


async def get_razorpay_config() -> dict:
    """Get Razorpay config from DB, fallback to env vars."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    s = settings or {}
    return {
        "key_id": s.get("razorpayKeyId") or RAZORPAY_KEY_ID,
        "key_secret": s.get("razorpayKeySecret") or RAZORPAY_KEY_SECRET,
    }


async def get_aws_config() -> dict:
    """Get AWS S3 config from DB, fallback to env vars."""
    from app.database import get_db
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    s = settings or {}
    return {
        "access_key": s.get("awsAccessKeyId") or AWS_ACCESS_KEY,
        "secret_key": s.get("awsSecretAccessKey") or AWS_SECRET_KEY,
        "bucket": s.get("awsS3Bucket") or AWS_BUCKET_NAME,
        "region": s.get("awsRegion") or AWS_REGION,
    }
