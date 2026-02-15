<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check total visits
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM visits");
    $totalVisits = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Check pending visits (status = 'pending' or status = 0)
    $stmt = $pdo->query("SELECT COUNT(*) as pending FROM visits WHERE status = 'pending' OR status = '0' OR status = 0");
    $pendingCount = $stmt->fetch(PDO::FETCH_ASSOC)['pending'];
    
    // Check approved visits
    $stmt = $pdo->query("SELECT COUNT(*) as approved FROM visits WHERE status = 'approved' OR status = '1' OR status = 1");
    $approvedCount = $stmt->fetch(PDO::FETCH_ASSOC)['approved'];
    
    // Get distinct status values
    $stmt = $pdo->query("SELECT DISTINCT status, COUNT(*) as cnt FROM visits GROUP BY status");
    $statusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample pending visits
    $stmt = $pdo->query("SELECT v.id, v.mason_id, v.status, v.visit_date, m.name as customer_name 
                         FROM visits v 
                         LEFT JOIN masons m ON v.mason_id = m.id 
                         WHERE v.status = 'pending' OR v.status = '0' OR v.status = 0
                         LIMIT 5");
    $samplePending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check visits table structure
    $stmt = $pdo->query("DESCRIBE visits");
    $tableStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'total_visits' => $totalVisits,
        'pending_count' => $pendingCount,
        'approved_count' => $approvedCount,
        'status_breakdown' => $statusCounts,
        'sample_pending' => $samplePending,
        'status_column_type' => array_filter($tableStructure, fn($col) => $col['Field'] === 'status')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}