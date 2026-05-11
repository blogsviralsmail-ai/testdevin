// Client-side CSV and PDF export utilities

export function exportToCSV(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(",");
  const rows = data.map(row =>
    cols.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToPDF(title: string, tableHTML: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
    h1 { text-align: center; color: #0EA5B8; font-size: 22px; margin-bottom: 5px; }
    .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #0EA5B8; color: white; padding: 6px 8px; text-align: left; font-weight: 600; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    tr:nth-child(even) { background: #f8f9fa; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { body { padding: 10px; } @page { size: landscape; margin: 10mm; } }
  </style></head><body>
  <h1>${title}</h1>
  <p class="subtitle">Complete Raw Data Export - Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} at ${new Date().toLocaleTimeString("en-IN")}</p>
  ${tableHTML}
  <div class="footer">KKHS Media Private Limited | internship.kkhsmedia.com</div>
  </body></html>`);
  w.document.close();
  w.print();
}

export function buildTableHTML(data: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => `<th>${c.label}</th>`).join("");
  const rows = data.map(row =>
    "<tr>" + columns.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      return `<td>${String(val)}</td>`;
    }).join("") + "</tr>"
  ).join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function serverExportCSV(exportType: string) {
  window.open(`/api/export?type=${exportType}&format=csv`, "_blank");
}

export async function serverExportPDF(exportType: string, title: string) {
  try {
    const res = await fetch(`/api/export?type=${exportType}&format=json`);
    if (!res.ok) { alert("Export failed"); return; }
    const { data, headers: hdrs } = await res.json();
    if (!data || !data.length) { alert("No data to export"); return; }
    const columns = hdrs ? hdrs.map((h: string, i: number) => {
      const keys = Object.keys(data[0]);
      return { key: keys[i] || h, label: h };
    }) : Object.keys(data[0]).map((k: string) => ({ key: k, label: k }));
    const tableHTML = buildTableHTML(data, columns);
    exportToPDF(title, tableHTML);
  } catch {
    alert("Export failed");
  }
}
