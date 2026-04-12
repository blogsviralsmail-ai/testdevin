from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timedelta
from bson import ObjectId
import uuid

from app.database import get_db
from app.models.schemas import CreateOrderRequest
from app.utils.auth import get_current_user, serialize_doc, serialize_docs

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def calculate_expiry(duration: int, duration_type: str) -> datetime:
    now = datetime.utcnow()
    if duration_type == "day":
        return now + timedelta(days=duration)
    elif duration_type == "week":
        return now + timedelta(weeks=duration)
    elif duration_type == "month":
        return now + timedelta(days=30 * duration)
    return now + timedelta(days=duration)


@router.post("")
async def create_order(req: CreateOrderRequest, user=Depends(get_current_user)):
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    gst_rate = settings.get("gstRate", 18) if settings else 18

    # Calculate total
    total_base = 0
    order_slots = []

    for slot_item in req.slots:
        # Get product price for this duration type
        product = await db.products.find_one({
            "durationType": slot_item.durationType,
            "isActive": True,
        })
        if not product:
            raise HTTPException(status_code=400, detail=f"No active plan for {slot_item.durationType}")

        price = product["price"].get(req.currency, product["price"].get("INR", 0))
        item_total = price * slot_item.duration

        order_slots.append({
            "slotId": slot_item.slotId,
            "duration": slot_item.duration,
            "durationType": slot_item.durationType,
            "unitPrice": price,
            "total": item_total,
        })
        total_base += item_total

    gst_amount = round(total_base * gst_rate / 100, 2)
    total_amount = round(total_base + gst_amount, 2)

    order_id = str(uuid.uuid4().hex[:12])
    order = {
        "orderId": order_id,
        "userId": user["id"],
        "slots": order_slots,
        "subtotal": round(total_base, 2),
        "gstRate": gst_rate,
        "gstAmount": gst_amount,
        "totalAmount": total_amount,
        "currency": req.currency,
        "status": "pending",
        "paymentGateway": req.paymentGateway,
        "paymentId": None,
        "phone": req.phone,
        "billingAddress": req.address,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    result = await db.orders.insert_one(order)
    order["id"] = str(result.inserted_id)

    # Create payment session based on gateway
    payment_data = {}
    if req.paymentGateway == "cashfree":
        payment_data = await create_cashfree_order(order_id, total_amount, req.currency, user)
    elif req.paymentGateway == "razorpay":
        payment_data = await create_razorpay_order(order_id, total_amount, req.currency)

    if payment_data.get("paymentSessionId") or payment_data.get("orderId"):
        await db.orders.update_one(
            {"_id": result.inserted_id},
            {"$set": {"paymentData": payment_data}}
        )

    return {
        "order": serialize_doc(order),
        "payment": payment_data,
    }


@router.get("")
async def get_orders(user=Depends(get_current_user)):
    db = get_db()
    orders = await db.orders.find({"userId": user["id"]}).sort("createdAt", -1).to_list(100)
    return serialize_docs(orders)


@router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_doc(order)


@router.post("/{order_id}/verify")
async def verify_order(order_id: str, user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] == "paid":
        return {"message": "Order already paid", "status": "paid"}

    # Verify with payment gateway
    verified = False
    if order.get("paymentGateway") == "cashfree":
        verified = await verify_cashfree_payment(order["orderId"])
    elif order.get("paymentGateway") == "razorpay":
        verified = await verify_razorpay_payment(order.get("paymentData", {}).get("orderId", ""))

    if verified:
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": "paid", "updatedAt": datetime.utcnow()}}
        )
        # Activate/renew slots
        await activate_slots(db, order)
        return {"message": "Payment verified", "status": "paid"}

    return {"message": "Payment not confirmed yet", "status": order["status"]}


@router.post("/webhook/cashfree")
async def cashfree_webhook(request: Request):
    body = await request.json()
    db = get_db()
    order_id = body.get("data", {}).get("order", {}).get("order_id", "")
    payment_status = body.get("data", {}).get("payment", {}).get("payment_status", "")

    if payment_status == "SUCCESS":
        order = await db.orders.find_one({"orderId": order_id})
        if order and order["status"] != "paid":
            await db.orders.update_one(
                {"_id": order["_id"]},
                {"$set": {"status": "paid", "updatedAt": datetime.utcnow()}}
            )
            await activate_slots(db, order)

    return {"status": "ok"}


