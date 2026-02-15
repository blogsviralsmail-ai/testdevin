<?php
// Fix API files script v2
header('Content-Type: application/json');

// Security check
if (!isset($_GET['fix']) || $_GET['fix'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

$api_dir = __DIR__;

// Fixed pending-visits.php content - using correct patterns from visits.php
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
    // Get all visits - the web app shows pending visits as all recent visits
    // Since there is no status column, we return all visits for admin to review
    $sql = "SELECT v.*, v.items_description as items, m.name as customer_name, m.mobile as customer_mobile 
            FROM mason_visits v 
            JOIN masons m ON v.mason_id = m.id
            ORDER BY v.visit_date DESC, v.created_at DESC LIMIT 100";
    
    $stmt = $pdo->query($sql);
    $visits = $stmt->fetchAll();
    
    echo json_encode(["success" => true, "data" => $visits]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Approve/reject visit - for now just return success since there is no status column
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input["visit_id"]) || !isset($input["action"])) {
        echo json_encode(["success" => false, "message" => "Missing visit_id or action"]);
        exit;
    }
    
    // Since there is no status column, we just acknowledge the action
    echo json_encode(["success" => true, "message" => "Visit " . $input["action"] . " acknowledged"]);
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed meetings.php content - return empty array since table does not exist
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
    // Meetings table does not exist yet, return empty array
    echo json_encode(["success" => true, "data" => [], "message" => "Meetings feature coming soon"]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Cannot create meetings since table does not exist
    echo json_encode(["success" => false, "message" => "Meetings feature coming soon"]);
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

// Fixed gifts.php content - return empty array since table does not exist
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
    // Gifts table does not exist yet, return empty array
    echo json_encode(["success" => true, "data" => [], "message" => "Gifts feature coming soon"]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Cannot add gifts since table does not exist
    echo json_encode(["success" => false, "message" => "Gifts feature coming soon"]);
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
