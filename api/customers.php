<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require_once "../includes/config.php";
require_once "auth.php";

$user = authenticateRequest();
$action = isset($_GET["action"]) ? $_GET["action"] : "";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $category = isset($_GET["category"]) ? $_GET["category"] : "";
    $search = isset($_GET["search"]) ? $_GET["search"] : "";
    $mobile = isset($_GET["mobile"]) ? $_GET["mobile"] : "";
    $tier = isset($_GET["tier"]) ? $_GET["tier"] : "";
    
    $sql = "SELECT m.*, cat.name as category_name, COALESCE(SUM(v.rewards), 0) as total_rewards, COUNT(v.id) as visit_count FROM masons m LEFT JOIN customer_categories cat ON m.category_id = cat.id LEFT JOIN mason_visits v ON m.id = v.mason_id WHERE 1=1";
    $params = [];
    
    if (!empty($category)) { $sql .= " AND m.category_id = ?"; $params[] = $category; }
    if (!empty($search)) { $sql .= " AND (m.name LIKE ? OR m.mobile LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
    if (!empty($mobile)) { $sql .= " AND m.mobile = ?"; $params[] = $mobile; }
    if (!empty($tier)) { $sql .= " AND m.customer_tier = ?"; $params[] = $tier; }
    
    $sql .= " GROUP BY m.id ORDER BY m.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $customers = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $customers]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    if ($action === "update") {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!isset($input["id"])) { echo json_encode(["success" => false, "message" => "Customer ID required"]); exit; }
        $customerId = $input["id"];
        
        if (isset($input["mobile"]) && !empty($input["mobile"])) {
            $stmt = $pdo->prepare("SELECT id FROM masons WHERE mobile = ? AND id != ?");
            $stmt->execute([$input["mobile"], $customerId]);
            if ($stmt->fetch()) { echo json_encode(["success" => false, "message" => "Mobile number already exists for another customer"]); exit; }
        }
        
        $updates = []; $params = [];
        if (isset($input["name"])) { $updates[] = "name = ?"; $params[] = $input["name"]; }
        if (isset($input["mobile"])) { $updates[] = "mobile = ?"; $params[] = $input["mobile"]; }
        if (isset($input["email"])) { $updates[] = "email = ?"; $params[] = $input["email"]; }
        if (isset($input["address"])) { $updates[] = "address = ?"; $params[] = $input["address"]; }
        if (isset($input["category_id"])) { $updates[] = "category_id = ?"; $params[] = $input["category_id"]; }
        if (isset($input["customer_tier"]) && in_array($input["customer_tier"], ['Platinum', 'Gold', 'Silver', 'Brown'])) { 
            $updates[] = "customer_tier = ?"; $params[] = $input["customer_tier"]; 
        }
        if (isset($input["reference_by"])) { $updates[] = "reference_by = ?"; $params[] = $input["reference_by"]; }
        
        if (empty($updates)) { echo json_encode(["success" => false, "message" => "No fields to update"]); exit; }
        
        $params[] = $customerId;
        $sql = "UPDATE masons SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(["success" => true, "message" => "Customer updated successfully"]);
        exit;
    }
    
    if ($action === "delete") {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!isset($input["id"])) { echo json_encode(["success" => false, "message" => "Customer ID required"]); exit; }
        $customerId = $input["id"];
        
        $stmt = $pdo->prepare("SELECT user_id FROM masons WHERE id = ?");
        $stmt->execute([$customerId]);
        $mason = $stmt->fetch();
        
        $stmt = $pdo->prepare("DELETE FROM mason_visits WHERE mason_id = ?");
        $stmt->execute([$customerId]);
        
        if ($mason && $mason['user_id']) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$mason['user_id']]);
        }
        
        $stmt = $pdo->prepare("DELETE FROM masons WHERE id = ?");
        $stmt->execute([$customerId]);
        
        echo json_encode(["success" => true, "message" => "Customer deleted successfully"]);
        exit;
    }
    
    // ADD NEW CUSTOMER
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input["name"]) || !isset($input["mobile"])) { echo json_encode(["success" => false, "message" => "Name and mobile required"]); exit; }
    
    $stmt = $pdo->prepare("SELECT id FROM masons WHERE mobile = ?");
    $stmt->execute([$input["mobile"]]);
    if ($stmt->fetch()) { echo json_encode(["success" => false, "message" => "Mobile number already exists"]); exit; }
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE mobile = ?");
    $stmt->execute([$input["mobile"]]);
    if ($stmt->fetch()) { echo json_encode(["success" => false, "message" => "Mobile number already registered"]); exit; }
    
    try {
        $pdo->beginTransaction();
        
        $defaultPassword = password_hash('12345', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, mobile, password, role, created_at) VALUES (?, ?, ?, 'customer', NOW())");
        $stmt->execute([$input["name"], $input["mobile"], $defaultPassword]);
        $userId = $pdo->lastInsertId();
        
        $customerTier = isset($input["customer_tier"]) && in_array($input["customer_tier"], ['Platinum', 'Gold', 'Silver', 'Brown']) ? $input["customer_tier"] : 'Silver';
        $referenceBy = isset($input["reference_by"]) && !empty($input["reference_by"]) ? $input["reference_by"] : 'Direct';
        
        $stmt = $pdo->prepare("INSERT INTO masons (name, mobile, email, address, category_id, customer_tier, reference_by, user_id, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active')");
        $stmt->execute([
            $input["name"], 
            $input["mobile"], 
            $input["email"] ?? "", 
            $input["address"] ?? "", 
            $input["category_id"] ?? null,
            $customerTier,
            $referenceBy,
            $userId
        ]);
        $customerId = $pdo->lastInsertId();
        
        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Customer added successfully", "customer_id" => $customerId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Error adding customer: " . $e->getMessage()]);
    }
}