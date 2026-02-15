<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== FIXING MASONS TOTALS ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// Get current totals before fix
$before = $conn->query("SELECT SUM(total_visits) as tv, SUM(total_rewards) as tr FROM masons")->fetch_assoc();
echo "BEFORE FIX:\n";
echo "Total Visits Sum: {$before['tv']}\n";
echo "Total Rewards Sum: {$before['tr']}\n\n";

// Update each mason's total_visits and total_rewards from actual mason_visits data
$result = $conn->query("SELECT id FROM masons");
$updated = 0;
while ($mason = $result->fetch_assoc()) {
    $mason_id = $mason['id'];
    
    // Get actual counts from mason_visits
    $actual = $conn->query("SELECT COUNT(*) as visits, COALESCE(SUM(rewards), 0) as rewards FROM mason_visits WHERE mason_id = $mason_id")->fetch_assoc();
    
    // Update masons table
    $visits = (int)$actual['visits'];
    $rewards = (float)$actual['rewards'];
    
    $conn->query("UPDATE masons SET total_visits = $visits, total_rewards = $rewards WHERE id = $mason_id");
    $updated++;
}

echo "Updated $updated masons\n\n";

// Get totals after fix
$after = $conn->query("SELECT SUM(total_visits) as tv, SUM(total_rewards) as tr FROM masons")->fetch_assoc();
echo "AFTER FIX:\n";
echo "Total Visits Sum: {$after['tv']}\n";
echo "Total Rewards Sum: {$after['tr']}\n\n";

// Verify no negative values remain
$neg = $conn->query("SELECT COUNT(*) as c FROM masons WHERE total_rewards < 0 OR total_visits < 0")->fetch_assoc()['c'];
echo "Masons with negative values: $neg\n";

// Show top 5 customers by rewards
echo "\n=== TOP 5 CUSTOMERS BY REWARDS ===\n";
$top = $conn->query("SELECT name, mobile, total_visits, total_rewards FROM masons ORDER BY total_rewards DESC LIMIT 5");
while ($row = $top->fetch_assoc()) {
    echo "{$row['name']} ({$row['mobile']}): {$row['total_visits']} visits, {$row['total_rewards']} rewards\n";
}

$conn->close();
echo "\n=== FIX COMPLETE ===\n";