<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check pending_visits table
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $totalPending = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Check mason_visits table
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM mason_visits");
    $totalMasonVisits = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get status breakdown from pending_visits
    $stmt = $pdo->query("SELECT DISTINCT status, COUNT(*) as cnt FROM pending_visits GROUP BY status");
    $pendingStatusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get status breakdown from mason_visits
    $stmt = $pdo->query("SELECT DISTINCT status, COUNT(*) as cnt FROM mason_visits GROUP BY status");
    $masonStatusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample pending visits
    $stmt = $pdo->query("SELECT pv.*, m.name as customer_name 
                         FROM pending_visits pv 
                         LEFT JOIN masons m ON pv.mason_id = m.id 
                         WHERE pv.status = 'pending' OR pv.status = '0' OR pv.status = 0
                         LIMIT 5");
    $samplePending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Describe pending_visits
    $stmt = $pdo->query("DESCRIBE pending_visits");
    $pendingStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'pending_visits_total' => $totalPending,
        'mason_visits_total' => $totalMasonVisits,
        'pending_status_breakdown' => $pendingStatusCounts,
        'mason_status_breakdown' => $masonStatusCounts,
        'sample_pending' => $samplePending,
        'pending_visits_structure' => $pendingStructure
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}