<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== INVESTIGATING NEGATIVE VISITS AND REWARDS ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// 1. Check total counts
echo "=== 1. OVERALL STATS ===\n";
$total_masons = $conn->query("SELECT COUNT(*) as c FROM masons")->fetch_assoc()['c'];
$total_visits = $conn->query("SELECT COUNT(*) as c FROM mason_visits")->fetch_assoc()['c'];
$total_rewards = $conn->query("SELECT SUM(rewards) as s FROM mason_visits")->fetch_assoc()['s'];
$total_rewards_masons = $conn->query("SELECT SUM(total_rewards) as s FROM masons")->fetch_assoc()['s'];

echo "Total masons: $total_masons\n";
echo "Total visits in mason_visits table: $total_visits\n";
echo "Sum of rewards in mason_visits: $total_rewards\n";
echo "Sum of total_rewards in masons: $total_rewards_masons\n";

// 2. Check for negative rewards in mason_visits
echo "\n=== 2. NEGATIVE REWARDS IN MASON_VISITS ===\n";
$result = $conn->query("SELECT * FROM mason_visits WHERE rewards < 0");
$neg_count = $result->num_rows;
echo "Count: $neg_count\n";
while ($row = $result->fetch_assoc()) {
    echo "Visit ID: {$row['id']}, Mason ID: {$row['mason_id']}, Rewards: {$row['rewards']}, Date: {$row['visit_date']}\n";
}

// 3. Check for negative total_rewards in masons
echo "\n=== 3. NEGATIVE TOTAL_REWARDS IN MASONS ===\n";
$result = $conn->query("SELECT id, name, mobile, total_rewards, status FROM masons WHERE total_rewards < 0");
$neg_count = $result->num_rows;
echo "Count: $neg_count\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Mobile: {$row['mobile']}, Rewards: {$row['total_rewards']}, Status: {$row['status']}\n";
}

// 4. Check reports.php query to understand how it calculates
echo "\n=== 4. CHECKING WHAT REPORTS PAGE SHOWS ===\n";
// This is likely what the reports page is calculating
$result = $conn->query("SELECT 
    COUNT(DISTINCT m.id) as total_customers,
    COUNT(v.id) as total_visits,
    COALESCE(SUM(v.rewards), 0) as total_rewards
    FROM masons m
    LEFT JOIN mason_visits v ON m.id = v.mason_id");
$row = $result->fetch_assoc();
echo "Total Customers: {$row['total_customers']}\n";
echo "Total Visits: {$row['total_visits']}\n";
echo "Total Rewards: {$row['total_rewards']}\n";

// 5. Check if there are any visits with NULL mason_id
echo "\n=== 5. ORPHAN VISITS (NULL or invalid mason_id) ===\n";
$result = $conn->query("SELECT COUNT(*) as c FROM mason_visits WHERE mason_id IS NULL OR mason_id NOT IN (SELECT id FROM masons)");
echo "Orphan visits: " . $result->fetch_assoc()['c'] . "\n";

// 6. Check masons table structure
echo "\n=== 6. MASONS WITH VISIT COUNT MISMATCH ===\n";
$result = $conn->query("SELECT m.id, m.name, m.total_rewards, 
    (SELECT COUNT(*) FROM mason_visits WHERE mason_id = m.id) as actual_visits,
    (SELECT COALESCE(SUM(rewards), 0) FROM mason_visits WHERE mason_id = m.id) as actual_rewards
    FROM masons m
    HAVING m.total_rewards != actual_rewards
    LIMIT 10");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Name: {$row['name']}, Stored: {$row['total_rewards']}, Actual: {$row['actual_rewards']}\n";
}

$conn->close();