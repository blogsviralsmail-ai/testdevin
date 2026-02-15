<?php
// Fix API files script v3 - using correct table structures
header('Content-Type: application/json');

if (!isset($_GET['fix']) || $_GET['fix'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

$api_dir = __DIR__;

// Fixed pending-visits.php - using pending_visits table
$pending_visits_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../includes/config.php";
require_once "auth.php";

$user = authenticateRequest();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    // Get pending visits from pending_visits table
    $sql = "SELECT pv.*, m.name as customer_name, m.mobile as customer_mobile 
            FROM pending_visits pv 
            LEFT JOIN masons m ON pv.customer_id = m.id
            WHERE pv.status = \"pending\"
            ORDER BY pv.visit_date DESC, pv.created_at DESC";
    
    $stmt = $pdo->query($sql);
    $visits = $stmt->fetchAll();
    
    echo json_encode(["success" => true, "data" => $visits]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input["visit_id"]) || !isset($input["action"])) {
        echo json_encode(["success" => false, "message" => "Missing visit_id or action"]);
        exit;
    }
    
    $visit_id = $input["visit_id"];
    $action = $input["action"];
    
    try {
        if ($action === "approve") {
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = \"approved\", approved_by = ? WHERE id = ?");
            $stmt->execute([$user["id"], $visit_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = \"rejected\", approved_by = ? WHERE id = ?");
            $stmt->execute([$user["id"], $visit_id]);
        }
        
        echo json_encode(["success" => true, "message" => "Visit " . $action . "d successfully"]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed meetings.php - using correct meetings table structure
$meetings_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../includes/config.php";
require_once "auth.php";

$user = authenticateRequest();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    // Get meetings from meetings table
    $sql = "SELECT m.*, u.name as created_by_name 
            FROM meetings m 
            LEFT JOIN users u ON m.created_by = u.id
            ORDER BY m.meeting_date DESC, m.meeting_time DESC";
    
    $stmt = $pdo->query($sql);
    $meetings = $stmt->fetchAll();
    
    echo json_encode(["success" => true, "data" => $meetings]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO meetings (title, description, meeting_date, meeting_time, venue, status, created_by) 
            VALUES (?, ?, ?, ?, ?, \"upcoming\", ?)
        ");
        $stmt->execute([
            $input["title"] ?? "Meeting",
            $input["description"] ?? "",
            $input["meeting_date"] ?? date("Y-m-d"),
            $input["meeting_time"] ?? null,
            $input["venue"] ?? $input["location"] ?? "",
            $user["id"]
        ]);
        
        echo json_encode(["success" => true, "message" => "Meeting created successfully", "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed gifts.php - using gift_events table for events and gifts table for individual gifts
$gifts_content = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../includes/config.php";
require_once "auth.php";

$user = authenticateRequest();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    // Get gift events
    $sql = "SELECT ge.*, u.name as created_by_name 
            FROM gift_events ge 
            LEFT JOIN users u ON ge.created_by = u.id
            ORDER BY ge.event_date DESC, ge.created_at DESC";
    
    $stmt = $pdo->query($sql);
    $gift_events = $stmt->fetchAll();
    
    // Also get individual gifts
    $sql2 = "SELECT g.*, m.name as customer_name, m.mobile as customer_mobile 
             FROM gifts g 
             LEFT JOIN masons m ON g.mason_id = m.id
             ORDER BY g.given_date DESC, g.created_at DESC";
    
    $stmt2 = $pdo->query($sql2);
    $gifts = $stmt2->fetchAll();
    
    echo json_encode(["success" => true, "data" => ["events" => $gift_events, "gifts" => $gifts]]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    
    try {
        // Check if this is a gift event or individual gift
        if (isset($input["title"])) {
            // Gift event
            $stmt = $pdo->prepare("
                INSERT INTO gift_events (title, description, event_date, status, created_by) 
                VALUES (?, ?, ?, \"planning\", ?)
            ");
            $stmt->execute([
                $input["title"],
                $input["description"] ?? "",
                $input["event_date"] ?? date("Y-m-d"),
                $user["id"]
            ]);
            echo json_encode(["success" => true, "message" => "Gift event created successfully", "id" => $pdo->lastInsertId()]);
        } else {
            // Individual gift
            $stmt = $pdo->prepare("
                INSERT INTO gifts (mason_id, gift_name, gift_value, given_date, notes, created_by) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input["mason_id"] ?? $input["customer_id"] ?? null,
                $input["gift_name"] ?? "",
                $input["gift_value"] ?? 0,
                $input["given_date"] ?? date("Y-m-d"),
                $input["notes"] ?? "",
                $user["id"]
            ]);
            echo json_encode(["success" => true, "message" => "Gift added successfully", "id" => $pdo->lastInsertId()]);
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

$results = [];

// Write files
$result1 = file_put_contents($api_dir . '/pending-visits.php', $pending_visits_content);
$results['pending-visits.php'] = $result1 !== false ? 'success' : 'failed';

$result2 = file_put_contents($api_dir . '/meetings.php', $meetings_content);
$results['meetings.php'] = $result2 !== false ? 'success' : 'failed';

$result3 = file_put_contents($api_dir . '/gifts.php', $gifts_content);
$results['gifts.php'] = $result3 !== false ? 'success' : 'failed';

echo json_encode(['success' => true, 'results' => $results]);
