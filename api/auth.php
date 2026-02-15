<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';

// Handle refresh action - return updated user data
if (isset($_GET['action']) && $_GET['action'] === 'refresh') {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        echo json_encode(['success' => false, 'message' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    
    $stmt = $pdo->prepare("SELECT * FROM api_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $tokenData = $stmt->fetch();
    
    if (!$tokenData) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
    
    // Check if this is a customer token
    if ($tokenData['user_type'] === 'customer') {
        $stmt = $pdo->prepare("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.id = ? AND m.status = 'active'");
        $stmt->execute([$tokenData['user_id']]);
        $customer = $stmt->fetch();
        
        if ($customer) {
            // Get website URL from settings
            $websiteUrl = '';
            $settingStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'website_url'");
            $setting = $settingStmt->fetch();
            if ($setting) {
                $websiteUrl = $setting['setting_value'];
            }
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $customer['id'],
                    'name' => $customer['name'],
                    'mobile' => $customer['mobile'],
                    'role' => 'customer',
                    'total_visits' => $customer['total_visits'] ?? 0,
                    'total_rewards' => $customer['total_rewards'] ?? 0,
                    'website_url' => $websiteUrl
                ]
            ]);
            exit;
        }
    }
    
    // Get user data from users table (admin/employee)
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND status = 'active'");
    $stmt->execute([$tokenData['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $response = [
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'mobile' => $user['mobile'],
            'role' => $user['role']
        ]
    ];
    
    // Add permissions for employees
    if ($user['role'] === 'employee' && !empty($user['permissions'])) {
        $response['user']['permissions'] = json_decode($user['permissions'], true);
    }
    
    echo json_encode($response);
    exit;
}

// API Authentication helper
function authenticateRequest() {
    global $pdo;
    
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authorization token required']);
        exit;
    }
    
    $token = $matches[1];
    
    $stmt = $pdo->prepare("SELECT * FROM api_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $tokenData = $stmt->fetch();
    
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit;
    }
    
    // Get user data from users table
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND status = 'active'");
    $stmt->execute([$tokenData['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    // Set permissions based on role
    if ($user['role'] === 'admin') {
        $user['permissions'] = ['all'];
    } else {
        $user['permissions'] = json_decode($user['permissions'], true) ?: [];
    }
    
    return $user;
}

function hasApiPermission($user, $permission) {
    if ($user['role'] === 'admin') return true;
    return in_array($permission, $user['permissions']);
}
