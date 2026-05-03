<?php
/**
 * SafeChild API - Device Pairing
 * 
 * POST /api/pair.php
 * Body: { "pairing_code": "123456", "device_id": "...", "model": "...", "manufacturer": "...", "android_version": "..." }
 * 
 * Flow:
 * 1. Parent generates pairing code in dashboard
 * 2. Parent installs SafeChild on child's phone
 * 3. Child app sends pairing code + device info
 * 4. Server links device to child profile
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

$data = getJsonInput();
$error = validateRequired($data, ['pairing_code', 'device_id']);
if ($error) {
    jsonResponse(['error' => $error], 400);
}

$db = getDB();
$pairingCode = sanitize($data['pairing_code']);
$deviceId = sanitize($data['device_id']);
$model = sanitize($data['model'] ?? 'Unknown');
$manufacturer = sanitize($data['manufacturer'] ?? 'Unknown');
$androidVersion = sanitize($data['android_version'] ?? '');
$deviceName = sanitize($data['device_name'] ?? "$manufacturer $model");

// Find pending device with this pairing code
$result = $db->query("
    SELECT cd.*, c.name as child_name, c.family_id, f.parent_id
    FROM child_devices cd
    JOIN children c ON cd.child_id = c.id
    JOIN families f ON c.family_id = f.id
    WHERE cd.pairing_code = '$pairingCode'
    AND cd.paired_at IS NULL
    AND cd.is_active = 1
");

if (!$result || $result->num_rows === 0) {
    jsonResponse(['error' => 'Invalid or expired pairing code'], 404);
}

$device = $result->fetch_assoc();

// Update device with actual device info
$now = date('Y-m-d H:i:s');
$db->query("
    UPDATE child_devices SET
        device_id = '$deviceId',
        device_name = '$deviceName',
        model = '$model',
        manufacturer = '$manufacturer',
        android_version = '$androidVersion',
        paired_at = '$now',
        last_seen = '$now',
        pairing_code = NULL
    WHERE id = {$device['id']}
");

// Log consent
$parentId = (int) $device['parent_id'];
$childId = (int) $device['child_id'];
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

$consentText = "Parent has consented to monitor child's location, screen time, and app usage. Child device is aware of monitoring (persistent notification shown).";
$consentTextEsc = sanitize($consentText);

$consentTypes = ['monitoring', 'location', 'app_usage', 'screen_time'];
foreach ($consentTypes as $type) {
    $db->query("
        INSERT INTO consent_records (parent_id, child_id, consent_type, consented, consent_text, ip_address, user_agent)
        VALUES ($parentId, $childId, '$type', 1, '$consentTextEsc', '$ip', '$ua')
    ");
}

// Create alert for parent
createAlert($parentId, $childId, 'new_app_installed', 
    "Device paired successfully", 
    "{$device['child_name']}'s device ($deviceName) has been paired."
);

// Log audit
logAudit($parentId, 'device_paired', 'child_devices', $device['id'], "Device $deviceName paired for {$device['child_name']}");

jsonResponse([
    'success' => true,
    'message' => 'Device paired successfully',
    'device_token' => $deviceId,
    'child_name' => $device['child_name'],
    'settings' => [
        'location_interval_minutes' => (int) getSetting('location_interval_minutes', '15'),
        'heartbeat_interval_minutes' => (int) getSetting('heartbeat_interval_minutes', '5'),
    ]
]);
