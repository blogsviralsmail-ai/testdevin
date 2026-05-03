<?php
/**
 * SafeChild API - Device Heartbeat
 * 
 * POST /api/heartbeat.php
 * Headers: Authorization: Bearer <device_id>
 * Body: { "battery_level": 85, "is_charging": true, "network_type": "wifi", "is_screen_on": false, "app_version": "1.0.0" }
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
$batteryLevel = isset($data['battery_level']) ? (int) $data['battery_level'] : null;
$isCharging = !empty($data['is_charging']) ? 1 : 0;
$networkType = sanitize($data['network_type'] ?? 'unknown');
$isScreenOn = !empty($data['is_screen_on']) ? 1 : 0;
$appVersion = sanitize($data['app_version'] ?? '');
$now = date('Y-m-d H:i:s');

$batteryVal = $batteryLevel !== null ? $batteryLevel : 'NULL';
$appVersionVal = !empty($appVersion) ? "'$appVersion'" : 'NULL';

$db->query("
    INSERT INTO device_heartbeats (device_id, battery_level, is_charging, network_type, is_screen_on, app_version, recorded_at)
    VALUES ('$deviceId', $batteryVal, $isCharging, '$networkType', $isScreenOn, $appVersionVal, '$now')
");

// Update device last_seen and app_version
$db->query("
    UPDATE child_devices SET 
        last_seen = '$now'
        " . (!empty($appVersion) ? ", app_version = '$appVersion'" : "") . "
    WHERE device_id = '$deviceId'
");

// Return any pending rules/commands for the device
$childId = (int) $device['child_id'];

// Get screen time rules for today
$dayOfWeek = strtolower(date('D'));
$rules = $db->query("
    SELECT daily_limit_minutes, bedtime_start, bedtime_end
    FROM screen_time_rules
    WHERE child_id = $childId AND day_of_week = '$dayOfWeek' AND is_active = 1
    LIMIT 1
");

$screenTimeRule = null;
if ($rules && $rules->num_rows > 0) {
    $screenTimeRule = $rules->fetch_assoc();
}

// Get blocked apps
$blockedApps = [];
$blocked = $db->query("
    SELECT package_name, block_type, time_limit_minutes, schedule_start, schedule_end
    FROM app_block_rules
    WHERE child_id = $childId AND is_active = 1
");
if ($blocked) {
    while ($row = $blocked->fetch_assoc()) {
        $blockedApps[] = $row;
    }
}

// Get geofences
$geofences = [];
$fences = $db->query("
    SELECT id, name, latitude, longitude, radius_meters, notify_on_enter, notify_on_exit
    FROM geofences
    WHERE child_id = $childId AND is_active = 1
");
if ($fences) {
    while ($row = $fences->fetch_assoc()) {
        $geofences[] = $row;
    }
}

jsonResponse([
    'success' => true,
    'rules' => [
        'screen_time' => $screenTimeRule,
        'blocked_apps' => $blockedApps,
        'geofences' => $geofences,
        'location_interval_minutes' => (int) getSetting('location_interval_minutes', '15'),
    ]
]);
