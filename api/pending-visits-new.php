<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Include database config from includes folder
require_once '../includes/config.php';

// Verify token
$headers = getallheaders();
$authHeader = isset($headers["Authorization"]) ? $headers["Authorization"] : "";

if (empty($authHeader) || !preg_match("/Bearer\s+(.+)/i", $authHeader, $matches)) {
    echo json_encode(array("success" => false, "message" => "Authorization token required"));
    exit;
}

$token = $matches[1];

// Verify token in database - check api_tokens table first, then users table
$stmt = $pdo->prepare("SELECT * FROM api_tokens WHERE token = ? AND expires_at > NOW()");
$stmt->execute(array($token));
$tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tokenData) {
    // Try checking users table for auth_token
    $stmt = $pdo->prepare("SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.auth_token = ?");
    $stmt->execute(array($token));
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(array("success" => false, "message" => "Invalid token"));
        exit;
    }
}

// Handle GET request - list pending visits
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $stmt = $pdo->query("
            SELECT pv.*, m.name as customer_name, m.mobile as customer_mobile 
            FROM pending_visits pv 
            LEFT JOIN masons m ON pv.customer_id = m.id 
            WHERE pv.status = 'pending'
            ORDER BY pv.created_at DESC
        ");
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the response to match expected format
        $formattedVisits = array();
        foreach ($visits as $visit) {
            $formattedVisits[] = array(
                'id' => $visit['id'],
                'customer_id' => $visit['customer_id'],
                'customer_name' => $visit['customer_name'] ? $visit['customer_name'] : 'Unknown',
                'customer_mobile' => $visit['customer_mobile'],
                'visit_date' => $visit['visit_date'],
                'visit_time' => $visit['visit_time'],
                'items' => $visit['items_description'],
                'status' => $visit['status'],
                'rewards' => $visit['rewards'],
                'created_at' => $visit['created_at']
            );
        }
        
        echo json_encode(array("success" => true, "data" => $formattedVisits));
    } catch (PDOException $e) {
        echo json_encode(array("success" => false, "message" => "Failed to fetch pending visits: " . $e->getMessage()));
    }
    exit;
}

// Handle POST request - approve/reject
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = isset($input["action"]) ? $input["action"] : "";
    $visitId = isset($input["visit_id"]) ? $input["visit_id"] : 0;
    
    if (empty($visitId)) {
        echo json_encode(array("success" => false, "message" => "Visit ID required"));
        exit;
    }
    
    if ($action === "approve") {
        $rewards = isset($input["rewards"]) ? floatval($input["rewards"]) : 0;
        
        try {
            $pdo->beginTransaction();
            
            // Get pending visit details
            $stmt = $pdo->prepare("SELECT * FROM pending_visits WHERE id = ? AND status = 'pending'");
            $stmt->execute(array($visitId));
            $visit = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$visit) {
                $pdo->rollBack();
                echo json_encode(array("success" => false, "message" => "Pending visit not found"));
                exit;
            }
            
            // Update mason total rewards
            $stmt = $pdo->prepare("UPDATE masons SET total_rewards = COALESCE(total_rewards, 0) + ? WHERE id = ?");
            $stmt->execute(array($rewards, $visit["customer_id"]));
            
            // Update pending visit status to approved
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = 'approved', rewards = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute(array($rewards, $visitId));
            
            $pdo->commit();
            echo json_encode(array("success" => true, "message" => "Visit approved successfully"));
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(array("success" => false, "message" => "Failed to approve visit: " . $e->getMessage()));
        }
    } elseif ($action === "reject") {
        try {
            $stmt = $pdo->prepare("UPDATE pending_visits SET status = 'rejected', updated_at = NOW() WHERE id = ? AND status = 'pending'");
            $stmt->execute(array($visitId));
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(array("success" => true, "message" => "Visit rejected successfully"));
            } else {
                echo json_encode(array("success" => false, "message" => "Pending visit not found or already processed"));
            }
        } catch (PDOException $e) {
            echo json_encode(array("success" => false, "message" => "Failed to reject visit: " . $e->getMessage()));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Invalid action"));
    }
    exit;
}

echo json_encode(array("success" => false, "message" => "Invalid request method"));
