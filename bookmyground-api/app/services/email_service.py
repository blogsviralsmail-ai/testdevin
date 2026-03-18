import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import threading
import ssl


SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "info@bookaground.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "tsfz uifx oqeg ucqw")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_email_async(to_email: str, subject: str, html_body: str):
    """Send email in background thread so it doesn't block the API"""
    thread = threading.Thread(target=_send_email, args=(to_email, subject, html_body))
    thread.daemon = True
    thread.start()


def _send_email(to_email: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"BookAGround <{SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        # Use SSL context for secure connection
        context = ssl.create_default_context()
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL] Successfully sent to {to_email}: {subject}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL AUTH ERROR] Authentication failed for {SMTP_EMAIL}: {e}")
    except smtplib.SMTPException as e:
        print(f"[EMAIL SMTP ERROR] Failed to send to {to_email}: {e}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {type(e).__name__}: {e}")


def send_booking_confirmation(booking: dict, user_email: str, ground_name: str):
    if not user_email:
        return
    # QR code with full booking details encoded
    import urllib.parse
    qr_data = urllib.parse.quote(f"BookAGround Booking\nID: {booking.get('booking_id','')}\nGround: {ground_name}\nDate: {booking.get('booking_date','')}\nTime: {booking.get('start_time','')}-{booking.get('end_time','')}\nAmount: Rs.{booking.get('total_amount',0)}\nPayment: {booking.get('payment_mode','online')}")
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a5f2a,#2d8f4e);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">Booking Confirmed!</h1>
            <p style="margin:5px 0 0;opacity:0.9">BookAGround</p>
        </div>
        <div style="padding:25px">
            <div style="text-align:center;margin-bottom:20px">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={qr_data}" alt="QR"/>
            </div>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;color:#666">Booking ID</td><td style="padding:8px;font-weight:bold">{booking.get('booking_id','')}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Ground</td><td style="padding:8px;font-weight:bold">{ground_name}</td></tr>
                <tr><td style="padding:8px;color:#666">Date</td><td style="padding:8px">{booking.get('booking_date','')}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Time</td><td style="padding:8px">{booking.get('start_time','')}-{booking.get('end_time','')}</td></tr>
                <tr><td style="padding:8px;color:#666">Amount</td><td style="padding:8px;font-weight:bold;color:#1a5f2a">Rs.{booking.get('total_amount',0)}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Payment</td><td style="padding:8px">{booking.get('payment_mode','online')}</td></tr>
            </table>
            <p style="text-align:center;color:#888;font-size:12px;margin-top:20px">Show QR code at the ground for verification</p>
        </div>
        <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#999">
            BookAGround | info@bookaground.com
        </div>
    </div>
    """
    send_email_async(user_email, f"Booking Confirmed - {booking.get('booking_id','')}", html)


def send_booking_cancellation(booking: dict, user_email: str, ground_name: str, refund_amount: float = 0):
    if not user_email:
        return
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">Booking Cancelled</h1>
            <p style="margin:5px 0 0;opacity:0.9">BookAGround</p>
        </div>
        <div style="padding:25px">
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;color:#666">Booking ID</td><td style="padding:8px;font-weight:bold">{booking.get('booking_id','')}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Ground</td><td style="padding:8px">{ground_name}</td></tr>
                <tr><td style="padding:8px;color:#666">Date</td><td style="padding:8px">{booking.get('booking_date','')}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Refund</td><td style="padding:8px;font-weight:bold;color:#1a5f2a">Rs.{refund_amount}</td></tr>
            </table>
            <p style="text-align:center;color:#888;font-size:12px;margin-top:20px">Refund has been credited to your wallet</p>
        </div>
    </div>
    """
    send_email_async(user_email, f"Booking Cancelled - {booking.get('booking_id','')}", html)


def send_registration_welcome(user_email: str, user_name: str):
    if not user_email:
        return
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1a5f2a,#2d8f4e);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">Welcome to BookAGround!</h1>
        </div>
        <div style="padding:25px;text-align:center">
            <h2>Hi {user_name}!</h2>
            <p>Your account has been created successfully. Start booking cricket grounds near you!</p>
            <a href="https://bookaground.com" style="display:inline-block;background:#1a5f2a;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:15px">Browse Grounds</a>
        </div>
    </div>
    """
    send_email_async(user_email, "Welcome to BookAGround!", html)


def send_password_reset(user_email: str, otp: str):
    if not user_email:
        return
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">Password Reset</h1>
        </div>
        <div style="padding:25px;text-align:center">
            <p>Your OTP for password reset is:</p>
            <div style="font-size:32px;font-weight:bold;color:#1a5f2a;letter-spacing:8px;margin:20px 0">{otp}</div>
            <p style="color:#888;font-size:12px">This OTP is valid for 10 minutes. Do not share with anyone.</p>
        </div>
    </div>
    """
    send_email_async(user_email, "BookAGround - Password Reset OTP", html)


def send_payment_pending(user_email: str, booking_id: str, amount: float):
    if not user_email:
        return
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">Payment Pending</h1>
        </div>
        <div style="padding:25px;text-align:center">
            <p>Your booking <b>{booking_id}</b> has a pending balance of <b>Rs.{amount}</b></p>
            <p>Please complete the payment before your slot time.</p>
        </div>
    </div>
    """
    send_email_async(user_email, f"Payment Pending - {booking_id}", html)


def send_kyc_rejection_email(owner_email: str, owner_name: str, reason: str = ""):
    if not owner_email:
        return
    reason_text = f"<p style='color:#dc2626;font-weight:bold;margin:15px 0'>Reason: {reason}</p>" if reason else ""
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:25px;text-align:center;color:white">
            <h1 style="margin:0">KYC Verification Rejected</h1>
            <p style="margin:5px 0 0;opacity:0.9">BookAGround</p>
        </div>
        <div style="padding:25px;text-align:center">
            <h2 style="color:#374151">Hi {owner_name},</h2>
            <p>Your KYC verification has been <b style="color:#dc2626">Rejected</b> by the admin.</p>
            {reason_text}
            <p style="margin-top:15px">Please re-submit your KYC documents with correct details from your Owner Dashboard.</p>
            <a href="https://bookaground.com/owner" style="display:inline-block;background:#1a5f2a;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:15px">Go to Dashboard</a>
        </div>
        <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#999">
            BookAGround | info@bookaground.com
        </div>
    </div>
    """
    send_email_async(owner_email, "BookAGround - KYC Verification Rejected", html)


def send_ground_statement_email(owner_email: str, ground_name: str, html_content: str):
    if not owner_email:
        return
    send_email_async(owner_email, f"BookAGround - Statement for {ground_name}", html_content)


# SMS placeholder - integrate actual provider later
def send_sms(phone: str, message: str, api_key: str = "", provider: str = "MSG91"):
    """Placeholder for SMS integration. Will use actual API when key is configured."""
    if not api_key:
        print(f"[SMS PLACEHOLDER] To: {phone} | Message: {message}")
        return False
    print(f"[SMS] Sending via {provider} to {phone}: {message}")
    return True


# WhatsApp placeholder - integrate actual provider later  
def send_whatsapp(phone: str, message: str, api_key: str = "", provider: str = "Twilio"):
    """Placeholder for WhatsApp integration. Will use actual API when key is configured."""
    if not api_key:
        print(f"[WHATSAPP PLACEHOLDER] To: {phone} | Message: {message}")
        return False
    print(f"[WHATSAPP] Sending via {provider} to {phone}: {message}")
    return True
