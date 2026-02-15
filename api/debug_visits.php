<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

try {
    // Check visits table structure
    $stmt = $pdo->query("DESCRIBE visits");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all visits
    $stmt2 = $pdo->query("SELECT * FROM visits LIMIT 5");
    $visits = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    // Check if meetings table exists
    $stmt3 = $pdo->query("SHOW TABLES LIKE 'meetings'");
    $meetings_exists = $stmt3->rowCount() > 0;
    
    // Check if gifts table exists
    $stmt4 = $pdo->query("SHOW TABLES LIKE 'gifts'");
    $gifts_exists = $stmt4->rowCount() > 0;
    
    echo json_encode([
        'visits_columns' => $columns,
        'sample_visits' => $visits,
        'meetings_table_exists' => $meetings_exists,
        'gifts_table_exists' => $gifts_exists
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
