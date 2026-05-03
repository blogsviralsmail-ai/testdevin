<?php
/**
 * SafeChild API - App Management
 * 
 * POST /api/apps.php - Sync installed apps from device
 * Headers: Authorization: Bearer <device_id>
 * Body: { "apps": [ { "package_name": "...", "app_name": "...", "is_system_app": false } ] }
 * 
 * GET /api/apps.php?child_id=1 - Parent gets child's apps (session auth)
 */

require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = getDB();

// POST - Device syncs installed apps
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $device = requireDeviceAuth();
    $data = getJsonInput();
    
    if (!isset($data['apps']) || !is_array($data['apps'])) {
        jsonResponse(['error' => 'apps array is required'], 400);
    }
    
    $deviceId = sanitize($device['device_id']);
    $childId = (int) $device['child_id'];
    $parentId = (int) $device['parent_id'];
    
    $newApps = [];
    
    foreach ($data['apps'] as $app) {
        $packageName = sanitize($app['package_name'] ?? '');
        $appName = sanitize($app['app_name'] ?? '');
        $isSystemApp = !empty($app['is_system_app']) ? 1 : 0;
        $category = sanitize($app['category'] ?? '');
        
        if (empty($packageName)) continue;
        
        $existing = $db->query("
            SELECT id FROM child_apps WHERE device_id = '$deviceId' AND package_name = '$packageName'
        ");
        
        $isNew = (!$existing || $existing->num_rows === 0);
        $categoryVal = !empty($category) ? "'$category'" : 'NULL';
        
        $db->query("
            INSERT INTO child_apps (device_id, child_id, package_name, app_name, category, is_system_app)
            VALUES ('$deviceId', $childId, '$packageName', '$appName', $categoryVal, $isSystemApp)
            ON DUPLICATE KEY UPDATE app_name = '$appName', is_system_app = $isSystemApp
        ");
        
        if ($isNew && !$isSystemApp) {
            $newApps[] = $appName;
        }
    }
    
    // Alert about new apps
    if (!empty($newApps)) {
        $appList = implode(', ', array_slice($newApps, 0, 5));
        $count = count($newApps);
        createAlert($parentId, $childId, 'new_app_installed',
            "$count new app(s) detected",
            "New apps on {$device['child_name']}'s device: $appList"
        );
    }
    
    // Get blocked apps list to send back
    $blockedApps = [];
    $blocked = $db->query("
        SELECT package_name FROM app_block_rules
        WHERE child_id = $childId AND is_active = 1 AND package_name IS NOT NULL
    ");
    if ($blocked) {
        while ($row = $blocked->fetch_assoc()) {
            $blockedApps[] = $row['package_name'];
        }
    }
    
    jsonResponse([
        'success' => true,
        'blocked_apps' => $blockedApps,
        'new_apps_detected' => count($newApps)
    ]);
}

// GET - Parent views child's apps
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $parent = getAuthParent();
    if (!$parent) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    
    $childId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;
    if ($childId === 0) {
        jsonResponse(['error' => 'child_id is required'], 400);
    }
    
    $parentId = (int) $parent['id'];
    $check = $db->query("
        SELECT c.id FROM children c JOIN families f ON c.family_id = f.id
        WHERE c.id = $childId AND f.parent_id = $parentId
    ");
    if (!$check || $check->num_rows === 0) {
        jsonResponse(['error' => 'Child not found'], 404);
    }
    
    $apps = [];
    $result = $db->query("
        SELECT ca.*, abr.id as block_rule_id, abr.block_type
        FROM child_apps ca
        LEFT JOIN app_block_rules abr ON ca.package_name = abr.package_name AND abr.child_id = $childId AND abr.is_active = 1
        WHERE ca.child_id = $childId AND ca.is_system_app = 0
        ORDER BY ca.app_name ASC
    ");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $apps[] = $row;
        }
    }
    
    jsonResponse(['apps' => $apps]);
}
