<?php
// Jai Collection - Email + Telegram notifications.
// Email sending uses the stored SMTP credentials when configured, else PHP mail().
// All helpers are failure-tolerant: a broken SMTP config must NOT break
// checkout, status updates, or registration. Every call wraps errors and logs.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

function jcEmailFromConfig() {
    return [
        'host' => trim((string)getSetting('smtp_host', '')),
        'port' => (int)getSetting('smtp_port', 587),
        'user' => trim((string)getSetting('smtp_user', '')),
        'pass' => (string)getSetting('smtp_pass', ''),
        'secure' => strtolower(trim((string)getSetting('smtp_secure', 'tls'))),
        'from_email' => trim((string)getSetting('smtp_from_email', getSetting('site_email', 'no-reply@jaicollection.in'))),
        'from_name' => trim((string)getSetting('smtp_from_name', getSetting('site_name', 'Jai Collection'))),
    ];
}

function sendEmail($to, $subject, $htmlBody, $textBody = null) {
    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $cfg = jcEmailFromConfig();
    $textBody = $textBody ?: strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));

    if ($cfg['host'] && $cfg['user']) {
        return jcSmtpSend($cfg, $to, $subject, $htmlBody, $textBody);
    }
    // Fallback: PHP mail() (requires sendmail/postfix on host)
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . jcMimeHeader($cfg['from_name']) . ' <' . $cfg['from_email'] . '>',
        'Reply-To: ' . $cfg['from_email'],
        'X-Mailer: JaiCollection',
    ];
    $ok = @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    if (!$ok) error_log('[jc-notify] mail() failed for ' . $to);
    return $ok;
}

function jcMimeHeader($s) {
    if (preg_match('/^[\x20-\x7E]*$/', $s)) return $s;
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

// Minimal SMTP sender over sockets. Supports STARTTLS (tls) or implicit SSL (ssl).
// Returns true on success, false on any error (logged).
function jcSmtpSend($cfg, $to, $subject, $htmlBody, $textBody) {
    $host = $cfg['host'];
    $port = $cfg['port'] ?: 587;
    $secure = $cfg['secure'];
    $sockHost = ($secure === 'ssl') ? 'ssl://' . $host : $host;

    $errno = 0; $errstr = '';
    $fp = @stream_socket_client($sockHost . ':' . $port, $errno, $errstr, 15);
    if (!$fp) { error_log('[jc-smtp] connect failed: ' . $errstr); return false; }
    stream_set_timeout($fp, 20);

    $read = function() use ($fp) {
        $data = '';
        while (!feof($fp)) {
            $line = fgets($fp, 1024);
            if ($line === false) break;
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $write = function($cmd) use ($fp) { fwrite($fp, $cmd . "\r\n"); };
    $expect = function($resp, $codes) {
        if (!$resp) return false;
        $code = substr($resp, 0, 3);
        return in_array($code, (array)$codes, true);
    };

    $ehlo = $_SERVER['SERVER_NAME'] ?? 'jaicollection.local';

    $r = $read(); if (!$expect($r, ['220'])) { fclose($fp); return jcSmtpLog('banner', $r); }
    $write('EHLO ' . $ehlo); $r = $read(); if (!$expect($r, ['250'])) { fclose($fp); return jcSmtpLog('EHLO', $r); }

    if ($secure === 'tls') {
        $write('STARTTLS'); $r = $read(); if (!$expect($r, ['220'])) { fclose($fp); return jcSmtpLog('STARTTLS', $r); }
        if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { fclose($fp); return jcSmtpLog('TLS', 'crypto enable failed'); }
        $write('EHLO ' . $ehlo); $r = $read(); if (!$expect($r, ['250'])) { fclose($fp); return jcSmtpLog('EHLO2', $r); }
    }

    $write('AUTH LOGIN'); $r = $read(); if (!$expect($r, ['334'])) { fclose($fp); return jcSmtpLog('AUTH', $r); }
    $write(base64_encode($cfg['user'])); $r = $read(); if (!$expect($r, ['334'])) { fclose($fp); return jcSmtpLog('USER', $r); }
    $write(base64_encode($cfg['pass'])); $r = $read(); if (!$expect($r, ['235'])) { fclose($fp); return jcSmtpLog('PASS', $r); }

    $write('MAIL FROM: <' . $cfg['from_email'] . '>'); $r = $read(); if (!$expect($r, ['250'])) { fclose($fp); return jcSmtpLog('FROM', $r); }
    $write('RCPT TO: <' . $to . '>'); $r = $read(); if (!$expect($r, ['250','251'])) { fclose($fp); return jcSmtpLog('RCPT', $r); }
    $write('DATA'); $r = $read(); if (!$expect($r, ['354'])) { fclose($fp); return jcSmtpLog('DATA', $r); }

    $boundary = 'bnd_' . md5(uniqid('', true));
    $msg = '';
    $msg .= 'From: ' . jcMimeHeader($cfg['from_name']) . ' <' . $cfg['from_email'] . '>' . "\r\n";
    $msg .= 'To: <' . $to . '>' . "\r\n";
    $msg .= 'Subject: ' . jcMimeHeader($subject) . "\r\n";
    $msg .= 'Date: ' . date('r') . "\r\n";
    $msg .= 'MIME-Version: 1.0' . "\r\n";
    $msg .= 'Content-Type: multipart/alternative; boundary="' . $boundary . '"' . "\r\n\r\n";
    $msg .= '--' . $boundary . "\r\n" . 'Content-Type: text/plain; charset=UTF-8' . "\r\n\r\n" . $textBody . "\r\n\r\n";
    $msg .= '--' . $boundary . "\r\n" . 'Content-Type: text/html; charset=UTF-8' . "\r\n\r\n" . $htmlBody . "\r\n\r\n";
    $msg .= '--' . $boundary . '--' . "\r\n";
    // Dot-stuff
    $msg = preg_replace('/^\./m', '..', $msg);
    fwrite($fp, $msg . "\r\n.\r\n");
    $r = $read();
    fwrite($fp, "QUIT\r\n");
    fclose($fp);
    if (!$expect($r, ['250'])) return jcSmtpLog('end-DATA', $r);
    return true;
}

function jcSmtpLog($stage, $resp) {
    error_log('[jc-smtp] ' . $stage . ': ' . trim((string)$resp));
    return false;
}

function sendTelegram($text, $parseMode = 'HTML') {
    $token = trim((string)getSetting('telegram_bot_token', ''));
    $chatId = trim((string)getSetting('telegram_chat_id', ''));
    if (!$token || !$chatId) return false;
    $ch = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => $parseMode,
            'disable_web_page_preview' => true,
        ]),
    ]);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200) error_log('[jc-telegram] http ' . $code . ': ' . ($err ?: substr((string)$res, 0, 200)));
    return $code === 200;
}

