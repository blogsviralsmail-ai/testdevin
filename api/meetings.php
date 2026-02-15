<?php
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
    // Check if getting invites for a specific meeting
    $meetingId = isset($_GET['meeting_id']) ? (int)$_GET['meeting_id'] : 0;
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    if ($action === 'get_invites' && $meetingId > 0) {
        // Get invited customers for a specific meeting
        $stmt = $pdo->prepare("
            SELECT mi.*, mi.attended, m.name as customer_name, m.mobile as customer_mobile, m.email as customer_email,
                   cc.name as category_name
            FROM meeting_invites mi
            JOIN masons m ON mi.customer_id = m.id
            LEFT JOIN customer_categories cc ON m.category_id = cc.id
            WHERE mi.meeting_id = ?
            ORDER BY mi.attended DESC, m.name
        ");
        $stmt->execute([$meetingId]);
        $invites = $stmt->fetchAll();
        
        echo json_encode(["success" => true, "data" => $invites]);
        exit;
    }
    
    // Get all meetings with invite counts
    $sql = "SELECT m.*, u.name as created_by_name,
            (SELECT COUNT(*) FROM meeting_invites WHERE meeting_id = m.id) as invited_count,
            (SELECT COUNT(*) FROM meeting_invites WHERE meeting_id = m.id AND attended = 1) as attended_count
            FROM meetings m 
            LEFT JOIN users u ON m.created_by = u.id
            ORDER BY m.meeting_date DESC, m.meeting_time DESC";
    
    $stmt = $pdo->query($sql);
    $meetings = $stmt->fetchAll();
    
    echo json_encode(["success" => true, "data" => $meetings]);
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? "create";
    
    try {
        // Create meeting_invites table if not exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS meeting_invites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id INT NOT NULL,
            customer_id INT NOT NULL,
            attended TINYINT(1) DEFAULT 0,
            email_sent TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_meeting_customer (meeting_id, customer_id)
        )");
        
        if ($action === "create") {
            // Create new meeting
            $stmt = $pdo->prepare("
                INSERT INTO meetings (title, description, meeting_date, meeting_time, venue, status, created_by) 
                VALUES (?, ?, ?, ?, ?, 'upcoming', ?)
            ");
            $stmt->execute([
                $input["title"] ?? "Meeting",
                $input["description"] ?? "",
                $input["meeting_date"] ?? date("Y-m-d"),
                $input["meeting_time"] ?? null,
                $input["venue"] ?? $input["location"] ?? "",
                $user["id"]
            ]);
            
            $meetingId = $pdo->lastInsertId();
            
            // If customers are provided, invite them
            if (!empty($input["invite_customers"])) {
                $inviteStmt = $pdo->prepare("INSERT IGNORE INTO meeting_invites (meeting_id, customer_id) VALUES (?, ?)");
                foreach ($input["invite_customers"] as $custId) {
                    $inviteStmt->execute([$meetingId, (int)$custId]);
                }
            }
            
            echo json_encode(["success" => true, "message" => "Meeting created successfully", "id" => $meetingId]);
            
        } elseif ($action === "invite") {
            // Invite customers to existing meeting
            $meetingId = $input["meeting_id"] ?? 0;
            $customerIds = $input["customer_ids"] ?? [];
            
            if (!$meetingId || empty($customerIds)) {
                echo json_encode(["success" => false, "message" => "Meeting ID and customer IDs required"]);
                exit;
            }
            
            // Check if meeting exists
            $stmt = $pdo->prepare("SELECT id FROM meetings WHERE id = ?");
            $stmt->execute([$meetingId]);
            if (!$stmt->fetch()) {
                echo json_encode(["success" => false, "message" => "Meeting not found"]);
                exit;
            }
            
            $added = 0;
            $stmt = $pdo->prepare("INSERT IGNORE INTO meeting_invites (meeting_id, customer_id) VALUES (?, ?)");
            foreach ($customerIds as $custId) {
                $stmt->execute([$meetingId, (int)$custId]);
                if ($stmt->rowCount() > 0) $added++;
            }
            
            echo json_encode(["success" => true, "message" => "$added customer(s) invited successfully"]);
            
        } elseif ($action === "mark_attendance") {
            // Mark customer attendance
            $meetingId = $input["meeting_id"] ?? 0;
            $customerId = $input["customer_id"] ?? 0;
            $attended = isset($input["attended"]) ? (int)$input["attended"] : 1;
            
            if (!$meetingId || !$customerId) {
                echo json_encode(["success" => false, "message" => "Meeting ID and customer ID required"]);
                exit;
            }
            
            // Check if invite exists
            $stmt = $pdo->prepare("SELECT id FROM meeting_invites WHERE meeting_id = ? AND customer_id = ?");
            $stmt->execute([$meetingId, $customerId]);
            if (!$stmt->fetch()) {
                // Create invite first if not exists
                $stmt = $pdo->prepare("INSERT INTO meeting_invites (meeting_id, customer_id, attended) VALUES (?, ?, ?)");
                $stmt->execute([$meetingId, $customerId, $attended]);
            } else {
                // Update attendance
                $stmt = $pdo->prepare("UPDATE meeting_invites SET attended = ? WHERE meeting_id = ? AND customer_id = ?");
                $stmt->execute([$attended, $meetingId, $customerId]);
            }
            
            echo json_encode(["success" => true, "message" => "Attendance updated successfully"]);
            
        } elseif ($action === "get_invites") {
            // Get invited customers for a meeting (POST version)
            $meetingId = $input["meeting_id"] ?? 0;
            
            if (!$meetingId) {
                echo json_encode(["success" => false, "message" => "Meeting ID required"]);
                exit;
            }
            
            $stmt = $pdo->prepare("
                SELECT mi.*, mi.attended, m.name as customer_name, m.mobile as customer_mobile, m.email as customer_email,
                       cc.name as category_name
                FROM meeting_invites mi
                JOIN masons m ON mi.customer_id = m.id
                LEFT JOIN customer_categories cc ON m.category_id = cc.id
                WHERE mi.meeting_id = ?
                ORDER BY mi.attended DESC, m.name
            ");
            $stmt->execute([$meetingId]);
            $invites = $stmt->fetchAll();
            
            echo json_encode(["success" => true, "data" => $invites]);
            
        } elseif ($action === "add_attendee") {
            // Add attendee by mobile number
            $meetingId = $input["meeting_id"] ?? 0;
            $mobile = $input["mobile"] ?? "";
            
            if (!$meetingId || empty($mobile)) {
                echo json_encode(["success" => false, "message" => "Meeting ID and mobile required"]);
                exit;
            }
            
            // Find customer by mobile
            $stmt = $pdo->prepare("SELECT id FROM masons WHERE mobile = ?");
            $stmt->execute([$mobile]);
            $customer = $stmt->fetch();
            
            if (!$customer) {
                echo json_encode(["success" => false, "message" => "Customer not found with this mobile number"]);
                exit;
            }
            
            // Add to invites
            $stmt = $pdo->prepare("INSERT IGNORE INTO meeting_invites (meeting_id, customer_id) VALUES (?, ?)");
            $stmt->execute([$meetingId, $customer['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(["success" => true, "message" => "Customer added successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Customer already invited"]);
            }
            
        } elseif ($action === "delete") {
            // Delete meeting
            $meetingId = $input["meeting_id"] ?? $input["id"] ?? 0;
            
            if (!$meetingId) {
                echo json_encode(["success" => false, "message" => "Meeting ID required"]);
                exit;
            }
            
            // Delete invites first
            $stmt = $pdo->prepare("DELETE FROM meeting_invites WHERE meeting_id = ?");
            $stmt->execute([$meetingId]);
            
            // Delete meeting
            $stmt = $pdo->prepare("DELETE FROM meetings WHERE id = ?");
            $stmt->execute([$meetingId]);
            
            echo json_encode(["success" => true, "message" => "Meeting deleted successfully"]);
            
        } else {
            echo json_encode(["success" => false, "message" => "Unknown action: $action"]);
        }
        
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}