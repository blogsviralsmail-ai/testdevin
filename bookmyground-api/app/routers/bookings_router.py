from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.database import get_db
try:
    from app.services.email_service import send_booking_confirmation, send_booking_cancellation, send_payment_pending
except ImportError:
    send_booking_confirmation = send_booking_cancellation = send_payment_pending = lambda *a, **kw: None
from app.auth import get_current_user
from app.seed import generate_booking_id
from datetime import datetime, date as date_type, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


class CreateBookingRequest(BaseModel):
    ground_id: int
    slot_id: int
    payment_type: str = "token"
    payment_gateway: str = "razorpay"
    promo_code: str | None = None
    user_latitude: float | None = None
    user_longitude: float | None = None


class CancelBookingRequest(BaseModel):
    reason: str = "Change of plans"


@router.post("")
async def create_booking(req: CreateBookingRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
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

        ground_row = db.execute("SELECT * FROM grounds WHERE id = ?", (req.ground_id,)).fetchone()
        if not ground_row:
            raise HTTPException(status_code=404, detail="Ground not found")
        ground = dict(ground_row)

        # Validate payment gateway - skip validation for wallet payments
        if req.payment_gateway not in ("cash", "wallet"):
            gw = db.execute("SELECT * FROM payment_gateways WHERE LOWER(name) = LOWER(?)", (req.payment_gateway,)).fetchone()
            if not gw:
                raise HTTPException(status_code=400, detail=f"Payment gateway '{req.payment_gateway}' not found")
            if not gw["is_active"]:
                raise HTTPException(status_code=400, detail=f"{gw['display_name']} is not active. Contact admin.")
            # Only check API key for non-COD gateways
            if gw["name"].lower() != "cod" and (not gw["api_key"] or gw["api_key"] == ""):
                raise HTTPException(status_code=400, detail=f"{gw['display_name']} API key not configured. Payment cannot be processed. Contact admin.")

        if req.payment_gateway == "cash":
            cash_enabled = db.execute("SELECT value FROM settings WHERE key='cash_payment_enabled'").fetchone()
            if cash_enabled and cash_enabled["value"] == "0":
                raise HTTPException(status_code=400, detail="Cash payment is currently disabled")

        token_pct = float(db.execute("SELECT value FROM settings WHERE key='token_percentage'").fetchone()["value"])
        cashback_enabled = db.execute("SELECT value FROM settings WHERE key='cashback_enabled'").fetchone()["value"] == "1"
        cashback_amount = float(db.execute("SELECT value FROM settings WHERE key='cashback_amount'").fetchone()["value"])
        cashback_min = float(db.execute("SELECT value FROM settings WHERE key='cashback_min_booking'").fetchone()["value"])

        total = slot["price"]
        discount = 0.0
        cashback = 0.0

        if req.promo_code:
            promo = db.execute(
                "SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND used_count < usage_limit",
                (req.promo_code,),
            ).fetchone()
            if promo:
                now_str = datetime.now(IST).strftime("%Y-%m-%d")
                if promo["valid_from"] <= now_str <= promo["valid_to"]:
                    if total >= promo["min_booking"]:
                        # BUG-018 FIX: Check per-user promo usage limit
                        user_promo_usage = db.execute(
                            "SELECT COUNT(*) as cnt FROM promo_usage WHERE user_id = ? AND promo_id = ?",
                            (user["user_id"], promo["id"])
                        ).fetchone()
                        if user_promo_usage and user_promo_usage["cnt"] >= 1:
                            pass  # User already used this promo, skip discount
                        else:
                            if promo["discount_type"] == "percentage":
                                discount = min(total * promo["discount_value"] / 100, promo["max_discount"] or 99999)
                            else:
                                discount = min(promo["discount_value"], promo["max_discount"] or 99999)
                            db.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", (promo["id"],))
                            # Track per-user promo usage
                            db.execute(
                                "INSERT INTO promo_usage (user_id, promo_id, promo_code) VALUES (?, ?, ?)",
                                (user["user_id"], promo["id"], req.promo_code)
                            )

        if cashback_enabled and total >= cashback_min:
            existing = db.execute(
                "SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ? AND status != 'cancelled'",
                (user["user_id"],),
            ).fetchone()
            if existing["cnt"] == 0:
                cashback = cashback_amount

        final_amount = max(total - discount, 0)
        if req.payment_type == "token":
            token_amount = round(final_amount * token_pct / 100, 2)
            remaining = final_amount - token_amount
        else:
            token_amount = final_amount
            remaining = 0

        if req.payment_gateway == "cash":
            booking_status = "pending_cash"
            payment_status = "pending"
        else:
            approval_setting = db.execute("SELECT value FROM settings WHERE key='booking_approval_required'").fetchone()
            global_approval = approval_setting and approval_setting["value"] == "1"
            ground_approval = False
            try:
                ground_approval = bool(ground["approval_required"])
            except (KeyError, IndexError):
                pass
            if global_approval or ground_approval:
                booking_status = "awaiting_approval"
                payment_status = "success"
            else:
                booking_status = "confirmed"
                payment_status = "success"

        booking_id = generate_booking_id()
        db.execute(
            """INSERT INTO bookings (booking_id, user_id, ground_id, slot_id, booking_date, start_time, end_time,
            total_amount, token_amount, remaining_amount, discount_amount, cashback_amount,
            payment_mode, payment_gateway, payment_status, promo_code, status, user_latitude, user_longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (booking_id, user["user_id"], req.ground_id, req.slot_id, slot["date"],
             slot["start_time"], slot["end_time"], total, token_amount, remaining,
             discount, cashback,
             "cash" if req.payment_gateway == "cash" else "online",
             req.payment_gateway, payment_status, req.promo_code, booking_status,
             req.user_latitude, req.user_longitude),
        )

        db.execute("UPDATE slots SET status = 'booked' WHERE id = ?", (req.slot_id,))
        db.execute("UPDATE grounds SET total_bookings = total_bookings + 1 WHERE id = ?", (req.ground_id,))

        # Deduct wallet balance for wallet payments
        if req.payment_gateway == "wallet" and token_amount > 0:
            db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (token_amount, user["user_id"]))

        if cashback > 0 and booking_status == "confirmed":
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (cashback, user["user_id"]))

        bid = db.execute("SELECT id FROM bookings WHERE booking_id = ?", (booking_id,)).fetchone()["id"]
        db.execute(
            "INSERT INTO payments (booking_id, amount, gateway, transaction_id, payment_type, status) VALUES (?, ?, ?, ?, ?, ?)",
            (bid, token_amount, req.payment_gateway, f"TXN{booking_id}", req.payment_type, payment_status),
        )

        status_msg = booking_status
        if booking_status == "pending_cash":
            status_msg = "Pending admin verification (Cash payment)"
        elif booking_status == "awaiting_approval":
            status_msg = "Awaiting owner approval"

        # Get owner details for confirmed bookings
        owner_row = db.execute("SELECT name, phone, email FROM users WHERE id = ?", (ground["owner_id"],)).fetchone()
        owner = dict(owner_row) if owner_row else None

        # Get customer care number from settings
        cc_row = db.execute("SELECT value FROM settings WHERE key='customer_care_number'").fetchone()
        customer_care = cc_row["value"] if cc_row else "9782005500"

        # Show owner phone only for confirmed/completed bookings, otherwise show customer care
        if booking_status in ("confirmed", "completed"):
            show_phone = owner["phone"] if owner else customer_care
            show_name = owner["name"] if owner else None
            show_email = owner["email"] if owner else None
        else:
            show_phone = customer_care
            show_name = "Customer Care"
            show_email = None

        return {
            "booking_id": booking_id,
            "ground_name": ground["name"],
            "ground_address": ground["address"],
            "ground_city": ground["city"],
            "ground_latitude": ground.get("latitude"),
            "ground_longitude": ground.get("longitude"),
            "date": slot["date"],
            "time": f"{slot['start_time']} - {slot['end_time']}",
            "total_amount": total,
            "discount": discount,
            "cashback": cashback if booking_status == "confirmed" else 0,
            "token_paid": token_amount,
            "remaining": remaining,
            "payment_gateway": req.payment_gateway,
            "status": booking_status,
            "status_message": status_msg,
            "owner_name": show_name,
            "owner_phone": show_phone,
            "owner_email": show_email,
            "customer_care_number": customer_care,
            "sport_type": ground.get("sport_type", "cricket"),
            "user_latitude": req.user_latitude,
            "user_longitude": req.user_longitude,
        }


@router.get("")
async def my_bookings(status: str = Query(None), user: dict = Depends(get_current_user)):
    with get_db() as db:
        now = datetime.now(IST)
        today = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")
        db.execute(
            """UPDATE bookings SET status = 'completed'
            WHERE user_id = ? AND status = 'confirmed'
            AND (booking_date < ? OR (booking_date = ? AND end_time <= ?))""",
            (user["user_id"], today, today, current_time),
        )

        query = """SELECT b.*, g.name as ground_name, g.address as ground_address, g.city as ground_city,
                   g.latitude as ground_latitude, g.longitude as ground_longitude, g.sport_type,
                   g.amenities as ground_amenities, g.photos as ground_photos,
                   u.name as owner_name, u.phone as owner_phone
                   FROM bookings b JOIN grounds g ON b.ground_id = g.id
                   JOIN users u ON g.owner_id = u.id
                   WHERE b.user_id = ?"""
        params: list = [user["user_id"]]
        if status:
            if status == "not_attending":
                query += " AND b.status = 'no_show'"
            else:
                query += " AND b.status = ?"
                params.append(status)
        query += " ORDER BY b.created_at DESC"
        rows = db.execute(query, params).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            # Show customer care number for non-confirmed bookings instead of hiding owner phone
            cc_row = db.execute("SELECT value FROM settings WHERE key='customer_care_number'").fetchone()
            customer_care = cc_row["value"] if cc_row else "9782005500"
            if d["status"] not in ("confirmed", "completed"):
                d["owner_phone"] = customer_care
                d["owner_name"] = "Customer Care"
            d["customer_care_number"] = customer_care
            results.append(d)
        return results


@router.get("/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    with get_db() as db:
        booking = db.execute(
            """SELECT b.*, g.name as ground_name, g.address as ground_address, g.city as ground_city,
            g.latitude, g.longitude FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ?""",
            (booking_id,),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        # BUG-031 FIX: Check that booking belongs to current user (or admin/owner)
        if booking["user_id"] != user["user_id"] and user.get("role") not in ("admin", "owner"):
            raise HTTPException(status_code=403, detail="Access denied")
        return dict(booking)


@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, req: CancelBookingRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?", (booking_id, user["user_id"])).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] not in ("confirmed", "awaiting_approval", "pending_cash"):
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")

        booking_dt = datetime.strptime(f"{booking['booking_date']} {booking['start_time']}", "%Y-%m-%d %H:%M")
        booking_dt = booking_dt.replace(tzinfo=IST)
        hours_until = (booking_dt - datetime.now(IST)).total_seconds() / 3600

        # Get cancellation charge percentage based on time remaining
        if hours_until > 24:
            charge_pct = float(db.execute("SELECT value FROM settings WHERE key='user_cancel_24h_charge'").fetchone()["value"])
        else:
            charge_pct = float(db.execute("SELECT value FROM settings WHERE key='user_cancel_lt24h_charge'").fetchone()["value"])

        # Cancel charge is percentage of token amount, not 100%
        cancel_charge = round(booking["token_amount"] * charge_pct / 100, 2)
        refund = round(booking["token_amount"] - cancel_charge, 2)

        db.execute(
            "UPDATE bookings SET status='cancelled', cancelled_by='user', cancel_reason=?, cancel_charge=?, refund_amount=? WHERE booking_id=?",
            (req.reason, cancel_charge, refund, booking_id),
        )
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))

        if refund > 0:
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund, user["user_id"]))

        return {
            "message": "Booking cancelled",
            "cancel_charge": cancel_charge,
            "refund_amount": refund,
            "refund_to": "wallet",
        }
