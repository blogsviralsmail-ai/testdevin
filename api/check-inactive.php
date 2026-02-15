<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== All Inactive Customers ===\n";
$result = $conn->query("SELECT id, name, mobile, total_rewards, status, created_at FROM masons WHERE status = 'inactive' ORDER BY id DESC");
echo "Count: " . $result->num_rows . "\n\n";

while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']} | Name: {$row['name']} | Mobile: {$row['mobile']} | Rewards: {$row['total_rewards']} | Status: {$row['status']}\n";
}

echo "\n\n=== Customers with visits but inactive ===\n";
$result = $conn->query("SELECT m.id, m.name, m.mobile, m.total_rewards, COUNT(v.id) as visit_count 
    FROM masons m 
    LEFT JOIN mason_visits v ON m.id = v.mason_id 
    WHERE m.status = 'inactive' 
    GROUP BY m.id 
    HAVING visit_count > 0");
echo "Count: " . $result->num_rows . "\n\n";

while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']} | Name: {$row['name']} | Mobile: {$row['mobile']} | Rewards: {$row['total_rewards']} | Visits: {$row['visit_count']}\n";
}

$conn->close();