<?php
require_once __DIR__ . '/../../includes/functions.php';

header('Content-Type: application/json');

$parent = getAuthParent();
if (!$parent) {
    echo json_encode(['count' => 0]);
    exit;
}

$db = getDB();
$parentId = (int) $parent['id'];
$result = $db->query("SELECT COUNT(*) as cnt FROM parent_alerts WHERE parent_id = $parentId AND is_read = 0");
$count = ($result && $row = $result->fetch_assoc()) ? (int) $row['cnt'] : 0;

echo json_encode(['count' => $count]);
