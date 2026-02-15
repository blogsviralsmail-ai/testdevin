<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

try {
    // Test connection using config
    $stmt = $pdo->query("SHOW TABLES LIKE 'visits'");
    $visits_exists = $stmt->rowCount() > 0;
    
    // Get pending_visits structure
    $stmt2 = $pdo->query("DESCRIBE pending_visits");
    $columns = $stmt2->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'visits_table_exists' => $visits_exists,
        'pending_visits_columns' => $columns
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
