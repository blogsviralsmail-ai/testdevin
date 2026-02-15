<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Count by status in pending_visits
    $stmt = $pdo->query("SELECT status, COUNT(*) as cnt FROM pending_visits GROUP BY status");
    $statusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get actual pending visits (status = 'pending')
    $stmt = $pdo->query("SELECT pv.*, m.name as mason_name, c.name as category_name
                         FROM pending_visits pv 
                         LEFT JOIN masons m ON pv.customer_id = m.id 
                         LEFT JOIN categories c ON pv.category_id = c.id
                         WHERE pv.status = 'pending'
                         LIMIT 10");
    $actualPending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'status_breakdown' => $statusCounts,
        'actual_pending_count' => count($actualPending),
        'actual_pending_visits' => $actualPending
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}