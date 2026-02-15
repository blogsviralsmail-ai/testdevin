<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

$results = [];

// 1. Clear all visits
$conn->query("DELETE FROM visits");
$results['visits_deleted'] = $conn->affected_rows;

// 2. Clear all meeting invites
$conn->query("DELETE FROM meeting_invites");
$results['meeting_invites_deleted'] = $conn->affected_rows;

// 3. Clear all meetings
$conn->query("DELETE FROM meetings");
$results['meetings_deleted'] = $conn->affected_rows;

// 4. Clear all gifts
$conn->query("DELETE FROM gifts");
$results['gifts_deleted'] = $conn->affected_rows;

// 5. Clear all winners
$conn->query("DELETE FROM winners");
$results['winners_deleted'] = $conn->affected_rows;

// 6. Clear all masons (customers)
$conn->query("DELETE FROM masons");
$results['customers_deleted'] = $conn->affected_rows;

// 7. Clear all users except main admin (id=1)
$conn->query("DELETE FROM users WHERE id != 1 AND role != 'admin'");
$results['employees_deleted'] = $conn->affected_rows;

// 8. Clear API tokens
$conn->query("DELETE FROM api_tokens");
$results['api_tokens_deleted'] = $conn->affected_rows;

// 9. Clear password reset OTPs
$conn->query("DELETE FROM password_reset_otp");
$results['otp_deleted'] = $conn->affected_rows;

// 10. Reset auto increment for masons
$conn->query("ALTER TABLE masons AUTO_INCREMENT = 1");

// 11. Reset auto increment for visits
$conn->query("ALTER TABLE visits AUTO_INCREMENT = 1");

echo json_encode([
    'success' => true,
    'message' => 'All dummy data cleared successfully',
    'results' => $results
], JSON_PRETTY_PRINT);

$conn->close();