// ===== Branded templates =====

function jcEmailWrapper($innerHtml, $heading = '') {
    $site = e(getSetting('site_name', SITE_NAME));
    $brand = '#e53935';
    return '<div style="font-family:Arial,sans-serif;background:#f4f6fa;padding:24px;">'
        . '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);">'
        . '<div style="background:linear-gradient(135deg,#f26722,' . $brand . ');padding:18px 24px;color:#fff;">'
        . '<div style="font-size:20px;font-weight:700;">' . $site . '</div>'
        . ($heading ? '<div style="font-size:15px;opacity:0.95;margin-top:4px;">' . e($heading) . '</div>' : '')
        . '</div>'
        . '<div style="padding:24px;color:#333;font-size:14px;line-height:1.55;">' . $innerHtml . '</div>'
        . '<div style="padding:14px 24px;background:#f7f8fa;color:#888;font-size:12px;border-top:1px solid #eee;text-align:center;">'
        . '&copy; ' . date('Y') . ' ' . $site . ' &middot; <a href="' . e(SITE_URL) . '" style="color:#888;">' . e(SITE_URL) . '</a></div>'
        . '</div></div>';
}

function notifyOrderPlaced($orderId) {
    $pdo = getPDO();
    $o = $pdo->prepare("SELECT * FROM orders WHERE id = ?"); $o->execute([$orderId]); $o = $o->fetch();
    if (!$o) return;

    // Customer email
    if (!empty($o['ship_email'])) {
        $body = '<p>Hi <strong>' . e($o['ship_name']) . '</strong>,</p>'
            . '<p>Thank you for shopping with us! Your order <strong>#' . e($o['order_number']) . '</strong> has been placed successfully.</p>'
            . '<p><b>Total:</b> ' . money($o['total']) . '<br><b>Payment:</b> ' . e(strtoupper($o['payment_method'])) . ' &middot; ' . e($o['payment_status']) . '</p>'
            . '<p>You can track your order here:<br><a href="' . e(SITE_URL) . '/order-track.php?order=' . urlencode($o['order_number']) . '" style="background:#e53935;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">Track Order</a></p>';
        sendEmail($o['ship_email'], 'Order Placed · #' . $o['order_number'], jcEmailWrapper($body, 'Order Confirmation'));
    }
    // Telegram to admin
    $msg = "<b>🛒 New Order</b>\n"
        . "Order: <b>" . htmlspecialchars($o['order_number']) . "</b>\n"
        . "Customer: " . htmlspecialchars($o['ship_name']) . " (" . htmlspecialchars($o['ship_mobile']) . ")\n"
        . "Total: ₹" . number_format((float)$o['total'], 2) . "\n"
        . "Payment: " . strtoupper($o['payment_method']) . " · " . $o['payment_status'] . "\n"
        . "City: " . htmlspecialchars($o['ship_city']) . " · " . htmlspecialchars($o['ship_pincode']);
    sendTelegram($msg);
}

