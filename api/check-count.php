<?php
header('Content-Type: application/json');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

// Count from masons table
$masons_count = $conn->query("SELECT COUNT(*) as count FROM masons")->fetch_assoc()['count'];

// Count from users table with role mason
$users_mason_count = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'mason'")->fetch_assoc()['count'];

// Count active customers
$active_count = $conn->query("SELECT COUNT(*) as count FROM masons WHERE status = 'active'")->fetch_assoc()['count'];

echo json_encode([
    'masons_table_count' => $masons_count,
    'users_mason_role_count' => $users_mason_count,
    'active_masons_count' => $active_count
]);

$conn->close();
