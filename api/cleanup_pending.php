<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Count before deletion
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $beforeCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Count approved/rejected
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM pending_visits WHERE status IN ('approved', 'rejected')");
    $toDelete = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    
    // Delete approved and rejected records
    $stmt = $pdo->prepare("DELETE FROM pending_visits WHERE status IN ('approved', 'rejected')");
    $stmt->execute();
    $deleted = $stmt->rowCount();
    
    // Count after deletion
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $afterCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get remaining pending visits
    $stmt = $pdo->query("SELECT status, COUNT(*) as cnt FROM pending_visits GROUP BY status");
    $remaining = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'before_count' => $beforeCount,
        'deleted' => $deleted,
        'after_count' => $afterCount,
        'remaining_breakdown' => $remaining,
        'message' => "Deleted $deleted approved/rejected records from pending_visits table"
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}