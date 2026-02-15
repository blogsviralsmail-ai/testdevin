<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';
require_once 'auth.php';

$user = authenticateRequest();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get visits with filters
    $customerId = isset($_GET['customer_id']) ? $_GET['customer_id'] : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $dateRange = isset($_GET['date_range']) ? $_GET['date_range'] : '';
    
    $sql = "SELECT v.*, v.items_description as items, m.name as customer_name, m.mobile as customer_mobile, cc.name as category_name
            FROM mason_visits v 
            JOIN masons m ON v.mason_id = m.id
            LEFT JOIN customer_categories cc ON m.category_id = cc.id
            WHERE 1=1";
    $params = [];
    
    // Filter by customer_id
    if (!empty($customerId)) {
        $sql .= " AND v.mason_id = ?";
        $params[] = $customerId;
    }
    
    // Filter by search (name or mobile)
    if (!empty($search)) {
        $sql .= " AND (m.name LIKE ? OR m.mobile LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    // Filter by category
    if (!empty($category)) {
        $sql .= " AND m.category_id = ?";
        $params[] = $category;
    }
    
    // Filter by date range
    if (!empty($dateRange)) {
        switch ($dateRange) {
            case 'this_month':
                $sql .= " AND MONTH(v.visit_date) = MONTH(CURDATE()) AND YEAR(v.visit_date) = YEAR(CURDATE())";
                break;
            case 'month':
                $sql .= " AND v.visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case '3months':
                $sql .= " AND v.visit_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
                break;
            case 'year':
                $sql .= " AND v.visit_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
                break;
        }
    }
    
    $sql .= " ORDER BY v.visit_date DESC, v.created_at DESC LIMIT 500";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $visits = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $visits]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Add visit
    if (!hasApiPermission($user, 'add_visit')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Permission denied']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['customer_id'])) {
        echo json_encode(['success' => false, 'message' => 'Customer ID required']);
        exit;
    }
    
    $visitDate = isset($input['visit_date']) ? $input['visit_date'] : date('Y-m-d');
    $visitTime = isset($input['visit_time']) ? $input['visit_time'] : date('H:i:s');
    $items = isset($input['items']) ? $input['items'] : '';
    $rewards = isset($input['rewards']) ? floatval($input['rewards']) : 0;
    
    $stmt = $pdo->prepare("INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, rewards, created_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['customer_id'],
        $visitDate,
        $visitTime,
        $items,
        $rewards,
        $user['id']
    ]);
    
    $visitId = $pdo->lastInsertId();
    
    echo json_encode(['success' => true, 'message' => 'Visit added successfully', 'visit_id' => $visitId]);
}