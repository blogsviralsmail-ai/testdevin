"""
Shared Payout Utility for BookAGround
Handles auto-payout via RazorpayX and manual fallback.

Usage:
  - If payout API is configured in admin settings -> auto-payout via RazorpayX
  - If payout API is NOT configured -> creates pending withdrawal for admin manual processing
"""

import uuid
import requests as http_requests
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


def get_payout_config(db):
    """Get payout API configuration from settings.
    Returns dict with keys: enabled, api_key, api_secret, account_number
    Returns None if payout API is not enabled.
    Returns dict with enabled=True but incomplete=True if enabled but credentials missing.
    """
    # Check if auto-payout is enabled
    enabled_row = db.execute("SELECT value FROM settings WHERE key='auto_payout_enabled'").fetchone()
    if not enabled_row or enabled_row["value"] != "1":
        return None

    # Get payout API credentials (separate from payment collection keys)
    api_key_row = db.execute("SELECT value FROM settings WHERE key='payout_api_key'").fetchone()
    api_secret_row = db.execute("SELECT value FROM settings WHERE key='payout_api_secret'").fetchone()
    account_row = db.execute("SELECT value FROM settings WHERE key='payout_account_number'").fetchone()

    api_key = ((api_key_row["value"] if api_key_row else "") or "").strip()
    api_secret = ((api_secret_row["value"] if api_secret_row else "") or "").strip()
    account_number = ((account_row["value"] if account_row else "") or "").strip()

    if not api_key or not api_secret or not account_number:
        # Auto-payout is ON but credentials are incomplete
        missing = []
        if not api_key:
            missing.append("API Key")
        if not api_secret:
            missing.append("API Secret")
        if not account_number:
            missing.append("Account Number")
        return {
            "enabled": True,
            "incomplete": True,
            "missing": missing,
        }

    return {
        "enabled": True,
        "incomplete": False,
        "api_key": api_key,
        "api_secret": api_secret,
        "account_number": account_number,
    }


def process_razorpayx_payout(
    api_key: str,
    api_secret: str,
    account_number: str,
    amount: float,
    user_name: str,
    user_phone: str,
    user_email: str | None,
    user_upi_id: str | None,
    user_bank_account: str | None,
    user_bank_ifsc: str | None,
    user_id: int,
    withdrawal_id: int,
    contact_type: str = "customer",
    narration: str = "BookAGround Withdrawal",
) -> dict:
    """
    Process a payout via RazorpayX Composite Payout API.

    Returns dict with:
      - success: bool
      - payout_id: str
      - utr: str
      - status: str (processing/processed)
      - mode: str (UPI/NEFT)
      - error: str (if failed)
    """
    amount_paise = int(round(amount * 100))
    idempotency_key = str(uuid.uuid4())

    upi_id = (user_upi_id or "").strip()
    bank_account = (user_bank_account or "").strip()
    bank_ifsc = (user_bank_ifsc or "").strip()

    if upi_id:
        payout_mode = "UPI"
        payout_payload = {
            "account_number": account_number,
            "amount": amount_paise,
            "currency": "INR",
            "mode": "UPI",
            "purpose": "payout",
            "fund_account": {
                "account_type": "vpa",
                "vpa": {"address": upi_id},
                "contact": {
                    "name": user_name,
                    "email": user_email,
                    "contact": user_phone,
                    "type": contact_type,
                    "reference_id": f"user_{user_id}"
                }
            },
            "queue_if_low_balance": True,
            "reference_id": f"wd_{withdrawal_id}_{datetime.now(IST).strftime('%Y%m%d%H%M%S')}",
            "narration": narration,
            "notes": {"withdrawal_id": str(withdrawal_id), "user_id": str(user_id)}
        }
    elif bank_account and bank_ifsc:
        payout_mode = "NEFT"
        payout_payload = {
            "account_number": account_number,
            "amount": amount_paise,
            "currency": "INR",
            "mode": "NEFT",
            "purpose": "payout",
            "fund_account": {
                "account_type": "bank_account",
                "bank_account": {
                    "name": user_name,
                    "ifsc": bank_ifsc,
                    "account_number": bank_account
                },
                "contact": {
                    "name": user_name,
                    "email": user_email,
                    "contact": user_phone,
                    "type": contact_type,
                    "reference_id": f"user_{user_id}"
                }
            },
            "queue_if_low_balance": True,
            "reference_id": f"wd_{withdrawal_id}_{datetime.now(IST).strftime('%Y%m%d%H%M%S')}",
            "narration": narration,
            "notes": {"withdrawal_id": str(withdrawal_id), "user_id": str(user_id)}
        }
    else:
        return {
            "success": False,
            "error": "No bank account or UPI details found. KYC required.",
            "payout_id": "",
            "utr": "",
            "status": "failed",
            "mode": "",
        }

    # Remove None values from contact
    contact = payout_payload["fund_account"]["contact"]
    payout_payload["fund_account"]["contact"] = {k: v for k, v in contact.items() if v is not None}

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
            return {
                "success": False,
                "error": f"Payout API error: {error_desc}",
                "payout_id": "",
                "utr": "",
                "status": "failed",
                "mode": payout_mode,
            }

        return {
            "success": True,
            "payout_id": resp_data.get("id", ""),
            "utr": resp_data.get("utr", ""),
            "status": resp_data.get("status", "processing"),
            "mode": payout_mode,
            "error": "",
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Payout API connection error: {str(e)}",
            "payout_id": "",
            "utr": "",
            "status": "failed",
            "mode": payout_mode,
        }


