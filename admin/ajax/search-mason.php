<?php
require_once '../../includes/config.php';

header('Content-Type: application/json');

$mobile = sanitize($_GET['mobile'] ?? '');

if (empty($mobile)) {
    echo json_encode(['success' => false, 'message' => 'Mobile number required']);
    exit;
}

$conn = getDBConnection();
$stmt = $conn->prepare("SELECT * FROM masons WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($mason = $result->fetch_assoc()) {
    echo json_encode(['success' => true, 'mason' => $mason]);
} else {
    echo json_encode(['success' => false, 'message' => 'Mason not found']);
}

$conn->close();
