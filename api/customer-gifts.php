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
require_once '../includes/functions.php';

$customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : 0;

if ($customer_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid customer ID']);
    exit;
}

$query = "SELECT gt.*, g.gift_name, g.occasion 
          FROM gift_tracking gt 
          INNER JOIN gifts g ON gt.gift_id = g.id 
          WHERE gt.mason_id = $customer_id 
          ORDER BY gt.created_at DESC";
$result = mysqli_query($conn, $query);

$gifts = [];
while ($row = mysqli_fetch_assoc($result)) {
    $gifts[] = $row;
}

echo json_encode(['success' => true, 'data' => $gifts]);
?>
