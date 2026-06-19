import datetime
from typing import Optional


def parse_period(period: str, frm: Optional[str] = None, to: Optional[str] = None):
    now = datetime.datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "today":
        return today, now
    elif period == "yesterday":
        yesterday = today - datetime.timedelta(days=1)
        return yesterday, today
    elif period == "week":
        start = today - datetime.timedelta(days=today.weekday())
        return start, now
    elif period == "month":
        start = today.replace(day=1)
        return start, now
    elif period == "quarter":
        q = (today.month - 1) // 3
        start = today.replace(month=q * 3 + 1, day=1)
        return start, now
    elif period == "custom" and frm and to:
        start = datetime.datetime.fromisoformat(frm)
        end = datetime.datetime.fromisoformat(to) + datetime.timedelta(days=1)
        return start, end
    else:
        return datetime.datetime(2000, 1, 1), now


def fmt_currency(amount: float) -> str:
    if amount >= 100000:
        return f"₹{amount/100000:.1f}L"
    elif amount >= 1000:
        return f"₹{amount/1000:.1f}K"
    return f"₹{amount:.0f}"


def generate_order_number(account_id: int, seq: int) -> str:
    return f"KW{account_id:04d}-{seq:06d}"
