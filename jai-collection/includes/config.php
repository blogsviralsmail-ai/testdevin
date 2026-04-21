<?php
// Jai Collection - Core Configuration
// Single-vendor e-commerce with admin panel, agent commissions, RogerPay integration

// ====== Database Configuration ======
// Values can be overridden by environment variables (useful for local dev / CI)
define('DB_HOST', getenv('JC_DB_HOST') ?: 'localhost');
define('DB_USER', getenv('JC_DB_USER') ?: 'jaicollection_user');
define('DB_PASS', getenv('JC_DB_PASS') ?: 'JaiCollection@2025');
define('DB_NAME', getenv('JC_DB_NAME') ?: 'jaicollection_db');

// ====== Site Configuration ======
define('SITE_URL', getenv('JC_SITE_URL') ?: 'https://jaicollection.in');
define('SITE_NAME', 'Jai Collection');
define('SITE_TAGLINE', 'Fashion. Home. Daily Essentials.');
define('SITE_CURRENCY', 'INR');
define('SITE_CURRENCY_SYMBOL', '₹');

// Base path for includes (absolute disk path to this app root)
define('JC_ROOT', realpath(__DIR__ . '/..'));

// Upload paths (disk + URL)
define('UPLOAD_DIR', JC_ROOT . '/uploads');
define('UPLOAD_URL', SITE_URL . '/uploads');

// Session hardening
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_start();
}

// ====== Database Connections ======
function getDBConnection() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            die('Database connection failed: ' . $conn->connect_error);
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

function getPDO() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false) {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Database error']);
                exit;
            }
            die('Database error');
        }
    }
    return $pdo;
}

// ====== Utility Helpers ======
function e($s) {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

// Sanitize user input for storage (strips tags, does NOT HTML-encode — e() handles
// encoding at render time). Never use this on cryptographic keys or webhook secrets.
function sanitize($data) {
    return strip_tags(trim((string)$data));
}

// Return a safe internal redirect path. Rejects external URLs (open-redirect guard).
function safeRedirect($target, $fallback) {
    if (!is_string($target) || $target === '') return $fallback;
    // Must be an internal path starting with '/' and not a protocol-relative '//'
    if ($target[0] !== '/' || (isset($target[1]) && $target[1] === '/')) return $fallback;
    if (strpos($target, "\n") !== false || strpos($target, "\r") !== false) return $fallback;
    return $target;
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function money($amount) {
    return SITE_CURRENCY_SYMBOL . number_format((float)$amount, 2);
}

function slugify($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9\-]+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

function generateRandomString($length = 10) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out = '';
    for ($i = 0; $i < $length; $i++) {
        $out .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $out;
}

function generateOrderNumber() {
    return 'JC' . date('ymd') . strtoupper(generateRandomString(5));
}

function formatDate($d) { return $d ? date('d M Y', strtotime($d)) : ''; }
function formatDateTime($d) { return $d ? date('d M Y h:i A', strtotime($d)) : ''; }

// ====== Flash messages ======
function setFlash($type, $msg) {
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}

function getFlash() {
    if (isset($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}

// ====== CSRF ======
function csrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField() {
    return '<input type="hidden" name="csrf_token" value="' . e(csrfToken()) . '">';
}

function csrfVerify() {
    $t = $_POST['csrf_token'] ?? '';
    if (!$t || !hash_equals($_SESSION['csrf_token'] ?? '', $t)) {
        http_response_code(403);
        die('Invalid CSRF token. Please refresh and try again.');
    }
}

// ====== Role Helpers ======
function currentAdmin() { return $_SESSION['admin'] ?? null; }
function currentAgent() { return $_SESSION['agent'] ?? null; }
function currentCustomer() { return $_SESSION['customer'] ?? null; }

function requireAdmin() {
    if (!currentAdmin()) { redirect(SITE_URL . '/admin/login.php'); }
}

function requireAgent() {
    if (!currentAgent()) { redirect(SITE_URL . '/agent/login.php'); }
}

function requireCustomer() {
    if (!currentCustomer()) { redirect(SITE_URL . '/account/login.php?redirect=' . urlencode($_SERVER['REQUEST_URI'] ?? '/')); }
}

// ====== Settings ======
function getSetting($key, $default = '') {
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        try {
            $stmt = getPDO()->query("SELECT setting_key, setting_value FROM settings");
            foreach ($stmt->fetchAll() as $row) {
                $cache[$row['setting_key']] = $row['setting_value'];
            }
        } catch (Exception $e) { /* table may not exist yet during install */ }
    }
    return array_key_exists($key, $cache) ? $cache[$key] : $default;
}

function setSetting($key, $value) {
    $stmt = getPDO()->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    return $stmt->execute([$key, $value]);
}

// ====== Cart (session-based for guests + DB-backed for logged-in customers later) ======
function cartItems() {
    return $_SESSION['cart'] ?? [];
}

function cartAdd($productId, $variantId, $qty = 1) {
    if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];
    $key = $productId . '_' . ($variantId ?: 0);
    if (isset($_SESSION['cart'][$key])) {
        $_SESSION['cart'][$key]['qty'] += (int)$qty;
    } else {
        $_SESSION['cart'][$key] = [
            'product_id' => (int)$productId,
            'variant_id' => $variantId ? (int)$variantId : null,
            'qty' => (int)$qty,
        ];
    }
}

function cartUpdate($key, $qty) {
    if (isset($_SESSION['cart'][$key])) {
        if ($qty <= 0) unset($_SESSION['cart'][$key]);
        else $_SESSION['cart'][$key]['qty'] = (int)$qty;
    }
}

function cartRemove($key) {
    unset($_SESSION['cart'][$key]);
}

function cartClear() {
    unset($_SESSION['cart']);
}

function cartCount() {
    $n = 0;
    foreach (cartItems() as $item) { $n += (int)$item['qty']; }
    return $n;
}

// ====== Agent referral attribution ======
// Agents share ?ref=<code>. We set a cookie for 30 days so any order placed
// within that window is attributed to them.
function captureAgentRef() {
    if (!empty($_GET['ref'])) {
        $code = preg_replace('/[^A-Za-z0-9_-]/', '', $_GET['ref']);
        if ($code) {
            setcookie('jc_ref', $code, time() + 60 * 60 * 24 * 30, '/');
            $_COOKIE['jc_ref'] = $code;
        }
    }
}

function currentAgentRefId() {
    if (empty($_COOKIE['jc_ref'])) return null;
    $code = preg_replace('/[^A-Za-z0-9_-]/', '', $_COOKIE['jc_ref']);
    if (!$code) return null;
    $stmt = getPDO()->prepare("SELECT id FROM agents WHERE referral_code = ? AND status = 'active'");
    $stmt->execute([$code]);
    $row = $stmt->fetch();
    return $row ? (int)$row['id'] : null;
}

captureAgentRef();