def attempt_auto_payout(db, withdrawal_id: int, user_id: int, net_amount: float, processed_by: int | None = None) -> dict:
    """
    Attempt auto-payout for a withdrawal request.

    If payout API is configured and enabled:
      - Calls RazorpayX to send money
      - Updates withdraw_requests record
      - Returns success result

    If payout API is NOT configured:
      - Leaves withdrawal as 'pending' for admin manual processing
      - Returns manual result

    Returns dict with:
      - auto: bool (True if auto-payout was attempted)
      - success: bool
      - message: str
      - payout_id, utr, status, mode (if auto)
    """
    config = get_payout_config(db)

    if not config:
        # Auto-payout not enabled - manual processing by admin
        return {
            "auto": False,
            "success": True,
            "message": "Withdrawal request submitted. Admin will process it manually.",
        }

    if config.get("incomplete"):
        # Auto-payout is ON but credentials are missing
        missing_str = ", ".join(config.get("missing", []))
        return {
            "auto": False,
            "success": True,
            "message": f"Auto-payout is enabled but RazorpayX credentials are incomplete (missing: {missing_str}). Withdrawal submitted for manual processing. Please ask admin to complete payout API configuration.",
        }

    # Get user details for payout
    u = db.execute(
        "SELECT id, name, phone, email, bank_account, bank_ifsc, upi_id FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if not u:
        return {
            "auto": False,
            "success": True,
            "message": "Withdrawal request submitted. Admin will process it.",
        }

    user_upi = (u["upi_id"] or "").strip()
    user_bank = (u["bank_account"] or "").strip()
    user_ifsc = (u["bank_ifsc"] or "").strip()

    if not user_upi and not (user_bank and user_ifsc):
        # No bank details - can't auto-payout
        return {
            "auto": False,
            "success": True,
            "message": "Withdrawal request submitted. Bank details incomplete for auto-payout. Admin will process manually.",
        }

    # Attempt RazorpayX payout
    result = process_razorpayx_payout(
        api_key=config["api_key"],
        api_secret=config["api_secret"],
        account_number=config["account_number"],
        amount=net_amount,
        user_name=u["name"] or "User",
        user_phone=u["phone"] or "",
        user_email=u["email"] if u["email"] else None,
        user_upi_id=user_upi or None,
        user_bank_account=user_bank or None,
        user_bank_ifsc=user_ifsc or None,
        user_id=user_id,
        withdrawal_id=withdrawal_id,
    )

    if result["success"]:
        # Auto-payout succeeded - update withdrawal record
        transaction_id = result["payout_id"] or f"AUTO_{withdrawal_id}_{datetime.now(IST).strftime('%Y%m%d%H%M%S')}"
        proof_info = f"Auto Payout | Mode: {result['mode']} | UTR: {result['utr'] or 'pending'} | Status: {result['status']}"

        db.execute(
            "UPDATE withdraw_requests SET status='completed', processed_by=?, processed_at=CURRENT_TIMESTAMP, transaction_id=?, proof_url=? WHERE id=?",
            (processed_by or 0, transaction_id, proof_info, withdrawal_id)
        )

        return {
            "auto": True,
            "success": True,
            "message": f"Auto-payout of Rs.{net_amount} initiated via {result['mode']}!",
            "payout_id": result["payout_id"],
            "utr": result["utr"],
            "status": result["status"],
            "mode": result["mode"],
        }
    else:
        # Auto-payout failed - leave as pending for admin
        # Update proof_url with failure reason for admin visibility
        db.execute(
            "UPDATE withdraw_requests SET proof_url=? WHERE id=?",
            (f"Auto-payout failed: {result['error']}", withdrawal_id)
        )

        return {
            "auto": False,
            "success": True,
            "message": f"Auto-payout failed ({result['error']}). Request submitted for admin manual processing.",
            "error": result["error"],
        }
