import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from app.database import get_db


def get_smtp_settings():
    """Get SMTP settings from database."""
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").fetchall()
    conn.close()
    settings = {r["key"]: r["value"] for r in rows}
    return settings


def send_email(to_email: str, subject: str, html_body: str,
               attachment_bytes: Optional[bytes] = None,
               attachment_filename: Optional[str] = None) -> bool:
    """Send email using SMTP settings from database. Optionally attach a file (e.g. PDF)."""
    try:
        settings = get_smtp_settings()
        smtp_host = settings.get("smtp_host", "")
        smtp_port = int(settings.get("smtp_port", "587"))
        smtp_user = settings.get("smtp_user", "")
        smtp_password = settings.get("smtp_password", "")
        smtp_from = settings.get("smtp_from_email", smtp_user)
        smtp_from_name = settings.get("smtp_from_name", "Education Hub")

        if not smtp_host or not smtp_user or not smtp_password:
            print("SMTP not configured, skipping email send")
            return False

        # Use mixed type when we have attachments, alternative when just HTML
        if attachment_bytes and attachment_filename:
            msg = MIMEMultipart("mixed")
        else:
            msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{smtp_from_name} <{smtp_from}>"
        msg["To"] = to_email

        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        # Attach file if provided
        if attachment_bytes and attachment_filename:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment_bytes)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={attachment_filename}")
            msg.attach(part)

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.starttls()

        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False


def send_registration_email(name: str, email: str, username: str):
    """Send registration confirmation email."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Education Hub</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
            <h2>Welcome, {name}!</h2>
            <p>Your registration has been received successfully. Your account is currently <strong>pending approval</strong> from the admin.</p>
            <p>Once approved, you can login with your credentials:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Username:</strong> {username}</p>
            </div>
            <p>You will receive another email once your account is approved.</p>
            <p style="color: #64748b; font-size: 14px;">Thank you for choosing Education Hub!</p>
        </div>
    </div>
    """
    send_email(email, "Registration Confirmation - Education Hub", html)


