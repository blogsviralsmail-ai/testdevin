<?php
header("Content-Type: application/json");
require_once '../includes/config.php';

try {
    // Get pending_visits table structure
    $stmt = $pdo->query("DESCRIBE pending_visits");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data
    $stmt2 = $pdo->query("SELECT * FROM pending_visits LIMIT 3");
    $data = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        "success" => true,
        "columns" => $columns,
        "sample_data" => $data
    ));
} catch (PDOException $e) {
    echo json_encode(array("success" => false, "message" => $e->getMessage()));
}