function notifyOrderStatusChange($orderId, $newStatus) {
    $pdo = getPDO();
    $o = $pdo->prepare("SELECT * FROM orders WHERE id = ?"); $o->execute([$orderId]); $o = $o->fetch();
    if (!$o) return;

    $statusCopy = [
        'confirmed' => 'has been confirmed',
        'packed' => 'has been packed',
        'shipped' => 'has been shipped',
        'delivered' => 'has been delivered',
        'cancelled' => 'has been cancelled',
        'returned' => 'has been marked as returned',
    ];
    $line = $statusCopy[$newStatus] ?? ('status updated to ' . $newStatus);

    if (!empty($o['ship_email'])) {
        $body = '<p>Hi <strong>' . e($o['ship_name']) . '</strong>,</p>'
            . '<p>Your order <strong>#' . e($o['order_number']) . '</strong> ' . e($line) . '.</p>'
            . ($newStatus === 'delivered' ? '<p>We hope you love your purchase! We would appreciate a quick review.</p>' : '')
            . '<p><a href="' . e(SITE_URL) . '/order-track.php?order=' . urlencode($o['order_number']) . '" style="background:#e53935;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">Track Order</a></p>';
        sendEmail($o['ship_email'], 'Order Update · #' . $o['order_number'], jcEmailWrapper($body, 'Order ' . ucfirst($newStatus)));
    }

    $msg = "<b>📦 Order " . htmlspecialchars(ucfirst($newStatus)) . "</b>\n"
        . "Order: <b>" . htmlspecialchars($o['order_number']) . "</b>\n"
        . "Customer: " . htmlspecialchars($o['ship_name']) . "\n"
        . "Total: ₹" . number_format((float)$o['total'], 2);
    sendTelegram($msg);
}

function notifyPasswordReset($email, $name, $resetLink) {
    if (!$email) return false;
    $body = '<p>Hi <strong>' . e($name) . '</strong>,</p>'
        . '<p>We received a request to reset your password. Click the button below to set a new password (valid for 60 minutes):</p>'
        . '<p><a href="' . e($resetLink) . '" style="background:#e53935;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">Reset Password</a></p>'
        . '<p style="color:#888;font-size:12px;">If you did not request this, you can safely ignore this email.</p>';
    return sendEmail($email, 'Reset your password', jcEmailWrapper($body, 'Password Reset'));
}

function notifyWelcome($email, $name, $role = 'customer') {
    if (!$email) return false;
    $body = '<p>Hi <strong>' . e($name) . '</strong>,</p>'
        . '<p>Welcome to <strong>' . e(getSetting('site_name', SITE_NAME)) . '</strong>! Your ' . e($role) . ' account has been created successfully.</p>'
        . '<p><a href="' . e(SITE_URL) . '" style="background:#e53935;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">Start Shopping</a></p>';
    return sendEmail($email, 'Welcome to ' . getSetting('site_name', SITE_NAME), jcEmailWrapper($body, 'Welcome!'));
}
