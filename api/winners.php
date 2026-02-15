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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get winners
    $stmt = $pdo->query("SELECT w.*, m.name as customer_name, m.mobile as customer_mobile 
                         FROM winners w 
                         LEFT JOIN masons m ON w.mason_id = m.id 
                         ORDER BY w.created_at DESC");
    $winners = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $winners]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add winner
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO winners (mason_id, name, prize, photo) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $input['mason_id'] ?? null,
        $input['name'] ?? '',
        $input['prize'] ?? '',
        $input['photo'] ?? null
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Winner added successfully']);
}
