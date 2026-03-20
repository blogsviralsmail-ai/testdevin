from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user, require_role
from app.seed import generate_booking_id

router = APIRouter(prefix="/api/owner", tags=["owner"])


class UpdateGroundRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    weekday_price: float | None = None
    weekend_price: float | None = None
    evening_extra: float | None = None
    amenities: str | None = None
    opening_time: str | None = None
    closing_time: str | None = None
    token_money_percent: float | None = None


class OfflineBookingRequest(BaseModel):
    ground_id: int
    slot_id: int
    customer_name: str
    customer_phone: str
    payment_mode: str = "cash"
    is_self: bool = False


class AddGroundRequest(BaseModel):
    name: str
    address: str
    city: str
    ground_type: str = "box"
    weekday_price: float
    weekend_price: float
    evening_extra: float = 0
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    amenities: str = ""
    description: str = ""
    latitude: float | None = None
    longitude: float | None = None
    token_money_percent: float = 100


class RateUserRequest(BaseModel):
    rating: float


class AddSlotRequest(BaseModel):
    ground_id: int
    date: str
    start_time: str
    end_time: str
    price: float


class PayoutRequest(BaseModel):
    amount: float


class OwnerKYCRequest(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    document_type: str
    kyc_doc_data: str | None = None
    kyc_doc_filename: str | None = None
    upi_id: str | None = None


@router.get("/dashboard")
async def owner_dashboard(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        grounds = db.execute("SELECT * FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()
        ground_ids = [g["id"] for g in grounds]
        if not ground_ids:
            return {"grounds": [], "stats": {"total_revenue": 0, "total_bookings": 0, "monthly_revenue": 0, "avg_rating": 0, "today_bookings": 0, "available_slots": 0}, "recent_bookings": [], "cash_tracking": {"online_collected": 0, "cash_collected": 0, "commission_due": 0, "net_payable": 0}, "wallet_balance": 0}

        placeholders = ",".join("?" * len(ground_ids))

        total_revenue = db.execute(
            f"SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as total FROM bookings WHERE ground_id IN ({placeholders}) AND status != 'cancelled'",
            ground_ids,
        ).fetchone()["total"]

        total_bookings = db.execute(
            f"SELECT COUNT(*) as cnt FROM bookings WHERE ground_id IN ({placeholders}) AND status != 'cancelled'",
            ground_ids,
        ).fetchone()["cnt"]

        monthly_revenue = db.execute(
            f"SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as total FROM bookings WHERE ground_id IN ({placeholders}) AND status != 'cancelled' AND created_at >= date('now', '-30 days')",
            ground_ids,
        ).fetchone()["total"]

        recent = db.execute(
            f"""SELECT b.*, g.name as ground_name, u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id
            WHERE b.ground_id IN ({placeholders}) ORDER BY b.created_at DESC LIMIT 20""",
            ground_ids,
        ).fetchall()

        # Online = bookings paid via online gateway (not cash/offline)
        # For no_show: only token_amount counts (remaining was never paid)
        online_total = db.execute(
            f"SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as total FROM bookings WHERE ground_id IN ({placeholders}) AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline')",
            ground_ids,
        ).fetchone()["total"]

        # Cash = bookings paid via cash/offline mode (no_show cash bookings = 0 collected)
        cash_total = db.execute(
            f"SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE ground_id IN ({placeholders}) AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline')",
            ground_ids,
        ).fetchone()["total"]

        settings = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        commission_rate = float(settings["value"]) if settings else 10

        # Commission applies on ALL bookings (online + cash)
        total_commission = 0.0
        online_commission = 0.0
        cash_commission = 0.0
        for g in grounds:
            rate = g["commission_rate"] if g["commission_rate"] is not None else commission_rate
            g_online_rev = db.execute(
                "SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as total FROM bookings WHERE ground_id = ? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'",
                (g["id"],),
            ).fetchone()["total"]
            g_cash_rev = db.execute(
                "SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE ground_id = ? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'",
                (g["id"],),
            ).fetchone()["total"]
            online_commission += g_online_rev * rate / 100
            cash_commission += g_cash_rev * rate / 100
            total_commission += (g_online_rev + g_cash_rev) * rate / 100

        owner_user = db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["user_id"],)).fetchone()

        # Subtract already withdrawn + already settled from net_payable
        already_withdrawn_dash = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (user["user_id"],)).fetchone()["total"]
        already_settled_dash = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlement_records WHERE owner_id=?", (user["user_id"],)).fetchone()["total"]
        total_paid_out_dash = already_withdrawn_dash + already_settled_dash

        # Fetch settlement records to include in dashboard response for transaction ledger
        settlement_rows = db.execute(
            "SELECT id, amount, settlement_type, utr_number, notes, status, balance_before, balance_after, created_at FROM settlement_records WHERE owner_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()

        return {
            "grounds": [dict(g) for g in grounds],
            "stats": {
                "total_revenue": total_revenue,
                "total_bookings": total_bookings,
                "monthly_revenue": monthly_revenue,
                "avg_rating": sum(g["rating"] for g in grounds) / len(grounds) if grounds else 0,
                "today_bookings": len([b for b in recent if b["booking_date"] == __import__("datetime").date.today().isoformat()]),
                "available_slots": 0,
            },
            "recent_bookings": [dict(r) for r in recent],
            "settlements": [dict(s) for s in settlement_rows],
            "cash_tracking": {
                "online_collected": online_total,
                "cash_collected": cash_total,
                "commission_due": round(total_commission, 2),
                "net_payable": round(online_total - total_commission - total_paid_out_dash, 2),
                "online_commission": round(online_commission, 2),
                "cash_commission": round(cash_commission, 2),
                "commission_owed": round(cash_commission, 2),
                "settlement_balance": round(online_total - total_commission - total_paid_out_dash, 2),
                "already_withdrawn": round(total_paid_out_dash, 2),
            },
            "wallet_balance": owner_user["wallet_balance"] if owner_user else 0,
        }


@router.get("/grounds")
async def owner_grounds(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            # Get gallery images for this ground
            try:
                gallery = db.execute("SELECT id, image_url, caption FROM ground_gallery WHERE ground_id = ?", (d["id"],)).fetchall()
                d["gallery_images"] = [dict(g) for g in gallery]
            except Exception:
                d["gallery_images"] = []
            # Set image_url from first gallery image or photos field
            if d.get("photos"):
                d["image_url"] = d["photos"]
            elif d["gallery_images"]:
                d["image_url"] = d["gallery_images"][0]["image_url"]
            else:
                d["image_url"] = ""
            result.append(d)
        return result


@router.post("/grounds")
async def add_ground(req: AddGroundRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO grounds (owner_id, name, address, city, ground_type, weekday_price, weekend_price,
            evening_extra, opening_time, closing_time, amenities, description, latitude, longitude, token_money_percent, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)""",
            (user["user_id"], req.name, req.address, req.city, req.ground_type, req.weekday_price,
             req.weekend_price, req.evening_extra, req.opening_time, req.closing_time,
             req.amenities, req.description, req.latitude, req.longitude, req.token_money_percent),
        )
        new_id = cursor.lastrowid
        return {"message": f"Ground '{req.name}' submitted for approval. Admin will review and activate it.", "id": new_id}


@router.put("/grounds/{ground_id}/toggle")
async def toggle_owner_ground(ground_id: int, user: dict = Depends(get_current_user)):
    """Owner can activate/deactivate their own ground"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT is_active FROM grounds WHERE id = ? AND owner_id = ?", (ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found or not owned by you")
        new_status = 0 if ground["is_active"] else 1
        db.execute("UPDATE grounds SET is_active = ? WHERE id = ?", (new_status, ground_id))
        return {"message": f"Ground {'activated' if new_status else 'deactivated'}", "is_active": new_status}


@router.delete("/grounds/{ground_id}")
async def delete_ground(ground_id: int, user: dict = Depends(get_current_user)):
    """Owner can delete their own ground"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT id FROM grounds WHERE id = ? AND owner_id = ?", (ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found or not owned by you")
        db.execute("DELETE FROM slots WHERE ground_id = ?", (ground_id,))
        db.execute("DELETE FROM grounds WHERE id = ?", (ground_id,))
        return {"message": "Ground deleted successfully"}


@router.put("/grounds/{ground_id}")
async def update_ground(ground_id: int, req: UpdateGroundRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT * FROM grounds WHERE id = ? AND owner_id = ?", (ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        updates = []
        params: list = []
        for field, value in req.model_dump(exclude_none=True).items():
            updates.append(f"{field} = ?")
            params.append(value)
        if updates:
            params.append(ground_id)
            db.execute(f"UPDATE grounds SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Ground updated"}


@router.get("/grounds/{ground_id}/slots")
async def owner_get_slots(ground_id: int, date: str = Query(...), user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT * FROM grounds WHERE id = ? AND owner_id = ?", (ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found or not yours")
        slots = db.execute("SELECT * FROM slots WHERE ground_id = ? AND date = ? ORDER BY start_time", (ground_id, date)).fetchall()
        if not slots:
            from datetime import datetime as dt
            d = dt.strptime(date, "%Y-%m-%d")
            is_weekend = d.weekday() >= 5
            base_price = ground["weekend_price"] if is_weekend else ground["weekday_price"]
            open_h = int(ground["opening_time"].split(":")[0])
            close_h = int(ground["closing_time"].split(":")[0])
            for hour in range(open_h, close_h):
                price = base_price + (ground["evening_extra"] if hour >= 17 else 0)
                db.execute(
                    "INSERT INTO slots (ground_id, date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, 'available')",
                    (ground_id, date, f"{hour:02d}:00", f"{hour+1:02d}:00", price),
                )
            slots = db.execute("SELECT * FROM slots WHERE ground_id = ? AND date = ? ORDER BY start_time", (ground_id, date)).fetchall()
        return [dict(s) for s in slots]


@router.post("/slots/add")
async def add_custom_slot(req: AddSlotRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT * FROM grounds WHERE id = ? AND owner_id = ?", (req.ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        db.execute(
            "INSERT INTO slots (ground_id, date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, 'available')",
            (req.ground_id, req.date, req.start_time, req.end_time, req.price),
        )
        return {"message": f"Slot {req.start_time}-{req.end_time} added for {req.date}"}


@router.get("/bookings")
async def owner_bookings(status: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground_ids = [g["id"] for g in db.execute("SELECT id FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()]
        if not ground_ids:
            return []
        placeholders = ",".join("?" * len(ground_ids))
        query = f"""SELECT b.*, g.name as ground_name, g.id as g_id, u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id
            WHERE b.ground_id IN ({placeholders})"""
        params = list(ground_ids)
        if status:
            query += " AND b.status = ?"
            params.append(status)
        query += " ORDER BY b.created_at DESC"
        rows = db.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("/bookings/offline")
async def create_offline_booking(req: OfflineBookingRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT * FROM grounds WHERE id = ? AND owner_id = ?", (req.ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found or not yours")
        slot = db.execute("SELECT * FROM slots WHERE id = ? AND status = 'available'", (req.slot_id,)).fetchone()
        if not slot:
            raise HTTPException(status_code=400, detail="Slot not available")

        # BUG-021 FIX: Find or create customer with a temporary password
        customer = db.execute("SELECT * FROM users WHERE phone=?", (req.customer_phone,)).fetchone()
        if not customer:
            from app.seed import generate_ref_code
            import bcrypt
            ref_code = generate_ref_code()
            # Set phone last 4 digits as temp password so user can login later
            temp_password = req.customer_phone[-4:] + "1234"
            pw_hash = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
            db.execute(
                "INSERT INTO users (name, phone, role, referral_code, wallet_balance, password_hash) VALUES (?, ?, 'user', ?, 0, ?)",
                (req.customer_name, req.customer_phone, ref_code, pw_hash),
            )
            customer = db.execute("SELECT * FROM users WHERE phone=?", (req.customer_phone,)).fetchone()

        # ALL offline bookings by owner are owner_self - no commission ever
        booking_type = 'owner_self'

        booking_id = generate_booking_id()
        db.execute(
            """INSERT INTO bookings (booking_id, user_id, ground_id, slot_id, booking_date, start_time, end_time,
            total_amount, token_amount, remaining_amount, payment_mode, payment_status, status, booking_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'success', 'confirmed', ?)""",
            (booking_id, customer["id"], req.ground_id, req.slot_id, slot["date"],
             slot["start_time"], slot["end_time"], slot["price"], slot["price"], req.payment_mode, booking_type),
        )
        db.execute("UPDATE slots SET status = 'booked' WHERE id = ?", (req.slot_id,))
        db.execute("UPDATE grounds SET total_bookings = total_bookings + 1 WHERE id = ?", (req.ground_id,))
        return {"message": f"Offline booking created - {booking_id}", "booking_id": booking_id}


@router.post("/bookings/{booking_id}/cancel")
async def owner_cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ? AND g.owner_id = ?""",
            (booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] != "confirmed":
            raise HTTPException(status_code=400, detail="Cannot cancel")

        penalty = float(db.execute("SELECT value FROM settings WHERE key='owner_cancel_penalty'").fetchone()["value"])
        refund = booking["token_amount"]

        db.execute(
            "UPDATE bookings SET status='cancelled', cancelled_by='owner', cancel_charge=?, refund_amount=? WHERE booking_id=?",
            (penalty, refund, booking_id),
        )
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
        db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund, booking["user_id"]))
        return {"message": f"Booking cancelled. Rs.{penalty} penalty charged. Full refund Rs.{refund} to user wallet."}


@router.post("/bookings/{booking_id}/rate-user")
async def rate_user(booking_id: str, req: RateUserRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        u = db.execute("SELECT * FROM users WHERE id = ?", (booking["user_id"],)).fetchone()
        new_count = u["rating_count"] + 1
        new_rating = round(((u["rating"] * u["rating_count"]) + req.rating) / new_count, 1)
        db.execute("UPDATE users SET rating = ?, rating_count = ? WHERE id = ?", (new_rating, new_count, booking["user_id"]))
        return {"message": f"User rated {req.rating} stars", "new_rating": new_rating}




@router.post("/bookings/{booking_id}/no-show")
async def owner_mark_no_show(booking_id: str, user: dict = Depends(get_current_user)):
    """Owner marks a booking as no-show - token amount forfeited"""
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ? AND g.owner_id = ?""",
            (booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] not in ("confirmed", "completed"):
            raise HTTPException(status_code=400, detail="Cannot mark as no-show")
        token_amount = booking["token_amount"] or 0
        db.execute(
            "UPDATE bookings SET status='no_show', attendance='no_show', cancel_charge=? WHERE booking_id=?",
            (token_amount, booking_id),
        )
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
        return {"message": f"Marked as No Show. Token amount Rs.{token_amount} forfeited.", "forfeited": token_amount}


class UpdateSlotRequest(BaseModel):
    price: float | None = None
    status: str | None = None  # "available", "blocked"


@router.put("/slots/{slot_id}")
async def update_slot(slot_id: int, req: UpdateSlotRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        slot = db.execute(
            "SELECT s.* FROM slots s JOIN grounds g ON s.ground_id = g.id WHERE s.id = ? AND g.owner_id = ?",
            (slot_id, user["user_id"]),
        ).fetchone()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot["status"] == "booked":
            raise HTTPException(status_code=400, detail="Cannot modify a booked slot")
        if req.price is not None:
            db.execute("UPDATE slots SET price = ? WHERE id = ?", (req.price, slot_id))
        if req.status is not None and req.status in ("available", "blocked"):
            db.execute("UPDATE slots SET status = ? WHERE id = ?", (req.status, slot_id))
        return {"message": "Slot updated", "slot_id": slot_id}


@router.post("/slots/{slot_id}/block")
async def block_slot(slot_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        slot = db.execute(
            "SELECT s.* FROM slots s JOIN grounds g ON s.ground_id = g.id WHERE s.id = ? AND g.owner_id = ?",
            (slot_id, user["user_id"]),
        ).fetchone()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot["status"] == "booked":
            raise HTTPException(status_code=400, detail="Cannot block a booked slot")
        new_status = "available" if slot["status"] == "blocked" else "blocked"
        db.execute("UPDATE slots SET status = ? WHERE id = ?", (new_status, slot_id))
        return {"message": f"Slot {new_status}", "status": new_status}



@router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        slot = db.execute("SELECT s.* FROM slots s JOIN grounds g ON s.ground_id=g.id WHERE s.id=? AND g.owner_id=?", (slot_id, user["user_id"])).fetchone()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")
        if slot["status"] == "booked":
            raise HTTPException(status_code=400, detail="Cannot delete booked slot")
        db.execute("DELETE FROM slots WHERE id=?", (slot_id,))
        return {"message": "Slot deleted successfully"}

@router.post("/wallet/payout")
async def request_payout(req: PayoutRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum payout is Rs.100")
    with get_db() as db:
        u = db.execute("SELECT wallet_balance, kyc_status FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        kyc = u["kyc_status"] if "kyc_status" in u.keys() else "pending"
        if kyc not in ("verified", "approved"):
            raise HTTPException(status_code=400, detail="KYC verification required for payouts. Complete KYC first.")

        # Calculate net_payable from bookings (owner's earned revenue minus commission)
        grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()
        settings_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        default_commission = float(settings_row["value"]) if settings_row else 10

        online_revenue = 0.0
        total_commission = 0.0
        for g in grounds:
            online_rev = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as total FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'", (g["id"],)).fetchone()["total"]
            rate = g["commission_rate"] if g["commission_rate"] is not None else default_commission
            online_revenue += online_rev
            total_commission += online_rev * rate / 100
        already_withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (user["user_id"],)).fetchone()["total"]
        available_balance = round(online_revenue - total_commission - already_withdrawn, 2)
        if available_balance < req.amount:
            raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: Rs.{available_balance}")

        # Get withdrawal charge from settings
        charge_row = db.execute("SELECT value FROM settings WHERE key='withdrawal_charge_percent'").fetchone()
        charge_pct = float(charge_row["value"]) if charge_row else 3.0
        charge = round(req.amount * charge_pct / 100, 2)
        net = req.amount - charge
        db.execute(
            "INSERT INTO withdraw_requests (user_id, amount, charge, net_amount, status) VALUES (?, ?, ?, ?, 'pending')",
            (user["user_id"], req.amount, charge, net),
        )
        wid = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        # Auto-payout: attempt if payout API is configured
        from app.payout_utils import attempt_auto_payout
        payout_result = attempt_auto_payout(db, wid, user["user_id"], net)
        if payout_result.get("auto"):
            return {
                "message": payout_result["message"],
                "amount": req.amount, "charge": charge, "net_amount": net,
                "status": "completed",
                "payout_id": payout_result.get("payout_id", ""),
                "utr": payout_result.get("utr", ""),
                "mode": payout_result.get("mode", ""),
            }
        else:
            return {
                "message": payout_result["message"],
                "amount": req.amount, "charge": charge, "net_amount": net,
                "status": "pending",
            }


@router.post("/kyc")
async def owner_kyc(req: OwnerKYCRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        kyc_doc_url = None
        if req.kyc_doc_data and req.kyc_doc_filename:
            import base64, os, uuid
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "kyc")
            os.makedirs(upload_dir, exist_ok=True)
            ext = os.path.splitext(req.kyc_doc_filename)[1] or ".pdf"
            filename = f"kyc_{user['user_id']}_{uuid.uuid4().hex[:8]}{ext}"
            filepath = os.path.join(upload_dir, filename)
            try:
                file_data = base64.b64decode(req.kyc_doc_data)
                with open(filepath, "wb") as f:
                    f.write(file_data)
                kyc_doc_url = f"/uploads/kyc/{filename}"
            except Exception:
                kyc_doc_url = None
        if kyc_doc_url:
            db.execute(
                "UPDATE users SET kyc_status='pending', bank_name=?, bank_account=?, bank_ifsc=?, kyc_doc_type=?, kyc_doc_url=?, upi_id=? WHERE id=?",
                (req.bank_name, req.account_number, req.ifsc_code, req.document_type, kyc_doc_url, req.upi_id or '', user["user_id"]),
            )
        else:
            db.execute(
                "UPDATE users SET kyc_status='pending', bank_name=?, bank_account=?, bank_ifsc=?, kyc_doc_type=?, upi_id=? WHERE id=?",
                (req.bank_name, req.account_number, req.ifsc_code, req.document_type, req.upi_id or '', user["user_id"]),
            )
        return {"message": "KYC submitted. Admin will verify shortly.", "status": "pending"}


class AttendanceRequest(BaseModel):
    status: str  # "attended" or "no_show"


class DayOffRequest(BaseModel):
    ground_id: int
    date: str
    reason: str = "Holiday"


@router.post("/bookings/{booking_id}/attendance")
async def mark_attendance(booking_id: str, req: AttendanceRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ? AND g.owner_id = ?""",
            (booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if req.status == "no_show":
            token_amt = booking["token_amount"] if booking["token_amount"] else 0
            db.execute("UPDATE bookings SET status='no_show', attendance='no_show', cancel_reason='No show - token forfeited', cancel_charge=? WHERE booking_id=?", (token_amt, booking_id))
            db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
            # Token was paid via Razorpay (not wallet) - no wallet deduction needed
            # Token is forfeited (non-refundable) and goes to owner minus commission
            return {"message": "No Show. Token Rs." + str(token_amt) + " forfeited (non-refundable). Slot released."}
        else:
            db.execute(
                "UPDATE bookings SET status='completed', attendance='attended' WHERE booking_id=?",
                (booking_id,),
            )
            return {"message": "Attendance confirmed. Booking completed."}


@router.post("/bookings/{booking_id}/approve")
async def owner_approve_booking(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ? AND g.owner_id = ? AND b.status = 'awaiting_approval'""",
            (booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found or not awaiting approval")
        db.execute("UPDATE bookings SET status='confirmed' WHERE booking_id=?", (booking_id,))
        return {"message": f"Booking {booking_id} approved and confirmed"}


@router.post("/bookings/{booking_id}/verify-cash")
async def owner_verify_cash(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        booking = db.execute(
            """SELECT b.* FROM bookings b JOIN grounds g ON b.ground_id = g.id
            WHERE b.booking_id = ? AND g.owner_id = ? AND b.status = 'pending_cash'""",
            (booking_id, user["user_id"]),
        ).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found or not pending cash verification")
        db.execute(
            "UPDATE bookings SET status='confirmed', cash_verified=1, cash_verified_by=?, payment_status='success' WHERE booking_id=?",
            (user["user_id"], booking_id),
        )
        if booking["cashback_amount"] and booking["cashback_amount"] > 0:
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (booking["cashback_amount"], booking["user_id"]))
        return {"message": f"Cash payment verified for booking {booking_id}"}


@router.get("/wallet")
async def owner_wallet(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        u = db.execute("SELECT wallet_balance, kyc_status FROM users WHERE id = ?", (user["user_id"],)).fetchone()
        withdrawals = db.execute(
            "SELECT id, amount, charge, net_amount, status, created_at, processed_at FROM withdraw_requests WHERE user_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()

        # Calculate net_payable from bookings for owner
        grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()
        settings_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        default_commission = float(settings_row["value"]) if settings_row else 10
        online_revenue = 0.0
        cash_revenue = 0.0
        total_commission = 0.0
        for g in grounds:
            online_rev = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as total FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'", (g["id"],)).fetchone()["total"]
            cash_rev = db.execute("SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'", (g["id"],)).fetchone()["total"]
            rate = g["commission_rate"] if g["commission_rate"] is not None else default_commission
            online_revenue += online_rev
            cash_revenue += cash_rev
            total_commission += online_rev * rate / 100
        already_withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (user["user_id"],)).fetchone()["total"]
        already_settled = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlement_records WHERE owner_id=?", (user["user_id"],)).fetchone()["total"]
        total_paid_out = already_withdrawn + already_settled
        available_balance = round(online_revenue - total_commission - total_paid_out, 2)

        # Get settlement records to show in wallet
        settlements = db.execute(
            "SELECT id, amount, settlement_type, utr_number, notes, status, balance_before, balance_after, created_at FROM settlement_records WHERE owner_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()

        return {
            "balance": available_balance, "online_revenue": online_revenue, "cash_revenue": cash_revenue,
            "total_commission": round(total_commission, 2), "already_withdrawn": total_paid_out,
            "kyc_status": u["kyc_status"] if "kyc_status" in u.keys() else "not_submitted",
            "withdrawals": [dict(w) for w in withdrawals],
            "settlements": [dict(s) for s in settlements],
        }



class PayCommissionRequest(BaseModel):
    amount: float
    payment_mode: str = "online"
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None


@router.post("/pay-commission/create-order")
async def create_commission_order(req: PayCommissionRequest, user: dict = Depends(get_current_user)):
    """Create a Razorpay order for commission payment"""
    require_role(user, ["owner", "admin"])
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    with get_db() as db:
        # Check if Razorpay gateway is configured
        gw = db.execute("SELECT * FROM payment_gateways WHERE name='razorpay' AND is_active=1").fetchone()
        if not gw or not gw["api_key"] or not gw["secret_key"]:
            raise HTTPException(status_code=400, detail="Payment gateway not configured. Ask admin to add Razorpay API keys in Admin > Payments.")
        try:
            import razorpay
            client = razorpay.Client(auth=(gw["api_key"], gw["secret_key"]))
            order = client.order.create({
                "amount": int(req.amount * 100),  # paise
                "currency": "INR",
                "receipt": f"comm_{user['user_id']}_{int(__import__('time').time())}",
                "notes": {"type": "commission_payment", "owner_id": str(user["user_id"])}
            })
            return {"order_id": order["id"], "amount": req.amount, "key_id": gw["api_key"], "currency": "INR"}
        except ImportError:
            raise HTTPException(status_code=500, detail="Razorpay library not installed on server. Contact admin.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/pay-commission")
async def pay_commission(req: PayCommissionRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    with get_db() as db:
        # Calculate how much commission is owed on cash bookings
        grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()
        settings_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        default_commission = float(settings_row["value"]) if settings_row else 10
        cash_commission = 0.0
        for g in grounds:
            rate = g["commission_rate"] if g["commission_rate"] is not None else default_commission
            cash_rev = db.execute(
                "SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline') AND COALESCE(booking_type,'online') != 'owner_self'",
                (g["id"],),
            ).fetchone()["total"]
            cash_commission += cash_rev * rate / 100
        cash_commission = round(cash_commission, 2)
        if req.amount > cash_commission:
            raise HTTPException(status_code=400, detail=f"Amount exceeds commission owed (Rs.{cash_commission})")
        # Verify Razorpay payment if provided
        if req.razorpay_payment_id and req.razorpay_order_id:
            gw = db.execute("SELECT * FROM payment_gateways WHERE name='razorpay' AND is_active=1").fetchone()
            if gw and gw["api_key"] and gw["secret_key"]:
                try:
                    import razorpay
                    client = razorpay.Client(auth=(gw["api_key"], gw["secret_key"]))
                    payment = client.payment.fetch(req.razorpay_payment_id)
                    if payment["status"] != "captured":
                        client.payment.capture(req.razorpay_payment_id, int(req.amount * 100))
                except Exception:
                    pass  # Still record the payment
        # Record the commission payment as a transaction
        db.execute(
            "INSERT INTO withdraw_requests (user_id, amount, charge, net_amount, status, created_at) VALUES (?, ?, 0, ?, 'completed', CURRENT_TIMESTAMP)",
            (user["user_id"], -req.amount, -req.amount),
        )
        return {"message": f"Commission payment of Rs.{req.amount} recorded successfully via gateway"}


@router.get("/transactions")
async def owner_transaction_ledger(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        grounds = db.execute("SELECT id FROM grounds WHERE owner_id=?", (user["user_id"],)).fetchall()
        gids = [g["id"] for g in grounds]
        if not gids:
            return []
        ph = ",".join(["?" for _ in gids])
        rows = db.execute("SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount, b.remaining_amount, b.payment_mode, b.payment_gateway, b.status, b.attendance, b.created_at, COALESCE(b.booking_type,'online') as booking_type, u.name as user_name, u.phone as user_phone, g.name as ground_name FROM bookings b JOIN users u ON b.user_id=u.id JOIN grounds g ON b.ground_id=g.id WHERE b.ground_id IN (" + ph + ") ORDER BY b.created_at DESC", gids).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["txn_type"] = "booking"
            # Calculate online and cash amounts for each booking
            if d["status"] == "no_show":
                # No-show: only token amount was actually paid, remaining never collected
                d["online_amount"] = d["token_amount"] or 0
                d["cash_amount"] = 0
            elif d["payment_mode"] in ("cash", "offline"):
                d["online_amount"] = 0
                d["cash_amount"] = d["total_amount"]
            else:
                d["online_amount"] = d["token_amount"] or d["total_amount"]
                d["cash_amount"] = d["remaining_amount"] or 0
            result.append(d)

        # Also include settlement records
        settlement_rows = db.execute(
            "SELECT id, amount, settlement_type, utr_number, notes, status, balance_before, balance_after, created_at FROM settlement_records WHERE owner_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()
        for s in settlement_rows:
            d = dict(s)
            d["txn_type"] = "settlement"
            d["user_name"] = "-"
            d["user_phone"] = "-"
            d["ground_name"] = "-"
            d["booking_date"] = str(d["created_at"] or "")[:10]
            d["start_time"] = d["settlement_type"] or ""
            d["end_time"] = ""
            d["total_amount"] = d["amount"]
            d["online_amount"] = d["utr_number"] or ""
            d["cash_amount"] = 0
            d["payment_mode"] = "settlement"
            d["booking_type"] = "settlement"
            result.append(d)

        # Also include withdrawal records
        withdrawal_rows = db.execute(
            "SELECT id, amount, charge, net_amount, status, transaction_id, created_at FROM withdraw_requests WHERE user_id = ? ORDER BY created_at DESC",
            (user["user_id"],),
        ).fetchall()
        for w in withdrawal_rows:
            d = dict(w)
            d["txn_type"] = "withdrawal"
            d["user_name"] = "-"
            d["user_phone"] = "-"
            d["ground_name"] = "-"
            d["booking_date"] = str(d["created_at"] or "")[:10]
            d["start_time"] = ""
            d["end_time"] = ""
            d["total_amount"] = d["amount"]
            d["online_amount"] = d.get("charge", 0)
            d["cash_amount"] = d.get("net_amount", 0)
            d["payment_mode"] = "withdrawal"
            d["booking_type"] = "withdrawal"
            result.append(d)

        # Sort all by created_at descending
        result.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return result

@router.post("/grounds/{ground_id}/dayoff")
async def set_day_off(ground_id: int, req: DayOffRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        ground = db.execute("SELECT * FROM grounds WHERE id = ? AND owner_id = ?", (ground_id, user["user_id"])).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        existing_slots = db.execute(
            "SELECT * FROM slots WHERE ground_id = ? AND date = ?", (ground_id, req.date)
        ).fetchall()
        booked = [s for s in existing_slots if s["status"] == "booked"]
        if booked:
            raise HTTPException(status_code=400, detail=f"Cannot set day off - {len(booked)} slots already booked")
        db.execute("DELETE FROM slots WHERE ground_id = ? AND date = ? AND status = 'available'", (ground_id, req.date))
        db.execute(
            "INSERT INTO slots (ground_id, date, start_time, end_time, price, status) VALUES (?, ?, '00:00', '23:59', 0, 'dayoff')",
            (ground_id, req.date),
        )
        return {"message": f"Day off set for {req.date}. Reason: {req.reason}"}


@router.delete("/grounds/{ground_id}/dayoff")
async def remove_day_off(ground_id: int, date: str = Query(...), user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute("DELETE FROM slots WHERE ground_id = ? AND date = ? AND status = 'dayoff'", (ground_id, date))
        return {"message": f"Day off removed for {date}"}


# --- TICKET SYSTEM FOR OWNERS ---
class OwnerTicketRequest(BaseModel):
    subject: str
    message: str
    ground_id: int | None = None


class OwnerTicketReplyRequest(BaseModel):
    message: str


@router.post("/tickets")
async def create_owner_ticket(req: OwnerTicketRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        db.execute(
            "INSERT INTO tickets (user_id, ground_id, subject, message, status, priority) VALUES (?, ?, ?, ?, 'open', 'normal')",
            (user["user_id"], req.ground_id, req.subject, req.message),
        )
        return {"message": "Support ticket created. Admin will respond shortly."}


@router.get("/tickets")
async def list_owner_tickets(user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        # Owner sees tickets they created OR tickets related to their grounds
        ground_ids = [g["id"] for g in db.execute("SELECT id FROM grounds WHERE owner_id = ?", (user["user_id"],)).fetchall()]
        if ground_ids:
            ph = ",".join(["?" for _ in ground_ids])
            rows = db.execute(
                f"""SELECT t.*, g.name as ground_name FROM tickets t
                LEFT JOIN grounds g ON t.ground_id = g.id
                WHERE t.user_id = ? OR t.ground_id IN ({ph})
                ORDER BY t.created_at DESC""",
                [user["user_id"]] + ground_ids,
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT t.*, g.name as ground_name FROM tickets t
                LEFT JOIN grounds g ON t.ground_id = g.id
                WHERE t.user_id = ? ORDER BY t.created_at DESC""",
                (user["user_id"],),
            ).fetchall()
        tickets = []
        for r in rows:
            t = dict(r)
            replies = db.execute(
                """SELECT tr.*, u.name as user_name, u.role as user_role FROM ticket_replies tr
                JOIN users u ON tr.user_id = u.id WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC""",
                (t["id"],),
            ).fetchall()
            t["replies"] = [dict(rep) for rep in replies]
            tickets.append(t)
        return tickets


@router.post("/tickets/{ticket_id}/reply")
async def reply_owner_ticket(ticket_id: int, req: OwnerTicketReplyRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["owner", "admin"])
    with get_db() as db:
        # Owner can reply to their own tickets or tickets about their grounds
        ticket = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        # Check ownership
        is_creator = ticket["user_id"] == user["user_id"]
        is_ground_owner = False
        if ticket["ground_id"]:
            ground = db.execute("SELECT owner_id FROM grounds WHERE id = ?", (ticket["ground_id"],)).fetchone()
            if ground and ground["owner_id"] == user["user_id"]:
                is_ground_owner = True
        if not is_creator and not is_ground_owner:
            raise HTTPException(status_code=403, detail="Access denied")
        if ticket["status"] == "closed":
            raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
        db.execute(
            "INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)",
            (ticket_id, user["user_id"], req.message),
        )
        db.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (ticket_id,))
        return {"message": "Reply sent successfully"}
