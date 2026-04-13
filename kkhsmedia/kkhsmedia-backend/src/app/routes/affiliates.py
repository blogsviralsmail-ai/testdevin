"""Affiliate/Referral system for earning commissions."""
import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/affiliates", tags=["Affiliates"])


# ============ USER ENDPOINTS ============

@router.get("/my-referral")
async def get_my_referral(user=Depends(get_current_user)):
    """Get user's referral code and stats."""
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})

    referral_code = user_doc.get("referralCode")
    if not referral_code:
        referral_code = f"KKHS-{uuid.uuid4().hex[:8].upper()}"
        await db.users.update_one(
            {"_id": ObjectId(user["id"])},
            {"$set": {"referralCode": referral_code}}
        )

    # Get referral stats
    referred_count = await db.users.count_documents({"referredBy": user["id"]})
    total_earnings = 0
    earnings = await db.referral_earnings.find({"affiliateUserId": user["id"]}).to_list(1000)
    for e in earnings:
        total_earnings += e.get("amount", 0)

    pending_earnings = sum(e.get("amount", 0) for e in earnings if e.get("status") == "pending")
    paid_earnings = sum(e.get("amount", 0) for e in earnings if e.get("status") == "paid")

    settings = await db.settings.find_one({"key": "site"})
    commission_rate = (settings or {}).get("affiliateCommission", 10)

    return {
        "referralCode": referral_code,
        "referralLink": f"/register?ref={referral_code}",
        "commissionRate": commission_rate,
        "totalReferred": referred_count,
        "totalEarnings": total_earnings,
        "pendingEarnings": pending_earnings,
        "paidEarnings": paid_earnings,
    }


@router.get("/my-earnings")
async def get_my_earnings(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    """Get referral earnings history."""
    db = get_db()
    total = await db.referral_earnings.count_documents({"affiliateUserId": user["id"]})
    skip = (page - 1) * limit
    earnings = await db.referral_earnings.find(
        {"affiliateUserId": user["id"]}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    return {
        "earnings": serialize_docs(earnings),
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/my-referrals")
async def get_my_referrals(user=Depends(get_current_user)):
    """Get list of referred users."""
    db = get_db()
    referred = await db.users.find(
        {"referredBy": user["id"]},
        {"firstName": 1, "lastName": 1, "email": 1, "createdAt": 1}
    ).sort("createdAt", -1).to_list(100)

    return [{
        "id": str(u["_id"]),
        "firstName": u.get("firstName", ""),
        "lastName": u.get("lastName", ""),
        "email": u.get("email", ""),
        "createdAt": u.get("createdAt", "").isoformat() if isinstance(u.get("createdAt"), datetime) else "",
    } for u in referred]


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/stats")
async def admin_affiliate_stats(admin=Depends(get_admin_user)):
    """Get overall affiliate program stats."""
    db = get_db()
    total_affiliates = await db.users.count_documents({"referralCode": {"$exists": True, "$ne": ""}})
    total_referred = await db.users.count_documents({"referredBy": {"$exists": True, "$ne": ""}})

    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.referral_earnings.aggregate(pipeline).to_list(1)
    total_paid = result[0]["total"] if result else 0

    pending_pipeline = [
        {"$match": {"status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    pending_result = await db.referral_earnings.aggregate(pending_pipeline).to_list(1)
    total_pending = pending_result[0]["total"] if pending_result else 0

    # Top affiliates
    top_pipeline = [
        {"$group": {"_id": "$affiliateUserId", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
        {"$limit": 10}
    ]
    top_affiliates = await db.referral_earnings.aggregate(top_pipeline).to_list(10)

    enriched = []
    for aff in top_affiliates:
        u = await db.users.find_one({"_id": ObjectId(aff["_id"])}) if aff["_id"] else None
        enriched.append({
            "userId": aff["_id"],
            "userName": f"{u.get('firstName','')} {u.get('lastName','')}" if u else "Unknown",
            "email": u.get("email", "") if u else "",
            "totalEarnings": aff["total"],
            "referralCount": aff["count"],
        })

    return {
        "totalAffiliates": total_affiliates,
        "totalReferred": total_referred,
        "totalPaid": total_paid,
        "totalPending": total_pending,
        "topAffiliates": enriched,
    }


@router.get("/admin/earnings")
async def admin_list_earnings(
    page: int = 1, limit: int = 20, status: str = "",
    admin=Depends(get_admin_user)
):
    """List all referral earnings."""
    db = get_db()
    query = {}
    if status:
        query["status"] = status

    total = await db.referral_earnings.count_documents(query)
    skip = (page - 1) * limit
    earnings = await db.referral_earnings.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)

    enriched = []
    for e in earnings:
        u = await db.users.find_one({"_id": ObjectId(e["affiliateUserId"])}) if e.get("affiliateUserId") else None
        item = serialize_doc(e)
        item["affiliateName"] = f"{u.get('firstName','')} {u.get('lastName','')}" if u else "Unknown"
        item["affiliateEmail"] = u.get("email", "") if u else ""
        enriched.append(item)

    return {"earnings": enriched, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.put("/admin/earnings/{earning_id}/pay")
async def admin_mark_paid(earning_id: str, admin=Depends(get_admin_user)):
    """Mark a referral earning as paid."""
    db = get_db()
    await db.referral_earnings.update_one(
        {"_id": ObjectId(earning_id)},
        {"$set": {"status": "paid", "paidAt": datetime.utcnow()}}
    )
    return {"message": "Earning marked as paid"}


class UpdateAffiliateSettingsRequest(BaseModel):
    commission: float = 10


@router.put("/admin/settings")
async def admin_update_affiliate_settings(req: UpdateAffiliateSettingsRequest, admin=Depends(get_admin_user)):
    """Update affiliate commission rate."""
    db = get_db()
    await db.settings.update_one(
        {"key": "site"},
        {"$set": {"affiliateCommission": req.commission}},
        upsert=True,
    )
    return {"message": f"Commission rate updated to {req.commission}%"}


# ============ HELPER FUNCTION (called from orders) ============

async def process_referral_commission(order: dict):
    """Process referral commission when an order is paid."""
    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(order["userId"])})
    if not user_doc or not user_doc.get("referredBy"):
        return

    referrer_id = user_doc["referredBy"]
    settings = await db.settings.find_one({"key": "site"})
    commission_rate = (settings or {}).get("affiliateCommission", 10)

    commission = round(order.get("totalAmount", 0) * commission_rate / 100, 2)
    if commission <= 0:
        return

    await db.referral_earnings.insert_one({
        "affiliateUserId": referrer_id,
        "referredUserId": order["userId"],
        "orderId": str(order.get("_id", "")),
        "orderAmount": order.get("totalAmount", 0),
        "commissionRate": commission_rate,
        "amount": commission,
        "status": "pending",
        "createdAt": datetime.utcnow(),
    })
    logger.info(f"Referral commission {commission} for user {referrer_id} from order {order.get('orderId','')}")
