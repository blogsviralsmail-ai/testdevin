<?php
require_once 'includes/config.php';
$conn = getDBConnection();

$sql = "CREATE TABLE IF NOT EXISTS password_reset_otp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expiry DATETIME NOT NULL,
    user_type ENUM('admin', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile (mobile),
    INDEX idx_expiry (expiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($sql)) {
    echo "Table 'password_reset_otp' created successfully!";
} else {
    echo "Error: " . $conn->error;
}
$conn->close();
?>