def send_receipt_email(to_email: str, student_name: str, receipt_no: str, amount: float,
                       payment_mode: str, utr_number: str, payment_date: str,
                       total_fees: float, total_paid: float, pending: float,
                       branding: dict,
                       student_phone: str = "", student_email: str = "",
                       student_course: str = "", student_university: str = "",
                       student_father: str = "") -> bool:
    """Send professional fee receipt email."""
    company_name = branding.get("company_name", "ASFF Education Hub")
    company_phone = branding.get("company_phone", "")
    company_email = branding.get("company_email", "")
    company_address = branding.get("company_address", "")
    gst_number = branding.get("gst_number", "")
    receipt_footer = branding.get("receipt_footer", "This is a computer generated receipt.")
    tagline = branding.get("site_tagline", "")
    pct = round((total_paid / total_fees) * 100) if total_fees > 0 else 0

    gst_line = ""
    if gst_number:
        gst_line = f'<p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">GST: <strong style="color: #1e293b;">{gst_number}</strong></p>'

    utr_row = ""
    if utr_number:
        utr_row = f"""
                    <tr>
                        <td style="padding: 10px 20px; color: #64748b; font-size: 13px; border-bottom: 1px solid #f1f5f9;">UTR / Ref No.</td>
                        <td style="padding: 10px 20px; text-align: right; font-weight: 600; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">{utr_number}</td>
                    </tr>"""

    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f1f5f9; padding: 20px 0;">
        <!-- Accent Bar -->
        <div style="height: 5px; background: linear-gradient(90deg, #1e40af 0%, #7c3aed 40%, #ec4899 70%, #f97316 100%); border-radius: 12px 12px 0 0; max-width: 600px; margin: 0 auto;"></div>

        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 30px 30px 20px; border-bottom: 2px solid #1e40af;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="vertical-align: top;">
                                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.3px;">{company_name}</h1>
                                    {f'<p style="margin: 3px 0 0; font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">{tagline}</p>' if tagline else ''}
                                    <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">{company_phone}{(' &bull; ' + company_email) if company_email else ''}{('<br>' + company_address) if company_address else ''}</p>
                                    {gst_line}
                                </td>
                                <td style="vertical-align: top; text-align: right;">
                                    <div style="font-size: 26px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; line-height: 1;">RECEIPT</div>
                                    <p style="margin: 6px 0 0; font-size: 12px; color: #475569; font-weight: 600;">#{receipt_no}</p>
                                    <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">{payment_date}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Status Badge -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 18px; text-align: center; background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-bottom: 1px solid #d1fae5;">
                        <div style="display: inline-block; background: #ffffff; border: 2px solid #22c55e; border-radius: 50px; padding: 8px 26px; box-shadow: 0 2px 8px rgba(34,197,94,0.12);">
                            <span style="font-size: 14px; font-weight: 700; color: #16a34a;">&#10003; Payment Successful</span>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Greeting -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 25px 30px 5px;">
                        <h2 style="margin: 0; font-size: 17px; color: #1e293b; font-weight: 700;">Dear {student_name},</h2>
                        <p style="margin: 5px 0 0; font-size: 13px; color: #475569;">Thank you for your payment. Here is your fee receipt.</p>
                    </td>
                </tr>
            </table>

            <!-- Amount Highlight -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 15px 30px;">
                        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 12px; padding: 22px 24px; color: #fff;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <div style="font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500;">Amount Paid</div>
                                        <div style="font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; margin-top: 2px;">&#8377;{amount:,.0f}</div>
                                    </td>
                                    <td style="vertical-align: middle; text-align: right;">
                                        <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Payment Mode</div>
                                        <div style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 2px;">{(payment_mode or 'N/A').upper()}</div>
                                        {f'<div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 6px;">UTR/Ref: <strong style="color: rgba(255,255,255,0.9);">{utr_number}</strong></div>' if utr_number else ''}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Fee Summary Cards -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px 30px 10px;">
                        <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse: separate;">
                            <tr>
                                <td width="33%" style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1.5px solid #93c5fd; border-radius: 10px; padding: 14px 10px; text-align: center;">
                                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #3b82f6;">Total Fees</div>
                                    <div style="font-size: 18px; font-weight: 800; color: #1e40af; margin-top: 4px;">&#8377;{total_fees:,.0f}</div>
                                </td>
                                <td width="33%" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #86efac; border-radius: 10px; padding: 14px 10px; text-align: center;">
                                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #22c55e;">Total Paid</div>
                                    <div style="font-size: 18px; font-weight: 800; color: #16a34a; margin-top: 4px;">&#8377;{total_paid:,.0f}</div>
                                </td>
                                <td width="33%" style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1.5px solid #fde68a; border-radius: 10px; padding: 14px 10px; text-align: center;">
                                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #f59e0b;">Balance Due</div>
                                    <div style="font-size: 18px; font-weight: 800; color: #d97706; margin-top: 4px;">&#8377;{pending:,.0f}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Progress Bar -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px 30px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size: 11px; font-weight: 600; color: #64748b;">Payment Progress</td>
                                <td style="font-size: 11px; font-weight: 700; color: #1e293b; text-align: right;">{pct}%</td>
                            </tr>
                        </table>
                        <div style="margin-top: 5px; height: 8px; background: #e2e8f0; border-radius: 100px; overflow: hidden;">
                            <div style="height: 100%; width: {pct}%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 100px;"></div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 20px 30px; background: #f8fafc; border-top: 2px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0 0 6px; font-size: 11px; color: #94a3b8; font-weight: 500;">{receipt_footer}</p>
                        <p style="margin: 0; font-size: 11px; color: #b0b8c4;">{company_name}{(' &bull; ' + company_address) if company_address else ''}{(' &bull; ' + company_phone) if company_phone else ''}</p>
                        <p style="margin: 10px 0 0; font-size: 10px; color: #cbd5e1; letter-spacing: 0.5px;">Powered by Education Hub Management System</p>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    """
    # Generate invoice PDF attachment
    pdf_bytes = None
    pdf_filename = None
    try:
        from app.utils.invoice_pdf import generate_invoice_pdf
        pdf_bytes = generate_invoice_pdf(
            receipt_no=receipt_no,
            amount=amount,
            payment_date=payment_date,
            payment_mode=payment_mode,
            utr_number=utr_number,
            student_name=student_name,
            total_fees=total_fees,
            total_paid=total_paid,
            pending=pending,
            branding=branding,
            student_phone=student_phone,
            student_email=student_email,
            student_course=student_course,
            student_university=student_university,
            student_father=student_father,
        )
        pdf_filename = f"Invoice_{receipt_no}.pdf"
        print(f"[Invoice PDF] Generated {pdf_filename} ({len(pdf_bytes)} bytes)")
    except Exception as e:
        print(f"[Invoice PDF] Generation failed: {e}")

    return send_email(to_email, f"Fee Receipt {receipt_no} - {company_name}", html,
                      attachment_bytes=pdf_bytes, attachment_filename=pdf_filename)


def send_password_reset_email(name: str, email: str, reset_token: str, reset_url: str):
    """Send password reset email."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Education Hub</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
            <h2>Password Reset Request</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Use the code below to reset it:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
                <h1 style="color: #3b82f6; letter-spacing: 5px; margin: 0;">{reset_token}</h1>
            </div>
            <p>This code is valid for <strong>30 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p style="color: #64748b; font-size: 14px;">Education Hub Team</p>
        </div>
    </div>
    """
    send_email(email, "Password Reset - Education Hub", html)
