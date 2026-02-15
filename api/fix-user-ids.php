<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== Creating user accounts for masons without user_id ===\n\n";

// Get all active masons without user_id
$result = $conn->query("SELECT id, name, mobile, email, address FROM masons WHERE user_id IS NULL AND status = 'active'");
$count = 0;
$defaultPassword = password_hash('12345', PASSWORD_DEFAULT);

while ($mason = $result->fetch_assoc()) {
    // Check if user already exists with this mobile
    $check = $conn->query("SELECT id FROM users WHERE mobile = '{$mason['mobile']}'");
    
    if ($check->num_rows > 0) {
        // User exists, just link it
        $user = $check->fetch_assoc();
        $userId = $user['id'];
        $conn->query("UPDATE masons SET user_id = $userId WHERE id = {$mason['id']}");
        echo "Linked existing user $userId to mason {$mason['id']} ({$mason['name']})\n";
    } else {
        // Create new user
        $name = $conn->real_escape_string($mason['name']);
        $mobile = $conn->real_escape_string($mason['mobile']);
        $email = $conn->real_escape_string($mason['email'] ?? '');
        $address = $conn->real_escape_string($mason['address'] ?? '');
        
        $conn->query("INSERT INTO users (name, mobile, email, password, role, address, status) VALUES ('$name', '$mobile', '$email', '$defaultPassword', 'mason', '$address', 'active')");
        $userId = $conn->insert_id;
        
        if ($userId) {
            $conn->query("UPDATE masons SET user_id = $userId WHERE id = {$mason['id']}");
            echo "Created user $userId for mason {$mason['id']} ({$mason['name']} - {$mason['mobile']})\n";
            $count++;
        }
    }
}

echo "\n=== Summary ===\n";
echo "Created/linked $count user accounts\n";

// Verify
$remaining = $conn->query("SELECT COUNT(*) as c FROM masons WHERE user_id IS NULL AND status = 'active'")->fetch_assoc()['c'];
echo "Remaining masons without user_id: $remaining\n";

$conn->close();