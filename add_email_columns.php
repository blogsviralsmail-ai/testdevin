<?php
$conn = new mysqli('localhost', 'jptilesi', 'kA7:6:1CyqeVY7', 'jptilesi_db');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Add email column to masons table if not exists
$result = $conn->query("SHOW COLUMNS FROM masons LIKE 'email'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE masons ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER mobile");
    echo "Added email column to masons table\n";
} else {
    echo "Email column already exists in masons table\n";
}

// Add email column to users table if not exists
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'email'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER mobile");
    echo "Added email column to users table\n";
} else {
    echo "Email column already exists in users table\n";
}

// Add email_sent column to meeting_invites table if not exists
$result = $conn->query("SHOW COLUMNS FROM meeting_invites LIKE 'email_sent'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE meeting_invites ADD COLUMN email_sent TINYINT(1) DEFAULT 0");
    echo "Added email_sent column to meeting_invites table\n";
} else {
    echo "Email_sent column already exists in meeting_invites table\n";
}

// Add email_sent_at column to meeting_invites table if not exists
$result = $conn->query("SHOW COLUMNS FROM meeting_invites LIKE 'email_sent_at'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE meeting_invites ADD COLUMN email_sent_at DATETIME DEFAULT NULL");
    echo "Added email_sent_at column to meeting_invites table\n";
} else {
    echo "Email_sent_at column already exists in meeting_invites table\n";
}

echo "Done!\n";
$conn->close();
?>
