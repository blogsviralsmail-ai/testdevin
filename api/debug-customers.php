<?php
header('Content-Type: application/json');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

// Check customer 7976372751
echo "=== Customer 7976372751 ===\n";
$result = $conn->query("SELECT * FROM masons WHERE mobile = '7976372751'");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Found in masons table:\n";
    print_r($row);
} else {
    echo "NOT found in masons table\n";
}

// Check in users table
$result = $conn->query("SELECT * FROM users WHERE mobile = '7976372751'");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "\nFound in users table:\n";
    print_r($row);
} else {
    echo "\nNOT found in users table\n";
}

echo "\n\n=== Customer 8824848342 ===\n";
$result = $conn->query("SELECT * FROM masons WHERE mobile = '8824848342'");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Found in masons table:\n";
    print_r($row);
} else {
    echo "NOT found in masons table\n";
}

// Check in users table
$result = $conn->query("SELECT * FROM users WHERE mobile = '8824848342'");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "\nFound in users table:\n";
    print_r($row);
} else {
    echo "\nNOT found in users table\n";
}

// Check visits for these customers
echo "\n\n=== Visits for 7976372751 ===\n";
$result = $conn->query("SELECT mv.* FROM mason_visits mv JOIN masons m ON mv.mason_id = m.id WHERE m.mobile = '7976372751'");
echo "Visit count: " . $result->num_rows . "\n";

echo "\n=== Visits for 8824848342 ===\n";
$result = $conn->query("SELECT mv.* FROM mason_visits mv JOIN masons m ON mv.mason_id = m.id WHERE m.mobile = '8824848342'");
echo "Visit count: " . $result->num_rows . "\n";

// Check total customers count
echo "\n\n=== Customer Counts ===\n";
$total = $conn->query("SELECT COUNT(*) as c FROM masons")->fetch_assoc()['c'];
$active = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'active'")->fetch_assoc()['c'];
echo "Total masons: $total\n";
echo "Active masons: $active\n";

$conn->close();