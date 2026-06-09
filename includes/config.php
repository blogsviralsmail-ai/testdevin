<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'jptilesi_user');
define('DB_PASS', 'JPTiles@2024Secure');
define('DB_NAME', 'jptilesi_db');

// Site Configuration
define('SITE_URL', 'https://jptiles.in');
define('SITE_NAME', 'JP Tiles');
define('SITE_TAGLINE', '#1 Trusted Brand Since 2013');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
session_start();

// Database Connection (mysqli)
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

// PDO Database Connection (for API)
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Only die if this is an API request
    if (strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
        die(json_encode(['success' => false, 'message' => 'Database connection failed']));
    }
}

// Helper Functions
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function redirect($url) {
    header("Location: $url");
    exit();
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

function isMason() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'mason';
}

function isEmployee() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'employee';
}

function isAdminOrEmployee() {
    return isAdmin() || isEmployee();
}

// Check if user has specific permission
function hasPermission($permission) {
    if (isAdmin()) return true; // Admin has all permissions
    if (!isEmployee()) return false;
    
    $permissions = isset($_SESSION['user_permissions']) ? $_SESSION['user_permissions'] : [];
    return in_array($permission, $permissions);
}

// Get customer categories
function getCustomerCategories() {
    $conn = getDBConnection();
    $result = $conn->query("SELECT * FROM customer_categories WHERE status = 'active' ORDER BY sort_order");
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    $conn->close();
    return $categories;
}

function formatDate($date) {
    return date('d M Y', strtotime($date));
}

function formatDateTime($datetime) {
    return date('d M Y h:i A', strtotime($datetime));
}

function formatCurrency($amount) {
    return number_format($amount, 2);
}

// Get Site Settings (cached - loads all settings once, avoids repeated DB calls)
function getSetting($key, $default = '') {
    static $settings_cache = null;
    
    if ($settings_cache === null) {
        $settings_cache = [];
        $conn = getDBConnection();
        $result = $conn->query("SELECT setting_key, setting_value FROM settings");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $settings_cache[$row['setting_key']] = $row['setting_value'];
            }
        }
        $conn->close();
    }
    
    return isset($settings_cache[$key]) ? $settings_cache[$key] : $default;
}

// Update Site Setting
function updateSetting($key, $value) {
    $conn = getDBConnection();
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("sss", $key, $value, $value);
    $result = $stmt->execute();
    $stmt->close();
    $conn->close();
    return $result;
}

// Alias for updateSetting
function setSetting($key, $value) {
    return updateSetting($key, $value);
}

// Error and Success Messages
function setMessage($type, $message) {
    $_SESSION['message'] = ['type' => $type, 'text' => $message];
}

function getMessage() {
    if (isset($_SESSION['message'])) {
        $message = $_SESSION['message'];
        unset($_SESSION['message']);
        return $message;
    }
    return null;
}

// Generate Random String
function generateRandomString($length = 10) {
    return substr(str_shuffle(str_repeat('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($length/62))), 1, $length);
}
?>
