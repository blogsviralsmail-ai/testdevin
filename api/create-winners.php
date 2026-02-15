<?php
require_once '/home/jptilesi/public_html/includes/config.php';
$conn = getDBConnection();

// Check if winners table exists
$result = $conn->query("SHOW TABLES LIKE 'winners'");
if ($result->num_rows == 0) {
    // Create winners table
    $sql = "CREATE TABLE winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        offer_id INT,
        mason_id INT,
        prize VARCHAR(255),
        won_date DATE,
        status ENUM('pending', 'delivered') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
        FOREIGN KEY (mason_id) REFERENCES masons(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($sql)) {
        echo "Winners table created successfully\n";
    } else {
        echo "Error creating winners table: " . $conn->error . "\n";
    }
} else {
    echo "Winners table already exists\n";
}

$conn->close();