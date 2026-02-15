<?php
header('Content-Type: application/json');

if (!isset($_GET['check']) || $_GET['check'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

require_once '../includes/config.php';

$results = [];

try {
    // Check meetings table structure
    $stmt = $pdo->query("DESCRIBE meetings");
    $results['meetings_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check gifts table structure
    $stmt = $pdo->query("DESCRIBE gifts");
    $results['gifts_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check pending_visits table structure
    $stmt = $pdo->query("DESCRIBE pending_visits");
    $results['pending_visits_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check gift_events table structure
    $stmt = $pdo->query("DESCRIBE gift_events");
    $results['gift_events_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data from meetings
    $stmt = $pdo->query("SELECT * FROM meetings LIMIT 5");
    $results['meetings_data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data from gifts
    $stmt = $pdo->query("SELECT * FROM gifts LIMIT 5");
    $results['gifts_data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data from pending_visits
    $stmt = $pdo->query("SELECT * FROM pending_visits LIMIT 5");
    $results['pending_visits_data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $results['success'] = true;
    
} catch (Exception $e) {
    $results['error'] = $e->getMessage();
    $results['success'] = false;
}

echo json_encode($results, JSON_PRETTY_PRINT);
