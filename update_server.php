<?php
if ($_GET['key'] !== 'jptiles2026') die('Unauthorized');
$a = $_GET['action'] ?? '';

if ($a === 'fix_customers') {
    $code = '<?php
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
    
    $sql = "SELECT m.*, cat.name as category_name, COALESCE(SUM(v.rewards), 0) as total_rewards, COUNT(v.id) as visit_count FROM masons m LEFT JOIN customer_categories cat ON m.category_id = cat.id LEFT JOIN mason_visits v ON m.id = v.mason_id WHERE m.status = \'active\'";
    $params = [];
    
    if (!empty($category)) { $sql .= " AND m.category_id = ?"; $params[] = $category; }
    if (!empty($search)) { $sql .= " AND (m.name LIKE ? OR m.mobile LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
    if (!empty($mobile)) { $sql .= " AND m.mobile = ?"; $params[] = $mobile; }
    
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
        $stmt = $pdo->prepare("UPDATE masons SET status = \'inactive\' WHERE id = ?");
        $stmt->execute([$input["id"]]);
        echo json_encode(["success" => true, "message" => "Customer deleted successfully"]);
        exit;
    }
    
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input["name"]) || !isset($input["mobile"])) { echo json_encode(["success" => false, "message" => "Name and mobile required"]); exit; }
    
    $stmt = $pdo->prepare("SELECT id FROM masons WHERE mobile = ?");
    $stmt->execute([$input["mobile"]]);
    if ($stmt->fetch()) { echo json_encode(["success" => false, "message" => "Mobile number already exists"]); exit; }
    
    $stmt = $pdo->prepare("INSERT INTO masons (name, mobile, email, address, category_id, registration_date) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$input["name"], $input["mobile"], $input["email"] ?? "", $input["address"] ?? "", $input["category_id"] ?? null]);
    $customerId = $pdo->lastInsertId();
    echo json_encode(["success" => true, "message" => "Customer added successfully", "customer_id" => $customerId]);
}';
    file_put_contents(__DIR__ . '/api/customers.php', $code);
    echo "customers.php updated";
}

if ($a === 'fix_pending') {
    $code = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require_once "../includes/config.php";
require_once "auth.php";

$user = authenticateRequest();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $stmt = $pdo->query("SELECT v.*, m.name as customer_name, m.mobile as customer_mobile FROM pending_visits v JOIN masons m ON v.mason_id = m.id WHERE v.status = \'pending\' ORDER BY v.created_at DESC");
    $visits = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $visits]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!isset($input["visit_id"]) || !isset($input["action"])) { echo json_encode(["success" => false, "message" => "Visit ID and action required"]); exit; }
    
    $visitId = $input["visit_id"];
    $action = $input["action"];
    
    $stmt = $pdo->prepare("SELECT * FROM pending_visits WHERE id = ? AND status = \'pending\'");
    $stmt->execute([$visitId]);
    $pendingVisit = $stmt->fetch();
    
    if (!$pendingVisit) { echo json_encode(["success" => false, "message" => "Visit not found or already processed"]); exit; }
    
    if ($action === "approve") {
        $rewards = isset($input["rewards"]) ? floatval($input["rewards"]) : 0;
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, rewards, created_by) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$pendingVisit["mason_id"], $pendingVisit["visit_date"], $pendingVisit["visit_time"], $pendingVisit["items_description"], $rewards, $user["id"]]);
            
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = \'approved\', rewards = ?, approved_by = ?, approved_at = NOW() WHERE id = ?");
            $stmt->execute([$rewards, $user["id"], $visitId]);
            
            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Visit approved successfully"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
    } elseif ($action === "reject") {
        $stmt = $pdo->prepare("UPDATE pending_visits SET status = \'rejected\', approved_by = ?, approved_at = NOW() WHERE id = ?");
        $stmt->execute([$user["id"], $visitId]);
        echo json_encode(["success" => true, "message" => "Visit rejected successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
}';
    file_put_contents(__DIR__ . '/api/pending-visits.php', $code);
    echo "pending-visits.php updated";
}

if ($a === 'add_reg_date') {
    require_once 'includes/config.php';
    $conn = getDBConnection();
    $result = $conn->query("SHOW COLUMNS FROM masons LIKE 'registration_date'");
    if ($result->num_rows == 0) {
        $conn->query("ALTER TABLE masons ADD COLUMN registration_date DATE DEFAULT NULL AFTER status");
        echo "Added registration_date column\n";
    }
    $conn->query("UPDATE masons SET registration_date = '2026-01-20' WHERE registration_date IS NULL");
    $result = $conn->query("SELECT COUNT(*) as count FROM masons WHERE registration_date = '2026-01-20'");
    $row = $result->fetch_assoc();
    echo "Updated " . $row['count'] . " customers with date 2026-01-20";
    $conn->close();
}