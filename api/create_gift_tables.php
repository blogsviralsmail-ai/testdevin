<?php
header("Content-Type: application/json");
require_once "../includes/config.php";

try {
    // Check if gift_events table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'gift_events'");
    $eventsExists = $stmt->rowCount() > 0;
    
    // Check if gift_recipients table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'gift_recipients'");
    $recipientsExists = $stmt->rowCount() > 0;
    
    $created = [];
    
    if (!$eventsExists) {
        $pdo->exec("
            CREATE TABLE gift_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date DATE,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $created[] = "gift_events";
    }
    
    if (!$recipientsExists) {
        $pdo->exec("
            CREATE TABLE gift_recipients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                customer_id INT NOT NULL,
                gift_description VARCHAR(255),
                is_delivered TINYINT(1) DEFAULT 0,
                delivered_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_event_customer (event_id, customer_id),
                FOREIGN KEY (event_id) REFERENCES gift_events(id) ON DELETE CASCADE
            )
        ");
        $created[] = "gift_recipients";
    }
    
    echo json_encode([
        "success" => true,
        "gift_events_existed" => $eventsExists,
        "gift_recipients_existed" => $recipientsExists,
        "tables_created" => $created,
        "message" => empty($created) ? "All tables already exist" : "Created tables: " . implode(", ", $created)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}