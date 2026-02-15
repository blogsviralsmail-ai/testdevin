<?php
// Fix pending-visits.php API
header('Content-Type: application/json');

// Database connection
$host = 'localhost';
$dbname = 'jptilesi_db';
$username = 'jptilesi_user';
$password = 'Bhawani@123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? 'check';

if ($action === 'check') {
    // Check current pending-visits.php file
    $file = '/home/jptilesi/public_html/api/pending-visits.php';
    if (file_exists($file)) {
        $content = file_get_contents($file);
        echo json_encode([
            'success' => true,
            'file_exists' => true,
            'file_size' => strlen($content),
            'first_100_chars' => substr($content, 0, 100)
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'File not found']);
    }
} elseif ($action === 'fix') {
    // Create fixed pending-visits.php
    $newContent = '<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Database connection
$host = "localhost";
$dbname = "jptilesi_db";
$username = "jptilesi_user";
$password = "Bhawani@123";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Verify token
$headers = getallheaders();
$authHeader = $headers["Authorization"] ?? "";

if (empty($authHeader) || !preg_match("/Bearer\s+(.+)/i", $authHeader, $matches)) {
    echo json_encode(["success" => false, "message" => "Authorization token required"]);
    exit;
}

$token = $matches[1];

// Verify token in database
$stmt = $pdo->prepare("SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.auth_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["success" => false, "message" => "Invalid token"]);
    exit;
}

// Handle GET request - list pending visits
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $stmt = $pdo->query("
            SELECT pv.*, m.name as customer_name, m.mobile as customer_mobile 
            FROM pending_visits pv 
            LEFT JOIN masons m ON pv.mason_id = m.id 
            WHERE pv.status = \"pending\"
            ORDER BY pv.created_at DESC
        ");
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $visits]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Failed to fetch pending visits"]);
    }
    exit;
}

// Handle POST request - approve/reject
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? "";
    $visitId = $input["visit_id"] ?? 0;
    
    if (empty($visitId)) {
        echo json_encode(["success" => false, "message" => "Visit ID required"]);
        exit;
    }
    
    if ($action === "approve") {
        $rewards = floatval($input["rewards"] ?? 0);
        
        try {
            $pdo->beginTransaction();
            
            // Get pending visit details
            $stmt = $pdo->prepare("SELECT * FROM pending_visits WHERE id = ? AND status = \"pending\"");
            $stmt->execute([$visitId]);
            $visit = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$visit) {
                $pdo->rollBack();
                echo json_encode(["success" => false, "message" => "Pending visit not found"]);
                exit;
            }
            
            // Insert into visits table
            $stmt = $pdo->prepare("INSERT INTO visits (mason_id, visit_date, visit_time, items, rewards, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute([
                $visit["mason_id"],
                $visit["visit_date"],
                $visit["visit_time"],
                $visit["items"],
                $rewards
            ]);
            
            // Update mason total rewards
            $stmt = $pdo->prepare("UPDATE masons SET total_rewards = total_rewards + ? WHERE id = ?");
            $stmt->execute([$rewards, $visit["mason_id"]]);
            
            // Update pending visit status
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = \"approved\", rewards = ? WHERE id = ?");
            $stmt->execute([$rewards, $visitId]);
            
            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Visit approved successfully"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false, "message" => "Failed to approve visit"]);
        }
    } elseif ($action === "reject") {
        try {
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = \"rejected\" WHERE id = ? AND status = \"pending\"");
            $stmt->execute([$visitId]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(["success" => true, "message" => "Visit rejected successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Pending visit not found or already processed"]);
            }
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => "Failed to reject visit"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request method"]);
';

    $file = '/home/jptilesi/public_html/api/pending-visits.php';
    if (file_put_contents($file, $newContent)) {
        echo json_encode(['success' => true, 'message' => 'pending-visits.php fixed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to write file']);
    }
}
?>