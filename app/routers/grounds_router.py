from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.auth import get_current_user, get_optional_user
from datetime import datetime, date as date_type, timezone, timedelta
import re

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/grounds", tags=["grounds"])


def generate_slug(name: str, city: str) -> str:
    """Generate a URL-friendly slug from ground name and city"""
    text = f"{name} {city}".lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    text = text.strip('-')
    return text


@router.get("/slug-map")
async def get_slug_map():
    """Return mapping of ground slugs to IDs for frontend routing"""
    with get_db() as db:
        rows = db.execute("SELECT id, name, city, slug FROM grounds WHERE is_active = 1").fetchall()
        result = []
        for r in rows:
            row = dict(r)
            slug = row.get("slug") or generate_slug(row["name"], row["city"])
            result.append({"id": row["id"], "slug": slug, "name": row["name"], "city": row["city"]})
        return result


@router.get("/by-slug/{slug}")
async def get_ground_by_slug(slug: str, user: dict = Depends(get_optional_user)):
    """Get ground details by slug"""
    with get_db() as db:
        # First try to find by slug column
        ground = db.execute(
            "SELECT g.*, u.name as owner_name, u.phone as owner_phone FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.slug = ?",
            (slug,),
        ).fetchone()
        
        # If not found, try to match by generated slug
        if not ground:
            rows = db.execute(
                "SELECT g.*, u.name as owner_name, u.phone as owner_phone FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.is_active = 1"
            ).fetchall()
            for r in rows:
                row = dict(r)
                generated_slug = generate_slug(row["name"], row["city"])
                if generated_slug == slug:
                    ground = r
                    # Save slug to DB for future lookups
                    try:
                        db.execute("UPDATE grounds SET slug = ? WHERE id = ?", (slug, row["id"]))
                    except Exception:
                        pass
                    break
        
        if not ground:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Ground not found")
        
        ground_id = dict(ground)["id"]
        reviews = db.execute(
            """SELECT r.*, u.name as reviewer_name FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.target_type = 'ground' AND r.target_id = ?
            ORDER BY r.created_at DESC LIMIT 10""",
            (ground_id,),
        ).fetchall()

        result = {**dict(ground), "reviews": [dict(r) for r in reviews]}
        # Add slug to response
        if not result.get("slug"):
            result["slug"] = generate_slug(result["name"], result["city"])
        
        cc_row = db.execute("SELECT value FROM settings WHERE key='customer_care_number'").fetchone()
        customer_care = cc_row["value"] if cc_row else "9782005500"
        result["customer_care_number"] = customer_care

        show_phone = False
        if user:
            booking = db.execute(
                "SELECT id FROM bookings WHERE user_id = ? AND ground_id = ? AND status IN ('confirmed','completed','awaiting_approval')",
                (user["user_id"], ground_id),
            ).fetchone()
            if booking:
                show_phone = True
            if user.get("role") in ("owner", "admin"):
                show_phone = True
        if not show_phone:
            result["owner_phone"] = customer_care
        return result


@router.get("")
async def list_grounds(
    city: str = Query(None),
    sport_type: str = Query(None),
    ground_type: str = Query(None),
    search: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    sort: str = Query("rating"),
    lat: float = Query(None),
    lng: float = Query(None),
):
    with get_db() as db:
        # BUG-016 FIX: Filter out test/garbage grounds (name too short or obviously test data)
        query = "SELECT g.*, u.name as owner_name FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.is_active = 1 AND LENGTH(g.name) > 3"
        params: list = []
        if city:
            query += " AND LOWER(g.city) = LOWER(?)"
            params.append(city)
        if sport_type:
            query += " AND g.sport_type = ?"
            params.append(sport_type)
        if ground_type:
            query += " AND g.ground_type = ?"
            params.append(ground_type)
        if search:
            query += " AND (LOWER(g.name) LIKE LOWER(?) OR LOWER(g.address) LIKE LOWER(?))"
            params.extend([f"%{search}%", f"%{search}%"])
        if min_price:
            query += " AND g.weekday_price >= ?"
            params.append(min_price)
        if max_price:
            query += " AND g.weekday_price <= ?"
            params.append(max_price)

        if sort == "price_low":
            query += " ORDER BY g.weekday_price ASC"
        elif sort == "price_high":
            query += " ORDER BY g.weekday_price DESC"
        elif sort == "bookings":
            query += " ORDER BY g.total_bookings DESC"
        else:
            query += " ORDER BY g.rating DESC"

        rows = db.execute(query, params).fetchall()
        results = [dict(r) for r in rows]
        # Add slug to each ground
        for r in results:
            if not r.get("slug"):
                r["slug"] = generate_slug(r["name"], r["city"])
        if lat is not None and lng is not None:
            import math
            for r in results:
                g_lat = r.get("latitude")
                g_lng = r.get("longitude")
                if g_lat and g_lng:
                    R = 6371
                    dlat = math.radians(g_lat - lat)
                    dlng = math.radians(g_lng - lng)
                    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(g_lat)) * math.sin(dlng/2)**2
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                    r["distance_km"] = round(R * c, 1)
                else:
                    r["distance_km"] = None
            if sort in ("distance", "nearest"):
                results.sort(key=lambda x: x.get("distance_km") or 9999)
        return results


