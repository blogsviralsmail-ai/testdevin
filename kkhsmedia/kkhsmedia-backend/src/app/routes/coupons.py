"""Coupon/Discount system for promotional codes."""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/coupons", tags=["Coupons"])


class CreateCouponRequest(BaseModel):
    code: str
    discountType: str = "percentage"  # percentage or fixed
    discountValue: float  # percentage (0-100) or fixed amount
    maxUses: int = 0  # 0 = unlimited
    maxUsesPerUser: int = 1
    minOrderAmount: float = 0
    validFrom: Optional[str] = None
    validUntil: Optional[str] = None
    applicablePlans: list = []  # empty = all plans
    isActive: bool = True
    description: str = ""


class UpdateCouponRequest(BaseModel):
    code: Optional[str] = None
    discountType: Optional[str] = None
    discountValue: Optional[float] = None
    maxUses: Optional[int] = None
    maxUsesPerUser: Optional[int] = None
    minOrderAmount: Optional[float] = None
    validFrom: Optional[str] = None
    validUntil: Optional[str] = None
    applicablePlans: Optional[list] = None
    isActive: Optional[bool] = None
    description: Optional[str] = None


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/list")
async def admin_list_coupons(page: int = 1, limit: int = 20, admin=Depends(get_admin_user)):
    db = get_db()
    total = await db.coupons.count_documents({})
    skip = (page - 1) * limit
    coupons = await db.coupons.find().sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    return {"coupons": serialize_docs(coupons), "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("/admin/create")
async def admin_create_coupon(req: CreateCouponRequest, admin=Depends(get_admin_user)):
    db = get_db()
    existing = await db.coupons.find_one({"code": req.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = {
        "code": req.code.upper(),
        "discountType": req.discountType,
        "discountValue": req.discountValue,
        "maxUses": req.maxUses,
        "maxUsesPerUser": req.maxUsesPerUser,
        "minOrderAmount": req.minOrderAmount,
        "validFrom": req.validFrom,
        "validUntil": req.validUntil,
        "applicablePlans": req.applicablePlans,
        "isActive": req.isActive,
        "description": req.description,
        "usedCount": 0,
        "usedBy": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.coupons.insert_one(coupon)
    coupon["id"] = str(result.inserted_id)
    return serialize_doc(coupon)


@router.put("/admin/{coupon_id}")
async def admin_update_coupon(coupon_id: str, req: UpdateCouponRequest, admin=Depends(get_admin_user)):
    db = get_db()
    update = {"updatedAt": datetime.utcnow()}
    for field, value in req.model_dump(exclude_none=True).items():
        if field == "code" and value:
            value = value.upper()
        update[field] = value

    await db.coupons.update_one({"_id": ObjectId(coupon_id)}, {"$set": update})
    coupon = await db.coupons.find_one({"_id": ObjectId(coupon_id)})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return serialize_doc(coupon)


@router.delete("/admin/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    await db.coupons.delete_one({"_id": ObjectId(coupon_id)})
    return {"message": "Coupon deleted"}


# ============ SHARED HELPERS ============

def _validate_coupon(coupon: dict, user_id: str, order_amount: float = 0) -> None:
    """Validate coupon restrictions. Raises HTTPException on failure."""
    now = datetime.utcnow()

    # Check validity period
    if coupon.get("validFrom"):
        valid_from = datetime.fromisoformat(coupon["validFrom"].replace("Z", "+00:00")).replace(tzinfo=None)
        if now < valid_from:
            raise HTTPException(status_code=400, detail="Coupon not yet active")

    if coupon.get("validUntil"):
        valid_until = datetime.fromisoformat(coupon["validUntil"].replace("Z", "+00:00")).replace(tzinfo=None)
        if now > valid_until:
            raise HTTPException(status_code=400, detail="Coupon has expired")

    # Check max uses
    if coupon.get("maxUses", 0) > 0 and coupon.get("usedCount", 0) >= coupon["maxUses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    # Check per-user limit
    user_uses = sum(1 for u in coupon.get("usedBy", []) if u == user_id)
    if coupon.get("maxUsesPerUser", 1) > 0 and user_uses >= coupon["maxUsesPerUser"]:
        raise HTTPException(status_code=400, detail="You have already used this coupon")

    # Check minimum order amount
    if order_amount < coupon.get("minOrderAmount", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order amount is {coupon['minOrderAmount']}")


# ============ USER ENDPOINTS ============

@router.post("/validate")
async def validate_coupon(code: str, order_amount: float = 0, user=Depends(get_current_user)):
    """Validate a coupon code and return discount details."""
    db = get_db()
    coupon = await db.coupons.find_one({"code": code.upper(), "isActive": True})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    _validate_coupon(coupon, user["id"], order_amount)

    # Calculate discount
    if coupon["discountType"] == "percentage":
        discount = round(order_amount * coupon["discountValue"] / 100, 2)
    else:
        discount = min(coupon["discountValue"], order_amount)

    return {
        "valid": True,
        "code": coupon["code"],
        "discountType": coupon["discountType"],
        "discountValue": coupon["discountValue"],
        "discountAmount": discount,
        "description": coupon.get("description", ""),
    }


@router.post("/apply")
async def apply_coupon(code: str, order_id: str, user=Depends(get_current_user)):
    """Apply a validated coupon to an order."""
    db = get_db()
    coupon = await db.coupons.find_one({"code": code.upper(), "isActive": True})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Reject if order is already paid or already has a coupon
    if order.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Cannot apply coupon to a paid order")
    if order.get("couponCode"):
        raise HTTPException(status_code=400, detail="A coupon has already been applied to this order")

    # Use originalSubtotal if already stored (e.g. if a previous coupon was removed),
    # otherwise use current subtotal as the original base price.
    original_subtotal = order.get("originalSubtotal", order.get("subtotal", 0))
    _validate_coupon(coupon, user["id"], original_subtotal)

    # Calculate discount on the original (pre-discount) subtotal
    if coupon["discountType"] == "percentage":
        discount = round(original_subtotal * coupon["discountValue"] / 100, 2)
    else:
        discount = min(coupon["discountValue"], original_subtotal)

    new_subtotal = max(original_subtotal - discount, 0)
    gst_rate = order.get("gstRate", 18)
    new_gst = round(new_subtotal * gst_rate / 100, 2)
    new_total = round(new_subtotal + new_gst, 2)

    # Update order with coupon - preserve originalSubtotal so it's never lost
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "couponCode": coupon["code"],
            "couponDiscount": discount,
            "originalSubtotal": original_subtotal,
            "subtotal": new_subtotal,
            "gstAmount": new_gst,
            "totalAmount": new_total,
            "updatedAt": datetime.utcnow(),
        }}
    )

    # Update coupon usage atomically with limit checks to prevent race conditions
    coupon_filter = {"_id": coupon["_id"], "isActive": True}
    max_uses = coupon.get("maxUses", 0)
    if max_uses > 0:
        coupon_filter["$expr"] = {"$lt": ["$usedCount", max_uses]}
    coupon_update = await db.coupons.find_one_and_update(
        coupon_filter,
        {"$inc": {"usedCount": 1}, "$push": {"usedBy": user["id"]}},
    )
    if not coupon_update:
        # Race condition: coupon limit was reached concurrently
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    return {"message": "Coupon applied", "discount": discount, "newTotal": new_total}
