from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.database import engine, Base
from app.models.user import User, Admin, TeamUser, Task, ActivityLog
from app.models.order import Order, Product, Customer, AbandonedCart
from app.models.finance import CostEntry, GSTConfig, Payment, CODRemittance, WalletTransaction, Expense, AdCampaign
from app.models.whatsapp import (
    WhatsAppConfig, WhatsAppTemplate, WhatsAppCampaign, WhatsAppContact,
    WhatsAppMessage, WhatsAppAutomation, WhatsAppLabel, WhatsAppQuickReply,
    WhatsAppChatLink, WhatsAppBusinessHours, OrderAutomation, AbandonedCartConfig,
)
from app.models.integration import Integration, SyncLog, ShippingRate, DeliveryPartner
from app.models.notification import Notification, Alert, NDRAlert, Announcement
from app.models.checkout import CheckoutConfig, Coupon, CheckoutSession, CustomerAddress, TrackingConfig, Invoice
from app.routers import auth, dashboard, orders, products, inventory, finance, analytics, whatsapp, checkout, cashflow, notifications, integrations, team, admin, reports, settings

app = FastAPI(title="Kwikfy", version="0.1.0", description="All-in-One D2C Brand Management Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Seed default admin
from app.database import SessionLocal
from app.utils.auth import hash_password

db = SessionLocal()
if not db.query(Admin).first():
    default_admin = Admin(
        email="admin@kwikfy.com",
        password_hash=hash_password("admin123"),
        name="Super Admin",
        role="admin",
    )
    db.add(default_admin)
    db.commit()
db.close()

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(finance.router)
app.include_router(analytics.router)
app.include_router(whatsapp.router)
app.include_router(checkout.router)
app.include_router(cashflow.router)
app.include_router(notifications.router)
app.include_router(integrations.router)
app.include_router(team.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(settings.router)

# Serve frontend
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "frontend")


@app.get("/")
async def serve_home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/login")
async def serve_login():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))


@app.get("/signup")
async def serve_signup():
    return FileResponse(os.path.join(FRONTEND_DIR, "signup.html"))


@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
