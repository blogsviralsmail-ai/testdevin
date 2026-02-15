<?php
require_once '../includes/config.php';

header('Content-Type: application/json');

$mobile = sanitize($_GET['mobile'] ?? '');

if (empty($mobile)) {
    echo json_encode(['found' => false]);
    exit;
}

$conn = getDBConnection();
$stmt = $conn->prepare("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($customer = $result->fetch_assoc()) {
    echo json_encode([
        'found' => true,
        'name' => $customer['name'],
        'category' => $customer['category_name'] ?? 'N/A',
        'rewards' => number_format($customer['total_rewards'], 2)
    ]);
} else {
    echo json_encode(['found' => false]);
}

$conn->close();
