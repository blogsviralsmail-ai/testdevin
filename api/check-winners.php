<?php
require_once '/home/jptilesi/public_html/includes/config.php';
$conn = getDBConnection();

// Check if winners table exists
$result = $conn->query("SHOW TABLES LIKE 'winners'");
if ($result->num_rows > 0) {
    echo "Winners table exists\n";
    $count = $conn->query("SELECT COUNT(*) as c FROM winners")->fetch_assoc()['c'];
    echo "Winners count: $count\n";
} else {
    echo "Winners table does NOT exist\n";
}

// Check offers table
$result = $conn->query("SHOW TABLES LIKE 'offers'");
if ($result->num_rows > 0) {
    echo "Offers table exists\n";
    $count = $conn->query("SELECT COUNT(*) as c FROM offers")->fetch_assoc()['c'];
    echo "Offers count: $count\n";
} else {
    echo "Offers table does NOT exist\n";
}

$conn->close();