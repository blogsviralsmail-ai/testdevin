<?php
// Jai Collection - CSV + PDF export helpers. PDF uses plain HTML -> browser
// print (Ctrl+P -> Save as PDF). Keeps the app dependency-free.

function exportCsv($filename, $headers, $rows) {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $fp = fopen('php://output', 'w');
    fputs($fp, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
    fputcsv($fp, $headers);
    foreach ($rows as $row) fputcsv($fp, $row);
    fclose($fp);
    exit;
}

function exportPdf($title, $headers, $rows) {
    // Serve a print-styled HTML; user uses browser's "Print → Save as PDF".
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!doctype html><html><head><meta charset="utf-8"><title>' . htmlspecialchars($title) . '</title>';
    echo '<style>
        body{font-family:Arial,sans-serif;margin:24px;color:#222;}
        h1{color:#0d2d66;margin:0 0 10px;font-size:20px;}
        .meta{color:#888;font-size:12px;margin-bottom:16px;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{background:#0d2d66;color:#fff;padding:7px 8px;text-align:left;}
        td{padding:6px 8px;border-bottom:1px solid #eee;}
        tr:nth-child(even) td{background:#fafbff;}
        .noprint{margin-bottom:14px;}
        @media print { .noprint{display:none;} }
    </style></head><body>';
    echo '<div class="noprint"><button onclick="window.print()" style="padding:8px 18px;background:#e53935;color:#fff;border:0;border-radius:6px;cursor:pointer;">Print / Save as PDF</button></div>';
    echo '<h1>' . htmlspecialchars($title) . '</h1>';
    echo '<div class="meta">Generated: ' . date('d M Y, h:i A') . '</div>';
    echo '<table><thead><tr>';
    foreach ($headers as $h) echo '<th>' . htmlspecialchars($h) . '</th>';
    echo '</tr></thead><tbody>';
    foreach ($rows as $row) {
        echo '<tr>';
        foreach ($row as $cell) echo '<td>' . htmlspecialchars((string)$cell) . '</td>';
        echo '</tr>';
    }
    echo '</tbody></table>';
    echo '<script>setTimeout(function(){window.print();},400);</script>';
    echo '</body></html>';
    exit;
}
