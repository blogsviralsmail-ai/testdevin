<?php
/**
 * VideoByte — Configuration
 * Update these values for your server environment.
 */

// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'videobyte_db');
define('DB_USER', 'videobyte_user');
define('DB_PASS', 'VideoByte@2025');

// App
define('APP_NAME', 'VideoByte');
define('APP_URL', 'http://localhost');          // change in production
define('JWT_SECRET', 'CHANGE_ME_to_random_64_chars');

// Email (SMTP for OTP)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', '');   // your@gmail.com
define('SMTP_PASS', '');   // app-password
define('SMTP_FROM', 'noreply@videobyte.in');
define('SMTP_FROM_NAME', 'VideoByte');

// Google / YouTube OAuth
define('GOOGLE_CLIENT_ID', '');
define('GOOGLE_CLIENT_SECRET', '');
define('GOOGLE_REDIRECT_URI', APP_URL . '/google_login.php');
define('YT_REDIRECT_URI', APP_URL . '/api.php?action=yt_callback');

// Facebook OAuth
define('FB_APP_ID', '');
define('FB_APP_SECRET', '');
define('FB_REDIRECT_URI', APP_URL . '/api.php?action=fb_callback');

// Instagram
define('IG_REDIRECT_URI', APP_URL . '/instagram_login.php');

// TikTok
define('TT_CLIENT_KEY', '');
define('TT_CLIENT_SECRET', '');
define('TT_REDIRECT_URI', APP_URL . '/api.php?action=tt_callback');

// Uploads
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_UPLOAD_SIZE', 2 * 1024 * 1024 * 1024); // 2 GB

// Session
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0);  // set 1 in production with HTTPS
ini_set('session.use_strict_mode', 1);
session_start();

// DB connection
function db() {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

// JSON response helper
function json_out($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Read JSON body
function json_body() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

// Get logged-in user from session
function current_user() {
    return $_SESSION['user'] ?? null;
}

// Require logged-in
function require_auth() {
    $u = current_user();
    if (!$u) json_out(['ok' => false, 'message' => 'Unauthorized'], 401);
    return $u;
}

// Require admin
function require_admin() {
    $u = require_auth();
    if ($u['role'] !== 'admin') json_out(['ok' => false, 'message' => 'Forbidden'], 403);
    return $u;
}

// Generate random OTP
function generate_otp($len = 6) {
    return str_pad(random_int(0, pow(10, $len) - 1), $len, '0', STR_PAD_LEFT);
}

// Simple JWT encode/decode (HS256)
function jwt_encode($payload) {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + 86400 * 30; // 30 days
    $body = base64url_encode(json_encode($payload));
    $sig = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $sig = base64url_encode(hash_hmac('sha256', "$parts[0].$parts[1]", JWT_SECRET, true));
    if (!hash_equals($sig, $parts[2])) return null;
    $payload = json_decode(base64url_decode($parts[1]), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

// Send OTP email (simple mail() fallback; replace with SMTP library in production)
function send_otp_email($to, $otp) {
    $subject = APP_NAME . ' — Verification Code';
    $body = "Your verification code is: <b>$otp</b><br><br>This code expires in 10 minutes.<br><br>" . APP_NAME;
    $headers = "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    return @mail($to, $subject, $body, $headers);
}
