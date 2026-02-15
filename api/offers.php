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
    // Get offers
    $stmt = $pdo->query("SELECT * FROM offers ORDER BY created_at DESC");
    $offers = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $offers]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add or toggle offer
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action']) && $input['action'] === 'toggle') {
        // Toggle offer status
        $stmt = $pdo->prepare("UPDATE offers SET is_active = ? WHERE id = ?");
        $stmt->execute([$input['is_active'], $input['offer_id']]);
        echo json_encode(['success' => true, 'message' => 'Offer status updated']);
    } else {
        // Add offer
        $stmt = $pdo->prepare("INSERT INTO offers (title, description, is_active) VALUES (?, ?, 1)");
        $stmt->execute([
            $input['title'] ?? '',
            $input['description'] ?? ''
        ]);
        echo json_encode(['success' => true, 'message' => 'Offer added successfully']);
    }
}
