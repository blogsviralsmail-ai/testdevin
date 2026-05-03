<?php
/**
 * SafeChild API - Emergency SOS
 * 
 * POST /api/sos.php
 * Headers: Authorization: Bearer <device_id>
 * Body: { "latitude": 28.6139, "longitude": 77.2090, "battery_level": 25, "address": "..." }
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
$childId = (int) $device['child_id'];
$deviceId = sanitize($device['device_id']);
$parentId = (int) $device['parent_id'];

$latitude = isset($data['latitude']) ? (float) $data['latitude'] : null;
$longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
$batteryLevel = isset($data['battery_level']) ? (int) $data['battery_level'] : null;
$addressText = sanitize($data['address'] ?? '');
$now = date('Y-m-d H:i:s');

$latVal = $latitude !== null ? $latitude : 'NULL';
$lngVal = $longitude !== null ? $longitude : 'NULL';
$batteryVal = $batteryLevel !== null ? $batteryLevel : 'NULL';
$addressVal = !empty($addressText) ? "'$addressText'" : 'NULL';

$db->query("
    INSERT INTO sos_events (child_id, device_id, latitude, longitude, address_text, battery_level, triggered_at)
    VALUES ($childId, '$deviceId', $latVal, $lngVal, $addressVal, $batteryVal, '$now')
");

// Create urgent alert for parent
$locationInfo = '';
if ($latitude !== null && $longitude !== null) {
    $locationInfo = "Location: $latitude, $longitude";
    if (!empty($addressText)) {
        $locationInfo = "Location: $addressText ($latitude, $longitude)";
    }
}

createAlert($parentId, $childId, 'sos_triggered',
    "EMERGENCY SOS from {$device['child_name']}!",
    "SOS triggered at " . formatDate($now) . ". $locationInfo. Battery: " . ($batteryLevel ?? 'Unknown') . "%"
);

jsonResponse([
    'success' => true,
    'message' => 'SOS alert sent to parent'
]);
