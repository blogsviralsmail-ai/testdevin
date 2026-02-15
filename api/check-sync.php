<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== SYNC ISSUE CHECK ===\n\n";

// 1. Check for masons without user_id (can't login to app)
echo "1. Masons without user_id (can't login):\n";
$result = $conn->query("SELECT id, name, mobile FROM masons WHERE user_id IS NULL AND status = 'active'");
echo "Count: " . $result->num_rows . "\n";
if ($result->num_rows > 0 && $result->num_rows <= 10) {
    while ($row = $result->fetch_assoc()) {
        echo "  - ID: {$row['id']} | {$row['name']} | {$row['mobile']}\n";
    }
}

// 2. Check for orphaned users (user exists but no mason record)
echo "\n2. Orphaned users (no mason record):\n";
$result = $conn->query("SELECT u.id, u.name, u.mobile FROM users u LEFT JOIN masons m ON u.id = m.user_id WHERE m.id IS NULL AND u.role = 'mason'");
echo "Count: " . $result->num_rows . "\n";

// 3. Check for visits with invalid mason_id
echo "\n3. Visits with invalid mason_id:\n";
$result = $conn->query("SELECT COUNT(*) as c FROM mason_visits v LEFT JOIN masons m ON v.mason_id = m.id WHERE m.id IS NULL");
echo "Count: " . $result->fetch_assoc()['c'] . "\n";

// 4. Check for negative rewards (data issue)
echo "\n4. Customers with negative rewards:\n";
$result = $conn->query("SELECT id, name, mobile, total_rewards FROM masons WHERE total_rewards < 0");
echo "Count: " . $result->num_rows . "\n";
while ($row = $result->fetch_assoc()) {
    echo "  - ID: {$row['id']} | {$row['name']} | {$row['mobile']} | Rewards: {$row['total_rewards']}\n";
}

// 5. Check for duplicate mobile numbers
echo "\n5. Duplicate mobile numbers:\n";
$result = $conn->query("SELECT mobile, COUNT(*) as c FROM masons GROUP BY mobile HAVING c > 1");
echo "Count: " . $result->num_rows . "\n";
while ($row = $result->fetch_assoc()) {
    echo "  - Mobile: {$row['mobile']} appears {$row['c']} times\n";
}

// 6. Check dashboard counts match
echo "\n6. Dashboard counts verification:\n";
$total_masons = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'active'")->fetch_assoc()['c'];
$total_visits = $conn->query("SELECT COUNT(*) as c FROM mason_visits")->fetch_assoc()['c'];
$total_rewards = $conn->query("SELECT SUM(rewards) as c FROM mason_visits")->fetch_assoc()['c'];
echo "Active Masons: $total_masons\n";
echo "Total Visits: $total_visits\n";
echo "Total Rewards from visits: $total_rewards\n";

$conn->close();