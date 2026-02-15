<?php
header('Content-Type: application/json');

// Security check
if (!isset($_GET['setup']) || $_GET['setup'] !== 'jptiles2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

require_once '../includes/config.php';

$results = [];

try {
    // Check existing tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['existing_tables'] = $tables;
    
    // Create meetings table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mason_id INT NOT NULL,
            meeting_date DATE NOT NULL,
            meeting_time TIME,
            purpose VARCHAR(255),
            location VARCHAR(255),
            notes TEXT,
            status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (mason_id) REFERENCES masons(id) ON DELETE CASCADE
        )
    ");
    $results['meetings_table'] = 'created or exists';
    
    // Create gifts table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS gifts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mason_id INT NOT NULL,
            gift_name VARCHAR(255) NOT NULL,
            gift_value DECIMAL(10,2) DEFAULT 0,
            given_date DATE,
            notes TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (mason_id) REFERENCES masons(id) ON DELETE CASCADE
        )
    ");
    $results['gifts_table'] = 'created or exists';
    
    // Verify tables were created
    $stmt = $pdo->query("SHOW TABLES");
    $tables_after = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['tables_after'] = $tables_after;
    
    $results['success'] = true;
    
} catch (Exception $e) {
    $results['error'] = $e->getMessage();
    $results['success'] = false;
}

echo json_encode($results, JSON_PRETTY_PRINT);
