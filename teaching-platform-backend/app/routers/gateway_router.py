"""Payment Gateway management router - Admin CRUD + payment initiation"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
import json
import hashlib
import time
import uuid

router = APIRouter(prefix="/api/admin/gateways", tags=["gateways"])


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _gateway_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "gateway_type": row["gateway_type"],
        "display_name": row["display_name"],
        "api_key": row["api_key"],
        "api_secret": _mask(row["api_secret"]),
        "merchant_id": row["merchant_id"],
        "extra_config": json.loads(row["extra_config"] or "{}"),
        "is_enabled": bool(row["is_enabled"]),
        "is_primary": bool(row["is_primary"]),
        "supports_upi": bool(row["supports_upi"]),
        "supports_cards": bool(row["supports_cards"]),
        "supports_netbanking": bool(row["supports_netbanking"]),
        "upi_intent": bool(row["upi_intent"]),
        "custom_upi_id": row["custom_upi_id"],
        "custom_qr_data": row["custom_qr_data"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _mask(val: str) -> str:
    if not val or len(val) < 6:
        return "****" if val else ""
    return "****" + val[-4:]


# ===== List all gateways =====
@router.get("/")
def list_gateways(user=Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM payment_gateways ORDER BY id").fetchall()
        return [_gateway_dict(r) for r in rows]


# ===== Get single gateway =====
@router.get("/{gateway_id}")
def get_gateway(gateway_id: int, user=Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Gateway not found")
        return _gateway_dict(row)


# ===== Create gateway =====
class GatewayCreate(BaseModel):
    name: str
    gateway_type: str
    display_name: str
    api_key: str = ""
    api_secret: str = ""
    merchant_id: str = ""
    extra_config: dict = {}
    is_enabled: bool = False
    supports_upi: bool = True
    supports_cards: bool = False
    supports_netbanking: bool = False
    upi_intent: bool = False
    custom_upi_id: str = ""
    custom_qr_data: str = ""


@router.post("/")
def create_gateway(data: GatewayCreate, user=Depends(require_admin)):
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO payment_gateways (name, gateway_type, display_name, api_key, api_secret, merchant_id, extra_config, is_enabled, is_primary, supports_upi, supports_cards, supports_netbanking, upi_intent, custom_upi_id, custom_qr_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)""",
            (data.name, data.gateway_type, data.display_name, data.api_key, data.api_secret,
             data.merchant_id, json.dumps(data.extra_config), 1 if data.is_enabled else 0,
             1 if data.supports_upi else 0, 1 if data.supports_cards else 0,
             1 if data.supports_netbanking else 0, 1 if data.upi_intent else 0,
             data.custom_upi_id, data.custom_qr_data)
        )
        return {"message": "Gateway created", "id": cursor.lastrowid}


# ===== Update gateway =====
class GatewayUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    merchant_id: Optional[str] = None
    extra_config: Optional[dict] = None
    is_enabled: Optional[bool] = None
    supports_upi: Optional[bool] = None
    supports_cards: Optional[bool] = None
    supports_netbanking: Optional[bool] = None
    upi_intent: Optional[bool] = None
    custom_upi_id: Optional[str] = None
    custom_qr_data: Optional[str] = None


