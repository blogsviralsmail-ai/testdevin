from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user, require_role
from app.seed import generate_ref_code
import hashlib
import csv
import io
import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.responses import StreamingResponse

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/admin", tags=["admin"])


# BUG-002 FIX: Use bcrypt for password hashing
import bcrypt
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# --- DASHBOARD ---
@router.get("/dashboard")
async def admin_dashboard(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        total_revenue = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as v FROM bookings WHERE status != 'cancelled'").fetchone()["v"]
        total_bookings = db.execute("SELECT COUNT(*) as v FROM bookings").fetchone()["v"]
        active_bookings = db.execute("SELECT COUNT(*) as v FROM bookings WHERE status = 'confirmed'").fetchone()["v"]
        total_users = db.execute("SELECT COUNT(*) as v FROM users WHERE role = 'user'").fetchone()["v"]
        total_grounds = db.execute("SELECT COUNT(*) as v FROM grounds WHERE is_active = 1").fetchone()["v"]
        total_owners = db.execute("SELECT COUNT(*) as v FROM users WHERE role = 'owner'").fetchone()["v"]
        monthly_revenue = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as v FROM bookings WHERE status != 'cancelled' AND created_at >= date('now', '-30 days')").fetchone()["v"]
        pending_grounds = db.execute("SELECT COUNT(*) as v FROM grounds WHERE is_active = 0").fetchone()["v"]

        commission_rate = float(db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()["value"])
        total_commission = round(total_revenue * commission_rate / 100, 2)

        recent_bookings = db.execute(
            """SELECT b.*, g.name as ground_name, g.id as ground_id, u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC LIMIT 10"""
        ).fetchall()

        booking_approval = db.execute("SELECT value FROM settings WHERE key='booking_approval_required'").fetchone()
        approval_required = booking_approval["value"] == "1" if booking_approval else False

        return {
            "stats": {
                "total_revenue": total_revenue,
                "monthly_revenue": monthly_revenue,
                "total_bookings": total_bookings,
                "active_bookings": active_bookings,
                "total_users": total_users,
                "total_grounds": total_grounds,
                "total_owners": total_owners,
                "total_commission": total_commission,
                "pending_grounds": pending_grounds,
            },
            "recent_bookings": [dict(r) for r in recent_bookings],
            "booking_approval_required": approval_required,
        }


# --- USERS MANAGEMENT ---
@router.get("/users")
async def list_users(role: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = "SELECT * FROM users"
        params: list = []
        if role:
            query += " WHERE role = ?"
            params.append(role)
        query += " ORDER BY created_at DESC"
        rows = db.execute(query, params).fetchall()
        result = []
        for r in rows:
            u = dict(r)
            # Get actual booking count for each user
            bc = db.execute("SELECT COUNT(*) as cnt FROM bookings WHERE user_id = ?", (u["id"],)).fetchone()
            u["total_bookings"] = bc["cnt"] if bc else 0
            result.append(u)
        return result


@router.get("/users/csv")
async def export_users_csv(role: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = "SELECT id, name, phone, email, role, wallet_balance, rating, city, created_at FROM users"
        params: list = []
        if role:
            query += " WHERE role = ?"
            params.append(role)
        query += " ORDER BY created_at DESC"
        rows = db.execute(query, params).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "Phone", "Email", "Role", "Wallet", "Rating", "City", "Created"])
        for r in rows:
            writer.writerow([r["id"], r["name"], r["phone"], r["email"], r["role"], r["wallet_balance"], r["rating"], r["city"], r["created_at"]])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=users.csv"}
        )


class AddUserRequest(BaseModel):
    name: str
    phone: str
    email: str | None = None
    role: str = "user"
    password: str = "password123"


