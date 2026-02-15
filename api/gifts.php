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
    $action = $_GET["action"] ?? "events";
    
    if ($action === "events") {
        // Get all gift events with counts
        $sql = "SELECT ge.*, 
                u.name as created_by_name,
                (SELECT COUNT(*) FROM gift_recipients WHERE event_id = ge.id) as total_recipients,
                (SELECT COUNT(*) FROM gift_recipients WHERE event_id = ge.id AND is_delivered = 1) as delivered_count
                FROM gift_events ge 
                LEFT JOIN users u ON ge.created_by = u.id
                ORDER BY ge.event_date DESC, ge.created_at DESC";
        
        $stmt = $pdo->query($sql);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $events]);
        
    } elseif ($action === "recipients") {
        // Get recipients for a specific event - use masons table instead of customers
        $event_id = (int)($_GET["event_id"] ?? 0);
        
        $sql = "SELECT gr.*, m.name as customer_name, m.mobile as customer_mobile
                FROM gift_recipients gr
                JOIN masons m ON gr.customer_id = m.id
                WHERE gr.event_id = ?
                ORDER BY gr.is_delivered ASC, gr.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$event_id]);
        $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $recipients]);
        
    } elseif ($action === "event_detail") {
        // Get single event with its recipients
        $event_id = (int)($_GET["event_id"] ?? 0);
        
        $stmt = $pdo->prepare("SELECT * FROM gift_events WHERE id = ?");
        $stmt->execute([$event_id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$event) {
            echo json_encode(["success" => false, "message" => "Event not found"]);
            exit;
        }
        
        // Use masons table instead of customers
        $stmt = $pdo->prepare("SELECT gr.*, m.name as customer_name, m.mobile as customer_mobile
                               FROM gift_recipients gr
                               JOIN masons m ON gr.customer_id = m.id
                               WHERE gr.event_id = ?
                               ORDER BY gr.is_delivered ASC, gr.created_at DESC");
        $stmt->execute([$event_id]);
        $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $event["recipients"] = $recipients;
        $event["total_recipients"] = count($recipients);
        $event["delivered_count"] = count(array_filter($recipients, fn($r) => $r["is_delivered"]));
        
        echo json_encode(["success" => true, "data" => $event]);
    }
    
} elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    $action = $input["action"] ?? "create_event";
    
    try {
        if ($action === "create_event") {
            // Create new gift event
            $stmt = $pdo->prepare("
                INSERT INTO gift_events (title, description, event_date, created_by) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $input["title"] ?? "Gift Event",
                $input["description"] ?? "",
                $input["event_date"] ?? date("Y-m-d"),
                $user["id"]
            ]);
            echo json_encode(["success" => true, "message" => "Gift event created successfully", "id" => $pdo->lastInsertId()]);
            
        } elseif ($action === "delete_event") {
            // Delete event and its recipients
            $event_id = (int)($input["event_id"] ?? 0);
            $pdo->prepare("DELETE FROM gift_recipients WHERE event_id = ?")->execute([$event_id]);
            $pdo->prepare("DELETE FROM gift_events WHERE id = ?")->execute([$event_id]);
            echo json_encode(["success" => true, "message" => "Event deleted"]);
            
        } elseif ($action === "add_recipients") {
            // Add recipients to an event
            $event_id = (int)($input["event_id"] ?? 0);
            $customer_ids = $input["customer_ids"] ?? [];
            $gift_description = $input["gift_description"] ?? "";
            
            if (!$event_id || empty($customer_ids)) {
                echo json_encode(["success" => false, "message" => "Event ID and customer IDs required"]);
                exit;
            }
            
            $added = 0;
            $stmt = $pdo->prepare("INSERT IGNORE INTO gift_recipients (event_id, customer_id, gift_description) VALUES (?, ?, ?)");
            foreach ($customer_ids as $cust_id) {
                $stmt->execute([$event_id, (int)$cust_id, $gift_description]);
                if ($stmt->rowCount() > 0) $added++;
            }
            
            echo json_encode(["success" => true, "message" => "$added recipient(s) added"]);
            
        } elseif ($action === "mark_delivered") {
            // Mark recipient as delivered
            $recipient_id = (int)($input["recipient_id"] ?? 0);
            $stmt = $pdo->prepare("UPDATE gift_recipients SET is_delivered = 1, delivered_date = CURDATE() WHERE id = ?");
            $stmt->execute([$recipient_id]);
            echo json_encode(["success" => true, "message" => "Marked as delivered"]);
            
        } elseif ($action === "remove_recipient") {
            // Remove recipient from event
            $recipient_id = (int)($input["recipient_id"] ?? 0);
            $stmt = $pdo->prepare("DELETE FROM gift_recipients WHERE id = ?");
            $stmt->execute([$recipient_id]);
            echo json_encode(["success" => true, "message" => "Recipient removed"]);
            
        } else {
            echo json_encode(["success" => false, "message" => "Unknown action"]);
        }
        
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}