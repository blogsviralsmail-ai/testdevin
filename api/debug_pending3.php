<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Describe pending_visits
    $stmt = $pdo->query("DESCRIBE pending_visits");
    $pendingStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Describe mason_visits
    $stmt = $pdo->query("DESCRIBE mason_visits");
    $masonStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Count pending_visits
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $totalPending = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Count mason_visits
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM mason_visits");
    $totalMason = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Sample from pending_visits
    $stmt = $pdo->query("SELECT * FROM pending_visits LIMIT 3");
    $samplePending = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Sample from mason_visits
    $stmt = $pdo->query("SELECT * FROM mason_visits LIMIT 3");
    $sampleMason = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'pending_visits_structure' => $pendingStructure,
        'mason_visits_structure' => $masonStructure,
        'pending_visits_count' => $totalPending,
        'mason_visits_count' => $totalMason,
        'sample_pending_visits' => $samplePending,
        'sample_mason_visits' => $sampleMason
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}