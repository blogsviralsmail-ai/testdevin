<?php
/**
 * SafeChild API - Fetch Rules for Device
 * 
 * GET /api/rules.php
 * Headers: Authorization: Bearer <device_id>
 * 
 * Returns all active rules for the child device:
 * - Screen time rules
 * - Blocked apps
 * - Website filters
 * - Geofences
 */

require_once __DIR__ . '/../includes/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

requireMethod('GET');

$device = requireDeviceAuth();
$db = getDB();
$childId = (int) $device['child_id'];

// Screen time rules
$screenTimeRules = [];
$result = $db->query("
    SELECT day_of_week, daily_limit_minutes, bedtime_start, bedtime_end
    FROM screen_time_rules
    WHERE child_id = $childId AND is_active = 1
    ORDER BY FIELD(day_of_week, 'mon','tue','wed','thu','fri','sat','sun')
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $screenTimeRules[] = $row;
    }
}

// Blocked apps
$blockedApps = [];
$result = $db->query("
    SELECT package_name, app_category, block_type, time_limit_minutes, schedule_start, schedule_end
    FROM app_block_rules
    WHERE child_id = $childId AND is_active = 1
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $blockedApps[] = $row;
    }
}

// Website filters
$websiteFilters = [];
$result = $db->query("
    SELECT filter_type, value
    FROM website_filters
    WHERE child_id = $childId AND is_active = 1
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $websiteFilters[] = $row;
    }
}

// Geofences
$geofences = [];
$result = $db->query("
    SELECT id, name, latitude, longitude, radius_meters, notify_on_enter, notify_on_exit
    FROM geofences
    WHERE child_id = $childId AND is_active = 1
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $geofences[] = $row;
    }
}

jsonResponse([
    'success' => true,
    'rules' => [
        'screen_time' => $screenTimeRules,
        'blocked_apps' => $blockedApps,
        'website_filters' => $websiteFilters,
        'geofences' => $geofences,
        'settings' => [
            'location_interval_minutes' => (int) getSetting('location_interval_minutes', '15'),
            'heartbeat_interval_minutes' => (int) getSetting('heartbeat_interval_minutes', '5'),
        ]
    ]
]);