@router.get("/featured")
async def featured_grounds():
    with get_db() as db:
        rows = db.execute(
            "SELECT g.*, u.name as owner_name FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.is_active = 1 ORDER BY g.rating DESC, g.total_bookings DESC LIMIT 6"
        ).fetchall()
        results = [dict(r) for r in rows]
        for r in results:
            if not r.get("slug"):
                r["slug"] = generate_slug(r["name"], r["city"])
        return results


@router.get("/cities")
async def get_cities():
    with get_db() as db:
        rows = db.execute("SELECT DISTINCT city FROM grounds WHERE is_active = 1 ORDER BY city").fetchall()
        return [r["city"] for r in rows]


@router.get("/{ground_id}")
async def get_ground(ground_id: int, user: dict = Depends(get_optional_user)):
    with get_db() as db:
        ground = db.execute(
            "SELECT g.*, u.name as owner_name, u.phone as owner_phone FROM grounds g JOIN users u ON g.owner_id = u.id WHERE g.id = ?",
            (ground_id,),
        ).fetchone()
        if not ground:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Ground not found")

        reviews = db.execute(
            """SELECT r.*, u.name as reviewer_name FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.target_type = 'ground' AND r.target_id = ?
            ORDER BY r.created_at DESC LIMIT 10""",
            (ground_id,),
        ).fetchall()

        result = {**dict(ground), "reviews": [dict(r) for r in reviews]}
        # Add slug to response
        if not result.get("slug"):
            result["slug"] = generate_slug(result["name"], result["city"])
        # Get customer care number from settings
        cc_row = db.execute("SELECT value FROM settings WHERE key='customer_care_number'").fetchone()
        customer_care = cc_row["value"] if cc_row else "9782005500"
        result["customer_care_number"] = customer_care

        # Hide owner phone unless user has a confirmed/completed booking for this ground
        show_phone = False
        if user:
            booking = db.execute(
                "SELECT id FROM bookings WHERE user_id = ? AND ground_id = ? AND status IN ('confirmed','completed','awaiting_approval')",
                (user["user_id"], ground_id),
            ).fetchone()
            if booking:
                show_phone = True
            # Owner/admin can always see
            if user.get("role") in ("owner", "admin"):
                show_phone = True
        if not show_phone:
            result["owner_phone"] = customer_care
        return result


@router.get("/{ground_id}/slots")
async def get_slots(ground_id: int, date: str = Query(...)):
    with get_db() as db:
        # Don't allow booking past dates
        now = datetime.now(IST)
        today = now.strftime("%Y-%m-%d")

        slots = db.execute(
            "SELECT * FROM slots WHERE ground_id = ? AND date = ? ORDER BY start_time",
            (ground_id, date),
        ).fetchall()

        # If no slots exist for this date, generate them
        if not slots:
            ground = db.execute("SELECT * FROM grounds WHERE id = ?", (ground_id,)).fetchone()
            if ground:
                dt = datetime.strptime(date, "%Y-%m-%d")
                is_weekend = dt.weekday() >= 5
                base_price = ground["weekend_price"] if is_weekend else ground["weekday_price"]
                open_h = int(ground["opening_time"].split(":")[0]) if ground["opening_time"] else 6
                close_h = int(ground["closing_time"].split(":")[0]) if ground["closing_time"] else 23
                for hour in range(open_h, close_h):
                    price = base_price + (ground["evening_extra"] if hour >= 17 else 0)
                    db.execute(
                        "INSERT INTO slots (ground_id, date, start_time, end_time, price, status) VALUES (?, ?, ?, ?, ?, 'available')",
                        (ground_id, date, f"{hour:02d}:00", f"{hour+1:02d}:00", price),
                    )
                slots = db.execute(
                    "SELECT * FROM slots WHERE ground_id = ? AND date = ? ORDER BY start_time",
                    (ground_id, date),
                ).fetchall()

        # Mark past slots as unavailable for today
        result = []
        for s in slots:
            slot = dict(s)
            if date == today:
                slot_hour = int(slot["start_time"].split(":")[0])
                if slot_hour <= now.hour and slot["status"] == "available":
                    slot["status"] = "past"
            elif date < today:
                if slot["status"] == "available":
                    slot["status"] = "past"
            result.append(slot)

        return result
