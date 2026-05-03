<?php
/**
 * SafeChild - Helper Functions
 */

require_once __DIR__ . '/db.php';

/**
 * Sanitize input string
 */
function sanitize(string $input): string {
    $db = getDB();
    return $db->real_escape_string(trim(strip_tags($input)));
}

/**
 * Hash password using bcrypt
 */
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Verify password
 */
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

/**
 * Generate a random pairing code (6 digits)
 */
function generatePairingCode(): string {
    return str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Generate a random API token for device authentication
 */
function generateApiToken(): string {
    return bin2hex(random_bytes(32));
}

/**
 * Send JSON response
 */
function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Get JSON request body
 */
function getJsonInput(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

/**
 * Require specific request method
 */
function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }
}

/**
 * Validate required fields in input
 */
function validateRequired(array $data, array $fields): ?string {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return "Field '$field' is required";
        }
    }
    return null;
}

/**
 * Get authenticated parent from session (admin panel)
 */
function getAuthParent(): ?array {
    if (!isset($_SESSION['parent_id'])) {
        return null;
    }
    
    $db = getDB();
    $parentId = (int) $_SESSION['parent_id'];
    $result = $db->query("SELECT * FROM parents WHERE id = $parentId AND is_active = 1");
    
    if ($result && $result->num_rows > 0) {
        return $result->fetch_assoc();
    }
    
    return null;
}

/**
 * Require parent authentication (redirect to login if not)
 */
function requireAuth(): array {
    $parent = getAuthParent();
    if (!$parent) {
        header('Location: /safechild/admin/index.php');
        exit;
    }
    return $parent;
}

/**
 * Authenticate device via API token (for REST API)
 */
function authenticateDevice(): ?array {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($token)) {
        return null;
    }
    
    // Remove "Bearer " prefix
    $token = str_replace('Bearer ', '', $token);
    $token = sanitize($token);
    
    $db = getDB();
    $result = $db->query("
        SELECT cd.*, c.name as child_name, c.family_id, f.parent_id
        FROM child_devices cd
        JOIN children c ON cd.child_id = c.id
        JOIN families f ON c.family_id = f.id
        WHERE cd.device_id = '$token' AND cd.is_active = 1
    ");
    
    if ($result && $result->num_rows > 0) {
        return $result->fetch_assoc();
    }
    
    return null;
}

/**
 * Require device authentication (for API endpoints)
 */
function requireDeviceAuth(): array {
    $device = authenticateDevice();
    if (!$device) {
        jsonResponse(['error' => 'Unauthorized. Invalid or missing device token.'], 401);
    }
    return $device;
}

/**
 * Log an audit action
 */
function logAudit(int $parentId, string $action, string $resourceType = '', int $resourceId = 0, string $details = ''): void {
    $db = getDB();
    $action = sanitize($action);
    $resourceType = sanitize($resourceType);
    $details = sanitize($details);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    
    $db->query("
        INSERT INTO audit_logs (parent_id, action, resource_type, resource_id, details, ip_address)
        VALUES ($parentId, '$action', '$resourceType', $resourceId, '$details', '$ip')
    ");
}

/**
 * Create an alert for parent
 */
function createAlert(int $parentId, int $childId, string $alertType, string $title, string $message = ''): void {
    $db = getDB();
    $alertType = sanitize($alertType);
    $title = sanitize($title);
    $message = sanitize($message);
    
    $db->query("
        INSERT INTO parent_alerts (parent_id, child_id, alert_type, title, message)
        VALUES ($parentId, $childId, '$alertType', '$title', '$message')
    ");
}

/**
 * Get app setting value
 */
function getSetting(string $key, string $default = ''): string {
    $db = getDB();
    $key = sanitize($key);
    $result = $db->query("SELECT setting_value FROM app_settings WHERE setting_key = '$key'");
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['setting_value'];
    }
    
    return $default;
}

/**
 * Format datetime for display
 */
function formatDate(string $datetime, string $format = 'd M Y, h:i A'): string {
    if (empty($datetime)) return 'N/A';
    return date($format, strtotime($datetime));
}

/**
 * Calculate time ago
 */
function timeAgo(string $datetime): string {
    $now = time();
    $diff = $now - strtotime($datetime);
    
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) return floor($diff / 60) . ' min ago';
    if ($diff < 86400) return floor($diff / 3600) . ' hours ago';
    if ($diff < 604800) return floor($diff / 86400) . ' days ago';
    
    return formatDate($datetime, 'd M Y');
}
