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

# AWS S3
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY", "")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "kkhsmedia-videos")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Email (SendGrid/SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@kkhsmedia.com")

# Payment Gateways
CASHFREE_APP_ID = os.getenv("CASHFREE_APP_ID", "")
CASHFREE_SECRET_KEY = os.getenv("CASHFREE_SECRET_KEY", "")
CASHFREE_ENV = os.getenv("CASHFREE_ENV", "sandbox")  # sandbox or production

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

# App
APP_URL = os.getenv("APP_URL", "http://localhost:5173")
API_URL = os.getenv("API_URL", "http://localhost:8000")
