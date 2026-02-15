<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Check masons table
$result = $conn->query("SELECT id, name, mobile, user_id FROM masons WHERE mobile = '8888888888'");
$mason = $result->fetch_assoc();

// Check users table
$result2 = $conn->query("SELECT id, name, mobile, role FROM users WHERE mobile = '8888888888'");
$user = $result2->fetch_assoc();

echo json_encode([
    'mason' => $mason,
    'user' => $user
], JSON_PRETTY_PRINT);
