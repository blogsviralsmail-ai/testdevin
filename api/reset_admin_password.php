<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Reset admin password to 'password'
$newPassword = password_hash('password', PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = 1");
$stmt->bind_param("s", $newPassword);
$result = $stmt->execute();

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Admin password reset to "password"']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
}

$conn->close();
