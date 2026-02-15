<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../includes/config.php';

$conn = getDBConnection();

$results = [];

// 1. Create Google Test Admin Account
$adminMobile = '9999999999';
$adminPassword = password_hash('TestAdmin@123', PASSWORD_DEFAULT);
$adminName = 'Google Test Admin';
$adminEmail = 'testadmin@jptiles.in';

// Delete if exists and recreate
$conn->query("DELETE FROM users WHERE mobile = '$adminMobile'");

$sql = "INSERT INTO users (name, mobile, email, password, role, status, created_at) VALUES ('$adminName', '$adminMobile', '$adminEmail', '$adminPassword', 'employee', 'active', NOW())";
if ($conn->query($sql)) {
    $results['admin_created'] = true;
    $results['admin_id'] = $conn->insert_id;
} else {
    $results['admin_error'] = $conn->error;
}

// 2. Create Google Test Customer Account
// First create user entry for customer login
$customerMobile = '8888888888';
$customerPassword = password_hash('TestCustomer@123', PASSWORD_DEFAULT);
$customerName = 'Google Test Customer';
$customerEmail = 'testcustomer@jptiles.in';
$customerAddress = 'Test Address, Jaipur, Rajasthan';

// Delete if exists
$conn->query("DELETE FROM masons WHERE mobile = '$customerMobile'");
$conn->query("DELETE FROM users WHERE mobile = '$customerMobile'");

// Create user entry for customer
$sql = "INSERT INTO users (name, mobile, email, password, role, status, created_at) VALUES ('$customerName', '$customerMobile', '$customerEmail', '$customerPassword', 'customer', 'active', NOW())";
if ($conn->query($sql)) {
    $userId = $conn->insert_id;
    $results['customer_user_created'] = true;
    $results['customer_user_id'] = $userId;
    
    // Create mason entry linked to user
    $sql = "INSERT INTO masons (user_id, name, mobile, email, address, total_visits, total_rewards, status, created_at) VALUES ($userId, '$customerName', '$customerMobile', '$customerEmail', '$customerAddress', 5, 500, 'active', NOW())";
    if ($conn->query($sql)) {
        $masonId = $conn->insert_id;
        $results['customer_mason_created'] = true;
        $results['customer_mason_id'] = $masonId;
        
        // Add some sample visits
        for ($i = 1; $i <= 5; $i++) {
            $visitDate = date('Y-m-d', strtotime("-$i days"));
            $conn->query("INSERT INTO visits (mason_id, visit_date, rewards, status, created_at) VALUES ($masonId, '$visitDate', 100, 'approved', NOW())");
        }
        $results['sample_visits_added'] = 5;
    } else {
        $results['customer_mason_error'] = $conn->error;
    }
} else {
    $results['customer_user_error'] = $conn->error;
}

echo json_encode([
    'success' => true,
    'message' => 'Test accounts created for Google Play review',
    'results' => $results,
    'credentials' => [
        'admin' => [
            'mobile' => '9999999999',
            'password' => 'TestAdmin@123'
        ],
        'customer' => [
            'mobile' => '8888888888',
            'password' => 'TestCustomer@123'
        ]
    ]
], JSON_PRETTY_PRINT);

$conn->close();
