<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Fix the customer role
$result = $conn->query("UPDATE users SET role = 'customer' WHERE mobile = '8888888888'");

// Verify
$result2 = $conn->query("SELECT id, name, mobile, role FROM users WHERE mobile = '8888888888'");
$user = $result2->fetch_assoc();

echo json_encode([
    'success' => true,
    'message' => 'Customer role fixed',
    'user' => $user
], JSON_PRETTY_PRINT);
