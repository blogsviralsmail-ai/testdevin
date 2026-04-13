from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from bson import ObjectId

from app.database import get_db
from app.models.schemas import (
    AdminUpdateUserRequest, UpdateProductRequest, CreateProductRequest,
    UpdateSettingsRequest,
)
from app.utils.auth import get_admin_user, serialize_doc, serialize_docs, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============ DASHBOARD ============
@router.get("/dashboard")
async def admin_dashboard(admin=Depends(get_admin_user)):
    db = get_db()
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    total_users = await db.users.count_documents({"role": "user"})
    new_users_30d = await db.users.count_documents({"role": "user", "createdAt": {"$gte": thirty_days_ago}})
    total_slots = await db.slots.count_documents({})
    active_slots = await db.slots.count_documents({"status": "active"})
    streaming_slots = await db.slots.count_documents({"isStreaming": True})
    total_videos = await db.videos.count_documents({})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"status": "paid"})

    # Revenue
    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    pipeline_30d = [
        {"$match": {"status": "paid", "createdAt": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]
    revenue_30d_result = await db.orders.aggregate(pipeline_30d).to_list(1)
    revenue_30d = revenue_30d_result[0]["total"] if revenue_30d_result else 0

    # Revenue chart (last 30 days by day)
    chart_pipeline = [
        {"$match": {"status": "paid", "createdAt": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "revenue": {"$sum": "$totalAmount"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]
    revenue_chart = await db.orders.aggregate(chart_pipeline).to_list(31)

    # Recent orders
    recent_orders = await db.orders.find().sort("createdAt", -1).to_list(5)

    # Recent users
    recent_users = await db.users.find({"role": "user"}).sort("createdAt", -1).to_list(5)

    return {
        "stats": {
            "totalUsers": total_users,
            "newUsers30d": new_users_30d,
            "totalSlots": total_slots,
            "activeSlots": active_slots,
            "streamingSlots": streaming_slots,
            "totalVideos": total_videos,
            "totalOrders": total_orders,
            "paidOrders": paid_orders,
            "totalRevenue": total_revenue,
            "revenue30d": revenue_30d,
        },
        "revenueChart": [{"date": r["_id"], "revenue": r["revenue"], "orders": r["orders"]} for r in revenue_chart],
        "recentOrders": serialize_docs(recent_orders),
        "recentUsers": [{
            "id": str(u["_id"]),
            "firstName": u.get("firstName", ""),
            "lastName": u.get("lastName", ""),
            "email": u["email"],
            "createdAt": u.get("createdAt", "").isoformat() if isinstance(u.get("createdAt"), datetime) else "",
        } for u in recent_users],
    }


# ============ USER MANAGEMENT ============
@router.get("/users")
async def get_users(
    page: int = 1, limit: int = 20, search: str = "", status: str = "",
    admin=Depends(get_admin_user)
):
    db = get_db()
    query = {"role": {"$in": ["user", "moderator"]}}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"firstName": {"$regex": search, "$options": "i"}},
            {"lastName": {"$regex": search, "$options": "i"}},
        ]
    if status:
        query["status"] = status

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    users = await db.users.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    safe_users = []
    for u in users:
        slots_count = await db.slots.count_documents({"userId": str(u["_id"])})
        active_slots = await db.slots.count_documents({"userId": str(u["_id"]), "status": "active"})
        safe_users.append({
            "id": str(u["_id"]),
            "firstName": u.get("firstName", ""),
            "lastName": u.get("lastName", ""),
            "email": u["email"],
            "phone": u.get("phone", ""),
            "role": u.get("role", "user"),
            "status": u.get("status", "active"),
            "emailVerified": u.get("emailVerified", False),
            "totalSlots": slots_count,
            "activeSlots": active_slots,
            "planUnlimited": u.get("planUnlimited", False),
            "createdAt": u.get("createdAt", "").isoformat() if isinstance(u.get("createdAt"), datetime) else "",
        })

    return {"users": safe_users, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    slots = await db.slots.find({"userId": user_id}).to_list(100)
    orders = await db.orders.find({"userId": user_id}).sort("createdAt", -1).to_list(50)
    videos = await db.videos.find({"userId": user_id}).to_list(200)

    return {
        "user": {
            "id": str(user["_id"]),
            "firstName": user.get("firstName", ""),
            "lastName": user.get("lastName", ""),
            "email": user["email"],
            "phone": user.get("phone", ""),
            "address": user.get("address", {}),
            "status": user.get("status", "active"),
            "role": user.get("role", "user"),
            "emailVerified": user.get("emailVerified", False),
            "createdAt": user.get("createdAt", "").isoformat() if isinstance(user.get("createdAt"), datetime) else "",
        },
        "slots": serialize_docs(slots),
        "orders": serialize_docs(orders),
        "videos": serialize_docs(videos),
    }


@router.put("/users/{user_id}")
async def update_user(user_id: str, req: AdminUpdateUserRequest, admin=Depends(get_admin_user)):
    db = get_db()
    update = {"updatedAt": datetime.utcnow()}
    if req.status is not None:
        update["status"] = req.status
    if req.role is not None:
        update["role"] = req.role

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin")

    # Stop all streams
    streaming_slots = await db.slots.find({"userId": user_id, "isStreaming": True}).to_list(100)
    for slot in streaming_slots:
        if slot.get("streamProcessId"):
            from app.services.streaming import stop_ffmpeg_stream
            await stop_ffmpeg_stream(slot["streamProcessId"])

    await db.slots.delete_many({"userId": user_id})
    await db.videos.delete_many({"userId": user_id})
    await db.orders.delete_many({"userId": user_id})
    await db.users.delete_one({"_id": ObjectId(user_id)})

    return {"message": "User and all data deleted"}


# ============ SLOT MANAGEMENT ============
@router.get("/slots")
async def admin_get_slots(
    page: int = 1, limit: int = 20, status: str = "", streaming: str = "",
    admin=Depends(get_admin_user)
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if streaming == "true":
        query["isStreaming"] = True

    total = await db.slots.count_documents(query)
    skip = (page - 1) * limit
    slots = await db.slots.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    # Enrich with user info
    enriched = []
    for slot in slots:
        user = await db.users.find_one({"_id": ObjectId(slot["userId"])}) if slot.get("userId") else None
        s = serialize_doc(slot)
        s["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown"
        s["userEmail"] = user.get("email", "") if user else ""
        enriched.append(s)

    return {"slots": enriched, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("/slots/{slot_id}/force-stop")
async def admin_force_stop(slot_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.get("streamProcessId"):
        from app.services.streaming import stop_ffmpeg_stream
        await stop_ffmpeg_stream(slot["streamProcessId"])

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {"isStreaming": False, "streamProcessId": None, "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Stream force stopped"}


@router.put("/slots/{slot_id}/extend")
async def admin_extend_slot(slot_id: str, days: int = 30, admin=Depends(get_admin_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    current_expiry = slot.get("expiryDate") or datetime.utcnow()
    if not isinstance(current_expiry, datetime) or current_expiry < datetime.utcnow():
        current_expiry = datetime.utcnow()
    new_expiry = current_expiry + timedelta(days=days)

    await db.slots.update_one(
        {"_id": ObjectId(slot_id)},
        {"$set": {"status": "active", "expiryDate": new_expiry, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Slot extended by {days} days", "newExpiry": new_expiry.isoformat()}


# ============ VIDEO MANAGEMENT ============
@router.get("/videos")
async def admin_get_videos(page: int = 1, limit: int = 20, admin=Depends(get_admin_user)):
    db = get_db()
    total = await db.videos.count_documents({})
    skip = (page - 1) * limit
    videos = await db.videos.find().sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    enriched = []
    for video in videos:
        user = await db.users.find_one({"_id": ObjectId(video["userId"])}) if video.get("userId") else None
        v = serialize_doc(video)
        v["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown"
        v["userEmail"] = user.get("email", "") if user else ""
        enriched.append(v)

    # Total storage
    pipeline = [{"$group": {"_id": None, "totalSize": {"$sum": "$fileSize"}}}]
    size_result = await db.videos.aggregate(pipeline).to_list(1)
    total_storage = size_result[0]["totalSize"] if size_result else 0

    return {
        "videos": enriched,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "totalStorage": total_storage,
    }


# ============ ORDER MANAGEMENT ============
@router.get("/orders")
async def admin_get_orders(
    page: int = 1, limit: int = 20, status: str = "",
    admin=Depends(get_admin_user)
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status

    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    orders = await db.orders.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    enriched = []
    for order in orders:
        user = await db.users.find_one({"_id": ObjectId(order["userId"])}) if order.get("userId") else None
        o = serialize_doc(order)
        o["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown"
        o["userEmail"] = user.get("email", "") if user else ""
        enriched.append(o)

    return {"orders": enriched, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, new_status: str, admin=Depends(get_admin_user)):
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
    )

    # If marking as paid, activate slots
    if new_status == "paid" and order["status"] != "paid":
        from app.routes.orders import activate_slots
        await activate_slots(db, order)

    return {"message": f"Order status updated to {new_status}"}


# ============ PRODUCTS/PLANS ============
@router.get("/products")
async def admin_get_products(admin=Depends(get_admin_user)):
    db = get_db()
    products = await db.products.find().sort("sortOrder", 1).to_list(50)
    return serialize_docs(products)


@router.post("/products")
async def admin_create_product(req: CreateProductRequest, admin=Depends(get_admin_user)):
    db = get_db()
    product = {
        "name": req.name,
        "durationType": req.durationType,
        "durationValue": req.durationValue,
        "price": req.price,
        "features": req.features,
        "streamQuality": req.streamQuality,
        "isActive": req.isActive,
        "sortOrder": req.sortOrder,
        "createdAt": datetime.utcnow(),
    }
    result = await db.products.insert_one(product)
    product["id"] = str(result.inserted_id)
    return serialize_doc(product)


@router.put("/products/{product_id}")
async def admin_update_product(product_id: str, req: UpdateProductRequest, admin=Depends(get_admin_user)):
    db = get_db()
    update = {}
    for field, value in req.model_dump(exclude_none=True).items():
        update[field] = value
    if update:
        await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update})
    updated = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(updated)


@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}


# ============ SETTINGS ============
@router.get("/settings")
async def admin_get_settings(admin=Depends(get_admin_user)):
    db = get_db()
    settings = await db.settings.find_one({"key": "site"})
    if settings:
        return serialize_doc(settings)
    return {}


@router.put("/settings")
async def admin_update_settings(req: UpdateSettingsRequest, admin=Depends(get_admin_user)):
    db = get_db()
    update = {}
    for field, value in req.model_dump(exclude_none=True).items():
        update[field] = value
    if update:
        await db.settings.update_one({"key": "site"}, {"$set": update}, upsert=True)
    settings = await db.settings.find_one({"key": "site"})
    return serialize_doc(settings)


# ============ CONTACTS/MESSAGES ============
@router.get("/contacts")
async def admin_get_contacts(page: int = 1, limit: int = 20, admin=Depends(get_admin_user)):
    db = get_db()
    total = await db.contacts.count_documents({})
    skip = (page - 1) * limit
    contacts = await db.contacts.find().sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return {"contacts": serialize_docs(contacts), "total": total, "page": page}


@router.put("/contacts/{contact_id}/status")
async def admin_update_contact_status(contact_id: str, new_status: str = "read", admin=Depends(get_admin_user)):
    db = get_db()
    await db.contacts.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow()}}
    )
    return {"message": "Contact status updated"}


# ============ ASSIGN PLAN TO USER ============
from pydantic import BaseModel as _BaseModel


class AdminCreateUserRequest(_BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    phone: str = ""
    role: str = "user"


class AdminAssignPlanRequest(_BaseModel):
    userId: str
    slotCount: int = 1  # number of slots to assign (0 = unlimited)
    duration: int = 30  # duration in days
    planName: str = "Admin Assigned"
    unlimited: bool = False


@router.post("/create-user")
async def admin_create_user(req: AdminCreateUserRequest, admin=Depends(get_admin_user)):
    """Admin can create a new user directly."""
    db = get_db()
    existing = await db.users.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.utcnow()
    user_doc = {
        "firstName": req.firstName.strip(),
        "lastName": req.lastName.strip(),
        "email": req.email.lower().strip(),
        "password": hash_password(req.password),
        "phone": req.phone.strip(),
        "role": req.role if req.role in ("user", "admin", "moderator") else "user",
        "status": "active",
        "emailVerified": True,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.users.insert_one(user_doc)
    return {
        "message": f"User '{req.firstName} {req.lastName}' created successfully",
        "userId": str(result.inserted_id),
    }


@router.post("/assign-plan")
async def admin_assign_plan(req: AdminAssignPlanRequest, admin=Depends(get_admin_user)):
    """Admin assigns a plan to a user - only updates plan info on user record. User creates their own slots."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(req.userId)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()
    expiry = None if req.unlimited else now + timedelta(days=req.duration)
    slot_limit = 0 if req.unlimited else (req.slotCount if req.slotCount > 0 else 5)

    # Only update user record with plan info - no auto-creating slots
    plan_update = {
        "currentPlan": req.planName,
        "planSlots": slot_limit,
        "planUnlimited": req.unlimited,
        "planExpiry": expiry,
        "planAssignedAt": now,
        "planAssignedBy": str(admin["_id"]),
        "updatedAt": now,
    }
    await db.users.update_one({"_id": ObjectId(req.userId)}, {"$set": plan_update})

    slot_desc = "Unlimited" if req.unlimited else str(slot_limit)
    expiry_desc = "no expiry" if req.unlimited else f"{req.duration} days"
    return {
        "message": f"Plan '{req.planName}' assigned - {slot_desc} slots, {expiry_desc}",
    }


@router.get("/users/{user_id}/plan")
async def admin_get_user_plan(user_id: str, admin=Depends(get_admin_user)):
    """Get current plan info for a user."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    slots = await db.slots.find({"userId": user_id, "status": "active"}).to_list(100)
    return {
        "currentPlan": user.get("currentPlan", "None"),
        "planSlots": user.get("planSlots", 0),
        "planUnlimited": user.get("planUnlimited", False),
        "planExpiry": user.get("planExpiry", "").isoformat() if isinstance(user.get("planExpiry"), datetime) else None,
        "activeSlots": len(slots),
        "totalSlots": await db.slots.count_documents({"userId": user_id}),
    }


# ============ DELETE ENDPOINTS ============

@router.delete("/slots/{slot_id}")
async def admin_delete_slot(slot_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    slot = await db.slots.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Stop active stream before deleting
    if slot.get("streamProcessId"):
        from app.services.streaming import stop_ffmpeg_stream
        await stop_ffmpeg_stream(slot["streamProcessId"])

    await db.slots.delete_one({"_id": ObjectId(slot_id)})
    return {"message": "Slot deleted"}


@router.delete("/videos/{video_id}")
async def admin_delete_video(video_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    video = await db.videos.find_one({"_id": ObjectId(video_id)})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Delete local file if exists
    import os
    local_path = video.get("localPath", "")
    if local_path and os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass

    # Remove video references from slots
    await db.slots.update_many(
        {"videoId": video_id},
        {"$set": {"videoId": None, "updatedAt": datetime.utcnow()}}
    )

    await db.videos.delete_one({"_id": ObjectId(video_id)})
    return {"message": "Video deleted"}


@router.delete("/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    result = await db.contacts.delete_one({"_id": ObjectId(contact_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}


# ============ ANALYTICS ============
@router.get("/analytics")
async def admin_analytics(period: str = "30d", admin=Depends(get_admin_user)):
    db = get_db()
    now = datetime.utcnow()

    if period == "7d":
        start = now - timedelta(days=7)
    elif period == "30d":
        start = now - timedelta(days=30)
    elif period == "90d":
        start = now - timedelta(days=90)
    else:
        start = now - timedelta(days=365)

    # User growth
    user_pipeline = [
        {"$match": {"role": "user", "createdAt": {"$gte": start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]
    user_growth = await db.users.aggregate(user_pipeline).to_list(365)

    # Revenue by day
    revenue_pipeline = [
        {"$match": {"status": "paid", "createdAt": {"$gte": start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "revenue": {"$sum": "$totalAmount"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}}
    ]
    revenue_data = await db.orders.aggregate(revenue_pipeline).to_list(365)

    # Plan popularity
    plan_pipeline = [
        {"$match": {"status": "paid"}},
        {"$unwind": "$slots"},
        {"$group": {"_id": "$slots.durationType", "count": {"$sum": 1}, "revenue": {"$sum": "$slots.total"}}},
    ]
    plan_data = await db.orders.aggregate(plan_pipeline).to_list(10)

    # Platform distribution
    platform_pipeline = [
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]
    platform_data = await db.slots.aggregate(platform_pipeline).to_list(10)

    return {
        "userGrowth": [{"date": r["_id"], "users": r["count"]} for r in user_growth],
        "revenueData": [{"date": r["_id"], "revenue": r["revenue"], "orders": r["orders"]} for r in revenue_data],
        "planPopularity": [{"plan": r["_id"], "count": r["count"], "revenue": r.get("revenue", 0)} for r in plan_data],
        "platformDistribution": [{"platform": r["_id"], "count": r["count"]} for r in platform_data],
    }


# ============ LOGO UPLOAD ============
from fastapi import UploadFile, File, Form
import os
import shutil
from pathlib import Path

UPLOAD_DIR = Path("/var/www/kkhsmedia-app/uploads/logos")

@router.post("/upload-logo")
async def admin_upload_logo(
    file: UploadFile = File(...),
    logo_type: str = Form(...),  # header, footer, favicon
    admin=Depends(get_admin_user),
):
    """Upload a logo image. logo_type: header, footer, favicon"""
    if logo_type not in ("header", "footer", "favicon"):
        raise HTTPException(status_code=400, detail="logo_type must be header, footer, or favicon")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "png"
    if ext not in ("png", "jpg", "jpeg", "webp", "svg", "ico"):
        raise HTTPException(status_code=400, detail="Unsupported image format")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{logo_type}-logo.{ext}"
    if logo_type == "favicon":
        filename = f"favicon.{ext}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    # Also copy to the main frontend directory for direct serving
    frontend_dir = Path("/var/www/kkhsmedia-app")
    if logo_type == "header":
        shutil.copy2(filepath, frontend_dir / "header-logo.png")
    elif logo_type == "footer":
        shutil.copy2(filepath, frontend_dir / "footer-logo.png")
    elif logo_type == "favicon":
        shutil.copy2(filepath, frontend_dir / "favicon.png")

    logo_url = f"/uploads/logos/{filename}"

    # Update settings in DB
    db = get_db()
    field_map = {"header": "headerLogoUrl", "footer": "footerLogoUrl", "favicon": "faviconUrl"}
    await db.settings.update_one(
        {"key": "site"},
        {"$set": {field_map[logo_type]: logo_url, "updatedAt": datetime.utcnow()}},
        upsert=True,
    )

    return {"url": logo_url, "filename": filename, "type": logo_type}


# ============ ROLE MANAGEMENT ============

ROLE_PERMISSIONS = {
    "admin": [
        "dashboard", "users", "users.create", "users.edit", "users.delete",
        "slots", "slots.manage", "slots.delete",
        "videos", "videos.delete",
        "orders", "orders.manage",
        "products", "products.create", "products.edit", "products.delete",
        "settings", "settings.edit",
        "analytics", "contacts", "contacts.delete",
        "roles", "roles.manage",
    ],
    "moderator": [
        "dashboard", "users", "users.edit",
        "slots", "slots.manage",
        "videos",
        "orders",
        "contacts",
    ],
    "user": [
        "own_profile", "own_slots", "own_videos", "own_orders",
    ],
}


@router.get("/roles")
async def get_roles(admin=Depends(get_admin_user)):
    """Get all available roles and their permissions."""
    return {
        "roles": [
            {"name": "admin", "label": "Administrator", "description": "Full system access", "permissions": ROLE_PERMISSIONS["admin"], "color": "red"},
            {"name": "moderator", "label": "Moderator", "description": "Manage users, slots, videos and orders", "permissions": ROLE_PERMISSIONS["moderator"], "color": "blue"},
            {"name": "user", "label": "User", "description": "Standard user access", "permissions": ROLE_PERMISSIONS["user"], "color": "green"},
        ]
    }


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin=Depends(get_admin_user)):
    """Update a user's role. Only admins can change roles."""
    if role not in ("admin", "moderator", "user"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be admin, moderator, or user")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent demoting yourself
    if str(user["_id"]) == str(admin["_id"]) and role != "admin":
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"User role updated to {role}"}


@router.put("/users/{user_id}/reset-password")
async def admin_reset_user_password(user_id: str, new_password: str = "Temp@1234", admin=Depends(get_admin_user)):
    """Admin can reset any user's password."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hash_password(new_password), "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Password reset successfully"}
