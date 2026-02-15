<?php
require_once '/home/jptilesi/public_html/includes/config.php';
$conn = getDBConnection();

echo "=== USER ROLES CHECK ===\n";
$result = $conn->query("SELECT role, COUNT(*) as c FROM users GROUP BY role");
while ($row = $result->fetch_assoc()) {
    echo "Role '{$row['role']}': {$row['c']} users\n";
}

// Check last few users created
echo "\n=== LAST 5 USERS CREATED ===\n";
$result = $conn->query("SELECT id, name, mobile, role, created_at FROM users ORDER BY id DESC LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Role: '{$row['role']}'\n";
}

$conn->close();