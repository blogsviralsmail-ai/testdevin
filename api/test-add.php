<?php
require_once '/home/jptilesi/public_html/includes/config.php';
$conn = getDBConnection();

echo "=== TESTING CUSTOMER ADD FIX ===\n";

// Check if a test customer exists and clean up
$test_mobile = "9999999999";
$conn->query("DELETE FROM masons WHERE mobile = '$test_mobile'");
$conn->query("DELETE FROM users WHERE mobile = '$test_mobile'");

echo "Test mobile: $test_mobile\n";
echo "Cleaned up any existing test data\n\n";

// Now simulate adding a customer via API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://jptiles.in/api/customers.php");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "name" => "Test Customer",
    "mobile" => $test_mobile,
    "address" => "Test Address"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer 1242e070ba7b77b3699b7c832fde70d2d933cfb04bb92df1aa8085070a0484a2"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo "API Response: $response\n\n";

// Check if mason was created
$mason = $conn->query("SELECT * FROM masons WHERE mobile = '$test_mobile'")->fetch_assoc();
if ($mason) {
    echo "Mason created: YES\n";
    echo "Mason ID: {$mason['id']}\n";
    echo "Mason user_id: " . ($mason['user_id'] ?? 'NULL') . "\n";
    
    // Check if user was created
    if ($mason['user_id']) {
        $user = $conn->query("SELECT * FROM users WHERE id = {$mason['user_id']}")->fetch_assoc();
        if ($user) {
            echo "User created: YES\n";
            echo "User role: {$user['role']}\n";
            echo "\nFIX VERIFIED: Customer add now creates user account!\n";
        } else {
            echo "User created: NO (user_id exists but user not found)\n";
            echo "\nFIX FAILED!\n";
        }
    } else {
        echo "User created: NO (user_id is NULL)\n";
        echo "\nFIX FAILED!\n";
    }
} else {
    echo "Mason created: NO\n";
    echo "\nFIX FAILED!\n";
}

// Clean up test data
$conn->query("DELETE FROM masons WHERE mobile = '$test_mobile'");
$conn->query("DELETE FROM users WHERE mobile = '$test_mobile'");
echo "\nTest data cleaned up.\n";

$conn->close();