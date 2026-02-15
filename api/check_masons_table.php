<?php
header('Content-Type: application/json');
require_once '../includes/config.php';

$conn = getDBConnection();

$result = $conn->query("DESCRIBE masons");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row;
}

echo json_encode(['columns' => $columns], JSON_PRETTY_PRINT);
