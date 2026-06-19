from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.order import Product
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    mrp: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    weight: Optional[float] = None
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class ProductCostUpdate(BaseModel):
    cost_price: float


class ProductSettings(BaseModel):
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = None
    weight: Optional[float] = None
    low_stock_threshold: Optional[int] = None


class BulkCostUpdate(BaseModel):
    updates: List[dict]


class ProductGSTUpdate(BaseModel):
    hsn_code: str = ""
    gst_rate: float = 18.0


@router.get("/")
def list_products(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.account_id == user.id).order_by(Product.name).all()
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category,
                "cost_price": p.cost_price,
                "selling_price": p.selling_price,
                "mrp": p.mrp,
                "stock_quantity": p.stock_quantity,
                "low_stock_threshold": p.low_stock_threshold,
                "hsn_code": p.hsn_code,
                "gst_rate": p.gst_rate,
                "image_url": p.image_url,
                "status": p.status,
            }
            for p in products
        ]
    }


@router.post("/")
def create_product(req: ProductUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = Product(account_id=user.id, name=req.name or "Untitled Product")
    for field in ["sku", "category", "description", "cost_price", "selling_price", "mrp", "stock_quantity", "low_stock_threshold", "weight", "hsn_code", "gst_rate", "image_url", "status"]:
        val = getattr(req, field, None)
        if val is not None:
            setattr(p, field, val)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"status": "ok", "product_id": p.id}


@router.put("/{product_id}/cost")
def update_product_cost(product_id: int, req: ProductCostUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.account_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.cost_price = req.cost_price
    db.commit()
    return {"status": "ok"}


@router.put("/{product_id}/settings")
def update_product_settings(product_id: int, req: ProductSettings, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.account_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if req.hsn_code is not None:
        p.hsn_code = req.hsn_code
    if req.gst_rate is not None:
        p.gst_rate = req.gst_rate
    if req.weight is not None:
        p.weight = req.weight
    if req.low_stock_threshold is not None:
        p.low_stock_threshold = req.low_stock_threshold
    db.commit()
    return {"status": "ok"}


@router.post("/bulk-cost")
def bulk_update_cost(req: BulkCostUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updated = 0
    for item in req.updates:
        pid = item.get("product_id")
        cost = item.get("cost_price")
        if pid and cost is not None:
            p = db.query(Product).filter(Product.id == pid, Product.account_id == user.id).first()
            if p:
                p.cost_price = cost
                updated += 1
    db.commit()
    return {"status": "ok", "updated": updated}
