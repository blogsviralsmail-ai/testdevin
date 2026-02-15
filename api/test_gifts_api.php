<?php
header("Content-Type: application/json");
require_once "../includes/config.php";

try {
    // Test 1: Check gift_events table
    $stmt = $pdo->query("SELECT * FROM gift_events ORDER BY id DESC LIMIT 5");
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 2: Check gift_recipients table
    $stmt = $pdo->query("SELECT gr.*, c.name as customer_name FROM gift_recipients gr LEFT JOIN customers c ON gr.customer_id = c.id ORDER BY gr.id DESC LIMIT 5");
    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Check if customers table exists and has data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM customers");
    $customerCount = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Test 4: Check masons table (might be used instead of customers)
    $stmt = $pdo->query("SHOW TABLES LIKE 'masons'");
    $masonsExists = $stmt->rowCount() > 0;
    $masonCount = 0;
    if ($masonsExists) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM masons");
        $masonCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    echo json_encode([
        "success" => true,
        "events_count" => count($events),
        "events" => $events,
        "recipients_count" => count($recipients),
        "recipients" => $recipients,
        "customers_count" => $customerCount['count'],
        "masons_table_exists" => $masonsExists,
        "masons_count" => $masonCount
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}