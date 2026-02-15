<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

// Delete customer 8824848342 (GIRDHARY JI KUMAWAT) - user said they deleted from app
echo "=== Deleting customer 8824848342 ===\n";
$result = $conn->query("SELECT id, user_id FROM masons WHERE mobile = '8824848342'");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $id = $row['id'];
    $user_id = $row['user_id'];
    
    // Delete visits
    $conn->query("DELETE FROM mason_visits WHERE mason_id = $id");
    echo "Deleted visits\n";
    
    // Delete from users if exists
    if ($user_id) {
        $conn->query("DELETE FROM users WHERE id = $user_id");
        echo "Deleted from users table\n";
    }
    
    // Delete from masons
    $conn->query("DELETE FROM masons WHERE id = $id");
    echo "Deleted from masons table\n";
    echo "Customer 8824848342 fully deleted!\n";
} else {
    echo "Customer 8824848342 not found\n";
}

// Reactivate customer 7976372751 (Pappu Ji yadav) - user said it should show in app
echo "\n=== Reactivating customer 7976372751 ===\n";
$result = $conn->query("UPDATE masons SET status = 'active' WHERE mobile = '7976372751'");
if ($conn->affected_rows > 0) {
    echo "Customer 7976372751 reactivated!\n";
} else {
    echo "Customer 7976372751 not found or already active\n";
}

// Show updated counts
echo "\n=== Updated Counts ===\n";
$total = $conn->query("SELECT COUNT(*) as c FROM masons")->fetch_assoc()['c'];
$active = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'active'")->fetch_assoc()['c'];
$inactive = $conn->query("SELECT COUNT(*) as c FROM masons WHERE status = 'inactive'")->fetch_assoc()['c'];
echo "Total: $total\n";
echo "Active: $active\n";
echo "Inactive: $inactive\n";

$conn->close();