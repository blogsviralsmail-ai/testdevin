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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Send bulk SMS
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['customer_ids']) || !isset($input['message'])) {
        echo json_encode(['success' => false, 'message' => 'Customer IDs and message required']);
        exit;
    }
    
    $customerIds = $input['customer_ids'];
    $message = $input['message'];
    
    // Get customer mobile numbers
    $placeholders = str_repeat('?,', count($customerIds) - 1) . '?';
    $stmt = $pdo->prepare("SELECT mobile FROM masons WHERE id IN ($placeholders)");
    $stmt->execute($customerIds);
    $mobiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Log SMS (actual sending would require DLT API integration)
    $stmt = $pdo->prepare("INSERT INTO sms_logs (message, recipient_count, sent_by, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$message, count($mobiles), $user['id']]);
    
    echo json_encode([
        'success' => true, 
        'message' => 'SMS queued for ' . count($mobiles) . ' recipients. Configure DLT API in settings for actual delivery.'
    ]);
}
