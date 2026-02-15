<?php
header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi';
$password = 'kA7:6:1CyqeVY7';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check for customer with mobile 9214929350
    $stmt = $pdo->prepare("SELECT * FROM masons WHERE mobile LIKE ?");
    $stmt->execute(['%9214929350%']);
    $customer = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also check visits for this customer
    $stmt2 = $pdo->prepare("SELECT mv.*, m.name, m.mobile FROM mason_visits mv JOIN masons m ON mv.mason_id = m.id WHERE m.mobile LIKE ?");
    $stmt2->execute(['%9214929350%']);
    $visits = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total customer count
    $stmt3 = $pdo->query("SELECT COUNT(*) as total FROM masons");
    $total = $stmt3->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'customer' => $customer,
        'visits' => $visits,
        'total_customers' => $total['total']
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}