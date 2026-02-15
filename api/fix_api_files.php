<?php
// Fix API files script
header('Content-Type: application/json');

// Security check - only allow from specific request
if (!isset($_GET['fix']) || $_GET['fix'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

$api_dir = __DIR__;

// Fixed pending-visits.php content
$pending_visits_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "auth.php";

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

require_once "../includes/db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        // Get pending visits (visits that need approval)
        $stmt = $pdo->query("
            SELECT v.*, m.name as customer_name, m.mobile as customer_mobile 
            FROM visits v 
            LEFT JOIN masons m ON v.mason_id = m.id 
            WHERE v.status = \"pending\" OR v.status IS NULL
            ORDER BY v.created_at DESC
        ");
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $visits]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data["visit_id"]) || !isset($data["action"])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing visit_id or action"]);
        exit;
    }
    
    $visit_id = $data["visit_id"];
    $action = $data["action"]; // approve or reject
    
    try {
        if ($action === "approve") {
            $stmt = $pdo->prepare("UPDATE visits SET status = \"approved\" WHERE id = ?");
        } else {
            $stmt = $pdo->prepare("UPDATE visits SET status = \"rejected\" WHERE id = ?");
        }
        $stmt->execute([$visit_id]);
        
        echo json_encode(["success" => true, "message" => "Visit " . $action . "d successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed meetings.php content
$meetings_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "auth.php";

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

require_once "../includes/db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $stmt = $pdo->query("
            SELECT m.*, c.name as customer_name, c.mobile as customer_mobile 
            FROM meetings m 
            LEFT JOIN masons c ON m.mason_id = c.id 
            ORDER BY m.meeting_date DESC, m.meeting_time DESC
        ");
        $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $meetings]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO meetings (mason_id, meeting_date, meeting_time, purpose, notes, status, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, \"scheduled\", ?, NOW())
        ");
        $stmt->execute([
            $data["mason_id"] ?? $data["customer_id"] ?? null,
            $data["meeting_date"] ?? date("Y-m-d"),
            $data["meeting_time"] ?? date("H:i:s"),
            $data["purpose"] ?? "",
            $data["notes"] ?? "",
            $user["id"]
        ]);
        
        echo json_encode(["success" => true, "message" => "Meeting created successfully", "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed gifts.php content
$gifts_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "auth.php";

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

require_once "../includes/db.php";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $stmt = $pdo->query("
            SELECT g.*, m.name as customer_name, m.mobile as customer_mobile 
            FROM gifts g 
            LEFT JOIN masons m ON g.mason_id = m.id 
            ORDER BY g.created_at DESC
        ");
        $gifts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $gifts]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO gifts (mason_id, gift_name, gift_value, given_date, notes, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $data["mason_id"] ?? $data["customer_id"] ?? null,
            $data["gift_name"] ?? "",
            $data["gift_value"] ?? 0,
            $data["given_date"] ?? date("Y-m-d"),
            $data["notes"] ?? "",
            $user["id"]
        ]);
        
        echo json_encode(["success" => true, "message" => "Gift added successfully", "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

$results = [];

// Write pending-visits.php
$result1 = file_put_contents($api_dir . '/pending-visits.php', $pending_visits_content);
$results['pending-visits.php'] = $result1 !== false ? 'success' : 'failed';

// Write meetings.php
$result2 = file_put_contents($api_dir . '/meetings.php', $meetings_content);
$results['meetings.php'] = $result2 !== false ? 'success' : 'failed';

// Write gifts.php
$result3 = file_put_contents($api_dir . '/gifts.php', $gifts_content);
$results['gifts.php'] = $result3 !== false ? 'success' : 'failed';

echo json_encode(['success' => true, 'results' => $results]);
