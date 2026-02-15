<?php
header('Content-Type: text/plain');
require_once '/home/jptilesi/public_html/includes/config.php';

$conn = getDBConnection();

echo "=== ADDING CUSTOMER TIER AND REFERENCE COLUMNS ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

// Check if columns already exist
$result = $conn->query("SHOW COLUMNS FROM masons LIKE 'customer_tier'");
if ($result->num_rows > 0) {
    echo "customer_tier column already exists\n";
} else {
    // Add customer_tier column with ENUM
    $sql = "ALTER TABLE masons ADD COLUMN customer_tier ENUM('Platinum', 'Gold', 'Silver', 'Brown') DEFAULT 'Silver' AFTER category_id";
    if ($conn->query($sql)) {
        echo "Added customer_tier column\n";
    } else {
        echo "Error adding customer_tier: " . $conn->error . "\n";
    }
}

$result = $conn->query("SHOW COLUMNS FROM masons LIKE 'reference_by'");
if ($result->num_rows > 0) {
    echo "reference_by column already exists\n";
} else {
    // Add reference_by column
    $sql = "ALTER TABLE masons ADD COLUMN reference_by VARCHAR(255) DEFAULT 'Direct' AFTER customer_tier";
    if ($conn->query($sql)) {
        echo "Added reference_by column\n";
    } else {
        echo "Error adding reference_by: " . $conn->error . "\n";
    }
}

// Update all existing customers to Silver tier and Direct reference
echo "\n=== UPDATING EXISTING CUSTOMERS ===\n";
$result = $conn->query("UPDATE masons SET customer_tier = 'Silver', reference_by = 'Direct' WHERE customer_tier IS NULL OR reference_by IS NULL");
if ($result) {
    $affected = $conn->affected_rows;
    echo "Updated $affected customers to Silver tier and Direct reference\n";
} else {
    echo "Error updating: " . $conn->error . "\n";
}

// Verify
echo "\n=== VERIFICATION ===\n";
$result = $conn->query("SELECT customer_tier, COUNT(*) as c FROM masons GROUP BY customer_tier");
while ($row = $result->fetch_assoc()) {
    echo "Tier '{$row['customer_tier']}': {$row['c']} customers\n";
}

$result = $conn->query("SELECT reference_by, COUNT(*) as c FROM masons GROUP BY reference_by LIMIT 5");
echo "\nTop references:\n";
while ($row = $result->fetch_assoc()) {
    echo "'{$row['reference_by']}': {$row['c']} customers\n";
}

$conn->close();
echo "\n=== DONE ===\n";