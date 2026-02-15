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
require_once 'auth.php';

$user = authenticateRequest();

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get employees
    $stmt = $pdo->query("SELECT id, name, mobile, status, permissions, created_at FROM users WHERE role = 'employee' ORDER BY created_at DESC");
    $employees = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $employees]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add employee
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['name']) || !isset($input['mobile'])) {
        echo json_encode(['success' => false, 'message' => 'Name and mobile required']);
        exit;
    }
    
    // Check if mobile already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE mobile = ?");
    $stmt->execute([$input['mobile']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Mobile number already exists']);
        exit;
    }
    
    $password = password_hash($input['password'] ?? '12345', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (name, mobile, password, role, status) VALUES (?, ?, ?, 'employee', 'active')");
    $stmt->execute([
        $input['name'],
        $input['mobile'],
        $password
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Employee added successfully']);
}
