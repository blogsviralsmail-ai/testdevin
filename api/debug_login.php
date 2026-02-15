<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Check admin users
$result = $conn->query("SELECT id, name, mobile, email, role, status, password FROM users WHERE role IN ('admin', 'employee') LIMIT 5");
$admins = [];
while ($row = $result->fetch_assoc()) {
    $admins[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'mobile' => $row['mobile'],
        'email' => $row['email'],
        'role' => $row['role'],
        'status' => $row['status'],
        'password_hash' => substr($row['password'], 0, 20) . '...',
        'password_verify_test' => password_verify('password', $row['password'])
    ];
}

// Check customers
$result = $conn->query("SELECT m.id, m.name, m.mobile, m.email, m.status, m.user_id, u.password FROM masons m LEFT JOIN users u ON m.user_id = u.id LIMIT 5");
$customers = [];
while ($row = $result->fetch_assoc()) {
    $customers[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'mobile' => $row['mobile'],
        'email' => $row['email'],
        'status' => $row['status'],
        'user_id' => $row['user_id'],
        'password_hash' => $row['password'] ? substr($row['password'], 0, 20) . '...' : 'NULL',
        'password_verify_12345' => $row['password'] ? password_verify('12345', $row['password']) : false
    ];
}

echo json_encode([
    'admins' => $admins,
    'customers' => $customers
], JSON_PRETTY_PRINT);

$conn->close();
