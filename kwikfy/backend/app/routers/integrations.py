from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.integration import Integration, SyncLog, ShippingRate, DeliveryPartner
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class IntegrationConnect(BaseModel):
    provider: str
    config: dict = {}


class ShippingRateIn(BaseModel):
    courier_name: str
    zone: str = ""
    weight_slab: str = ""
    base_rate: float = 0.0
    per_kg_rate: float = 0.0
    cod_charge: float = 0.0
    rto_charge: float = 0.0


class DeliveryPartnerIn(BaseModel):
    name: str
    api_key: str = ""
    api_secret: str = ""
    config: dict = {}


# --- Integrations ---
@router.get("/")
def list_integrations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integrations = db.query(Integration).filter(Integration.account_id == user.id).all()
    connected = {i.provider: i.is_connected for i in integrations}

    all_providers = [
        {"provider": "shopify", "name": "Shopify", "category": "store", "connected": connected.get("shopify", False)},
        {"provider": "whatsapp", "name": "WhatsApp Business", "category": "messaging", "connected": connected.get("whatsapp", False)},
        {"provider": "razorpay", "name": "Razorpay", "category": "payments", "connected": connected.get("razorpay", False)},
        {"provider": "cashfree", "name": "Cashfree", "category": "payments", "connected": connected.get("cashfree", False)},
        {"provider": "facebook_ads", "name": "Facebook Ads", "category": "ads", "connected": connected.get("facebook_ads", False)},
        {"provider": "google_ads", "name": "Google Ads", "category": "ads", "connected": connected.get("google_ads", False)},
        {"provider": "delhivery", "name": "Delhivery", "category": "shipping", "connected": connected.get("delhivery", False)},
        {"provider": "shiprocket", "name": "ShipRocket", "category": "shipping", "connected": connected.get("shiprocket", False)},
        {"provider": "dtdc", "name": "DTDC", "category": "shipping", "connected": connected.get("dtdc", False)},
        {"provider": "bluedart", "name": "BlueDart", "category": "shipping", "connected": connected.get("bluedart", False)},
        {"provider": "ecom_express", "name": "Ecom Express", "category": "shipping", "connected": connected.get("ecom_express", False)},
        {"provider": "xpressbees", "name": "XpressBees", "category": "shipping", "connected": connected.get("xpressbees", False)},
    ]
    return {"integrations": all_providers}


@router.post("/connect")
def connect_integration(req: IntegrationConnect, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.account_id == user.id, Integration.provider == req.provider).first()
    if not integration:
        integration = Integration(account_id=user.id, provider=req.provider)
        db.add(integration)
    integration.config = req.config
    integration.is_connected = True
    db.commit()
    return {"status": "ok", "provider": req.provider}


@router.post("/disconnect/{provider}")
def disconnect_integration(provider: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.account_id == user.id, Integration.provider == provider).first()
    if integration:
        integration.is_connected = False
        db.commit()
    return {"status": "ok"}


@router.post("/sync/{provider}")
def sync_integration(provider: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.account_id == user.id, Integration.provider == provider, Integration.is_connected == True).first()
    if not integration:
        raise HTTPException(status_code=400, detail=f"{provider} is not connected")
    log = SyncLog(account_id=user.id, provider=provider, action="full_sync", status="started")
    db.add(log)
    db.commit()
    return {"status": "ok", "message": f"Sync started for {provider}"}


@router.get("/sync-logs")
def sync_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(SyncLog).filter(SyncLog.account_id == user.id).order_by(SyncLog.created_at.desc()).limit(50).all()
    return {
        "logs": [
            {"id": l.id, "provider": l.provider, "action": l.action, "records_synced": l.records_synced, "status": l.status, "error": l.error, "created_at": l.created_at.isoformat() if l.created_at else None}
            for l in logs
        ]
    }


# --- Shopify ---
@router.get("/shopify/auth")
def shopify_auth(shop: str = Query(...)):
    from app.config import SHOPIFY_CLIENT_ID
    redirect_uri = f"https://kwikfy.com/api/integrations/shopify/callback"
    scopes = "read_orders,read_products,read_customers,write_orders"
    return {"redirect_url": f"https://{shop}/admin/oauth/authorize?client_id={SHOPIFY_CLIENT_ID}&scope={scopes}&redirect_uri={redirect_uri}"}


@router.get("/shopify/callback")
def shopify_callback(code: str = Query(""), shop: str = Query(""), hmac: str = Query("")):
    return {"status": "ok", "message": "Shopify connected successfully"}


@router.get("/shopify/status")
def shopify_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.account_id == user.id, Integration.provider == "shopify").first()
    if not integration or not integration.is_connected:
        return {"connected": False}
    return {"connected": True, "shop": integration.config.get("shop", ""), "last_sync": integration.last_sync.isoformat() if integration.last_sync else None}


# --- Shipping ---
@router.get("/shipping/rates")
def list_shipping_rates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rates = db.query(ShippingRate).filter(ShippingRate.account_id == user.id, ShippingRate.is_active == True).all()
    return {
        "rates": [
            {"id": r.id, "courier_name": r.courier_name, "zone": r.zone, "weight_slab": r.weight_slab, "base_rate": r.base_rate, "per_kg_rate": r.per_kg_rate, "cod_charge": r.cod_charge, "rto_charge": r.rto_charge}
            for r in rates
        ]
    }


@router.post("/shipping/rates")
def add_shipping_rate(req: ShippingRateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = ShippingRate(account_id=user.id, courier_name=req.courier_name, zone=req.zone, weight_slab=req.weight_slab, base_rate=req.base_rate, per_kg_rate=req.per_kg_rate, cod_charge=req.cod_charge, rto_charge=req.rto_charge)
    db.add(r)
    db.commit()
    return {"status": "ok", "rate_id": r.id}


@router.delete("/shipping/rates/{rate_id}")
def delete_shipping_rate(rate_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(ShippingRate).filter(ShippingRate.id == rate_id, ShippingRate.account_id == user.id).first()
    if r:
        db.delete(r)
        db.commit()
    return {"status": "ok"}


@router.get("/shipping/recommend")
def shipping_recommend(pincode: str = Query(""), weight: float = Query(0.5), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rates = db.query(ShippingRate).filter(ShippingRate.account_id == user.id, ShippingRate.is_active == True).all()
    recommendations = []
    for r in rates:
        cost = r.base_rate + (weight * r.per_kg_rate)
        recommendations.append({"courier": r.courier_name, "cost": cost, "cod_charge": r.cod_charge, "estimated_days": 3})
    recommendations.sort(key=lambda x: x["cost"])
    return {"recommendations": recommendations}


# --- Delivery Partners ---
@router.get("/delivery-partners")
def list_delivery_partners(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    partners = db.query(DeliveryPartner).filter(DeliveryPartner.account_id == user.id).all()
    return {
        "partners": [
            {"id": p.id, "name": p.name, "is_active": p.is_active, "config": {k: "***" for k in (p.config or {})}}
            for p in partners
        ]
    }


@router.post("/delivery-partners")
def add_delivery_partner(req: DeliveryPartnerIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = DeliveryPartner(account_id=user.id, name=req.name, api_key=req.api_key, api_secret=req.api_secret, config=req.config)
    db.add(p)
    db.commit()
    return {"status": "ok", "partner_id": p.id}