@router.post("/users")
async def add_user(req: AddUserRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        existing = db.execute("SELECT id FROM users WHERE phone=?", (req.phone,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
        ref_code = generate_ref_code()
        pw_hash = hash_password(req.password)
        db.execute(
            "INSERT INTO users (name, phone, email, role, referral_code, wallet_balance, password_hash) VALUES (?, ?, ?, ?, ?, 0, ?)",
            (req.name, req.phone, req.email, req.role, ref_code, pw_hash),
        )
        return {"message": f"{req.role.capitalize()} '{req.name}' added successfully"}


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    city: str | None = None
    password: str | None = None


@router.put("/users/{user_id}")
async def update_user(user_id: int, req: UpdateUserRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        updates = []
        params: list = []
        for field, value in req.model_dump(exclude_none=True).items():
            if field == "password":
                updates.append("password_hash = ?")
                params.append(hash_password(value))
            else:
                updates.append(f"{field} = ?")
                params.append(value)
        if updates:
            params.append(user_id)
            db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "User updated"}


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: int, role: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if role not in ("user", "owner", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    with get_db() as db:
        db.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        return {"message": f"User role updated to {role}"}


@router.put("/users/{user_id}/ban")
async def ban_user(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        u = db.execute("SELECT is_banned FROM users WHERE id = ?", (user_id,)).fetchone()
        new_val = 0 if (u and u.get("is_banned")) else 1
        db.execute("UPDATE users SET is_banned = ? WHERE id = ?", (new_val, user_id))
        return {"message": f"User {'banned' if new_val else 'unbanned'}"}


@router.put("/users/{user_id}/suspend")
async def suspend_user(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        u = db.execute("SELECT is_suspended FROM users WHERE id = ?", (user_id,)).fetchone()
        new_val = 0 if (u and u.get("is_suspended")) else 1
        db.execute("UPDATE users SET is_suspended = ? WHERE id = ?", (new_val, user_id))
        return {"message": f"User {'suspended' if new_val else 'unsuspended'}"}


@router.put("/users/{user_id}/kyc/verify")
async def verify_kyc(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        # On verify: clear old bank details backup (Re-KYC approved, new details are now official)
        db.execute(
            """UPDATE users SET kyc_status = 'verified',
               kyc_reject_reason = NULL,
               old_bank_name = NULL, old_bank_account = NULL, old_bank_ifsc = NULL,
               old_upi_id = NULL, old_kyc_doc_type = NULL, old_kyc_doc_url = NULL
            WHERE id = ?""",
            (user_id,)
        )
        return {"message": "KYC verified"}


# --- GROUNDS MANAGEMENT ---
@router.get("/grounds")
async def list_all_grounds(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            "SELECT g.*, u.name as owner_name, u.phone as owner_phone FROM grounds g JOIN users u ON g.owner_id = u.id ORDER BY g.created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


class AddGroundRequest(BaseModel):
    name: str
    address: str
    city: str
    ground_type: str = "box"
    owner_id: int
    weekday_price: float
    weekend_price: float
    evening_extra: float = 0
    opening_time: str = "06:00"
    closing_time: str = "23:00"
    amenities: str = ""
    description: str = ""
    latitude: float | None = None
    longitude: float | None = None
    commission_rate: float | None = None
    token_money_percent: float = 100


@router.post("/grounds")
async def add_ground(req: AddGroundRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute(
            """INSERT INTO grounds (owner_id, name, address, city, ground_type, weekday_price, weekend_price,
            evening_extra, opening_time, closing_time, amenities, description, latitude, longitude, commission_rate, token_money_percent, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (req.owner_id, req.name, req.address, req.city, req.ground_type, req.weekday_price,
             req.weekend_price, req.evening_extra, req.opening_time, req.closing_time,
             req.amenities, req.description, req.latitude, req.longitude, req.commission_rate, req.token_money_percent),
        )
        return {"message": f"Ground '{req.name}' added and activated"}


@router.put("/grounds/{ground_id}")
async def update_ground(ground_id: int, req: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        updates = []
        params: list = []
        allowed = ["name", "address", "city", "ground_type", "weekday_price", "weekend_price",
                    "evening_extra", "opening_time", "closing_time", "amenities", "description",
                    "latitude", "longitude", "commission_rate", "token_money_percent"]
        for field in allowed:
            if field in req:
                updates.append(f"{field} = ?")
                params.append(req[field])
        if updates:
            params.append(ground_id)
            db.execute(f"UPDATE grounds SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Ground updated"}


@router.put("/grounds/{ground_id}/commission")
async def set_ground_commission(ground_id: int, commission_rate: float, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("UPDATE grounds SET commission_rate = ? WHERE id = ?", (commission_rate, ground_id))
        return {"message": f"Commission set to {commission_rate}%"}


@router.put("/grounds/{ground_id}/toggle")
async def toggle_ground(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT is_active FROM grounds WHERE id = ?", (ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        new_status = 0 if ground["is_active"] else 1
        db.execute("UPDATE grounds SET is_active = ? WHERE id = ?", (new_status, ground_id))
        return {"message": f"Ground {'activated' if new_status else 'deactivated'}"}


@router.put("/grounds/{ground_id}/approve")
async def approve_ground(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("UPDATE grounds SET is_active = 1 WHERE id = ?", (ground_id,))
        return {"message": "Ground approved and activated"}


@router.put("/grounds/{ground_id}/reject")
async def reject_ground(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM grounds WHERE id = ?", (ground_id,))
        return {"message": "Ground rejected and removed"}


@router.put("/grounds/{ground_id}/featured")
async def toggle_featured(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT is_featured FROM grounds WHERE id = ?", (ground_id,)).fetchone()
        new_val = 0 if ground["is_featured"] else 1
        db.execute("UPDATE grounds SET is_featured = ? WHERE id = ?", (new_val, ground_id))
        return {"message": f"Ground {'featured' if new_val else 'unfeatured'}"}


# --- BOOKINGS ---
@router.get("/bookings")
async def list_all_bookings(status: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = """SELECT b.*, g.name as ground_name, g.id as ground_id, u.name as user_name, u.phone as user_phone,
            ow.phone as owner_phone
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id
            JOIN users ow ON g.owner_id = ow.id"""
        params: list = []
        if status:
            query += " WHERE b.status = ?"
            params.append(status)
        query += " ORDER BY b.created_at DESC"
        rows = db.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.get("/bookings/csv")
async def export_bookings_csv(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.status, b.payment_gateway, g.name as ground_name, g.id as ground_id,
            u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC"""
        ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Booking ID", "Date", "Start", "End", "Total", "Token", "Remaining", "Status", "Gateway", "Ground", "Ground ID", "User", "Phone"])
        for r in rows:
            writer.writerow([r["booking_id"], r["booking_date"], r["start_time"], r["end_time"], r["total_amount"],
                             r["token_amount"], r["remaining_amount"], r["status"], r["payment_gateway"],
                             r["ground_name"], r["ground_id"], r["user_name"], r["user_phone"]])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=bookings.csv"}
        )


@router.post("/bookings/{booking_id}/cancel")
async def admin_cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] not in ("confirmed", "pending_cash", "awaiting_approval"):
            raise HTTPException(status_code=400, detail="Cannot cancel")
        # BUG-012 FIX: Refund full paid amount (token + any remaining paid)
        refund = booking["token_amount"]
        if booking["remaining_amount"] and booking["payment_status"] == "success":
            # If full payment was made, refund total
            refund = booking["total_amount"]
        db.execute(
            "UPDATE bookings SET status='cancelled', cancelled_by='admin', cancel_charge=0, refund_amount=? WHERE booking_id=?",
            (refund, booking_id),
        )
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
        db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (refund, booking["user_id"]))
        return {"message": f"Booking cancelled by admin. Full refund Rs.{refund} to user wallet."}


@router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("UPDATE bookings SET status='confirmed' WHERE booking_id=? AND status IN ('awaiting','awaiting_approval','pending_cash')", (booking_id,))
        return {"message": "Booking confirmed"}


# --- PROMO CODES ---
class PromoCodeRequest(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_booking: float = 0
    max_discount: float | None = None
    usage_limit: int = 100
    valid_from: str
    valid_to: str
    is_active: int = 1


@router.get("/promos")
async def list_promos(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM promo_codes ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]


@router.post("/promos")
async def create_promo(req: PromoCodeRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            db.execute(
                """INSERT INTO promo_codes (code, discount_type, discount_value, min_booking, max_discount,
                usage_limit, valid_from, valid_to, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (req.code.upper(), req.discount_type, req.discount_value, req.min_booking,
                 req.max_discount, req.usage_limit, req.valid_from, req.valid_to, req.is_active),
            )
            return {"message": f"Promo code {req.code.upper()} created"}
        except Exception:
            raise HTTPException(status_code=400, detail="Promo code already exists")


@router.put("/promos/{promo_id}")
async def update_promo(promo_id: int, req: PromoCodeRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute(
            """UPDATE promo_codes SET code=?, discount_type=?, discount_value=?, min_booking=?,
            max_discount=?, usage_limit=?, valid_from=?, valid_to=?, is_active=? WHERE id=?""",
            (req.code.upper(), req.discount_type, req.discount_value, req.min_booking,
             req.max_discount, req.usage_limit, req.valid_from, req.valid_to, req.is_active, promo_id),
        )
        return {"message": "Promo updated"}


@router.delete("/promos/{promo_id}")
async def delete_promo(promo_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM promo_codes WHERE id = ?", (promo_id,))
        return {"message": "Promo deleted"}


# --- SETTINGS ---
@router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM settings ORDER BY id").fetchall()
        return [dict(r) for r in rows]


# --- FRONTEND CUSTOMIZATION SETTINGS (must be before /settings/{key}) ---
@router.get("/settings/customize")
async def get_customize_settings(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        defaults = {
            "site_name": "BookAGround",
            "site_tagline": "Book Cricket Grounds Near You",
            "primary_color": "#1a5f2a",
            "secondary_color": "#2d8f4e",
            "accent_color": "#f59e0b",
            "logo_url": "",
            "favicon_url": "",
            "hero_bg_image": "",
            "footer_text": "BookAGround - Your Cricket Ground Booking Platform",
            "contact_email": "info@bookaground.com",
            "contact_phone": "+91 9782005500",
            "social_facebook": "",
            "social_instagram": "",
            "social_twitter": "",
            "social_youtube": "",
            "meta_title": "BookAGround - Cricket Ground Booking",
            "meta_description": "Book cricket grounds near you. Easy online booking with instant confirmation.",
            "feature_wallet": "1",
            "feature_teams": "1",
            "feature_referral": "1",
            "feature_offers": "1",
            "feature_ratings": "1",
            "feature_tickets": "1",
            "homepage_layout": "default",
            "booking_instruction": "Show QR code at the ground for verification",
            "terms_url": "",
            "privacy_url": "",
            "about_text": "BookAGround is a platform for booking cricket grounds online.",
            "whatsapp_button_number": "919782005500",
            "whatsapp_button_message": "Hi! I want to book a sports ground on BookAGround. Please help me.",
        }
        result = {}
        for key, default_val in defaults.items():
            row = db.execute("SELECT value FROM settings WHERE key = ?", (f"customize_{key}",)).fetchone()
            if row:
                result[key] = row["value"]
            else:
                result[key] = default_val
                try:
                    db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (f"customize_{key}", default_val))
                except Exception:
                    pass
        return result


@router.put("/settings/customize")
async def update_customize_settings(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    require_role(user, ["admin"])
    with get_db() as db:
        for key, value in data.items():
            existing = db.execute("SELECT id FROM settings WHERE key = ?", (f"customize_{key}",)).fetchone()
            if existing:
                db.execute("UPDATE settings SET value = ? WHERE key = ?", (str(value), f"customize_{key}"))
            else:
                db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (f"customize_{key}", str(value)))
        return {"message": "Customization settings updated"}


class UpdateSettingRequest(BaseModel):
    value: str


@router.put("/settings/{key}")
async def update_setting(key: str, req: UpdateSettingRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        existing = db.execute("SELECT id FROM settings WHERE key = ?", (key,)).fetchone()
        if existing:
            db.execute("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?", (req.value, key))
        else:
            db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (key, req.value))
        return {"message": f"Setting {key} updated to {req.value}"}


# --- PAYMENT GATEWAYS ---
@router.get("/gateways")
async def list_gateways(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM payment_gateways ORDER BY priority").fetchall()
        return [dict(r) for r in rows]


class GatewayUpdateRequest(BaseModel):
    api_key: str | None = None
    secret_key: str | None = None
    is_active: int | None = None
    is_test_mode: int | None = None
    priority: int | None = None


@router.put("/gateways/{gateway_id}")
async def update_gateway(gateway_id: int, req: GatewayUpdateRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        gw = db.execute("SELECT * FROM payment_gateways WHERE id = ?", (gateway_id,)).fetchone()
        if not gw:
            raise HTTPException(status_code=404, detail="Gateway not found")
        updates = []
        params: list = []
        data = req.model_dump(exclude_none=True)
        # If trying to activate, check keys exist
        if data.get("is_active") == 1:
            api_key = data.get("api_key") or gw["api_key"]
            if not api_key or api_key.strip() == "":
                raise HTTPException(status_code=400, detail="API Key required to activate gateway. Add key first.")
            data["is_test_mode"] = 0
        # If keys are being added, auto-activate and set live mode
        if data.get("api_key") and data["api_key"].strip():
            data["is_active"] = 1
            data["is_test_mode"] = 0
        # If keys removed, deactivate
        if "api_key" in data and (not data["api_key"] or data["api_key"].strip() == ""):
            data["is_active"] = 0
            data["is_test_mode"] = 1
        for field, value in data.items():
            updates.append(f"{field} = ?")
            params.append(value)
        if updates:
            params.append(gateway_id)
            db.execute(f"UPDATE payment_gateways SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Gateway updated"}


# --- SETTLEMENTS ---
@router.get("/settlements")
async def list_settlements(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owners = db.execute("SELECT DISTINCT u.id, u.name, u.phone, u.email, u.bank_name, u.bank_account, u.bank_ifsc, u.upi_id FROM users u JOIN grounds g ON u.id = g.owner_id WHERE u.role = 'owner'").fetchall()
        result = []
        cr_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        commission_rate = float(cr_row["value"]) if cr_row else 10
        for owner in owners:
            grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id=?", (owner["id"],)).fetchall()
            online_rev = 0
            cash_rev = 0
            total_comm = 0
            for g in grounds:
                o_r = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                c_r = db.execute("SELECT COALESCE(SUM(total_amount),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                rate = g["commission_rate"] if g["commission_rate"] is not None else commission_rate
                online_rev += o_r
                cash_rev += c_r
                total_comm += o_r * rate / 100
            withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (owner["id"],)).fetchone()["total"]
            settled = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlement_records WHERE owner_id=?", (owner["id"],)).fetchone()["total"]
            total_paid_out = withdrawn + settled
            result.append({
                "owner_id": owner["id"], "owner_name": owner["name"], "owner_phone": owner["phone"],
                "bank_name": owner["bank_name"] or "", "bank_account": owner["bank_account"] or "",
                "bank_ifsc": owner["bank_ifsc"] or "", "upi_id": owner["upi_id"] or "",
                "online_revenue": online_rev, "cash_revenue": cash_rev,
                "total_revenue": online_rev + cash_rev, "commission": round(total_comm, 2),
                "net_payable": round(online_rev - total_comm - total_paid_out, 2),
                "already_withdrawn": total_paid_out, "status": "pending"
            })
        return result


@router.post("/settlements/{owner_id}/process")
async def process_settlement(owner_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        # BUG-008 FIX: Check for duplicate settlement processing
        existing = db.execute(
            "SELECT id FROM settlements WHERE owner_id = ? AND status = 'completed' AND created_at > date('now', '-1 day')",
            (owner_id,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Settlement already processed recently. Wait 24 hours.")

        # BUG-007 FIX: Deduct commission before adding to wallet
        grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id = ?", (owner_id,)).fetchall()
        commission_rate_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        default_commission = float(commission_rate_row["value"]) if commission_rate_row else 10

        total_revenue = 0.0
        total_commission = 0.0
        for g in grounds:
            rev = db.execute(
                "SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END), 0) as v FROM bookings WHERE ground_id = ? AND status NOT IN ('cancelled') AND booking_id NOT IN (SELECT COALESCE(booking_ids, '') FROM settlements WHERE owner_id = ?)",
                (g["id"], owner_id)
            ).fetchone()["v"]
            rate = g["commission_rate"] if g["commission_rate"] is not None else default_commission
            commission = rev * rate / 100
            total_revenue += rev
            total_commission += commission

        net_payable = round(total_revenue - total_commission, 2)
        if net_payable <= 0:
            raise HTTPException(status_code=400, detail="No pending settlement amount.")

        # Record settlement
        db.execute(
            "INSERT INTO settlements (owner_id, period, online_amount, cash_amount, commission_amount, net_payable, status) VALUES (?, ?, ?, 0, ?, ?, 'completed')",
            (owner_id, datetime.now(IST).strftime("%Y-%m"), total_revenue, round(total_commission, 2), net_payable)
        )
        # Add net payable (after commission) to owner wallet
        db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (net_payable, owner_id))
        return {"message": f"Settlement processed. Revenue: Rs.{total_revenue}, Commission: Rs.{round(total_commission, 2)}, Net paid: Rs.{net_payable}"}


@router.post("/settlement-payout")
async def settlement_payout(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    data = await request.json()
    owner_id = data.get("owner_id")
    amount = float(data.get("amount", 0))
    settlement_type = data.get("settlement_type", "bank_transfer")  # bank_transfer or razorpay
    utr_number = data.get("utr_number", "")
    proof_photo = data.get("proof_photo", "")
    razorpay_payment_id = data.get("razorpay_payment_id", "")
    notes = data.get("notes", "")
    payout_mode = data.get("payout_mode", "NEFT")  # NEFT, IMPS, UPI

    if not owner_id or amount <= 0:
        raise HTTPException(status_code=400, detail="Owner ID and valid amount required")

    if settlement_type == "bank_transfer" and not utr_number:
        raise HTTPException(status_code=400, detail="UTR number required for manual bank transfer")

    with get_db() as db:
        owner = db.execute("SELECT id, name, phone, email, wallet_balance, bank_name, bank_account, bank_ifsc, upi_id FROM users WHERE id = ?", (owner_id,)).fetchone()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")

        # Calculate actual net_payable from bookings (not wallet_balance which is for customer wallet)
        cr_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        commission_rate_default = float(cr_row["value"]) if cr_row else 10
        grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id=?", (owner_id,)).fetchall()
        online_rev_total = 0
        total_comm = 0
        for g in grounds:
            o_r = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline')", (g["id"],)).fetchone()["v"]
            rate = g["commission_rate"] if g["commission_rate"] is not None else commission_rate_default
            online_rev_total += o_r
            total_comm += o_r * rate / 100
        already_withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (owner_id,)).fetchone()["total"]
        already_settled = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlement_records WHERE owner_id=?", (owner_id,)).fetchone()["total"]
        balance_before = round(online_rev_total - total_comm - already_withdrawn - already_settled, 2)

        if amount > balance_before:
            raise HTTPException(status_code=400, detail=f"Amount Rs.{amount} exceeds available balance Rs.{balance_before}")

        # --- RAZORPAY AUTO PAYOUT via RazorpayX Composite API ---
        if settlement_type == "razorpay":
            import requests as http_requests
            gw = db.execute("SELECT * FROM payment_gateways WHERE LOWER(name) = 'razorpay' AND is_active = 1").fetchone()
            if not gw:
                raise HTTPException(status_code=400, detail="Razorpay gateway not configured")

            # Get RazorpayX account number from settings (Customer Identifier)
            razorpayx_account = db.execute("SELECT value FROM settings WHERE key = 'razorpayx_account_number'").fetchone()
            if not razorpayx_account:
                raise HTTPException(status_code=400, detail="RazorpayX account number not configured. Add 'razorpayx_account_number' in Settings.")

            account_number = razorpayx_account["value"]
            api_key = gw["api_key"]
            api_secret = gw["secret_key"]

            # Determine payout method: UPI or Bank Account
            owner_upi = (owner["upi_id"] or "").strip()
            owner_bank_account = (owner["bank_account"] or "").strip()
            owner_bank_ifsc = (owner["bank_ifsc"] or "").strip()
            owner_name = owner["name"] or "Owner"
            owner_phone = owner["phone"] or ""
            owner_email = owner["email"] or ""

            amount_paise = int(amount * 100)

            # Build composite payout request
            idempotency_key = str(uuid.uuid4())

            if payout_mode == "UPI" and owner_upi:
                # UPI Payout
                payout_payload = {
                    "account_number": account_number,
                    "amount": amount_paise,
                    "currency": "INR",
                    "mode": "UPI",
                    "purpose": "payout",
                    "fund_account": {
                        "account_type": "vpa",
                        "vpa": {
                            "address": owner_upi
                        },
                        "contact": {
                            "name": owner_name,
                            "email": owner_email if owner_email else None,
                            "contact": owner_phone,
                            "type": "vendor",
                            "reference_id": f"owner_{owner_id}"
                        }
                    },
                    "queue_if_low_balance": True,
                    "reference_id": f"settle_{owner_id}_{datetime.now(IST).strftime('%Y%m%d%H%M%S')}",
                    "narration": f"BookAGround Payout",
                    "notes": {
                        "owner_id": str(owner_id),
                        "note": notes or "Settlement payout"
                    }
                }
            elif owner_bank_account and owner_bank_ifsc:
                # Bank Account Payout (NEFT/IMPS)
                payout_payload = {
                    "account_number": account_number,
                    "amount": amount_paise,
                    "currency": "INR",
                    "mode": payout_mode if payout_mode in ("NEFT", "IMPS", "RTGS") else "NEFT",
                    "purpose": "payout",
                    "fund_account": {
                        "account_type": "bank_account",
                        "bank_account": {
                            "name": owner_name,
                            "ifsc": owner_bank_ifsc,
                            "account_number": owner_bank_account
                        },
                        "contact": {
                            "name": owner_name,
                            "email": owner_email if owner_email else None,
                            "contact": owner_phone,
                            "type": "vendor",
                            "reference_id": f"owner_{owner_id}"
                        }
                    },
                    "queue_if_low_balance": True,
                    "reference_id": f"settle_{owner_id}_{datetime.now(IST).strftime('%Y%m%d%H%M%S')}",
                    "narration": f"BookAGround Payout",
                    "notes": {
                        "owner_id": str(owner_id),
                        "note": notes or "Settlement payout"
                    }
                }
            else:
                raise HTTPException(status_code=400, detail="Owner has no bank account or UPI details. KYC required first.")

            # Remove None values from contact
            contact = payout_payload["fund_account"]["contact"]
            payout_payload["fund_account"]["contact"] = {k: v for k, v in contact.items() if v is not None}

            # Call RazorpayX Composite Payout API
            try:
                resp = http_requests.post(
                    "https://api.razorpay.com/v1/payouts",
                    json=payout_payload,
                    auth=(api_key, api_secret),
                    headers={
                        "Content-Type": "application/json",
                        "X-Payout-Idempotency": idempotency_key
                    },
                    timeout=30
                )
                resp_data = resp.json()

                if resp.status_code not in (200, 201):
                    error_desc = resp_data.get("error", {}).get("description", "Unknown error")
                    raise HTTPException(status_code=400, detail=f"Razorpay Payout failed: {error_desc}")

                razorpay_payout_id = resp_data.get("id", "")
                razorpay_utr = resp_data.get("utr", "")
                payout_status = resp_data.get("status", "processing")
                ref_id = razorpay_payout_id

            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Razorpay API error: {str(e)}")

            # Calculate new balance (settlement balance, not wallet_balance)
            new_balance = round(balance_before - amount, 2)

            # Record in settlement_records
            db.execute(
                """INSERT INTO settlement_records (owner_id, amount, settlement_type, utr_number, proof_photo, notes, status, balance_before, balance_after)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (owner_id, amount, "razorpay", ref_id, "", f"Razorpay Payout | UTR: {razorpay_utr} | Status: {payout_status} | {notes}",
                 payout_status if payout_status == "processed" else "processing", balance_before, new_balance)
            )

            return {
                "message": f"Razorpay payout of Rs.{amount} initiated! Payout ID: {razorpay_payout_id}",
                "payout_id": razorpay_payout_id,
                "utr": razorpay_utr,
                "status": payout_status
            }

        # --- MANUAL BANK TRANSFER ---
        else:
            new_balance = round(balance_before - amount, 2)

            ref_id = utr_number

            # Record in settlement_records
            db.execute(
                """INSERT INTO settlement_records (owner_id, amount, settlement_type, utr_number, proof_photo, notes, status, balance_before, balance_after)
                   VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)""",
                (owner_id, amount, "bank_transfer", ref_id, proof_photo, notes, balance_before, new_balance)
            )

            return {"message": f"Manual payout of Rs.{amount} recorded. UTR: {ref_id}"}


@router.get("/settlement-statement/{owner_id}")
async def settlement_statement(owner_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        records = db.execute(
            "SELECT * FROM settlement_records WHERE owner_id = ? ORDER BY created_at DESC",
            (owner_id,)
        ).fetchall()
        return {"records": [dict(r) for r in records]}


# --- NOTIFICATIONS CONFIG ---
@router.get("/notifications/config")
async def get_notification_config(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        keys = ["sms_api_key","sms_provider","sms_sender_id","whatsapp_api_key","whatsapp_provider","whatsapp_phone","email_api_key","email_provider","email_from"]
        config = {}
        for key in keys:
            row = db.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
            config[key] = row["value"] if row else ""
        return {
            "sms": {"enabled": bool(config.get("sms_api_key")), "provider": config.get("sms_provider","MSG91"), "api_key": config.get("sms_api_key",""), "sender_id": config.get("sms_sender_id","BAGND")},
            "whatsapp": {"enabled": bool(config.get("whatsapp_api_key")), "provider": config.get("whatsapp_provider","Twilio"), "api_key": config.get("whatsapp_api_key",""), "phone": config.get("whatsapp_phone","")},
            "email": {"enabled": bool(config.get("email_api_key")), "provider": config.get("email_provider","SendGrid"), "api_key": config.get("email_api_key",""), "from_email": config.get("email_from","noreply@bookaground.com")},
        }


@router.put("/notifications/config")
async def update_notification_config(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        mapping = [("sms","api_key","sms_api_key"),("sms","provider","sms_provider"),("sms","sender_id","sms_sender_id"),("whatsapp","api_key","whatsapp_api_key"),("whatsapp","provider","whatsapp_provider"),("whatsapp","phone","whatsapp_phone"),("email","api_key","email_api_key"),("email","provider","email_provider"),("email","from_email","email_from")]
        for ch, field, skey in mapping:
            if ch in data and field in data[ch]:
                val = data[ch][field]
                existing = db.execute("SELECT id FROM settings WHERE key = ?", (skey,)).fetchone()
                if existing:
                    db.execute("UPDATE settings SET value = ? WHERE key = ?", (val, skey))
                else:
                    db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (skey, val))
        return {"message": "Notification config updated successfully"}


# --- REPORTS ---
@router.get("/reports/revenue")
async def revenue_report(period: str = Query("monthly"), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        # Get totals
        totals = db.execute(
            "SELECT COUNT(*) as total_bookings, COALESCE(SUM(total_amount), 0) as total_revenue FROM bookings WHERE status != 'cancelled'"
        ).fetchone()
        total_revenue = totals["total_revenue"] if totals else 0
        total_bookings = totals["total_bookings"] if totals else 0
        avg_booking_value = round(total_revenue / max(total_bookings, 1))

        # Top grounds by revenue
        top_grounds_rows = db.execute(
            """SELECT g.name, COALESCE(SUM(b.total_amount), 0) as revenue
            FROM grounds g LEFT JOIN bookings b ON g.id = b.ground_id AND b.status != 'cancelled'
            GROUP BY g.id ORDER BY revenue DESC LIMIT 5"""
        ).fetchall()
        top_grounds = [{"name": r["name"], "revenue": r["revenue"]} for r in top_grounds_rows]

        # Peak hours
        peak_rows = db.execute(
            """SELECT substr(start_time, 1, 5) as hour, COUNT(*) as bookings
            FROM bookings WHERE status != 'cancelled'
            GROUP BY hour ORDER BY bookings DESC LIMIT 5"""
        ).fetchall()
        peak_hours = [{"hour": r["hour"], "bookings": r["bookings"]} for r in peak_rows]

        return {
            "total_revenue": total_revenue,
            "total_bookings": total_bookings,
            "avg_booking_value": avg_booking_value,
            "period": period,
            "top_grounds": top_grounds,
            "peak_hours": peak_hours,
        }


@router.get("/reports/grounds")
async def ground_report(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            """SELECT g.id, g.name, g.city, g.rating, g.total_bookings, u.name as owner_name, u.phone as owner_phone,
            COALESCE(g.commission_rate, (SELECT value FROM settings WHERE key='standard_commission')) as commission,
            COALESCE(SUM(b.total_amount), 0) as revenue
            FROM grounds g JOIN users u ON g.owner_id = u.id
            LEFT JOIN bookings b ON g.id = b.ground_id AND b.status != 'cancelled'
            GROUP BY g.id ORDER BY revenue DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


# --- ADMIN CREATE BOOKING ---
class AdminBookingRequest(BaseModel):
    ground_id: int
    slot_id: int
    customer_name: str
    customer_phone: str
    payment_mode: str = "cash"
    amount: float | None = None


@router.post("/bookings")
async def admin_create_booking(req: AdminBookingRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        slot = db.execute("SELECT * FROM slots WHERE id = ? AND status = 'available'", (req.slot_id,)).fetchone()
        if not slot:
            raise HTTPException(status_code=400, detail="Slot not available")
        ground = db.execute("SELECT * FROM grounds WHERE id = ?", (req.ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")

        customer = db.execute("SELECT * FROM users WHERE phone=?", (req.customer_phone,)).fetchone()
        if not customer:
            from app.seed import generate_ref_code as gen_ref
            ref_code = gen_ref()
            db.execute(
                "INSERT INTO users (name, phone, role, referral_code, wallet_balance) VALUES (?, ?, 'user', ?, 0)",
                (req.customer_name, req.customer_phone, ref_code),
            )
            customer = db.execute("SELECT * FROM users WHERE phone=?", (req.customer_phone,)).fetchone()

        from app.seed import generate_booking_id as gen_bid
        booking_id = gen_bid()
        amount = req.amount or slot["price"]
        db.execute(
            """INSERT INTO bookings (booking_id, user_id, ground_id, slot_id, booking_date, start_time, end_time,
            total_amount, token_amount, remaining_amount, payment_mode, payment_status, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'success', 'confirmed')""",
            (booking_id, customer["id"], req.ground_id, req.slot_id, slot["date"],
             slot["start_time"], slot["end_time"], amount, amount, req.payment_mode),
        )
        db.execute("UPDATE slots SET status = 'booked' WHERE id = ?", (req.slot_id,))
        db.execute("UPDATE grounds SET total_bookings = total_bookings + 1 WHERE id = ?", (req.ground_id,))
        return {"message": f"Booking created - {booking_id}", "booking_id": booking_id}


# --- GROUND-WISE STATEMENT CSV ---
@router.get("/grounds/{ground_id}/statement/csv")
async def ground_statement_csv(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT name FROM grounds WHERE id = ?", (ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.status, u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN users u ON b.user_id = u.id
            WHERE b.ground_id = ? ORDER BY b.created_at DESC""",
            (ground_id,),
        ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Booking ID", "Date", "Start", "End", "Total", "Token", "Remaining", "Payment Mode", "Status", "User", "Phone"])
        for r in rows:
            writer.writerow([r["booking_id"], r["booking_date"], r["start_time"], r["end_time"], r["total_amount"],
                             r["token_amount"], r["remaining_amount"], r["payment_mode"], r["status"],
                             r["user_name"], r["user_phone"]])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=ground_{ground_id}_statement.csv"}
        )


# --- CASH PAYMENT VERIFICATION ---
@router.post("/bookings/{booking_id}/verify-cash")
async def verify_cash_payment(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ? AND status = 'pending_cash'", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found or not pending cash verification")
        db.execute("UPDATE bookings SET status='confirmed', cash_verified=1, cash_verified_by=?, payment_status='success' WHERE booking_id=?", (user["user_id"], booking_id))
        if booking["cashback_amount"] and booking["cashback_amount"] > 0:
            cb_enabled = db.execute("SELECT value FROM settings WHERE key='cashback_enabled'").fetchone()
            if cb_enabled and cb_enabled["value"] == "1":
                db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (booking["cashback_amount"], booking["user_id"]))
        return {"message": f"Cash payment verified for booking {booking_id}"}


@router.post("/bookings/{booking_id}/reject-cash")
async def reject_cash_payment(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ? AND status = 'pending_cash'", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        db.execute("UPDATE bookings SET status='cancelled', cancelled_by='admin', cancel_reason='Cash payment rejected' WHERE booking_id=?", (booking_id,))
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
        return {"message": f"Cash payment rejected for {booking_id}. Slot released."}


# --- NOT ATTENDING / NO SHOW ---
@router.post("/bookings/{booking_id}/no-show")
async def mark_no_show(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin", "owner"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] != "confirmed":
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be marked as no-show")
        # BUG-020 FIX: Track forfeited token amount
        forfeited = booking["token_amount"]
        db.execute("UPDATE bookings SET status='no_show', attendance='no_show', cancel_reason='Team did not attend (15 min wait)', cancel_charge=? WHERE booking_id=?", (forfeited, booking_id,))
        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
        # Credit forfeited amount to platform (track in settings)
        db.execute("UPDATE settings SET value = CAST(CAST(value AS REAL) + ? AS TEXT) WHERE key = 'platform_forfeit_revenue'", (forfeited,))
        return {"message": f"Booking {booking_id} marked as No Show. Rs.{forfeited} token forfeited. Slot released."}


# --- OWNER APPROVAL PER GROUND ---
@router.put("/grounds/{ground_id}/approval")
async def toggle_ground_approval(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT approval_required FROM grounds WHERE id = ?", (ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        new_val = 0 if ground["approval_required"] else 1
        db.execute("UPDATE grounds SET approval_required = ? WHERE id = ?", (new_val, ground_id))
        status = "enabled" if new_val else "disabled"
        return {"message": f"Owner approval {status} for this ground"}


# --- OWNER APPROVE BOOKING ---
@router.post("/bookings/{booking_id}/owner-approve")
async def owner_approve_booking(booking_id: str, user: dict = Depends(get_current_user)):
    require_role(user, ["admin", "owner"])
    with get_db() as db:
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ? AND status = 'awaiting_approval'", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found or not awaiting approval")
        db.execute("UPDATE bookings SET status='confirmed' WHERE booking_id=?", (booking_id,))
        return {"message": f"Booking {booking_id} approved"}


# --- WITHDRAW REQUESTS ---
@router.get("/withdrawals")
async def list_withdrawals(status: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = """SELECT w.*, u.name as user_name, u.phone as user_phone, u.role as user_role, u.bank_name, u.bank_account, u.bank_ifsc, u.upi_id
                   FROM withdraw_requests w JOIN users u ON w.user_id = u.id"""
        params: list = []
        if status:
            query += " WHERE w.status = ?"
            params.append(status)
        query += " ORDER BY w.created_at DESC"
        rows = db.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("/withdrawals/{wid}/approve")
async def approve_withdrawal(wid: int, data: dict = None, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if data is None:
        data = {}
    with get_db() as db:
        w = db.execute("SELECT * FROM withdraw_requests WHERE id = ?", (wid,)).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        transaction_id = data.get("transaction_id", "") if data else ""
        proof_url = data.get("proof_url", "") if data else ""
        if w["status"] == "pending_topup":
            db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (w["net_amount"], w["user_id"]))
            db.execute("UPDATE withdraw_requests SET status='topup_completed', processed_by=?, processed_at=CURRENT_TIMESTAMP, transaction_id=?, proof_url=? WHERE id=?", (user["user_id"], transaction_id, proof_url, wid))
            return {"message": f"Top-up of Rs.{w['net_amount']} approved and added to user wallet."}
        elif w["status"] == "pending":
            db.execute("UPDATE withdraw_requests SET status='completed', processed_by=?, processed_at=CURRENT_TIMESTAMP, transaction_id=?, proof_url=? WHERE id=?", (user["user_id"], transaction_id, proof_url, wid))
            return {"message": "Withdrawal approved and processed"}
        else:
            raise HTTPException(status_code=400, detail="Already processed")


@router.post("/withdrawals/{wid}/reject")
async def reject_withdrawal(wid: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        w = db.execute("SELECT * FROM withdraw_requests WHERE id = ? AND status = 'pending'", (wid,)).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (w["amount"], w["user_id"]))
        db.execute("UPDATE withdraw_requests SET status='rejected', processed_by=?, processed_at=CURRENT_TIMESTAMP WHERE id=?", (user["user_id"], wid))
        return {"message": "Withdrawal rejected. Amount returned to wallet."}


@router.post("/withdrawals/{wid}/upload-proof")
async def upload_withdrawal_proof(wid: int, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload proof screenshot for withdrawal approval"""
    require_role(user, ["admin"])
    upload_dir = "/data/uploads/withdrawal_proofs"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "proof.png")[1] or ".png"
    filename = f"wd_{wid}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    proof_url = f"/uploads/withdrawal_proofs/{filename}"
    with get_db() as db:
        db.execute("UPDATE withdraw_requests SET proof_url=? WHERE id=?", (proof_url, wid))
    return {"proof_url": proof_url, "message": "Proof uploaded"}


# --- TEAM DATA (for admin promotion) ---
@router.get("/teams")
async def admin_list_teams(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    import json
    with get_db() as db:
        rows = db.execute(
            "SELECT t.*, u.name as captain_name, u.phone as captain_phone FROM teams t JOIN users u ON t.captain_id = u.id ORDER BY t.created_at DESC"
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            member_ids = json.loads(d["members"]) if d["members"] else []
            member_details = []
            for mid in member_ids:
                mu = db.execute("SELECT id, name, phone FROM users WHERE id = ?", (mid,)).fetchone()
                if mu:
                    member_details.append({"id": mu["id"], "name": mu["name"], "phone": mu["phone"]})
                else:
                    member_details.append({"id": mid, "name": f"Player #{mid}", "phone": ""})
            d["members"] = member_ids
            d["member_details"] = member_details
            d["member_count"] = len(member_ids)
            result.append(d)
        return result


# --- TRANSACTION HISTORY (ALL BOOKINGS WITH OWNER INFO) ---
@router.get("/transactions/history")
async def admin_transaction_history(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.payment_gateway, b.status, b.payment_status, b.created_at,
            u.name as user_name, u.phone as user_phone,
            g.name as ground_name, o.name as owner_name, o.phone as owner_phone
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN grounds g ON b.ground_id = g.id
            JOIN users o ON g.owner_id = o.id
            ORDER BY b.created_at DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


# --- KYC MANAGEMENT ---
@router.get("/kyc/pending")
async def pending_kyc(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT id, name, phone, email, role, kyc_status, bank_name, bank_account, bank_ifsc, upi_id, kyc_doc_type, kyc_doc_url FROM users WHERE kyc_status = 'pending'").fetchall()
        return [dict(r) for r in rows]


@router.put("/users/{user_id}/kyc/reject")
async def reject_kyc(user_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    reason = body.get("reason", "Your KYC documents could not be verified. Please re-submit with valid documents.")
    with get_db() as db:
        owner = db.execute(
            "SELECT name, email, phone, old_bank_name, old_bank_account, old_bank_ifsc, old_upi_id, old_kyc_doc_type, old_kyc_doc_url FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        # Check if this is a Re-KYC rejection (old bank details exist)
        has_old_details = owner and owner["old_bank_account"]
        if has_old_details:
            # Restore old bank details and set back to verified
            db.execute(
                """UPDATE users SET
                    kyc_status = 'verified',
                    kyc_reject_reason = ?,
                    bank_name = old_bank_name,
                    bank_account = old_bank_account,
                    bank_ifsc = old_bank_ifsc,
                    upi_id = old_upi_id,
                    kyc_doc_type = old_kyc_doc_type,
                    kyc_doc_url = old_kyc_doc_url,
                    old_bank_name = NULL, old_bank_account = NULL, old_bank_ifsc = NULL,
                    old_upi_id = NULL, old_kyc_doc_type = NULL, old_kyc_doc_url = NULL
                WHERE id = ?""",
                (reason, user_id,)
            )
        else:
            # Normal KYC rejection
            db.execute("UPDATE users SET kyc_status = 'rejected', kyc_reject_reason = ? WHERE id = ?", (reason, user_id,))
        # Send rejection email to owner
        if owner and owner["email"]:
            try:
                from app.services.email_service import send_kyc_rejection_email
                send_kyc_rejection_email(owner["email"], owner["name"] or "Owner", reason)
            except Exception:
                pass
        msg = "Re-KYC rejected. Old bank details restored." if has_old_details else "KYC rejected and owner notified via email"
        return {"message": msg}


# --- KYC DOCS VIEWING ---
@router.get("/kyc/all")
async def all_kyc(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            "SELECT id, name, phone, email, role, kyc_status, kyc_reject_reason, bank_name, bank_account, bank_ifsc, upi_id, kyc_doc_type, kyc_doc_url, old_bank_name, old_bank_account, old_bank_ifsc, old_upi_id FROM users WHERE kyc_status IS NOT NULL AND kyc_status != 'not_submitted' AND kyc_status != 'none' ORDER BY CASE kyc_status WHEN 'pending' THEN 0 WHEN 'verified' THEN 1 WHEN 'rejected' THEN 2 END"
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["is_rekyc"] = bool(d.get("old_bank_account"))
            result.append(d)
        return result


@router.get("/kyc/{user_id}")
async def get_kyc_details(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        u = db.execute(
            "SELECT id, name, phone, email, role, kyc_status, bank_name, bank_account, bank_ifsc, upi_id, kyc_doc_type, kyc_doc_url FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(u)


# --- TICKET SYSTEM ---
@router.get("/tickets")
async def list_all_tickets(status: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = """SELECT t.*, u.name as user_name, u.phone as user_phone, u.role as user_role,
                   g.name as ground_name FROM tickets t
                   JOIN users u ON t.user_id = u.id
                   LEFT JOIN grounds g ON t.ground_id = g.id"""
        params: list = []
        if status:
            query += " WHERE t.status = ?"
            params.append(status)
        query += " ORDER BY t.created_at DESC"
        rows = db.execute(query, params).fetchall()
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
async def admin_reply_ticket(ticket_id: int, data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ticket = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        db.execute(
            "INSERT INTO ticket_replies (ticket_id, user_id, message) VALUES (?, ?, ?)",
            (ticket_id, user["user_id"], data.get("message", "")),
        )
        db.execute("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (ticket_id,))
        return {"message": "Reply sent successfully"}


@router.put("/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: int, data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    new_status = data.get("status", "open")
    if new_status not in ("open", "in_progress", "resolved", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    with get_db() as db:
        db.execute("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, ticket_id))
        return {"message": f"Ticket status updated to {new_status}"}


# --- GROUND STATEMENT (HTML) --- BUG-022 FIX: Renamed to reflect actual format
@router.get("/grounds/{ground_id}/statement/html")
async def ground_statement_html(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT name FROM grounds WHERE id = ?", (ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.status, u.name as user_name, u.phone as user_phone
            FROM bookings b JOIN users u ON b.user_id = u.id
            WHERE b.ground_id = ? ORDER BY b.created_at DESC""",
            (ground_id,),
        ).fetchall()
        total_rev = sum(r["total_amount"] for r in rows if r["status"] != "cancelled")
        total_bookings = len([r for r in rows if r["status"] != "cancelled"])
        html = f"<html><head><style>body{{font-family:Arial;margin:20px}}table{{width:100%;border-collapse:collapse;margin-top:15px}}th,td{{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}}th{{background:#1a5f2a;color:white}}h1{{color:#1a5f2a}}.summary{{margin:10px 0;padding:10px;background:#f5f5f5;border-radius:5px}}</style></head><body>"
        html += f"<h1>BookAGround - Ground Statement</h1><h2>{ground['name']}</h2>"
        html += f"<div class='summary'><b>Total Revenue:</b> Rs.{total_rev} | <b>Total Bookings:</b> {total_bookings}</div>"
        html += "<table><tr><th>Booking ID</th><th>Date</th><th>Time</th><th>Amount</th><th>Token</th><th>Payment</th><th>Status</th><th>User</th><th>Phone</th></tr>"
        for r in rows:
            html += f"<tr><td>{r['booking_id']}</td><td>{r['booking_date']}</td><td>{r['start_time']}-{r['end_time']}</td><td>Rs.{r['total_amount']}</td><td>Rs.{r['token_amount']}</td><td>{r['payment_mode']}</td><td>{r['status']}</td><td>{r['user_name']}</td><td>{r['user_phone']}</td></tr>"
        html += "</table></body></html>"
        return StreamingResponse(
            iter([html.encode()]),
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=ground_{ground_id}_statement.html"}
        )


# BUG-022: Keep old PDF route as alias for backward compatibility
@router.get("/grounds/{ground_id}/statement/pdf")
async def ground_statement_pdf(ground_id: int, user: dict = Depends(get_current_user)):
    return await ground_statement_html(ground_id, user)


# --- TELEGRAM NOTIFICATION ---
@router.post("/notifications/telegram/test")
async def test_telegram(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        bot_token = db.execute("SELECT value FROM settings WHERE key='telegram_bot_token'").fetchone()
        chat_id = db.execute("SELECT value FROM settings WHERE key='telegram_chat_id'").fetchone()
        if not bot_token or not chat_id or not bot_token["value"] or not chat_id["value"]:
            raise HTTPException(status_code=400, detail="Configure Telegram Bot Token and Chat ID in Settings first")
        import urllib.request
        try:
            url = f"https://api.telegram.org/bot{bot_token['value']}/sendMessage"
            data = f'{{"chat_id":"{chat_id["value"]}","text":"✅ BookAGround Notification Test - Working!","parse_mode":"HTML"}}'.encode()
            req2 = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req2, timeout=10)
            return {"message": "Test notification sent to Telegram!"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Telegram send failed: {str(e)}")


# ============ V11 NEW ENDPOINTS ============

# --- SETTLEMENTS CSV DOWNLOAD ---
@router.get("/settlements/csv")
async def settlements_csv(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owners = db.execute("SELECT DISTINCT u.id, u.name, u.phone FROM users u JOIN grounds g ON u.id = g.owner_id WHERE u.role = 'owner'").fetchall()
        cr_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        commission_rate = float(cr_row["value"]) if cr_row else 10
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Owner", "Phone", "Online Revenue", "Cash Revenue", "Total Revenue", "Commission", "Withdrawn", "Net Payable"])
        for owner in owners:
            grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id=?", (owner["id"],)).fetchall()
            online_rev = cash_rev = total_comm = 0
            for g in grounds:
                o_r = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                c_r = db.execute("SELECT COALESCE(SUM(total_amount),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                rate = g["commission_rate"] if g["commission_rate"] is not None else commission_rate
                online_rev += o_r; cash_rev += c_r; total_comm += o_r * rate / 100
            withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (owner["id"],)).fetchone()["total"]
            net = round(online_rev - total_comm - withdrawn, 2)
            writer.writerow([owner["name"], owner["phone"], online_rev, cash_rev, online_rev+cash_rev, round(total_comm,2), withdrawn, net])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=settlements.csv"})


# --- TEAM DATA CSV DOWNLOAD ---
@router.get("/teams/csv")
async def teams_csv(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    import json as _json
    with get_db() as db:
        rows = db.execute("SELECT t.*, u.name as captain_name, u.phone as captain_phone FROM teams t JOIN users u ON t.captain_id = u.id ORDER BY t.created_at DESC").fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Team ID", "Team Name", "Captain", "Captain Phone", "Members Count", "Members", "Wins", "Losses", "Matches", "Created"])
        for r in rows:
            member_ids = _json.loads(r["members"]) if r["members"] else []
            member_names = []
            for mid in member_ids:
                mu = db.execute("SELECT name, phone FROM users WHERE id = ?", (mid,)).fetchone()
                member_names.append(f"{mu['name']}({mu['phone']})" if mu else f"#{mid}")
            writer.writerow([r["id"], r["name"], r["captain_name"], r["captain_phone"], len(member_ids), "; ".join(member_names), r["wins"], r["losses"], r["matches_played"], r["created_at"]])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=teams.csv"})


# --- GROUND STATEMENT EMAIL TO OWNER ---
@router.post("/grounds/{ground_id}/statement/email")
async def email_ground_statement(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground = db.execute("SELECT g.name, u.email as owner_email, u.name as owner_name FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.id = ?", (ground_id,)).fetchone()
        if not ground:
            raise HTTPException(status_code=404, detail="Ground not found")
        if not ground["owner_email"]:
            raise HTTPException(status_code=400, detail="Owner has no email address")
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.status, u.name as user_name
            FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.ground_id = ? ORDER BY b.created_at DESC""",
            (ground_id,),
        ).fetchall()
        total_rev = sum(r["total_amount"] for r in rows if r["status"] != "cancelled")
        html = f"<html><body style='font-family:Arial;'><h2 style='color:#1a5f2a'>BookAGround - Statement for {ground['name']}</h2>"
        html += f"<p><b>Total Revenue:</b> Rs.{total_rev} | <b>Total Bookings:</b> {len([r for r in rows if r['status'] != 'cancelled'])}</p>"
        html += "<table style='width:100%;border-collapse:collapse;margin-top:10px'><tr style='background:#1a5f2a;color:white'><th style='padding:8px;border:1px solid #ddd'>Booking ID</th><th style='padding:8px;border:1px solid #ddd'>Date</th><th style='padding:8px;border:1px solid #ddd'>Time</th><th style='padding:8px;border:1px solid #ddd'>Amount</th><th style='padding:8px;border:1px solid #ddd'>Status</th><th style='padding:8px;border:1px solid #ddd'>User</th></tr>"
        for r in rows:
            html += f"<tr><td style='padding:6px;border:1px solid #ddd'>{r['booking_id']}</td><td style='padding:6px;border:1px solid #ddd'>{r['booking_date']}</td><td style='padding:6px;border:1px solid #ddd'>{r['start_time']}-{r['end_time']}</td><td style='padding:6px;border:1px solid #ddd'>Rs.{r['total_amount']}</td><td style='padding:6px;border:1px solid #ddd'>{r['status']}</td><td style='padding:6px;border:1px solid #ddd'>{r['user_name']}</td></tr>"
        html += "</table></body></html>"
        from app.services.email_service import send_ground_statement_email
        send_ground_statement_email(ground["owner_email"], ground["name"], html)
        return {"message": f"Statement emailed to {ground['owner_email']}"}


# --- RE-KYC ENDPOINT ---
@router.put("/users/{user_id}/kyc/rekyc")
async def trigger_rekyc(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("UPDATE users SET kyc_status = 'rekyc_required' WHERE id = ?", (user_id,))
        return {"message": "Re-KYC required for this user. Withdrawals blocked until verified."}


# --- SEND TEST EMAIL ---
@router.post("/notifications/email/test")
async def test_email(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    to = data.get("to_email", "")
    if not to:
        raise HTTPException(status_code=400, detail="to_email required")
    from app.services.email_service import send_email_async
    send_email_async(to, "BookAGround - Test Email", "<div style='font-family:Arial;text-align:center;padding:40px'><h1 style='color:#1a5f2a'>Email Working!</h1><p>BookAGround email system is configured correctly.</p></div>")
    return {"message": f"Test email sent to {to}"}


# --- SEND BOOKING NOTIFICATION EMAIL ---
@router.post("/notifications/send")
async def send_notification(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    ntype = data.get("type", "")
    booking_id = data.get("booking_id", "")
    to_email = data.get("to_email", "")
    if not ntype:
        raise HTTPException(status_code=400, detail="type required")
    from app.services.email_service import send_email_async
    with get_db() as db:
        if booking_id:
            booking = db.execute("SELECT b.*, g.name as ground_name, u.email as user_email, u.name as user_name FROM bookings b JOIN grounds g ON b.ground_id = g.id JOIN users u ON b.user_id = u.id WHERE b.booking_id = ?", (booking_id,)).fetchone()
            if booking:
                to = to_email or booking["user_email"]
                if to:
                    from app.services.email_service import send_booking_confirmation, send_booking_cancellation
                    if ntype == "booking_confirmation":
                        send_booking_confirmation(dict(booking), to, booking["ground_name"])
                    elif ntype == "booking_cancellation":
                        send_booking_cancellation(dict(booking), to, booking["ground_name"], booking.get("refund_amount", 0))
                    return {"message": f"Notification sent to {to}"}
        if to_email:
            subject = data.get("subject", "BookAGround Notification")
            body = data.get("body", "<p>No content</p>")
            send_email_async(to_email, subject, body)
            return {"message": f"Email sent to {to_email}"}
        raise HTTPException(status_code=400, detail="No email address found")


# --- DETAILED REPORT ENDPOINT ---
@router.get("/reports/detailed")
async def detailed_report(report_type: str = Query("bookings"), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        if report_type == "bookings":
            rows = db.execute("""
                SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
                b.remaining_amount, b.payment_mode, b.payment_gateway, b.status, b.payment_status,
                b.discount_amount, b.cashback_amount, b.cash_verified, b.attendance, b.created_at,
                u.name as user_name, u.phone as user_phone, u.email as user_email,
                g.name as ground_name, g.city as ground_city, g.id as ground_id,
                o.name as owner_name, o.phone as owner_phone
                FROM bookings b JOIN users u ON b.user_id = u.id
                JOIN grounds g ON b.ground_id = g.id JOIN users o ON g.owner_id = o.id
                ORDER BY b.created_at DESC
            """).fetchall()
            return [dict(r) for r in rows]
        elif report_type == "revenue":
            rows = db.execute("""
                SELECT g.id, g.name, g.city, u.name as owner_name,
                COUNT(b.id) as total_bookings,
                COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN b.payment_mode NOT IN ('cash','offline') AND b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as online_revenue,
                COALESCE(SUM(CASE WHEN b.payment_mode IN ('cash','offline') AND b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as cash_revenue
                FROM grounds g JOIN users u ON g.owner_id = u.id
                LEFT JOIN bookings b ON g.id = b.ground_id
                GROUP BY g.id ORDER BY total_revenue DESC
            """).fetchall()
            return [dict(r) for r in rows]
        elif report_type == "users":
            rows = db.execute("""
                SELECT u.id, u.name, u.phone, u.email, u.role, u.wallet_balance, u.kyc_status, u.city, u.created_at,
                COUNT(b.id) as total_bookings,
                COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as total_spent
                FROM users u LEFT JOIN bookings b ON u.id = b.user_id
                GROUP BY u.id ORDER BY total_spent DESC
            """).fetchall()
            return [dict(r) for r in rows]
        elif report_type == "cancellations":
            rows = db.execute("""
                SELECT b.booking_id, b.booking_date, b.total_amount, b.cancel_charge, b.refund_amount,
                b.cancelled_by, b.cancel_reason, b.created_at,
                u.name as user_name, u.phone as user_phone,
                g.name as ground_name
                FROM bookings b JOIN users u ON b.user_id = u.id
                JOIN grounds g ON b.ground_id = g.id
                WHERE b.status = 'cancelled' ORDER BY b.created_at DESC
            """).fetchall()
            return [dict(r) for r in rows]
        return []


# --- REPORT CSV DOWNLOAD ---
@router.get("/reports/csv")
async def report_csv(report_type: str = Query("bookings"), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        output = io.StringIO()
        writer = csv.writer(output)
        if report_type == "bookings":
            writer.writerow(["Booking ID","Date","Time","Amount","Token","Remaining","Payment","Status","User","Phone","Ground","Owner"])
            rows = db.execute("""SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
                b.remaining_amount, b.payment_mode, b.status, u.name, u.phone, g.name as gname, o.name as oname
                FROM bookings b JOIN users u ON b.user_id = u.id JOIN grounds g ON b.ground_id = g.id JOIN users o ON g.owner_id = o.id
                ORDER BY b.created_at DESC""").fetchall()
            for r in rows:
                writer.writerow([r["booking_id"], r["booking_date"], f"{r['start_time']}-{r['end_time']}", r["total_amount"], r["token_amount"], r["remaining_amount"], r["payment_mode"], r["status"], r["name"], r["phone"], r["gname"], r["oname"]])
        elif report_type == "revenue":
            writer.writerow(["Ground","City","Owner","Bookings","Total Revenue","Online","Cash"])
            rows = db.execute("""SELECT g.name, g.city, u.name as oname, COUNT(b.id) as cnt,
                COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END),0) as rev,
                COALESCE(SUM(CASE WHEN b.payment_mode NOT IN ('cash','offline') AND b.status != 'cancelled' THEN b.total_amount ELSE 0 END),0) as online,
                COALESCE(SUM(CASE WHEN b.payment_mode IN ('cash','offline') AND b.status != 'cancelled' THEN b.total_amount ELSE 0 END),0) as cash
                FROM grounds g JOIN users u ON g.owner_id = u.id LEFT JOIN bookings b ON g.id = b.ground_id GROUP BY g.id""").fetchall()
            for r in rows:
                writer.writerow([r["name"], r["city"], r["oname"], r["cnt"], r["rev"], r["online"], r["cash"]])
        elif report_type == "users":
            writer.writerow(["Name","Phone","Email","Role","Wallet","KYC","City","Bookings","Total Spent"])
            rows = db.execute("""SELECT u.name, u.phone, u.email, u.role, u.wallet_balance, u.kyc_status, u.city,
                COUNT(b.id) as cnt, COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END),0) as spent
                FROM users u LEFT JOIN bookings b ON u.id = b.user_id GROUP BY u.id""").fetchall()
            for r in rows:
                writer.writerow([r["name"], r["phone"], r["email"], r["role"], r["wallet_balance"], r["kyc_status"], r["city"], r["cnt"], r["spent"]])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=report_{report_type}.csv"})


# --- REPORT EMAIL ---
@router.post("/reports/email")
async def email_report(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    to = data.get("to_email", "")
    report_type = data.get("report_type", "bookings")
    if not to:
        raise HTTPException(status_code=400, detail="to_email required")
    from app.services.email_service import send_email_async
    send_email_async(to, f"BookAGround - {report_type.capitalize()} Report", f"<div style='font-family:Arial'><h2 style='color:#1a5f2a'>BookAGround {report_type.capitalize()} Report</h2><p>Please download the report from admin panel.</p></div>")
    return {"message": f"Report notification sent to {to}"}


# --- ROLE MANAGEMENT ---
@router.get("/roles")
async def list_roles(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            roles = db.execute("SELECT * FROM admin_roles ORDER BY id").fetchall()
            return [dict(r) for r in roles]
        except Exception:
            return [
                {"id": 1, "name": "super_admin", "label": "Super Admin", "permissions": "all"},
                {"id": 2, "name": "admin", "label": "Admin", "permissions": "dashboard,grounds,bookings,users,payments,settlements,promos,kyc,teamdata,tickets,settings,reports"},
                {"id": 3, "name": "manager", "label": "Manager", "permissions": "dashboard,bookings,users,reports"},
                {"id": 4, "name": "support", "label": "Support", "permissions": "dashboard,bookings,tickets"},
            ]


@router.put("/users/{user_id}/permissions")
async def update_user_permissions(user_id: int, data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    permissions = data.get("permissions", "")
    sub_role = data.get("sub_role", "admin")
    with get_db() as db:
        try:
            db.execute("ALTER TABLE users ADD COLUMN sub_role TEXT DEFAULT 'admin'")
            db.commit()
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE users ADD COLUMN permissions TEXT")
            db.commit()
        except Exception:
            pass
        db.execute("UPDATE users SET sub_role = ?, permissions = ? WHERE id = ?", (sub_role, permissions, user_id))
        return {"message": "User permissions updated"}


# ============ V12 NEW ENDPOINTS ============

# --- SETTLEMENTS PDF DOWNLOAD ---
@router.get("/settlements/pdf")
async def settlements_pdf(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owners = db.execute("SELECT DISTINCT u.id, u.name, u.phone FROM users u JOIN grounds g ON u.id = g.owner_id WHERE u.role = 'owner'").fetchall()
        cr_row = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
        commission_rate = float(cr_row["value"]) if cr_row else 10
        html = "<html><head><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#1a5f2a;color:white}h1{color:#1a5f2a}.summary{margin:10px 0;padding:10px;background:#f5f5f5;border-radius:5px}</style></head><body>"
        html += "<h1>BookAGround - Settlements Report</h1>"
        html += f"<p>Generated: {datetime.now(IST).strftime('%Y-%m-%d %H:%M IST')}</p>"
        html += "<table><tr><th>Owner</th><th>Phone</th><th>Online Revenue</th><th>Cash Revenue</th><th>Total Revenue</th><th>Commission</th><th>Withdrawn</th><th>Net Payable</th></tr>"
        for owner in owners:
            grounds = db.execute("SELECT id, commission_rate FROM grounds WHERE owner_id=?", (owner["id"],)).fetchall()
            online_rev = cash_rev = total_comm = 0
            for g in grounds:
                o_r = db.execute("SELECT COALESCE(SUM(CASE WHEN status='no_show' THEN COALESCE(token_amount,0) ELSE total_amount END),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled') AND payment_mode NOT IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                c_r = db.execute("SELECT COALESCE(SUM(total_amount),0) as v FROM bookings WHERE ground_id=? AND status NOT IN ('cancelled','no_show') AND payment_mode IN ('cash','offline')", (g["id"],)).fetchone()["v"]
                rate = g["commission_rate"] if g["commission_rate"] is not None else commission_rate
                online_rev += o_r; cash_rev += c_r; total_comm += o_r * rate / 100
            withdrawn = db.execute("SELECT COALESCE(SUM(amount),0) as total FROM withdraw_requests WHERE user_id=? AND status IN ('pending','completed')", (owner["id"],)).fetchone()["total"]
            net = round(online_rev - total_comm - withdrawn, 2)
            html += f"<tr><td>{owner['name']}</td><td>{owner['phone']}</td><td>Rs.{online_rev}</td><td>Rs.{cash_rev}</td><td>Rs.{online_rev+cash_rev}</td><td>Rs.{round(total_comm,2)}</td><td>Rs.{withdrawn}</td><td>Rs.{net}</td></tr>"
        html += "</table></body></html>"
        return StreamingResponse(iter([html.encode()]), media_type="text/html", headers={"Content-Disposition": "attachment; filename=settlements_report.html"})


# --- WITHDRAWALS CSV DOWNLOAD ---
@router.get("/withdrawals/csv")
async def withdrawals_csv(status: str = Query(None), ground_id: int = Query(None), account_filter: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = """SELECT w.*, u.name as user_name, u.phone as user_phone, u.role as user_role, u.bank_name, u.bank_account, u.bank_ifsc, u.upi_id
                   FROM withdraw_requests w JOIN users u ON w.user_id = u.id"""
        conditions = []
        params_list: list = []
        if status:
            conditions.append("w.status = ?")
            params_list.append(status)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY w.created_at DESC"
        rows = db.execute(query, params_list).fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "User", "Phone", "Role", "Amount", "Charge", "Net Amount", "Status", "Bank", "Account", "IFSC", "UPI", "Transaction ID", "Proof", "Created", "Processed"])
        for r in rows:
            d = dict(r)
            writer.writerow([d["id"], d["user_name"], d["user_phone"], d["user_role"], d["amount"], d.get("charge",0), d.get("net_amount",0), d["status"], d.get("bank_name",""), d.get("bank_account",""), d.get("bank_ifsc",""), d.get("upi_id",""), d.get("transaction_id",""), d.get("proof_url",""), d["created_at"], d.get("processed_at","")])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=withdrawals.csv"})


# --- WITHDRAWALS PDF DOWNLOAD ---
@router.get("/withdrawals/pdf")
async def withdrawals_pdf(status: str = Query(None), user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        query = """SELECT w.*, u.name as user_name, u.phone as user_phone, u.role as user_role, u.bank_name, u.bank_account, u.bank_ifsc, u.upi_id
                   FROM withdraw_requests w JOIN users u ON w.user_id = u.id"""
        params_list: list = []
        if status:
            query += " WHERE w.status = ?"
            params_list.append(status)
        query += " ORDER BY w.created_at DESC"
        rows = db.execute(query, params_list).fetchall()
        html = "<html><head><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:11px}th{background:#1a5f2a;color:white}h1{color:#1a5f2a}</style></head><body>"
        html += "<h1>BookAGround - Withdrawal Requests</h1>"
        html += f"<p>Generated: {datetime.now(IST).strftime('%Y-%m-%d %H:%M IST')}</p>"
        html += "<table><tr><th>ID</th><th>User</th><th>Phone</th><th>Amount</th><th>Charge</th><th>Net</th><th>Status</th><th>Bank</th><th>Account</th><th>IFSC</th><th>UPI</th><th>TXN ID</th><th>Date</th></tr>"
        for r in rows:
            d = dict(r)
            html += f"<tr><td>{d['id']}</td><td>{d['user_name']}</td><td>{d['user_phone']}</td><td>Rs.{d['amount']}</td><td>Rs.{d.get('charge',0)}</td><td>Rs.{d.get('net_amount',0)}</td><td>{d['status']}</td><td>{d.get('bank_name','') or '-'}</td><td>{d.get('bank_account','') or '-'}</td><td>{d.get('bank_ifsc','') or '-'}</td><td>{d.get('upi_id','') or '-'}</td><td>{d.get('transaction_id','') or '-'}</td><td>{d['created_at']}</td></tr>"
        html += "</table></body></html>"
        return StreamingResponse(iter([html.encode()]), media_type="text/html", headers={"Content-Disposition": "attachment; filename=withdrawals_report.html"})


# --- TRANSACTION HISTORY CSV DOWNLOAD ---
@router.get("/transactions/csv")
async def transactions_csv(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.payment_gateway, b.status, b.created_at,
            b.discount_amount, b.cashback_amount,
            u.name as user_name, u.phone as user_phone,
            g.name as ground_name, o.name as owner_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN grounds g ON b.ground_id = g.id
            JOIN users o ON g.owner_id = o.id
            ORDER BY b.created_at DESC"""
        ).fetchall()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Booking ID", "Date", "Time", "Ground", "Owner", "User", "Phone", "Token Amount", "Cash Amount", "Online Amount", "Total Amount", "Payment Mode", "Gateway", "Status", "Discount", "Cashback", "Created"])
        for r in rows:
            token_amt = r["token_amount"] or 0
            total_amt = r["total_amount"] or 0
            remaining = r["remaining_amount"] or 0
            if r["payment_mode"] in ("cash", "offline"):
                cash_amt = total_amt
                online_amt = 0
            else:
                cash_amt = 0
                online_amt = total_amt
            d = dict(r)
            writer.writerow([d["booking_id"], d["booking_date"], f"{d['start_time']}-{d['end_time']}", d["ground_name"], d["owner_name"], d["user_name"], d["user_phone"], token_amt, cash_amt, online_amt, total_amt, d["payment_mode"], d.get("payment_gateway",""), d["status"], d.get("discount_amount",0), d.get("cashback_amount",0), d["created_at"]])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=transactions.csv"})


# --- TRANSACTION HISTORY PDF DOWNLOAD ---
@router.get("/transactions/pdf")
async def transactions_pdf(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute(
            """SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.token_amount,
            b.remaining_amount, b.payment_mode, b.status, b.created_at,
            u.name as user_name, u.phone as user_phone,
            g.name as ground_name, o.name as owner_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN grounds g ON b.ground_id = g.id
            JOIN users o ON g.owner_id = o.id
            ORDER BY b.created_at DESC"""
        ).fetchall()
        total_all = sum(r["total_amount"] for r in rows if r["status"] != "cancelled")
        total_token = sum((r["token_amount"] or 0) for r in rows if r["status"] != "cancelled")
        total_online = sum((r["total_amount"] or 0) for r in rows if r["status"] != "cancelled" and r["payment_mode"] not in ("cash","offline"))
        total_cash = sum((r["total_amount"] or 0) for r in rows if r["status"] != "cancelled" and r["payment_mode"] in ("cash","offline"))
        html = "<html><head><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px}th{background:#1a5f2a;color:white}h1{color:#1a5f2a}.summary{display:flex;gap:15px;margin:10px 0}.stat{background:#f5f5f5;padding:10px 15px;border-radius:8px;text-align:center}.stat b{display:block;color:#1a5f2a;font-size:16px}</style></head><body>"
        html += "<h1>BookAGround - Transaction History</h1>"
        html += f"<p>Generated: {datetime.now(IST).strftime('%Y-%m-%d %H:%M IST')}</p>"
        html += f"<div class='summary'><div class='stat'><b>Rs.{total_all}</b>Total</div><div class='stat'><b>Rs.{total_token}</b>Token</div><div class='stat'><b>Rs.{total_online}</b>Online</div><div class='stat'><b>Rs.{total_cash}</b>Cash</div></div>"
        html += "<table><tr><th>Booking ID</th><th>Date</th><th>Time</th><th>Ground</th><th>Owner</th><th>User</th><th>Token</th><th>Cash</th><th>Online</th><th>Total</th><th>Payment</th><th>Status</th></tr>"
        for r in rows:
            token_amt = r["token_amount"] or 0
            total_amt = r["total_amount"] or 0
            if r["payment_mode"] in ("cash", "offline"):
                cash_amt = total_amt; online_amt = 0
            else:
                cash_amt = 0; online_amt = total_amt
            html += f"<tr><td>{r['booking_id']}</td><td>{r['booking_date']}</td><td>{r['start_time']}-{r['end_time']}</td><td>{r['ground_name']}</td><td>{r['owner_name']}</td><td>{r['user_name']}</td><td>Rs.{token_amt}</td><td>Rs.{cash_amt}</td><td>Rs.{online_amt}</td><td>Rs.{total_amt}</td><td>{r['payment_mode']}</td><td>{r['status']}</td></tr>"
        html += "</table></body></html>"
        return StreamingResponse(iter([html.encode()]), media_type="text/html", headers={"Content-Disposition": "attachment; filename=transactions_report.html"})


# --- KYC IMAGE SERVE ENDPOINT ---
@router.get("/kyc/image/{user_id}")
async def get_kyc_image(user_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        u = db.execute("SELECT kyc_doc_url FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u or not u["kyc_doc_url"]:
            raise HTTPException(status_code=404, detail="No KYC document found")
        doc_url = u["kyc_doc_url"]
        # Return the URL info so frontend can display it
        is_image = any(doc_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp'])
        return {"url": doc_url, "is_image": is_image, "user_id": user_id}


# --- OWNER WALLET BALANCES ---
@router.get("/owner-wallets")
async def get_owner_wallets(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owners = db.execute(
            """SELECT u.id, u.name, u.phone, u.email, u.wallet_balance, u.kyc_status,
            u.bank_name, u.bank_account, u.bank_ifsc, u.upi_id,
            COUNT(DISTINCT g.id) as ground_count,
            COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
            COUNT(DISTINCT b.id) as total_bookings
            FROM users u
            LEFT JOIN grounds g ON g.owner_id = u.id
            LEFT JOIN bookings b ON b.ground_id = g.id
            WHERE u.role = 'owner'
            GROUP BY u.id
            ORDER BY u.name"""
        ).fetchall()
        result = []
        for o in owners:
            od = dict(o)
            # Calculate net payable (commission deducted)
            comm = db.execute("SELECT value FROM settings WHERE key='standard_commission'").fetchone()
            rate = float(comm["value"]) if comm else 10.0
            settled = db.execute("SELECT COALESCE(SUM(net_payable), 0) as v FROM settlements WHERE owner_id = ? AND status='completed'", (od["id"],)).fetchone()["v"]
            withdrawn = db.execute("SELECT COALESCE(SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END), 0) as v FROM withdraw_requests WHERE user_id = ? AND status = 'completed'", (od["id"],)).fetchone()["v"]
            gross = od["total_revenue"]
            commission = round(gross * rate / 100, 2)
            net_payable = round(gross - commission - settled - withdrawn, 2)
            od["commission"] = commission
            od["settled"] = settled
            od["withdrawn"] = withdrawn
            od["net_payable"] = net_payable
            result.append(od)
        return result


# --- OWNER STAFF DETAILS (for admin) ---
@router.get("/owner/{owner_id}/staff")
async def get_owner_staff(owner_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        owner = db.execute("SELECT name, phone FROM users WHERE id = ? AND role = 'owner'", (owner_id,)).fetchone()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        try:
            staff = db.execute("SELECT * FROM owner_staff WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,)).fetchall()
            return {"owner_name": owner["name"], "owner_phone": owner["phone"], "staff": [dict(s) for s in staff]}
        except Exception:
            return {"owner_name": owner["name"], "owner_phone": owner["phone"], "staff": []}


# --- GALLERY IMAGE UPLOAD ---
@router.post("/gallery/upload")
async def admin_upload_gallery_image(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin", "owner"])
    import base64
    body = await request.json()
    image_data = body.get("image_data", "")
    ground_id = body.get("ground_id", 0)
    caption = body.get("caption", "")
    if not image_data or not ground_id:
        raise HTTPException(status_code=400, detail="Image data and ground_id required")
    # Save base64 image as file
    import os, uuid
    upload_dir = "/opt/bookaground/uploads/gallery"
    os.makedirs(upload_dir, exist_ok=True)
    ext = "jpg"
    if "data:image/png" in image_data:
        ext = "png"
    elif "data:image/webp" in image_data:
        ext = "webp"
    # Strip data URI prefix
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(image_data))
    image_url = f"/uploads/gallery/{filename}"
    with get_db() as db:
        db.execute("INSERT INTO gallery (ground_id, image_url, caption) VALUES (?, ?, ?)", (ground_id, image_url, caption))
    return {"message": "Image uploaded", "image_url": image_url}


# ============================================================
# V17 - NEW FEATURE ENDPOINTS
# ============================================================

# --- TOURNAMENT MANAGEMENT (Admin) ---
@router.get("/tournaments")
async def admin_list_tournaments(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("""
                SELECT t.*, u.name as organizer_name,
                (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = t.id) as registered_teams
                FROM tournaments t LEFT JOIN users u ON t.organizer_id = u.id
                ORDER BY t.created_at DESC
            """).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.post("/tournaments")
async def admin_create_tournament(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        db.execute(
            """INSERT INTO tournaments (organizer_id, name, ground_id, sport_type, start_date, end_date,
            max_teams, entry_fee, prize_pool, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')""",
            (user["user_id"], body.get("name"), body.get("ground_id"), body.get("sport_type", "cricket"),
             body.get("start_date"), body.get("end_date"), body.get("max_teams", 8),
             body.get("entry_fee", 0), body.get("prize_pool", 0), body.get("description", ""))
        )
        return {"message": "Tournament created"}

@router.put("/tournaments/{tournament_id}")
async def admin_update_tournament(tournament_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        updates = []
        params = []
        for field in ["name", "status", "start_date", "end_date", "max_teams", "entry_fee", "prize_pool", "description"]:
            if field in body:
                updates.append(f"{field} = ?")
                params.append(body[field])
        if updates:
            params.append(tournament_id)
            db.execute(f"UPDATE tournaments SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Tournament updated"}

@router.delete("/tournaments/{tournament_id}")
async def admin_delete_tournament(tournament_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM tournament_registrations WHERE tournament_id = ?", (tournament_id,))
        db.execute("DELETE FROM tournaments WHERE id = ?", (tournament_id,))
        return {"message": "Tournament deleted"}

@router.get("/tournaments/{tournament_id}/registrations")
async def admin_tournament_registrations(tournament_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("""
            SELECT tr.*, u.name as user_name, u.phone as user_phone
            FROM tournament_registrations tr LEFT JOIN users u ON tr.user_id = u.id
            WHERE tr.tournament_id = ?
        """, (tournament_id,)).fetchall()
        return [dict(r) for r in rows]

# --- AUDIT LOG ---
@router.get("/audit-log")
async def get_audit_log(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("""
                SELECT a.*, u.name as user_name, u.role as user_role
                FROM audit_log a LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC LIMIT 500
            """).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.post("/audit-log")
async def add_audit_log(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    with get_db() as db:
        db.execute(
            "INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user["user_id"], body.get("action"), body.get("entity_type"), body.get("entity_id"),
             body.get("details"), ip, ua, body.get("location", ""))
        )
        return {"message": "Log added"}

# --- EQUIPMENT RENTAL ---
@router.get("/equipment")
async def admin_list_equipment(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("""
                SELECT e.*, g.name as ground_name
                FROM equipment_rental e LEFT JOIN grounds g ON e.ground_id = g.id
                ORDER BY e.created_at DESC
            """).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.post("/equipment")
async def admin_add_equipment(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        db.execute(
            "INSERT INTO equipment_rental (ground_id, name, category, price_per_hour, quantity, description) VALUES (?, ?, ?, ?, ?, ?)",
            (body.get("ground_id"), body.get("name"), body.get("category", "cricket"),
             body.get("price_per_hour", 50), body.get("quantity", 1), body.get("description", ""))
        )
        return {"message": "Equipment added"}

@router.put("/equipment/{equipment_id}")
async def admin_update_equipment(equipment_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        updates = []
        params = []
        for field in ["name", "category", "price_per_hour", "quantity", "description", "is_active"]:
            if field in body:
                updates.append(f"{field} = ?")
                params.append(body[field])
        if updates:
            params.append(equipment_id)
            db.execute(f"UPDATE equipment_rental SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Equipment updated"}

@router.delete("/equipment/{equipment_id}")
async def admin_delete_equipment(equipment_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM equipment_rental WHERE id = ?", (equipment_id,))
        return {"message": "Equipment deleted"}

# --- LOYALTY POINTS ---
@router.get("/loyalty")
async def admin_loyalty_overview(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            users_with_points = db.execute("""
                SELECT u.id, u.name, u.phone, lp.points, lp.total_earned, lp.total_redeemed, lp.tier
                FROM loyalty_points lp JOIN users u ON lp.user_id = u.id
                ORDER BY lp.points DESC
            """).fetchall()
            total_points = db.execute("SELECT COALESCE(SUM(points), 0) as v FROM loyalty_points").fetchone()["v"]
            return {"users": [dict(r) for r in users_with_points], "total_active_points": total_points}
        except Exception:
            return {"users": [], "total_active_points": 0}

@router.post("/loyalty/adjust")
async def admin_adjust_loyalty(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    user_id = body.get("user_id")
    points = body.get("points", 0)
    reason = body.get("reason", "Admin adjustment")
    with get_db() as db:
        existing = db.execute("SELECT * FROM loyalty_points WHERE user_id = ?", (user_id,)).fetchone()
        if existing:
            new_points = existing["points"] + points
            if points > 0:
                db.execute("UPDATE loyalty_points SET points = ?, total_earned = total_earned + ? WHERE user_id = ?", (new_points, points, user_id))
            else:
                db.execute("UPDATE loyalty_points SET points = ?, total_redeemed = total_redeemed + ? WHERE user_id = ?", (new_points, abs(points), user_id))
        else:
            db.execute("INSERT INTO loyalty_points (user_id, points, total_earned) VALUES (?, ?, ?)", (user_id, max(0, points), max(0, points)))
        db.execute("INSERT INTO loyalty_transactions (user_id, points, type, description) VALUES (?, ?, ?, ?)",
                   (user_id, points, "credit" if points > 0 else "debit", reason))
        return {"message": f"Points adjusted by {points}"}

# --- AUTO SETTLEMENT ---
@router.get("/auto-settlements")
async def admin_auto_settlements(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("""
                SELECT a.*, u.name as owner_name, u.phone as owner_phone
                FROM auto_settlements a JOIN users u ON a.owner_id = u.id
                ORDER BY a.created_at DESC
            """).fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.post("/auto-settlements")
async def admin_create_auto_settlement(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        db.execute(
            "INSERT OR REPLACE INTO auto_settlements (owner_id, frequency, next_settlement_date, is_active) VALUES (?, ?, ?, 1)",
            (body.get("owner_id"), body.get("frequency", "weekly"), body.get("next_date"))
        )
        return {"message": "Auto settlement configured"}

@router.post("/auto-settlements/run")
async def run_auto_settlements(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            pending = db.execute("SELECT * FROM auto_settlements WHERE is_active = 1").fetchall()
            processed = 0
            for a in pending:
                processed += 1
                db.execute("UPDATE auto_settlements SET last_settlement_date = datetime('now') WHERE id = ?", (a["id"],))
            return {"message": f"Processed {processed} auto settlements"}
        except Exception:
            return {"message": "Auto settlement run complete"}

# --- EMAIL TEMPLATES ---
@router.get("/email-templates")
async def admin_list_email_templates(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("SELECT * FROM email_templates ORDER BY name").fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.put("/email-templates/{template_id}")
async def admin_update_email_template(template_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        updates = []
        params = []
        for field in ["subject", "body", "is_active"]:
            if field in body:
                updates.append(f"{field} = ?")
                params.append(body[field])
        updates.append("updated_at = datetime('now')")
        if updates:
            params.append(template_id)
            db.execute(f"UPDATE email_templates SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Template updated"}

@router.post("/email-templates/preview")
async def preview_email_template(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    template_body = body.get("body", "")
    sample_vars = body.get("variables", {})
    for key, val in sample_vars.items():
        template_body = template_body.replace("{{" + key + "}}", str(val))
    return {"preview": template_body}

# --- PAGES (Privacy, About, Contact, Terms) ---
@router.get("/pages")
async def admin_list_pages(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        try:
            rows = db.execute("SELECT * FROM pages ORDER BY title").fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

@router.put("/pages/{page_id}")
async def admin_update_page(page_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        updates = []
        params = []
        for field in ["title", "content", "meta_description", "is_published"]:
            if field in body:
                updates.append(f"{field} = ?")
                params.append(body[field])
        updates.append("updated_at = datetime('now')")
        params.append(page_id)
        db.execute(f"UPDATE pages SET {', '.join(updates)} WHERE id = ?", params)
        return {"message": "Page updated"}

@router.post("/pages")
async def admin_create_page(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        db.execute(
            "INSERT INTO pages (slug, title, content, meta_description) VALUES (?, ?, ?, ?)",
            (body.get("slug"), body.get("title"), body.get("content", ""), body.get("meta_description", ""))
        )
        return {"message": "Page created"}

# --- BULK OPERATIONS ---
@router.post("/bulk/bookings")
async def bulk_booking_action(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    action = body.get("action")
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No items selected")
    with get_db() as db:
        if action == "cancel":
            for bid in ids:
                try:
                    booking = db.execute("SELECT * FROM bookings WHERE booking_id = ?", (bid,)).fetchone()
                    if booking and booking["status"] in ("confirmed", "pending_cash", "awaiting_approval"):
                        db.execute("UPDATE bookings SET status='cancelled', cancelled_by='admin' WHERE booking_id=?", (bid,))
                        db.execute("UPDATE slots SET status='available' WHERE id=?", (booking["slot_id"],))
                except Exception:
                    pass
        elif action == "confirm":
            for bid in ids:
                try:
                    db.execute("UPDATE bookings SET status='confirmed' WHERE booking_id=?", (bid,))
                except Exception:
                    pass
        return {"message": f"Bulk {action} applied to {len(ids)} bookings"}

@router.post("/bulk/users")
async def bulk_user_action(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    action = body.get("action")
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No items selected")
    with get_db() as db:
        if action == "ban":
            db.execute(f"UPDATE users SET is_banned = 1 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "unban":
            db.execute(f"UPDATE users SET is_banned = 0 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "suspend":
            db.execute(f"UPDATE users SET is_suspended = 1 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "unsuspend":
            db.execute(f"UPDATE users SET is_suspended = 0 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "delete":
            db.execute(f"DELETE FROM users WHERE id IN ({','.join('?' * len(ids))}) AND role = 'user'", ids)
        return {"message": f"Bulk {action} applied to {len(ids)} users"}

@router.post("/bulk/grounds")
async def bulk_ground_action(request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    action = body.get("action")
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No items selected")
    with get_db() as db:
        if action == "activate":
            db.execute(f"UPDATE grounds SET is_active = 1 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "deactivate":
            db.execute(f"UPDATE grounds SET is_active = 0 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "feature":
            db.execute(f"UPDATE grounds SET is_featured = 1 WHERE id IN ({','.join('?' * len(ids))})", ids)
        elif action == "unfeature":
            db.execute(f"UPDATE grounds SET is_featured = 0 WHERE id IN ({','.join('?' * len(ids))})", ids)
        return {"message": f"Bulk {action} applied to {len(ids)} grounds"}


# --- GALLERY MANAGEMENT ---
@router.get("/grounds/{ground_id}/gallery")
async def admin_get_gallery(ground_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT id, ground_id, image_url, caption, created_at FROM ground_gallery WHERE ground_id = ? ORDER BY id DESC", (ground_id,)).fetchall()
        return [dict(r) for r in rows]


@router.post("/gallery/upload")
async def admin_upload_gallery(data: dict, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        ground_id = data.get("ground_id")
        image_data = data.get("image_data", "")
        caption = data.get("caption", "")
        if not ground_id or not image_data:
            raise HTTPException(400, "ground_id and image_data required")
        # Store base64 image data as URL (or save to file)
        import base64, uuid, os
        if image_data.startswith("data:image"):
            # Save to /data/uploads/ directory
            os.makedirs("/data/uploads/gallery", exist_ok=True)
            ext = "jpg"
            if "png" in image_data[:30]:
                ext = "png"
            elif "webp" in image_data[:30]:
                ext = "webp"
            filename = f"{uuid.uuid4().hex}.{ext}"
            b64_data = image_data.split(",", 1)[1] if "," in image_data else image_data
            filepath = f"/data/uploads/gallery/{filename}"
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(b64_data))
            image_url = f"/uploads/gallery/{filename}"
        else:
            image_url = image_data
        db.execute("INSERT INTO ground_gallery (ground_id, image_url, caption) VALUES (?,?,?)",
                    (ground_id, image_url, caption))
        img_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        return {"id": img_id, "image_url": image_url, "message": "Image uploaded"}


# --- CONTACT SUBMISSIONS ---
@router.get("/contact-submissions")
async def get_contact_submissions(user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        rows = db.execute("SELECT * FROM contact_submissions ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

@router.put("/contact-submissions/{sub_id}")
async def update_contact_submission(sub_id: int, request: Request, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    body = await request.json()
    with get_db() as db:
        status = body.get("status", "read")
        reply = body.get("admin_reply", "")
        db.execute("UPDATE contact_submissions SET status = ?, admin_reply = ? WHERE id = ?", (status, reply, sub_id))
        return {"message": "Submission updated"}

@router.delete("/contact-submissions/{sub_id}")
async def delete_contact_submission(sub_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        db.execute("DELETE FROM contact_submissions WHERE id = ?", (sub_id,))
        return {"message": "Submission deleted"}


@router.delete("/grounds/photos/{photo_id}")
async def admin_delete_gallery_photo(photo_id: int, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    with get_db() as db:
        row = db.execute("SELECT * FROM ground_gallery WHERE id = ?", (photo_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Photo not found")
        # Delete file if local
        import os
        url = row["image_url"]
        if url and url.startswith("/uploads/") or url.startswith("/data/uploads/"):
            filepath = f"/data{url}" if url.startswith("/uploads/") else url
            if os.path.exists(filepath):
                os.remove(filepath)
        db.execute("DELETE FROM ground_gallery WHERE id = ?", (photo_id,))
        return {"message": "Photo deleted"}


# --- BULK OPERATIONS ---

class BulkIdsRequest(BaseModel):
    ids: list[int]


@router.post("/grounds/bulk-delete")
async def bulk_delete_grounds(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        placeholders = ",".join("?" for _ in req.ids)
        db.execute(f"DELETE FROM grounds WHERE id IN ({placeholders})", req.ids)
        return {"message": f"{len(req.ids)} ground(s) deleted"}


@router.post("/users/bulk-delete")
async def bulk_delete_users(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        # Don't allow deleting yourself
        req.ids = [uid for uid in req.ids if uid != user["user_id"]]
        if not req.ids:
            raise HTTPException(400, "Cannot delete yourself")
        placeholders = ",".join("?" for _ in req.ids)
        db.execute(f"DELETE FROM users WHERE id IN ({placeholders})", req.ids)
        return {"message": f"{len(req.ids)} user(s) deleted"}


@router.post("/kyc/bulk-verify")
async def bulk_verify_kyc(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        placeholders = ",".join("?" for _ in req.ids)
        db.execute(
            f"""UPDATE users SET kyc_status = 'verified',
                kyc_reject_reason = NULL,
                old_bank_name = NULL, old_bank_account = NULL, old_bank_ifsc = NULL,
                old_upi_id = NULL, old_kyc_doc_type = NULL, old_kyc_doc_url = NULL
            WHERE id IN ({placeholders})""",
            req.ids
        )
        return {"message": f"{len(req.ids)} KYC(s) verified"}


@router.post("/kyc/bulk-reject")
async def bulk_reject_kyc(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        placeholders = ",".join("?" for _ in req.ids)
        db.execute(
            f"UPDATE users SET kyc_status = 'rejected', kyc_reject_reason = 'Bulk rejected by admin' WHERE id IN ({placeholders})",
            req.ids
        )
        return {"message": f"{len(req.ids)} KYC(s) rejected"}


@router.post("/withdrawals/bulk-approve")
async def bulk_approve_withdrawals(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        count = 0
        for wid in req.ids:
            w = db.execute("SELECT * FROM withdraw_requests WHERE id = ? AND status = 'pending'", (wid,)).fetchone()
            if w:
                db.execute(
                    "UPDATE withdraw_requests SET status='completed', processed_by=?, processed_at=CURRENT_TIMESTAMP WHERE id=?",
                    (user["user_id"], wid)
                )
                count += 1
        return {"message": f"{count} withdrawal(s) approved"}


@router.post("/withdrawals/bulk-reject")
async def bulk_reject_withdrawals(req: BulkIdsRequest, user: dict = Depends(get_current_user)):
    require_role(user, ["admin"])
    if not req.ids:
        raise HTTPException(400, "No IDs provided")
    with get_db() as db:
        count = 0
        for wid in req.ids:
            w = db.execute("SELECT * FROM withdraw_requests WHERE id = ? AND status = 'pending'", (wid,)).fetchone()
            if w:
                db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (w["amount"], w["user_id"]))
                db.execute(
                    "UPDATE withdraw_requests SET status='rejected', processed_by=?, processed_at=CURRENT_TIMESTAMP WHERE id=?",
                    (user["user_id"], wid)
                )
                count += 1
        return {"message": f"{count} withdrawal(s) rejected"}
