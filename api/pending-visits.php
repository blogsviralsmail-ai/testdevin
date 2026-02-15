<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once '../includes/config.php';

$headers = getallheaders();
$authHeader = isset($headers["Authorization"]) ? $headers["Authorization"] : "";

if (empty($authHeader) || !preg_match("/Bearer\s+(.+)/i", $authHeader, $matches)) {
    echo json_encode(array("success" => false, "message" => "Authorization token required"));
    exit;
}

$token = $matches[1];

$stmt = $pdo->prepare("SELECT * FROM api_tokens WHERE token = ? AND expires_at > NOW()");
$stmt->execute(array($token));
$tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tokenData) {
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
            SELECT pv.*, m.name as customer_name, m.mobile as customer_mobile, m.customer_tier, m.reference_by, cc.name as category_name
            FROM pending_visits pv 
            LEFT JOIN masons m ON pv.customer_id = m.id 
            LEFT JOIN customer_categories cc ON m.category_id = cc.id
            ORDER BY pv.created_at DESC
        ");
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedVisits = array();
        foreach ($visits as $visit) {
            $formattedVisits[] = array(
                'id' => $visit['id'],
                'customer_id' => $visit['customer_id'],
                'customer_name' => $visit['customer_name'] ? $visit['customer_name'] : 'Unknown',
                'customer_mobile' => $visit['customer_mobile'],
                'customer_tier' => $visit['customer_tier'] ? $visit['customer_tier'] : 'Silver',
                'reference_by' => $visit['reference_by'] ? $visit['reference_by'] : 'Direct',
                'category_name' => $visit['category_name'] ? $visit['category_name'] : 'N/A',
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
    
    // Accept both 'id' and 'visit_id' parameters
    $id = 0;
    if (isset($input["id"])) {
        $id = (int)$input["id"];
    } elseif (isset($input["visit_id"])) {
        $id = (int)$input["visit_id"];
    }
    
    if ($action === "approve") {
        $rewards = isset($input["rewards"]) ? (float)$input["rewards"] : 0;
        $customerTier = isset($input["customer_tier"]) ? $input["customer_tier"] : "Silver";
        $referenceBy = isset($input["reference_by"]) ? $input["reference_by"] : "Direct";
        
        if ($id <= 0) {
            echo json_encode(array("success" => false, "message" => "Invalid visit ID"));
            exit;
        }
        
        // Validate tier
        if (!in_array($customerTier, array('Platinum', 'Gold', 'Silver', 'Brown'))) {
            $customerTier = 'Silver';
        }
        if (empty($referenceBy)) {
            $referenceBy = 'Direct';
        }
        
        try {
            // Get pending visit
            $stmt = $pdo->prepare("SELECT * FROM pending_visits WHERE id = ?");
            $stmt->execute(array($id));
            $visit = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$visit) {
                echo json_encode(array("success" => false, "message" => "Visit not found"));
                exit;
            }
            
            // Create actual visit in mason_visits
            $stmt = $pdo->prepare("INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, rewards, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute(array($visit["customer_id"], $visit["visit_date"], $visit["visit_time"], $visit["items_description"], $rewards));
            
            // Update mason totals and tier/reference
            $stmt = $pdo->prepare("UPDATE masons SET total_visits = total_visits + 1, total_rewards = total_rewards + ?, is_verified = 1, customer_tier = ?, reference_by = ? WHERE id = ?");
            $stmt->execute(array($rewards, $customerTier, $referenceBy, $visit["customer_id"]));
            
            // Delete pending visit
            $stmt = $pdo->prepare("DELETE FROM pending_visits WHERE id = ?");
            $stmt->execute(array($id));
            
            echo json_encode(array("success" => true, "message" => "Visit approved successfully"));
        } catch (PDOException $e) {
            echo json_encode(array("success" => false, "message" => "Failed to approve visit: " . $e->getMessage()));
        }
        exit;
    }
    
    if ($action === "reject") {
        if ($id <= 0) {
            echo json_encode(array("success" => false, "message" => "Invalid visit ID"));
            exit;
        }
        
        try {
            // Delete pending visit
            $stmt = $pdo->prepare("DELETE FROM pending_visits WHERE id = ?");
            $stmt->execute(array($id));
            
            echo json_encode(array("success" => true, "message" => "Visit rejected successfully"));
        } catch (PDOException $e) {
            echo json_encode(array("success" => false, "message" => "Failed to reject visit: " . $e->getMessage()));
        }
        exit;
    }
    
    echo json_encode(array("success" => false, "message" => "Invalid action"));
}