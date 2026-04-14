"""Invoice PDF generation for orders."""
import html as html_mod
import io
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from bson import ObjectId

from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user, serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


def _esc(val: str) -> str:
    """HTML-escape a string to prevent XSS."""
    return html_mod.escape(str(val)) if val else ""


def _generate_invoice_html(order: dict, user: dict, settings: dict) -> str:
    """Generate invoice HTML."""
    brand = _esc(settings.get("brandName", "KKHS Media"))
    company = _esc(settings.get("companyName", brand))
    company_address = _esc(settings.get("address", ""))
    company_email = _esc(settings.get("contactEmail", ""))
    company_phone = _esc(settings.get("phone", ""))
    gst_number = _esc(settings.get("gstNumber", ""))
    logo_url = _esc(settings.get("logoUrl", ""))

    order_date = order.get("createdAt", datetime.utcnow())
    if isinstance(order_date, datetime):
        order_date_str = order_date.strftime("%d %b %Y")
    else:
        order_date_str = str(order_date)

    # Build items table
    items_html = ""
    for i, slot in enumerate(order.get("slots", []), 1):
        items_html += f"""
        <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">{i}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">Streaming Slot - {_esc(slot.get('durationType','').title())} Plan</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">{slot.get('duration',1)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">{order.get('currency','INR')} {slot.get('unitPrice',0):.2f}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">{order.get('currency','INR')} {slot.get('total',0):.2f}</td>
        </tr>
        """

    coupon_row = ""
    if order.get("couponCode"):
        coupon_row = f"""
        <tr>
            <td colspan="4" style="padding:8px;text-align:right;color:#16a34a;">Coupon ({_esc(order['couponCode'])})</td>
            <td style="padding:8px;text-align:right;color:#16a34a;">-{order.get('currency','INR')} {order.get('couponDiscount',0):.2f}</td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Invoice #{order.get('orderId','')}</title></head>
    <body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:30px;color:#1f2937;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
            <div>
                <h1 style="margin:0;color:#6366f1;font-size:28px;">{brand}</h1>
                <p style="margin:5px 0 0 0;color:#6b7280;font-size:14px;">{company}</p>
            </div>
            <div style="text-align:right;">
                <h2 style="margin:0;color:#374151;">INVOICE</h2>
                <p style="margin:5px 0 0 0;color:#6b7280;font-size:14px;">#{order.get('orderId','')}</p>
            </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:30px;gap:40px;">
            <div>
                <h3 style="margin:0 0 8px 0;font-size:14px;color:#6b7280;text-transform:uppercase;">Bill From</h3>
                <p style="margin:0;font-weight:bold;">{company}</p>
                <p style="margin:2px 0;font-size:14px;color:#6b7280;">{company_address}</p>
                <p style="margin:2px 0;font-size:14px;color:#6b7280;">{company_email}</p>
                <p style="margin:2px 0;font-size:14px;color:#6b7280;">{company_phone}</p>
                {"<p style='margin:2px 0;font-size:14px;color:#6b7280;'>GST: " + gst_number + "</p>" if gst_number else ""}
            </div>
            <div>
                <h3 style="margin:0 0 8px 0;font-size:14px;color:#6b7280;text-transform:uppercase;">Bill To</h3>
                <p style="margin:0;font-weight:bold;">{_esc(user.get('firstName',''))} {_esc(user.get('lastName',''))}</p>
                <p style="margin:2px 0;font-size:14px;color:#6b7280;">{_esc(user.get('email',''))}</p>
                <p style="margin:2px 0;font-size:14px;color:#6b7280;">{_esc(user.get('phone',''))}</p>
            </div>
            <div>
                <h3 style="margin:0 0 8px 0;font-size:14px;color:#6b7280;text-transform:uppercase;">Invoice Details</h3>
                <p style="margin:2px 0;font-size:14px;">Date: {order_date_str}</p>
                <p style="margin:2px 0;font-size:14px;">Status: <span style="color:{'#16a34a' if order.get('status')=='paid' else '#f59e0b'};font-weight:bold;">{order.get('status','pending').upper()}</span></p>
                <p style="margin:2px 0;font-size:14px;">Payment: {_esc(order.get('paymentGateway','').title())}</p>
            </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead>
                <tr style="background:#f3f4f6;">
                    <th style="padding:10px;text-align:left;font-size:13px;">#</th>
                    <th style="padding:10px;text-align:left;font-size:13px;">Description</th>
                    <th style="padding:10px;text-align:center;font-size:13px;">Qty</th>
                    <th style="padding:10px;text-align:right;font-size:13px;">Unit Price</th>
                    <th style="padding:10px;text-align:right;font-size:13px;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;">
            <table style="width:300px;">
                <tr>
                    <td style="padding:6px;color:#6b7280;">Subtotal</td>
                    <td style="padding:6px;text-align:right;">{order.get('currency','INR')} {order.get('subtotal',0):.2f}</td>
                </tr>
                {coupon_row}
                <tr>
                    <td style="padding:6px;color:#6b7280;">GST ({order.get('gstRate',18)}%)</td>
                    <td style="padding:6px;text-align:right;">{order.get('currency','INR')} {order.get('gstAmount',0):.2f}</td>
                </tr>
                <tr style="border-top:2px solid #1f2937;">
                    <td style="padding:10px;font-weight:bold;font-size:16px;">Total</td>
                    <td style="padding:10px;text-align:right;font-weight:bold;font-size:16px;">{order.get('currency','INR')} {order.get('totalAmount',0):.2f}</td>
                </tr>
            </table>
        </div>

        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px;">
            <p>Thank you for your business!</p>
            <p>{brand} - 24/7 Live Streaming Platform</p>
        </div>
    </body>
    </html>
    """
    return html


@router.get("/admin/{order_id}")
async def admin_get_invoice(order_id: str, admin=Depends(get_admin_user)):
    """Admin: Get invoice for any order."""
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settings = await db.settings.find_one({"key": "site"}) or {}
    user_doc = await db.users.find_one({"_id": ObjectId(order["userId"])}) or {}

    html = _generate_invoice_html(order, user_doc, settings)
    return {"html": html, "orderId": order.get("orderId", "")}


@router.get("/{order_id}")
async def get_invoice(order_id: str, user=Depends(get_current_user)):
    """Get invoice HTML for an order."""
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settings = await db.settings.find_one({"key": "site"}) or {}
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])}) or {}

    html = _generate_invoice_html(order, user_doc, settings)
    return {"html": html, "orderId": order.get("orderId", "")}


@router.get("/{order_id}/download")
async def download_invoice(order_id: str, user=Depends(get_current_user)):
    """Download invoice as HTML file."""
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "userId": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settings = await db.settings.find_one({"key": "site"}) or {}
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])}) or {}

    html = _generate_invoice_html(order, user_doc, settings)
    buffer = io.BytesIO(html.encode("utf-8"))
    return StreamingResponse(
        buffer,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=invoice-{order.get('orderId','')}.html"}
    )
