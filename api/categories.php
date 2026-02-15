<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';
require_once 'auth.php';

$user = authenticateRequest();

// Get categories
$stmt = $pdo->query("SELECT * FROM customer_categories ORDER BY name");
$categories = $stmt->fetchAll();

echo json_encode(['success' => true, 'data' => $categories]);
