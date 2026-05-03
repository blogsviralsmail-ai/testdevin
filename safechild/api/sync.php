<?php
/**
 * SafeChild API - Data Sync
 * 
 * POST /api/sync.php
 * Headers: Authorization: Bearer <device_id>
 * Body: {
 *   "screen_time": { "date": "2025-01-01", "total_minutes": 120, "unlocks": 15 },
 *   "app_usage": [
 *     { "package_name": "com.whatsapp", "app_name": "WhatsApp", "usage_minutes": 45, "open_count": 10 }
 *   ],
 *   "installed_apps": [
 *     { "package_name": "com.whatsapp", "app_name": "WhatsApp", "is_system_app": false }
 *   ],
 *   "contact_summary": [
 *     { "contact_name": "Mom", "phone_number": "+91...", "call_count": 5, "sms_count": 3 }
 *   ]
 * }
 */

require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

requireMethod('POST');

$device = requireDeviceAuth();
$data = getJsonInput();

$db = getDB();
$deviceId = sanitize($device['device_id']);
$childId = (int) $device['child_id'];
$parentId = (int) $device['parent_id'];

$synced = [];

// Sync screen time
if (isset($data['screen_time'])) {
    $st = $data['screen_time'];
    $date = sanitize($st['date'] ?? date('Y-m-d'));
    $totalMinutes = (int) ($st['total_minutes'] ?? 0);
    $unlocks = (int) ($st['unlocks'] ?? 0);
    
    $db->query("
        INSERT INTO screen_time_logs (device_id, child_id, date, total_minutes, unlocks)
        VALUES ('$deviceId', $childId, '$date', $totalMinutes, $unlocks)
        ON DUPLICATE KEY UPDATE total_minutes = $totalMinutes, unlocks = $unlocks
    ");
    
    // Check if screen time limit exceeded
    $dayOfWeek = strtolower(date('D', strtotime($date)));
    $rule = $db->query("
        SELECT daily_limit_minutes FROM screen_time_rules
        WHERE child_id = $childId AND day_of_week = '$dayOfWeek' AND is_active = 1
        LIMIT 1
    ");
    
    if ($rule && $rule->num_rows > 0) {
        $ruleRow = $rule->fetch_assoc();
        if ($totalMinutes >= (int) $ruleRow['daily_limit_minutes']) {
            createAlert($parentId, $childId, 'screen_time_exceeded',
                "Screen time limit reached",
                "{$device['child_name']} has used {$totalMinutes} minutes today (limit: {$ruleRow['daily_limit_minutes']} min)"
            );
        }
    }
    
    $synced[] = 'screen_time';
}

// Sync app usage stats
if (isset($data['app_usage']) && is_array($data['app_usage'])) {
    $date = sanitize($data['app_usage_date'] ?? date('Y-m-d'));
    
    foreach ($data['app_usage'] as $app) {
        $packageName = sanitize($app['package_name'] ?? '');
        $appName = sanitize($app['app_name'] ?? '');
        $usageMinutes = (int) ($app['usage_minutes'] ?? 0);
        $openCount = (int) ($app['open_count'] ?? 0);
        
        if (empty($packageName)) continue;
        
        $db->query("
            INSERT INTO app_usage_stats (device_id, child_id, package_name, app_name, date, usage_minutes, open_count)
            VALUES ('$deviceId', $childId, '$packageName', '$appName', '$date', $usageMinutes, $openCount)
            ON DUPLICATE KEY UPDATE usage_minutes = $usageMinutes, open_count = $openCount, app_name = '$appName'
        ");
    }
    
    $synced[] = 'app_usage';
}

// Sync installed apps
if (isset($data['installed_apps']) && is_array($data['installed_apps'])) {
    foreach ($data['installed_apps'] as $app) {
        $packageName = sanitize($app['package_name'] ?? '');
        $appName = sanitize($app['app_name'] ?? '');
        $isSystemApp = !empty($app['is_system_app']) ? 1 : 0;
        $category = sanitize($app['category'] ?? '');
        
        if (empty($packageName)) continue;
        
        // Check if this is a new app
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
        
        // Alert parent about new app installs (non-system apps only)
        if ($isNew && !$isSystemApp) {
            createAlert($parentId, $childId, 'new_app_installed',
                "New app installed: $appName",
                "{$device['child_name']} installed '$appName' ($packageName)"
            );
        }
    }
    
    $synced[] = 'installed_apps';
}

// Sync contact summary
if (isset($data['contact_summary']) && is_array($data['contact_summary'])) {
    foreach ($data['contact_summary'] as $contact) {
        $contactName = sanitize($contact['contact_name'] ?? 'Unknown');
        $phoneNumber = sanitize($contact['phone_number'] ?? '');
        $callCount = (int) ($contact['call_count'] ?? 0);
        $smsCount = (int) ($contact['sms_count'] ?? 0);
        $lastDate = sanitize($contact['last_contact_date'] ?? date('Y-m-d'));
        
        if (empty($phoneNumber)) continue;
        
        // Update or insert
        $existing = $db->query("
            SELECT id FROM contact_summary
            WHERE device_id = '$deviceId' AND phone_number = '$phoneNumber'
        ");
        
        if ($existing && $existing->num_rows > 0) {
            $row = $existing->fetch_assoc();
            $db->query("
                UPDATE contact_summary SET
                    contact_name = '$contactName',
                    call_count = $callCount,
                    sms_count = $smsCount,
                    last_contact_date = '$lastDate'
                WHERE id = {$row['id']}
            ");
        } else {
            $db->query("
                INSERT INTO contact_summary (device_id, child_id, contact_name, phone_number, call_count, sms_count, last_contact_date)
                VALUES ('$deviceId', $childId, '$contactName', '$phoneNumber', $callCount, $smsCount, '$lastDate')
            ");
        }
    }
    
    $synced[] = 'contact_summary';
}

// Sync web activity
if (isset($data['web_activity']) && is_array($data['web_activity'])) {
    $date = sanitize($data['web_activity_date'] ?? date('Y-m-d'));
    
    foreach ($data['web_activity'] as $site) {
        $domain = sanitize($site['domain'] ?? '');
        $category = sanitize($site['category'] ?? '');
        $visitCount = (int) ($site['visit_count'] ?? 1);
        $wasBlocked = !empty($site['was_blocked']) ? 1 : 0;
        
        if (empty($domain)) continue;
        
        $categoryVal = !empty($category) ? "'$category'" : 'NULL';
        
        $db->query("
            INSERT INTO web_activity_summary (device_id, child_id, domain, category, visit_count, date, was_blocked)
            VALUES ('$deviceId', $childId, '$domain', $categoryVal, $visitCount, '$date', $wasBlocked)
        ");
        
        if ($wasBlocked) {
            createAlert($parentId, $childId, 'blocked_site_attempt',
                "Blocked website access: $domain",
                "{$device['child_name']} tried to visit blocked site: $domain"
            );
        }
    }
    
    $synced[] = 'web_activity';
}

// Update device last_seen
$now = date('Y-m-d H:i:s');
$db->query("UPDATE child_devices SET last_seen = '$now' WHERE device_id = '$deviceId'");

jsonResponse([
    'success' => true,
    'synced' => $synced,
    'message' => 'Data synced successfully'
]);
