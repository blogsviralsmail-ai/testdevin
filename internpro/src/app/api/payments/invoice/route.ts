import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paymentId = request.nextUrl.searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true, phone: true, collegeName: true, degree: true } },
          batch: { include: { program: { select: { title: true, domain: true } } } },
        },
      },
    },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const companyName = sMap.letterhead_company_name || sMap.company_name || "KKHS Media Private Limited";
  const companyAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur";
  const companyPhone = sMap.letterhead_phone || "9782005500";
  const companyEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
  const cin = sMap.letterhead_cin || "";
  const msme = sMap.letterhead_msme || "";

  const student = payment.enrollment?.student;
  const program = payment.enrollment?.batch?.program;
  const invoiceNumber = `INV-${new Date(payment.createdAt).getFullYear()}-${payment.id.slice(-8).toUpperCase()}`;
  const date = new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 30px; color: #333; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0000AA; padding-bottom: 15px; margin-bottom: 25px; }
    .company { font-size: 18px; font-weight: bold; color: #0000AA; }
    .company-details { font-size: 11px; color: #666; margin-top: 4px; }
    .invoice-title { font-size: 28px; font-weight: bold; color: #0000AA; text-align: right; }
    .invoice-meta { text-align: right; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 12px; border-bottom: 2px solid #dee2e6; }
    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #333; }
    .section-title { font-size: 13px; font-weight: bold; color: #0000AA; margin: 20px 0 8px; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-paid { background: #d4edda; color: #155724; }
    .badge-refund { background: #f8d7da; color: #721c24; }
  </style></head><body>
    <div class="header">
      <div>
        <div class="company">${companyName}</div>
        <div class="company-details">${companyAddress}<br/>Ph: ${companyPhone} | ${companyEmail}${cin ? `<br/>CIN: ${cin}` : ""}${msme ? ` | MSME: ${msme}` : ""}</div>
      </div>
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-meta">${invoiceNumber}<br/>${date}</div>
      </div>
    </div>

    <div class="section-title">Bill To:</div>
    <div style="font-size:13px;">
      <strong>${student?.name || "Student"}</strong><br/>
      ${student?.email || ""}<br/>
      ${student?.phone || ""}${student?.collegeName ? `<br/>${student.collegeName}` : ""}
    </div>

    <div class="section-title">Payment Details:</div>
    <table>
      <thead><tr><th>Description</th><th>Program</th><th>Method</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>${payment.type === "refund" ? "Refund" : payment.description || "Program Fee"} <span class="badge ${payment.amount < 0 ? "badge-refund" : "badge-paid"}">${payment.status}</span></td>
          <td>${program?.title || "—"}</td>
          <td>${payment.method || "—"}</td>
          <td style="text-align:right">${payment.amount < 0 ? "-" : ""}₹${Math.abs(payment.amount).toLocaleString("en-IN")}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3">Total</td>
          <td style="text-align:right">${payment.amount < 0 ? "-" : ""}₹${Math.abs(payment.amount).toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      This is a computer-generated invoice and does not require a signature.<br/>
      ${companyName} | ${companyAddress} | ${companyPhone}
    </div>
  </body></html>`;

  // Return HTML — client can print to PDF
  const format = request.nextUrl.searchParams.get("format");
  if (format === "pdf") {
    try {
      const { htmlToPdfBuffer } = await import("@/lib/pdf");
      const pdfBuffer = await htmlToPdfBuffer(html);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
        },
      });
    } catch {
      return NextResponse.json({ error: "PDF generation failed. Use HTML format." }, { status: 500 });
    }
  }

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
