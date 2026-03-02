<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['mobile']) || !isset($input['password'])) {
    echo json_encode(['success' => false, 'message' => 'Mobile and password required']);
    exit;
}

$mobile = $input['mobile'];
$password = $input['password'];
$loginType = $input['login_type'] ?? 'admin';

if ($loginType === 'customer') {
    // Customer login - check masons table
    $stmt = $pdo->prepare("SELECT m.*, u.password FROM masons m JOIN users u ON m.user_id = u.id WHERE m.mobile = ? AND m.status = 'active'");
    $stmt->execute([$mobile]);
    $customer = $stmt->fetch();
    
    if ($customer && password_verify($password, $customer['password'])) {
        // Generate token
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        // Store token
        $stmt = $pdo->prepare("INSERT INTO api_tokens (user_id, user_type, token, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$customer['id'], 'customer', $token, $expiry]);
        
        // Get website URL from settings
        $websiteUrl = '';
        $settingStmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'website_url'");
        $setting = $settingStmt->fetch();
        if ($setting) {
            $websiteUrl = $setting['setting_value'];
        }
        
        // Calculate actual totals from mason_visits table
        $totalsStmt = $pdo->prepare("SELECT COUNT(id) as total_visits, COALESCE(SUM(rewards), 0) as total_rewards FROM mason_visits WHERE mason_id = ?");
        $totalsStmt->execute([$customer['id']]);
        $totals = $totalsStmt->fetch();
        
        $response = [
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $customer['id'],
                'name' => $customer['name'],
                'mobile' => $customer['mobile'],
                'email' => $customer['email'] ?? '',
                'photo' => $customer['photo'] ?? '',
                'address' => $customer['address'] ?? '',
                'customer_tier' => $customer['customer_tier'] ?? 'Silver',
                'reference_by' => $customer['reference_by'] ?? 'Direct',
                'role' => 'customer',
                'total_visits' => $totals['total_visits'],
                'total_rewards' => $totals['total_rewards'],
                'website_url' => $websiteUrl,
                'created_at' => $customer['created_at'] ?? ''
            ]
        ];
        
        echo json_encode($response);
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Invalid mobile or password']);
    exit;
}

// Admin/Employee login - check users table
$stmt = $pdo->prepare("SELECT * FROM users WHERE mobile = ? AND status = 'active' AND role IN ('admin', 'employee')");
$stmt->execute([$mobile]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    // Generate token
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    // Store token
    $stmt = $pdo->prepare("INSERT INTO api_tokens (user_id, user_type, token, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user['id'], $user['role'], $token, $expiry]);
    
    $response = [
        'success' => true,
        'token' => $token,
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

echo json_encode(['success' => false, 'message' => 'Invalid mobile or password']);
