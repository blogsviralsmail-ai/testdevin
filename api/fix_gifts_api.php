<?php
// Fix gifts API to return data in expected format
header('Content-Type: application/json');

if (!isset($_GET['fix']) || $_GET['fix'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

$api_dir = __DIR__;

// Fixed gifts.php - return flat array instead of nested object
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
    // Get gift events as flat array (mobile app expects this format)
    $sql = "SELECT ge.*, u.name as created_by_name 
            FROM gift_events ge 
            LEFT JOIN users u ON ge.created_by = u.id
            ORDER BY ge.event_date DESC, ge.created_at DESC";
    
    $stmt = $pdo->query($sql);
    $gift_events = $stmt->fetchAll();
    
    // Return as flat array
    echo json_encode(["success" => true, "data" => $gift_events]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO gift_events (title, description, event_date, status, created_by) 
            VALUES (?, ?, ?, \"planning\", ?)
        ");
        $stmt->execute([
            $input["title"] ?? "Gift Event",
            $input["description"] ?? "",
            $input["event_date"] ?? date("Y-m-d"),
            $user["id"]
        ]);
        echo json_encode(["success" => true, "message" => "Gift event created successfully", "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
';

$result = file_put_contents($api_dir . '/gifts.php', $gifts_content);
echo json_encode(['success' => $result !== false, 'message' => $result !== false ? 'gifts.php fixed' : 'failed']);
