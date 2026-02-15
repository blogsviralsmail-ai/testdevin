<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Count before
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $beforeCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get the stuck record details
    $stmt = $pdo->query("SELECT pv.*, m.name as customer_name FROM pending_visits pv LEFT JOIN masons m ON pv.customer_id = m.id");
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Delete all pending visits
    $stmt = $pdo->prepare("DELETE FROM pending_visits");
    $stmt->execute();
    $deleted = $stmt->rowCount();
    
    // Count after
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pending_visits");
    $afterCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'before_count' => $beforeCount,
        'deleted' => $deleted,
        'after_count' => $afterCount,
        'deleted_records' => $records,
        'message' => "Deleted $deleted stuck pending visit records"
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}