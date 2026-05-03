<?php
/**
 * SafeChild - Database Connection
 */

require_once __DIR__ . '/config.php';

function getDB(): mysqli {
    static $conn = null;
    
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            error_log("SafeChild DB Connection Failed: " . $conn->connect_error);
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
        
        $conn->set_charset(DB_CHARSET);
    }
    
    return $conn;
}
