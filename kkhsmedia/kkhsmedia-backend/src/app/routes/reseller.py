"""Reseller/White-label panel for managing sub-users."""
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs, hash_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reseller", tags=["Reseller"])


class CreateResellerRequest(BaseModel):
    userId: str
    commissionRate: float = 15  # percentage
    maxClients: int = 50
    brandName: str = ""
    customDomain: str = ""


class CreateClientRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    maxSlots: int = 5


# ============ ADMIN: Manage Resellers ============

@router.post("/admin/create")
async def admin_create_reseller(req: CreateResellerRequest, admin=Depends(get_admin_user)):
    """Promote a user to reseller."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(req.userId)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reseller_code = f"RS-{uuid.uuid4().hex[:8].upper()}"
    await db.users.update_one(
        {"_id": ObjectId(req.userId)},
        {"$set": {
            "role": "reseller",
            "resellerCode": reseller_code,
            "resellerConfig": {
                "commissionRate": req.commissionRate,
                "maxClients": req.maxClients,
                "brandName": req.brandName,
                "customDomain": req.customDomain,
                "totalClients": 0,
            },
            "updatedAt": datetime.utcnow(),
        }}
    )
    return {"message": "Reseller created", "resellerCode": reseller_code}


@router.get("/admin/list")
async def admin_list_resellers(admin=Depends(get_admin_user)):
    """List all resellers."""
    db = get_db()
    resellers = await db.users.find({"role": "reseller"}).to_list(200)
    result = []
    for r in resellers:
        client_count = await db.users.count_documents({"createdByReseller": str(r["_id"])})
        result.append({
            "id": str(r["_id"]),
            "firstName": r.get("firstName", ""),
            "lastName": r.get("lastName", ""),
            "email": r.get("email", ""),
            "resellerCode": r.get("resellerCode", ""),
            "config": r.get("resellerConfig", {}),
            "totalClients": client_count,
            "createdAt": r.get("createdAt", "").isoformat() if isinstance(r.get("createdAt"), datetime) else "",
        })
    return result


@router.delete("/admin/{reseller_id}")
async def admin_remove_reseller(reseller_id: str, admin=Depends(get_admin_user)):
    """Demote reseller back to regular user."""
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(reseller_id)},
        {"$set": {"role": "user"}, "$unset": {"resellerCode": "", "resellerConfig": ""}}
    )
    return {"message": "Reseller demoted to user"}


# ============ RESELLER: Manage Clients ============

async def get_reseller_user(user=Depends(get_current_user)):
    """Dependency: check if user is a reseller."""
    if user.get("role") not in ("reseller", "admin"):
        raise HTTPException(status_code=403, detail="Reseller access required")
    return user


@router.get("/dashboard")
async def reseller_dashboard(user=Depends(get_reseller_user)):
    """Reseller dashboard stats."""
    db = get_db()
    reseller_id = user["id"]

    total_clients = await db.users.count_documents({"createdByReseller": reseller_id})
    active_clients = await db.users.count_documents({"createdByReseller": reseller_id, "status": "active"})
    total_slots = await db.slots.count_documents({"resellerUserId": reseller_id})
    streaming_slots = await db.slots.count_documents({"resellerUserId": reseller_id, "isStreaming": True})

    # Revenue from clients
    client_ids = [str(u["_id"]) async for u in db.users.find({"createdByReseller": reseller_id}, {"_id": 1})]
    pipeline = [
        {"$match": {"userId": {"$in": client_ids}, "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]
    rev_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = rev_result[0]["total"] if rev_result else 0

    config = user.get("resellerConfig", {})
    commission = round(total_revenue * config.get("commissionRate", 15) / 100, 2)

    return {
        "totalClients": total_clients,
        "activeClients": active_clients,
        "maxClients": config.get("maxClients", 50),
        "totalSlots": total_slots,
        "streamingSlots": streaming_slots,
        "totalRevenue": total_revenue,
        "commission": commission,
        "commissionRate": config.get("commissionRate", 15),
        "brandName": config.get("brandName", ""),
    }


@router.get("/clients")
async def reseller_list_clients(page: int = 1, limit: int = 20, user=Depends(get_reseller_user)):
    """List reseller's clients."""
    db = get_db()
    query = {"createdByReseller": user["id"]}
    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    clients = await db.users.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for c in clients:
        slots = await db.slots.count_documents({"userId": str(c["_id"])})
        streaming = await db.slots.count_documents({"userId": str(c["_id"]), "isStreaming": True})
        result.append({
            "id": str(c["_id"]),
            "firstName": c.get("firstName", ""),
            "lastName": c.get("lastName", ""),
            "email": c.get("email", ""),
            "status": c.get("status", "active"),
            "totalSlots": slots,
            "streamingSlots": streaming,
            "maxSlots": c.get("maxSlots", 5),
            "createdAt": c.get("createdAt", "").isoformat() if isinstance(c.get("createdAt"), datetime) else "",
        })

    return {"clients": result, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("/clients")
async def reseller_create_client(req: CreateClientRequest, user=Depends(get_reseller_user)):
    """Create a new client under reseller."""
    db = get_db()
    config = user.get("resellerConfig", {})
    current_count = await db.users.count_documents({"createdByReseller": user["id"]})
    if current_count >= config.get("maxClients", 50):
        raise HTTPException(status_code=400, detail="Maximum client limit reached")

    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    client = {
        "firstName": req.firstName,
        "lastName": req.lastName,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "phone": "",
        "address": {},
        "role": "user",
        "emailVerified": True,
        "status": "active",
        "createdByReseller": user["id"],
        "maxSlots": req.maxSlots,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.users.insert_one(client)
    return {"message": "Client created", "clientId": str(result.inserted_id)}


@router.put("/clients/{client_id}/status")
async def reseller_update_client_status(client_id: str, status: str = "active", user=Depends(get_reseller_user)):
    """Update client status (active/suspended)."""
    if status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'suspended'")
    db = get_db()
    client = await db.users.find_one({"_id": ObjectId(client_id), "createdByReseller": user["id"]})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await db.users.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Client status updated to {status}"}


@router.delete("/clients/{client_id}")
async def reseller_delete_client(client_id: str, user=Depends(get_reseller_user)):
    """Delete a client and their data."""
    db = get_db()
    client = await db.users.find_one({"_id": ObjectId(client_id), "createdByReseller": user["id"]})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await db.slots.delete_many({"userId": client_id})
    await db.videos.delete_many({"userId": client_id})
    await db.users.delete_one({"_id": ObjectId(client_id)})
    return {"message": "Client deleted"}
