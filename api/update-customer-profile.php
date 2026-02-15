<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/config.php';

$input = json_decode(file_get_contents('php://input'), true);

$customer_id = $input['customer_id'] ?? null;
$name = $input['name'] ?? null;
$mobile = $input['mobile'] ?? null;
$address = $input['address'] ?? null;
$current_password = $input['current_password'] ?? null;
$new_password = $input['new_password'] ?? null;

if (!$customer_id) {
    echo json_encode(['success' => false, 'message' => 'Customer ID required']);
    exit;
}

$conn = getDBConnection();

// Get current customer data
$stmt = $conn->prepare("SELECT m.*, u.id as user_id, u.password FROM masons m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?");
$stmt->bind_param("i", $customer_id);
$stmt->execute();
$result = $stmt->get_result();
$customer = $result->fetch_assoc();

if (!$customer) {
    echo json_encode(['success' => false, 'message' => 'Customer not found']);
    exit;
}

// If changing password, verify current password
if ($new_password && !empty($new_password)) {
    if (!$current_password || empty($current_password)) {
        echo json_encode(['success' => false, 'message' => 'Current password required to change password']);
        exit;
    }
    
    if (!password_verify($current_password, $customer['password'])) {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit;
    }
    
    // Update password in users table
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("si", $hashed_password, $customer['user_id']);
    $stmt->execute();
}

// Update mason profile
$stmt = $conn->prepare("UPDATE masons SET name = ?, mobile = ?, address = ? WHERE id = ?");
$stmt->bind_param("sssi", $name, $mobile, $address, $customer_id);
$stmt->execute();

// Also update users table name and mobile
if ($customer['user_id']) {
    $stmt = $conn->prepare("UPDATE users SET name = ?, mobile = ? WHERE id = ?");
    $stmt->bind_param("ssi", $name, $mobile, $customer['user_id']);
    $stmt->execute();
}

echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);

$conn->close();