@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    body = await request.json()
    db = get_db()
    event = body.get("event", "")

    if event == "payment.captured":
        payment = body.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment.get("notes", {}).get("order_id", "")
        if order_id:
            order = await db.orders.find_one({"orderId": order_id})
            if order and order["status"] != "paid":
                await db.orders.update_one(
                    {"_id": order["_id"]},
                    {"$set": {"status": "paid", "paymentId": payment.get("id"), "updatedAt": datetime.utcnow()}}
                )
                await activate_slots(db, order)

    return {"status": "ok"}


async def activate_slots(db, order):
    """Activate or renew slots after successful payment."""
    for slot_item in order.get("slots", []):
        expiry = calculate_expiry(slot_item["duration"], slot_item["durationType"])

        if slot_item.get("slotId"):
            # Renew existing slot
            existing = await db.slots.find_one({"_id": ObjectId(slot_item["slotId"])})
            if existing:
                # If still active, extend from current expiry
                current_expiry = existing.get("expiryDate")
                if current_expiry and current_expiry > datetime.utcnow():
                    base = current_expiry
                else:
                    base = datetime.utcnow()

                if slot_item["durationType"] == "day":
                    new_expiry = base + timedelta(days=slot_item["duration"])
                elif slot_item["durationType"] == "week":
                    new_expiry = base + timedelta(weeks=slot_item["duration"])
                else:
                    new_expiry = base + timedelta(days=30 * slot_item["duration"])

                await db.slots.update_one(
                    {"_id": ObjectId(slot_item["slotId"])},
                    {"$set": {"status": "active", "expiryDate": new_expiry, "updatedAt": datetime.utcnow()}}
                )
        else:
            # Create new slot placeholder
            await db.slots.insert_one({
                "userId": order["userId"],
                "name": f"New Slot",
                "platform": "youtube",
                "streamKey": "",
                "rtmpUrl": "rtmp://a.rtmp.youtube.com/live2",
                "videoId": None,
                "status": "active",
                "isStreaming": False,
                "streamProcessId": None,
                "expiryDate": expiry,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            })


async def create_cashfree_order(order_id: str, amount: float, currency: str, user: dict) -> dict:
    from app.config import CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV
    if not CASHFREE_APP_ID:
        return {"mock": True, "orderId": order_id, "message": "Cashfree not configured - using mock payment"}

    import httpx
    base_url = "https://sandbox.cashfree.com" if CASHFREE_ENV == "sandbox" else "https://api.cashfree.com"
    headers = {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
    }
    payload = {
        "order_id": order_id,
        "order_amount": amount,
        "order_currency": currency,
        "customer_details": {
            "customer_id": user["id"],
            "customer_email": user["email"],
            "customer_phone": user.get("phone", "9999999999"),
        },
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{base_url}/pg/orders", json=payload, headers=headers)
            data = resp.json()
            return {"paymentSessionId": data.get("payment_session_id"), "orderId": order_id, "gateway": "cashfree"}
    except Exception as e:
        return {"error": str(e), "orderId": order_id}


async def create_razorpay_order(order_id: str, amount: float, currency: str) -> dict:
    from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
    if not RAZORPAY_KEY_ID:
        return {"mock": True, "orderId": order_id, "message": "Razorpay not configured - using mock payment"}

    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.razorpay.com/v1/orders",
                json={"amount": int(amount * 100), "currency": currency, "receipt": order_id,
                      "notes": {"order_id": order_id}},
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
            data = resp.json()
            return {"orderId": data.get("id"), "amount": data.get("amount"), "currency": currency, "gateway": "razorpay",
                    "key": RAZORPAY_KEY_ID}
    except Exception as e:
        return {"error": str(e), "orderId": order_id}


async def verify_cashfree_payment(order_id: str) -> bool:
    from app.config import CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV
    if not CASHFREE_APP_ID:
        return True  # Mock mode
    import httpx
    base_url = "https://sandbox.cashfree.com" if CASHFREE_ENV == "sandbox" else "https://api.cashfree.com"
    headers = {"x-client-id": CASHFREE_APP_ID, "x-client-secret": CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/pg/orders/{order_id}", headers=headers)
            data = resp.json()
            return data.get("order_status") == "PAID"
    except Exception:
        return False


async def verify_razorpay_payment(rp_order_id: str) -> bool:
    from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
    if not RAZORPAY_KEY_ID:
        return True  # Mock mode
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.razorpay.com/v1/orders/{rp_order_id}/payments",
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
            data = resp.json()
            for item in data.get("items", []):
                if item.get("status") == "captured":
                    return True
    except Exception:
        pass
    return False
