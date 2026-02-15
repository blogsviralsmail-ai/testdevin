<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Fix the customer role to 'mason'
$conn->query("UPDATE users SET role = 'mason' WHERE mobile = '8888888888'");

// Verify
$result = $conn->query("SELECT id, name, mobile, role FROM users WHERE mobile = '8888888888'");
$user = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'message' => 'Customer role fixed to mason',
    'user' => $user
], JSON_PRETTY_PRINT);
