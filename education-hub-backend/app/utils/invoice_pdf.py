"""
Invoice PDF generator using fpdf2.
Generates a professional fee receipt/invoice PDF.
"""
import io
from datetime import datetime
from fpdf import FPDF


class InvoicePDF(FPDF):
    """Custom PDF class for invoice generation."""

    def __init__(self, branding: dict):
        super().__init__()
        self.branding = branding
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        pass  # We draw header manually for more control

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        footer_text = self.branding.get("receipt_footer", "This is a computer generated receipt.")
        self.cell(0, 5, footer_text, align="C")


def generate_invoice_pdf(
    receipt_no: str,
    amount: float,
    payment_date: str,
    payment_mode: str,
    utr_number: str,
    student_name: str,
    student_phone: str = "",
    student_email: str = "",
    student_course: str = "",
    student_university: str = "",
    student_father: str = "",
    total_fees: float = 0,
    total_paid: float = 0,
    pending: float = 0,
    branding: dict = None,
) -> bytes:
    """
    Generate a professional invoice PDF and return as bytes.

    Returns:
        bytes: PDF file content
    """
    if branding is None:
        branding = {}

    company_name = branding.get("company_name", "ASFF Education Hub")
    company_phone = branding.get("company_phone", "")
    company_email = branding.get("company_email", "")
    company_address = branding.get("company_address", "")
    gst_number = branding.get("gst_number", "")
    receipt_prefix = branding.get("receipt_prefix", "ASFF")

    pdf = InvoicePDF(branding)
    pdf.add_page()
    page_w = pdf.w - 20  # usable width (10mm margins each side)

    # ===== TOP ACCENT BAR =====
    pdf.set_fill_color(30, 64, 175)  # Blue
    pdf.rect(10, 10, page_w, 3, "F")

    # ===== HEADER =====
    pdf.set_y(18)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(page_w * 0.6, 8, company_name, ln=0)

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(page_w * 0.4, 8, "FEE RECEIPT", align="R", ln=1)

    # Company details
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(100, 116, 139)
    if company_address:
        pdf.cell(page_w * 0.6, 4, company_address, ln=0)
    else:
        pdf.cell(page_w * 0.6, 4, "", ln=0)

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(page_w * 0.4, 4, f"#{receipt_no}", align="R", ln=1)

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(100, 116, 139)
    contact_parts = []
    if company_phone:
        contact_parts.append(company_phone)
    if company_email:
        contact_parts.append(company_email)
    pdf.cell(page_w * 0.6, 4, " | ".join(contact_parts), ln=0)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(page_w * 0.4, 4, f"Date: {payment_date}", align="R", ln=1)

    if gst_number:
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(page_w, 4, f"GST: {gst_number}", ln=1)

    # Divider
    pdf.set_y(pdf.get_y() + 3)
    pdf.set_draw_color(30, 64, 175)
    pdf.set_line_width(0.5)
    pdf.line(10, pdf.get_y(), 10 + page_w, pdf.get_y())
    pdf.set_y(pdf.get_y() + 5)

    # ===== STUDENT DETAILS =====
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(page_w, 7, "Student Details", ln=1)

    y_start = pdf.get_y()
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(10, y_start, page_w, 28, "F")

    pdf.set_y(y_start + 2)
    col_w = page_w / 2

    def detail_row(label, value, x_offset=10):
        pdf.set_x(x_offset)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(30, 4, label + ":", ln=0)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(col_w - 30, 4, str(value) if value else "N/A", ln=0)

    # Row 1
    detail_row("Name", student_name, 12)
    detail_row("Phone", student_phone, 12 + col_w)
    pdf.ln(5)

    # Row 2
    detail_row("Email", student_email, 12)
    detail_row("Father", student_father, 12 + col_w)
    pdf.ln(5)

    # Row 3
    if student_university or student_course:
        detail_row("University", student_university, 12)
        detail_row("Course", student_course, 12 + col_w)
        pdf.ln(5)

    pdf.set_y(y_start + 30)

    # ===== PAYMENT DETAILS TABLE =====
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(page_w, 7, "Payment Details", ln=1)

    # Table header
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(page_w * 0.35, 8, "  Description", fill=True, ln=0)
    pdf.cell(page_w * 0.2, 8, "Mode", fill=True, align="C", ln=0)
    pdf.cell(page_w * 0.25, 8, "UTR/Ref No.", fill=True, align="C", ln=0)
    pdf.cell(page_w * 0.2, 8, "Amount", fill=True, align="R", ln=1)

    # Table row
    pdf.set_fill_color(248, 250, 252)
    pdf.set_text_color(30, 41, 59)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(page_w * 0.35, 8, f"  Fee Payment - {receipt_no}", fill=True, ln=0)
    pdf.cell(page_w * 0.2, 8, (payment_mode or "N/A").upper(), fill=True, align="C", ln=0)
    pdf.cell(page_w * 0.25, 8, utr_number or "N/A", fill=True, align="C", ln=0)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(page_w * 0.2, 8, f"Rs.{amount:,.0f}  ", fill=True, align="R", ln=1)

    # Total row
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(page_w * 0.8, 9, "  Total Amount Paid", fill=True, ln=0)
    pdf.cell(page_w * 0.2, 9, f"Rs.{amount:,.0f}  ", fill=True, align="R", ln=1)

    pdf.set_y(pdf.get_y() + 8)

    # ===== FEE SUMMARY =====
    if total_fees > 0:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(page_w, 7, "Fee Summary", ln=1)

        y_sum = pdf.get_y()
        box_w = page_w / 3 - 2
        box_h = 22

        # Total Fees box
        pdf.set_fill_color(239, 246, 255)
        pdf.rect(10, y_sum, box_w, box_h, "F")
        pdf.set_xy(10, y_sum + 3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(59, 130, 246)
        pdf.cell(box_w, 4, "TOTAL FEES", align="C", ln=1)
        pdf.set_x(10)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(30, 64, 175)
        pdf.cell(box_w, 8, f"Rs.{total_fees:,.0f}", align="C", ln=1)

        # Total Paid box
        pdf.set_fill_color(240, 253, 244)
        pdf.rect(10 + box_w + 3, y_sum, box_w, box_h, "F")
        pdf.set_xy(10 + box_w + 3, y_sum + 3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(34, 197, 94)
        pdf.cell(box_w, 4, "TOTAL PAID", align="C", ln=1)
        pdf.set_x(10 + box_w + 3)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(22, 163, 74)
        pdf.cell(box_w, 8, f"Rs.{total_paid:,.0f}", align="C", ln=1)

        # Balance Due box
        pdf.set_fill_color(255, 251, 235)
        pdf.rect(10 + (box_w + 3) * 2, y_sum, box_w, box_h, "F")
        pdf.set_xy(10 + (box_w + 3) * 2, y_sum + 3)
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(245, 158, 11)
        pdf.cell(box_w, 4, "BALANCE DUE", align="C", ln=1)
        pdf.set_x(10 + (box_w + 3) * 2)
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(217, 119, 6)
        pdf.cell(box_w, 8, f"Rs.{pending:,.0f}", align="C", ln=1)

        # Progress bar
        pdf.set_y(y_sum + box_h + 5)
        pct = round((total_paid / total_fees) * 100) if total_fees > 0 else 0
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(100, 116, 139)
        pdf.cell(page_w * 0.5, 4, "Payment Progress", ln=0)
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(30, 41, 59)
        pdf.cell(page_w * 0.5, 4, f"{pct}%", align="R", ln=1)

        bar_y = pdf.get_y() + 1
        # Background bar
        pdf.set_fill_color(226, 232, 240)
        pdf.rect(10, bar_y, page_w, 4, "F")
        # Progress fill
        if pct > 0:
            pdf.set_fill_color(34, 197, 94)
            pdf.rect(10, bar_y, page_w * min(pct, 100) / 100, 4, "F")

        pdf.set_y(bar_y + 10)

    # ===== PAYMENT STATUS =====
    pdf.set_y(pdf.get_y() + 3)
    status_y = pdf.get_y()
    pdf.set_fill_color(240, 253, 244)
    pdf.rect(10, status_y, page_w, 12, "F")
    pdf.set_draw_color(34, 197, 94)
    pdf.set_line_width(0.3)
    pdf.rect(10, status_y, page_w, 12, "D")
    pdf.set_xy(10, status_y + 2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(22, 163, 74)
    pdf.cell(page_w, 8, "PAYMENT SUCCESSFUL", align="C", ln=1)

    # Generated timestamp
    pdf.set_y(pdf.get_y() + 5)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(page_w, 4, f"Generated on {datetime.now().strftime('%d-%b-%Y %I:%M %p')}", align="C", ln=1)

    # Return as bytes
    return pdf.output()
