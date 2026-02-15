<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();
$issues = [];

echo "=== JP TILES FRESH AUDIT (POST-FIX) ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// 1. Database integrity checks
echo "=== 1. DATABASE INTEGRITY ===\n";

// Check masons table
$total_masons = $conn->query("SELECT COUNT(*) as c FROM masons")->fetch_assoc()['c'];
$active_masons = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'active'")->fetch_assoc()['c'];
$inactive_masons = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'inactive'")->fetch_assoc()['c'];
$masons_with_user = $conn->query("SELECT COUNT(*) as c FROM masons WHERE user_id IS NOT NULL")->fetch_assoc()['c'];
$masons_without_user = $conn->query("SELECT COUNT(*) as c FROM masons WHERE user_id IS NULL AND status = 'active'")->fetch_assoc()['c'];

echo "Total masons: $total_masons\n";
echo "Active masons: $active_masons\n";
echo "Inactive masons: $inactive_masons\n";
echo "Masons with user account: $masons_with_user\n";

if ($masons_without_user > 0) {
    $issues[] = "CRITICAL: $masons_without_user active masons without user account (can't login to app)";
    echo "ISSUE: $masons_without_user active masons without user account\n";
} else {
    echo "OK: All active masons have user accounts\n";
}

// Check for orphan visits
$orphan_visits = $conn->query("SELECT COUNT(*) as c FROM mason_visits v LEFT JOIN masons m ON v.mason_id = m.id WHERE m.id IS NULL")->fetch_assoc()['c'];
if ($orphan_visits > 0) {
    $issues[] = "WARNING: $orphan_visits orphan visits (mason deleted but visits remain)";
    echo "ISSUE: $orphan_visits orphan visits\n";
} else {
    echo "OK: No orphan visits\n";
}

// Check for duplicate mobiles
$dupes = $conn->query("SELECT mobile, COUNT(*) as c FROM masons WHERE status = 'active' GROUP BY mobile HAVING c > 1")->num_rows;
if ($dupes > 0) {
    $issues[] = "CRITICAL: $dupes duplicate mobile numbers in active masons";
    echo "ISSUE: $dupes duplicate mobile numbers\n";
} else {
    echo "OK: No duplicate mobile numbers in active masons\n";
}

// Check for negative rewards in active masons
$neg_rewards = $conn->query("SELECT COUNT(*) as c FROM masons WHERE total_rewards < 0 AND status = 'active'")->fetch_assoc()['c'];
if ($neg_rewards > 0) {
    $issues[] = "WARNING: $neg_rewards active masons with negative rewards";
    echo "ISSUE: $neg_rewards active masons with negative rewards\n";
} else {
    echo "OK: No active masons with negative rewards\n";
}

// 2. Check all tables exist
echo "\n=== 2. TABLE EXISTENCE CHECK ===\n";
$required_tables = ['masons', 'mason_visits', 'pending_visits', 'users', 'products', 'categories', 
                    'customer_categories', 'meetings', 'gifts', 'offers', 'winners', 'enquiries', 
                    'settings', 'sliders', 'gallery'];

foreach ($required_tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows > 0) {
        $count = $conn->query("SELECT COUNT(*) as c FROM `$table`")->fetch_assoc()['c'];
        echo "OK: $table ($count rows)\n";
    } else {
        $issues[] = "CRITICAL: Table '$table' does not exist";
        echo "MISSING: $table\n";
    }
}

// 3. Check users table integrity
echo "\n=== 3. USERS TABLE CHECK ===\n";
$total_users = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$admins = $conn->query("SELECT COUNT(*) as c FROM users WHERE role = 'admin'")->fetch_assoc()['c'];
$employees = $conn->query("SELECT COUNT(*) as c FROM users WHERE role = 'employee'")->fetch_assoc()['c'];
$customers = $conn->query("SELECT COUNT(*) as c FROM users WHERE role = 'customer'")->fetch_assoc()['c'];
echo "Total users: $total_users\n";
echo "Admins: $admins\n";
echo "Employees: $employees\n";
echo "Customers: $customers\n";

// 4. Check for users without password
$no_password = $conn->query("SELECT COUNT(*) as c FROM users WHERE password IS NULL OR password = ''")->fetch_assoc()['c'];
if ($no_password > 0) {
    $issues[] = "WARNING: $no_password users without password";
    echo "ISSUE: $no_password users without password\n";
} else {
    echo "OK: All users have passwords\n";
}

// Summary
echo "\n\n=== AUDIT SUMMARY ===\n";
if (count($issues) == 0) {
    echo "STATUS: ALL CLEAR - No issues found!\n";
} else {
    echo "STATUS: " . count($issues) . " issue(s) found:\n";
    foreach ($issues as $i => $issue) {
        echo ($i+1) . ". $issue\n";
    }
}

$conn->close();