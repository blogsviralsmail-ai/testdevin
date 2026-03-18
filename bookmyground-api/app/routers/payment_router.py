from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user
from app.seed import generate_booking_id
from datetime import datetime, timezone, timedelta
import hmac
import hashlib
import json

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/payments", tags=["payments"])


def get_razorpay_client():
    """Get Razorpay client using keys from payment_gateways table"""
    with get_db() as db:
        gw = db.execute(
            "SELECT * FROM payment_gateways WHERE LOWER(name) = 'razorpay' AND is_active = 1"
        ).fetchone()
        if not gw:
            raise HTTPException(status_code=400, detail="Razorpay gateway is not active. Please configure it in Admin > Gateways.")
        api_key = gw["api_key"]
        secret_key = gw["secret_key"]
        if not api_key or not secret_key or api_key.strip() == "" or secret_key.strip() == "":
            raise HTTPException(status_code=400, detail="Razorpay API keys not configured. Go to Admin > Gateways and add your Razorpay Key ID and Secret.")
        is_test = bool(gw["is_test_mode"])
        return api_key, secret_key, is_test


class CreateOrderRequest(BaseModel):
    ground_id: int
    slot_id: int
    payment_type: str = "token"  # "token" or "full"
    promo_code: str | None = None
    use_wallet: bool = False
    user_latitude: float | None = None
    user_longitude: float | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_razorpay_order(req: CreateOrderRequest, user: dict = Depends(get_current_user)):
    """Step 1: Create Razorpay order and reserve the slot"""
    api_key, secret_key, is_test = get_razorpay_client()

    with get_db() as db:
        # Validate slot
        slot = db.execute("SELECT * FROM slots WHERE id = ? AND status = 'available'", (req.slot_id,)).fetchone()
        if not slot:
            raise HTTPException(status_code=400, detail="Slot not available")

        now = datetime.now(IST)
        slot_date = slot["date"]
        slot_hour = int(slot["start_time"].split(":")[0])
        today_ist = now.strftime("%Y-%m-%d")
        if slot_date == today_ist and slot_hour <= now.hour:
            raise HTTPException(status_code=400, detail="This slot time has already passed")
        if slot_date < today_ist:
            raise HTTPException(status_code=400, detail="Cannot book slots for past dates")

        # Get ground
        ground_row = db.execute("SELECT * FROM grounds WHERE id = ?", (req.ground_id,)).fetchone()
        if not ground_row:
            raise HTTPException(status_code=404, detail="Ground not found")
        ground = dict(ground_row)

        # Calculate pricing
        token_pct = float(db.execute("SELECT value FROM settings WHERE key='token_percentage'").fetchone()["value"])
        total = slot["price"]
        discount = 0.0

        # Apply promo
        if req.promo_code:
            promo = db.execute(
                "SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND used_count < usage_limit",
                (req.promo_code,),
            ).fetchone()
            if promo:
                now_str = datetime.now(IST).strftime("%Y-%m-%d")
                if promo["valid_from"] <= now_str <= promo["valid_to"]:
                    if total >= promo["min_booking"]:
                        user_promo_usage = db.execute(
                            "SELECT COUNT(*) as cnt FROM promo_usage WHERE user_id = ? AND promo_id = ?",
                            (user["user_id"], promo["id"])
                        ).fetchone()
                        if not user_promo_usage or user_promo_usage["cnt"] < 1:
                            if promo["discount_type"] == "percentage":
                                discount = min(total * promo["discount_value"] / 100, promo["max_discount"] or 99999)
                            else:
                                discount = min(promo["discount_value"], promo["max_discount"] or 99999)

        final_amount = max(total - discount, 0)

        # Wallet deduction
        wallet_deduction = 0
        if req.use_wallet:
            user_row = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()
            wallet_balance = user_row["wallet_balance"] if user_row else 0
            if req.payment_type == "token":
                pay_target = round(final_amount * token_pct / 100, 2)
            else:
                pay_target = final_amount
            wallet_deduction = min(wallet_balance, pay_target)

        # Calculate pay now amount
        if req.payment_type == "token":
            raw_token = round(final_amount * token_pct / 100, 2)
            pay_now = max(raw_token - wallet_deduction, 0)
            remaining = final_amount - raw_token
        else:
            pay_now = max(final_amount - wallet_deduction, 0)
            remaining = 0

        # Pay now amount in paise (Razorpay uses smallest currency unit)
        amount_paise = int(round(pay_now * 100))

        if amount_paise < 100:
            # Less than Re.1 - Razorpay minimum is Re.1
            # If wallet covers everything, skip Razorpay
            if pay_now <= 0:
                raise HTTPException(status_code=400, detail="Wallet covers full amount. Use wallet payment instead of Razorpay.")
            raise HTTPException(status_code=400, detail="Minimum payment amount is Rs.1 for Razorpay.")

        # Create Razorpay order
        try:
            import razorpay
            client = razorpay.Client(auth=(api_key, secret_key))
            booking_id = generate_booking_id()
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": booking_id,
                "notes": {
                    "ground_id": str(req.ground_id),
                    "slot_id": str(req.slot_id),
                    "user_id": str(user["user_id"]),
                    "ground_name": ground["name"],
                    "booking_id": booking_id,
                }
            }
            order = client.order.create(data=order_data)
        except ImportError:
            raise HTTPException(status_code=500, detail="Razorpay SDK not installed on server. Contact admin.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")

        # Save pending booking
        if req.payment_type == "token":
            token_amount = raw_token
        else:
            token_amount = final_amount

        cashback_enabled = db.execute("SELECT value FROM settings WHERE key='cashback_enabled'").fetchone()["value"] == "1"
        cashback_amount_setting = float(db.execute("SELECT value FROM settings WHERE key='cashback_amount'").fetchone()["value"])
        cashback_min = float(db.execute("SELECT value FROM settings WHERE key='cashback_min_booking'").fetchone()["value"])
        cashback = 0.0
        if cashback_enabled and total >= cashback_min:
            existing = db.execute(
                "SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND status != 'cancelled'",
                (user["user_id"],),
            ).fetchone()
            if existing["cnt"] == 0:
                cashback = cashback_amount_setting

        db.execute(
            """INSERT INTO bookings (booking_id, user_id, ground_id, slot_id, booking_date, start_time, end_time,
            total_amount, token_amount, remaining_amount, discount_amount, cashback_amount,
            payment_mode, payment_gateway, payment_status, promo_code, status, razorpay_order_id,
            user_latitude, user_longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (booking_id, user["user_id"], req.ground_id, req.slot_id, slot["date"],
             slot["start_time"], slot["end_time"], total,
             pay_now + wallet_deduction,  # token_amount = what user pays now (razorpay + wallet)
             final_amount - (pay_now + wallet_deduction),  # remaining
             discount, cashback,
             "online", "razorpay", "pending", req.promo_code, "payment_pending",
             order["id"], req.user_latitude, req.user_longitude),
        )

        # Mark slot as temporarily held
        db.execute("UPDATE slots SET status = 'booked' WHERE id = ?", (req.slot_id,))

        # Apply promo usage
        if req.promo_code and discount > 0:
            promo = db.execute("SELECT id FROM promo_codes WHERE code = ?", (req.promo_code,)).fetchone()
            if promo:
                db.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", (promo["id"],))
                db.execute(
                    "INSERT INTO promo_usage (user_id, promo_id, promo_code) VALUES (?, ?, ?)",
                    (user["user_id"], promo["id"], req.promo_code)
                )

        # Deduct wallet if used
        if wallet_deduction > 0:
            db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (wallet_deduction, user["user_id"]))

        # Get user info for prefill
        user_row = db.execute("SELECT name, phone, email FROM users WHERE id = ?", (user["user_id"],)).fetchone()

        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": api_key,
            "booking_id": booking_id,
            "is_test": is_test,
            "prefill": {
                "name": user_row["name"] if user_row else "",
                "contact": user_row["phone"] if user_row else "",
                "email": user_row["email"] if user_row else "",
            },
            "notes": {
                "ground_name": ground["name"],
                "booking_id": booking_id,
            },
            "theme": {
                "color": "#16a34a",
            }
        }


@router.post("/verify")
async def verify_razorpay_payment(req: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    """Step 2: Verify Razorpay payment signature and confirm booking"""
    _, secret_key, _ = get_razorpay_client()

    # Verify signature
    message = req.razorpay_order_id + "|" + req.razorpay_payment_id
    generated_signature = hmac.new(
        secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed. Invalid signature.")

    with get_db() as db:
        # Find booking by razorpay_order_id
        booking = db.execute(
            "SELECT * FROM bookings WHERE razorpay_order_id = ? AND user_id = ?",
            (req.razorpay_order_id, user["user_id"])
        ).fetchone()

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found for this order")

        if booking["status"] != "payment_pending":
            # Already verified
            return {
                "status": booking["status"],
                "booking_id": booking["booking_id"],
                "message": "Payment already verified"
            }

        # Check approval settings
        ground = db.execute("SELECT * FROM grounds WHERE id = ?", (booking["ground_id"],)).fetchone()
        approval_setting = db.execute("SELECT value FROM settings WHERE key='booking_approval_required'").fetchone()
        global_approval = approval_setting and approval_setting["value"] == "1"
        ground_approval = False
        if ground:
            try:
                ground_approval = bool(ground["approval_required"])
            except (KeyError, IndexError):
                pass

        if global_approval or ground_approval:
            new_status = "awaiting_approval"
        else:
            new_status = "confirmed"

        # Update booking status
        db.execute(
            """UPDATE bookings SET status = ?, payment_status = 'success',
            razorpay_payment_id = ? WHERE razorpay_order_id = ?""",
            (new_status, req.razorpay_payment_id, req.razorpay_order_id)
        )

        # Update ground booking count
        db.execute("UPDATE grounds SET total_bookings = total_bookings + 1 WHERE id = ?", (booking["ground_id"],))

        # Record payment
        bid = booking["id"]
        db.execute(
            "INSERT INTO payments (booking_id, amount, gateway, transaction_id, payment_type, status) VALUES (?, ?, ?, ?, ?, ?)",
            (bid, booking["token_amount"], "razorpay", req.razorpay_payment_id, "online", "success"),
        )

        # Apply cashback if confirmed
        if new_status == "confirmed" and booking["cashback_amount"] > 0:
            db.execute(
                "UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?",
                (booking["cashback_amount"], user["user_id"])
            )

        # Get result details
        ground_dict = dict(ground) if ground else {}
        owner_row = db.execute("SELECT name, phone, email FROM users WHERE id = ?", (ground_dict.get("owner_id", 0),)).fetchone()
        cc_row = db.execute("SELECT value FROM settings WHERE key='customer_care_number'").fetchone()
        customer_care = cc_row["value"] if cc_row else "9782005500"

        if new_status == "confirmed" and owner_row:
            show_phone = owner_row["phone"]
            show_name = owner_row["name"]
            show_email = owner_row["email"]
        else:
            show_phone = customer_care
            show_name = "Customer Care"
            show_email = None

        status_msg = new_status
        if new_status == "awaiting_approval":
            status_msg = "Awaiting owner approval"

        return {
            "status": new_status,
            "booking_id": booking["booking_id"],
            "ground_name": ground_dict.get("name", ""),
            "ground_address": ground_dict.get("address", ""),
            "ground_city": ground_dict.get("city", ""),
            "date": booking["booking_date"],
            "time": f"{booking['start_time']} - {booking['end_time']}",
            "total_amount": booking["total_amount"],
            "discount": booking["discount_amount"],
            "cashback": booking["cashback_amount"] if new_status == "confirmed" else 0,
            "token_paid": booking["token_amount"],
            "remaining": booking["remaining_amount"],
            "payment_gateway": "razorpay",
            "razorpay_payment_id": req.razorpay_payment_id,
            "status_message": status_msg,
            "owner_name": show_name,
            "owner_phone": show_phone,
            "owner_email": show_email,
            "customer_care_number": customer_care,
            "sport_type": ground_dict.get("sport_type", "cricket"),
            "message": "Payment verified successfully! Booking confirmed."
        }


@router.post("/failed")
async def payment_failed(data: dict, user: dict = Depends(get_current_user)):
    """Handle failed/cancelled payment - release slot"""
    order_id = data.get("razorpay_order_id", "")
    if not order_id:
        return {"message": "No order ID provided"}

    with get_db() as db:
        booking = db.execute(
            "SELECT * FROM bookings WHERE razorpay_order_id = ? AND user_id = ? AND status = 'payment_pending'",
            (order_id, user["user_id"])
        ).fetchone()

        if not booking:
            return {"message": "No pending booking found"}

        # Release slot
        db.execute("UPDATE slots SET status = 'available' WHERE id = ?", (booking["slot_id"],))

        # Cancel booking
        db.execute(
            "UPDATE bookings SET status = 'cancelled', cancelled_by = 'system', cancel_reason = 'Payment failed or cancelled' WHERE id = ?",
            (booking["id"],)
        )

        # Refund wallet if deducted
        # (wallet deduction was already applied, need to refund)
        # We can't easily know wallet deduction from booking record alone,
        # but if promo was used, reverse it
        if booking["promo_code"]:
            promo = db.execute("SELECT id FROM promo_codes WHERE code = ?", (booking["promo_code"],)).fetchone()
            if promo:
                db.execute("UPDATE promo_codes SET used_count = MAX(used_count - 1, 0) WHERE id = ?", (promo["id"],))
                db.execute("DELETE FROM promo_usage WHERE user_id = ? AND promo_id = ?",
                           (user["user_id"], promo["id"]))

        return {"message": "Booking cancelled due to payment failure. Slot released."}


@router.get("/gateway-info")
async def get_gateway_info():
    """Get Razorpay key_id for frontend (public endpoint - no secret exposed)"""
    with get_db() as db:
        gw = db.execute(
            "SELECT api_key, is_active, is_test_mode FROM payment_gateways WHERE LOWER(name) = 'razorpay'"
        ).fetchone()
        if not gw or not gw["is_active"]:
            return {"configured": False, "message": "Razorpay not configured"}
        if not gw["api_key"] or gw["api_key"].strip() == "":
            return {"configured": False, "message": "Razorpay API key not set"}
        return {
            "configured": True,
            "key_id": gw["api_key"],
            "is_test": bool(gw["is_test_mode"]),
        }
