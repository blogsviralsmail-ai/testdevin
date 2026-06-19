from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.order import Product
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


class InvAction(BaseModel):
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    status: Optional[str] = None


@router.get("/")
def list_inventory(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.account_id == user.id).order_by(Product.name).all()
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "low_stock_threshold": p.low_stock_threshold,
                "selling_price": p.selling_price,
                "status": "low_stock" if p.stock_quantity <= p.low_stock_threshold else "in_stock",
            }
            for p in products
        ]
    }


@router.put("/{product_id}")
def update_inventory(product_id: int, req: InvAction, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.account_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if req.stock_quantity is not None:
        p.stock_quantity = req.stock_quantity
    if req.low_stock_threshold is not None:
        p.low_stock_threshold = req.low_stock_threshold
    if req.status is not None:
        p.status = req.status
    db.commit()
    return {"status": "ok"}
