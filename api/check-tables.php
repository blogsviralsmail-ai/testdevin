<?php
require_once '/home/jptilesi/public_html/includes/config.php';
$conn = getDBConnection();

echo "=== ALL DATABASE TABLES ===\n";
$result = $conn->query("SHOW TABLES");
while ($row = $result->fetch_array()) {
    $table = $row[0];
    $count = $conn->query("SELECT COUNT(*) as c FROM `$table`")->fetch_assoc()['c'];
    echo "$table: $count rows\n";
}

// Check masons without user_id (active)
echo "\n=== ACTIVE MASONS WITHOUT USER ACCOUNT ===\n";
$result = $conn->query("SELECT id, name, mobile FROM masons WHERE user_id IS NULL AND status = 'active'");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Mobile: {$row['mobile']}\n";
}

// Check for negative rewards
echo "\n=== MASONS WITH NEGATIVE REWARDS ===\n";
$result = $conn->query("SELECT id, name, mobile, total_rewards, status FROM masons WHERE total_rewards < 0");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Rewards: {$row['total_rewards']}, Status: {$row['status']}\n";
}

$conn->close();