@router.put("/{gateway_id}")
def update_gateway(gateway_id: int, data: GatewayUpdate, user=Depends(require_admin)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Gateway not found")

        updates = {}
        raw = data.dict(exclude_none=True)
        for key, value in raw.items():
            if key == "extra_config":
                updates[key] = json.dumps(value)
            elif key in ("is_enabled", "supports_upi", "supports_cards", "supports_netbanking", "upi_intent"):
                updates[key] = 1 if value else 0
            else:
                updates[key] = value

        if not updates:
            return {"message": "No changes"}

        set_parts = [f"{k} = ?" for k in updates.keys()]
        set_parts.append("updated_at = CURRENT_TIMESTAMP")
        values = list(updates.values())
        values.append(gateway_id)

        conn.execute(
            f"UPDATE payment_gateways SET {', '.join(set_parts)} WHERE id = ?",
            values
        )
        return {"message": "Gateway updated"}


# ===== Delete gateway =====
@router.delete("/{gateway_id}")
def delete_gateway(gateway_id: int, user=Depends(require_admin)):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Gateway not found")
        conn.execute("DELETE FROM payment_gateways WHERE id = ?", (gateway_id,))
        return {"message": "Gateway deleted"}


# ===== Set primary gateway =====
@router.post("/{gateway_id}/primary")
def set_primary_gateway(gateway_id: int, user=Depends(require_admin)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Gateway not found")
        if not existing["is_enabled"]:
            raise HTTPException(status_code=400, detail="Enable the gateway first before setting as primary")
        # Clear all primary flags
        conn.execute("UPDATE payment_gateways SET is_primary = 0")
        # Set this as primary
        conn.execute("UPDATE payment_gateways SET is_primary = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (gateway_id,))
        return {"message": f"{existing['name']} set as primary gateway"}


# ===== Toggle gateway enable/disable =====
@router.post("/{gateway_id}/toggle")
def toggle_gateway(gateway_id: int, user=Depends(require_admin)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Gateway not found")
        new_status = 0 if existing["is_enabled"] else 1
        conn.execute("UPDATE payment_gateways SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, gateway_id))
        # If disabling and it was primary, clear primary
        if new_status == 0 and existing["is_primary"]:
            conn.execute("UPDATE payment_gateways SET is_primary = 0 WHERE id = ?", (gateway_id,))
        return {"message": f"Gateway {'enabled' if new_status else 'disabled'}", "is_enabled": bool(new_status)}


# ===== Test gateway connectivity =====
@router.post("/{gateway_id}/test")
def test_gateway(gateway_id: int, user=Depends(require_admin)):
    with get_db() as conn:
        gw = conn.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not gw:
            raise HTTPException(status_code=404, detail="Gateway not found")

        gtype = gw["gateway_type"]
        api_key = gw["api_key"]
        api_secret = gw["api_secret"]

        # For custom UPI, just check if UPI ID is set
        if gtype == "custom_upi":
            if gw["custom_upi_id"] or gw["custom_qr_data"]:
                return {"success": True, "message": "Custom UPI configured correctly"}
            else:
                return {"success": False, "message": "Please set UPI ID or QR data"}

        # For cash gateway, always ready
        if gtype == "cash":
            return {"success": True, "message": "Cash payment gateway is ready. No API keys needed."}

        # For other gateways, check if API keys are configured
        if not api_key:
            return {"success": False, "message": f"API Key not configured for {gw['name']}"}

        # Simulate connectivity test (in production, this would make actual API calls)
        # RazorPay test
        if gtype == "razorpay":
            if api_key and api_secret:
                return {"success": True, "message": "RazorPay credentials configured. Ready to accept payments."}
            return {"success": False, "message": "Both API Key and Secret are required for RazorPay"}

        # PhonePe test
        if gtype == "phonepe":
            merchant_id = gw["merchant_id"]
            if api_key and merchant_id:
                return {"success": True, "message": "PhonePe credentials configured. Ready to accept payments."}
            return {"success": False, "message": "API Key and Merchant ID required for PhonePe"}

        # Cashfree test
        if gtype == "cashfree":
            if api_key and api_secret:
                return {"success": True, "message": "Cashfree credentials configured. Ready to accept payments."}
            return {"success": False, "message": "App ID and Secret Key required for Cashfree"}

        # PayU test
        if gtype == "payu":
            if api_key and api_secret:
                return {"success": True, "message": "PayU credentials configured. Ready to accept payments."}
            return {"success": False, "message": "Merchant Key and Salt required for PayU"}

        # Instamojo test
        if gtype == "instamojo":
            if api_key and api_secret:
                return {"success": True, "message": "Instamojo credentials configured. Ready to accept payments."}
            return {"success": False, "message": "API Key and Auth Token required for Instamojo"}

        return {"success": False, "message": "Unknown gateway type"}


# ===== PUBLIC: Get enabled gateways for checkout =====
public_router = APIRouter(prefix="/api/payment-gateways", tags=["payment-gateways"])


@public_router.get("/available")
def get_available_gateways():
    """Public endpoint - returns enabled gateways for checkout (no secrets)"""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, gateway_type, display_name, is_primary, supports_upi, supports_cards, supports_netbanking, upi_intent, custom_upi_id, custom_qr_data FROM payment_gateways WHERE is_enabled = 1 ORDER BY is_primary DESC, name"
        ).fetchall()
        result = []
        for r in rows:
            gw = {
                "id": r["id"],
                "name": r["name"],
                "gateway_type": r["gateway_type"],
                "display_name": r["display_name"],
                "is_primary": bool(r["is_primary"]),
                "supports_upi": bool(r["supports_upi"]),
                "supports_cards": bool(r["supports_cards"]),
                "supports_netbanking": bool(r["supports_netbanking"]),
                "upi_intent": bool(r["upi_intent"]),
            }
            # Include UPI ID/QR only for custom_upi type
            if r["gateway_type"] == "custom_upi":
                gw["custom_upi_id"] = r["custom_upi_id"]
                gw["custom_qr_data"] = r["custom_qr_data"]
            result.append(gw)
        return result


# ===== PUBLIC: Initiate payment via gateway =====
class InitiatePaymentRequest(BaseModel):
    gateway_id: int
    booking_id: int
    amount: float
    payment_method: str = "upi"  # upi, card, netbanking


@public_router.post("/initiate")
def initiate_payment(data: InitiatePaymentRequest, user=Depends(get_current_user)):
    """Initiate payment through selected gateway"""
    with get_db() as conn:
        gw = conn.execute("SELECT * FROM payment_gateways WHERE id = ? AND is_enabled = 1", (data.gateway_id,)).fetchone()
        if not gw:
            raise HTTPException(status_code=400, detail="Gateway not available")

        # Generate a transaction reference
        txn_id = f"TXN-{gw['gateway_type'].upper()}-{int(time.time())}-{uuid.uuid4().hex[:8].upper()}"

        gtype = gw["gateway_type"]

        # === RazorPay ===
        if gtype == "razorpay":
            # In production: Create Razorpay Order using API
            # For now, return order details for frontend SDK
            return {
                "gateway": "razorpay",
                "transaction_id": txn_id,
                "order_id": f"order_{uuid.uuid4().hex[:16]}",
                "amount": int(data.amount * 100),  # paise
                "currency": "INR",
                "key_id": gw["api_key"],
                "upi_intent": bool(gw["upi_intent"]),
                "name": "GuruConnect",
                "description": f"Class Booking #{data.booking_id}",
                "prefill": {"email": user["email"], "name": user["full_name"]},
                "status": "created"
            }

        # === PhonePe ===
        if gtype == "phonepe":
            return {
                "gateway": "phonepe",
                "transaction_id": txn_id,
                "merchant_id": gw["merchant_id"],
                "amount": int(data.amount * 100),
                "redirect_url": f"/payment/callback/phonepe?txn={txn_id}",
                "status": "created"
            }

        # === Cashfree ===
        if gtype == "cashfree":
            return {
                "gateway": "cashfree",
                "transaction_id": txn_id,
                "order_id": f"CF_{int(time.time())}_{data.booking_id}",
                "amount": data.amount,
                "app_id": gw["api_key"],
                "status": "created"
            }

        # === PayU ===
        if gtype == "payu":
            txn_string = f"{gw['api_key']}|{txn_id}|{data.amount}|Booking|{user['full_name']}|{user['email']}|||||||||||{gw['api_secret']}"
            pay_hash = hashlib.sha512(txn_string.encode()).hexdigest()
            return {
                "gateway": "payu",
                "transaction_id": txn_id,
                "merchant_key": gw["api_key"],
                "amount": data.amount,
                "hash": pay_hash,
                "product_info": "Class Booking",
                "status": "created"
            }

        # === Instamojo ===
        if gtype == "instamojo":
            return {
                "gateway": "instamojo",
                "transaction_id": txn_id,
                "amount": data.amount,
                "purpose": f"Class Booking #{data.booking_id}",
                "buyer_name": user["full_name"],
                "email": user["email"],
                "status": "created"
            }

        # === Custom UPI ===
        if gtype == "custom_upi":
            upi_id = gw["custom_upi_id"]
            qr_data = gw["custom_qr_data"]
            # Generate UPI deep link
            upi_link = ""
            if upi_id:
                upi_link = f"upi://pay?pa={upi_id}&pn=GuruConnect&am={data.amount}&cu=INR&tn=Booking{data.booking_id}"
            return {
                "gateway": "custom_upi",
                "transaction_id": txn_id,
                "upi_id": upi_id,
                "upi_link": upi_link,
                "qr_data": qr_data,
                "amount": data.amount,
                "status": "created"
            }

        # === Cash ===
        if gtype == "cash":
            return {
                "gateway": "cash",
                "transaction_id": txn_id,
                "amount": data.amount,
                "status": "created",
                "message": "Cash payment - to be collected directly"
            }

        raise HTTPException(status_code=400, detail="Unsupported gateway type")
