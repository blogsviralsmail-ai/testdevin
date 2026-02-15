<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

// Check users table structure
$result = $conn->query("DESCRIBE users");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row;
}

// Check what roles exist
$result2 = $conn->query("SELECT DISTINCT role FROM users");
$roles = [];
while ($row = $result2->fetch_assoc()) {
    $roles[] = $row['role'];
}

echo json_encode([
    'columns' => $columns,
    'existing_roles' => $roles
], JSON_PRETTY_PRINT);
