<?php
/**
 * SafeChild API - Location Updates
 * 
 * POST /api/location.php
 * Headers: Authorization: Bearer <device_id>
 * Body: { "latitude": 28.6139, "longitude": 77.2090, "accuracy": 10.5, "source": "fused", "battery_level": 85 }
 * 
 * GET /api/location.php?child_id=1&date=2025-01-01
 * (For parent dashboard - requires session auth)
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

// POST - Child device sends location
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $device = requireDeviceAuth();
    $data = getJsonInput();
    
    $error = validateRequired($data, ['latitude', 'longitude']);
    if ($error) {
        jsonResponse(['error' => $error], 400);
    }
    
    $deviceId = sanitize($device['device_id']);
    $childId = (int) $device['child_id'];
    $latitude = (float) $data['latitude'];
    $longitude = (float) $data['longitude'];
    $accuracy = isset($data['accuracy']) ? (float) $data['accuracy'] : null;
    $source = sanitize($data['source'] ?? 'fused');
    $batteryLevel = isset($data['battery_level']) ? (int) $data['battery_level'] : null;
    $addressText = sanitize($data['address'] ?? '');
    $now = date('Y-m-d H:i:s');
    
    $accuracyVal = $accuracy !== null ? $accuracy : 'NULL';
    $batteryVal = $batteryLevel !== null ? $batteryLevel : 'NULL';
    $addressVal = !empty($addressText) ? "'$addressText'" : 'NULL';
    
    $db->query("
        INSERT INTO location_history (device_id, child_id, latitude, longitude, accuracy, address_text, source, battery_level, recorded_at)
        VALUES ('$deviceId', $childId, $latitude, $longitude, $accuracyVal, $addressVal, '$source', $batteryVal, '$now')
    ");
    
    // Update device last_seen
    $db->query("UPDATE child_devices SET last_seen = '$now' WHERE device_id = '$deviceId'");
    
    // Check geofences
    $parentId = (int) $device['parent_id'];
    checkGeofences($db, $childId, $parentId, $latitude, $longitude);
    
    // Check battery level alerts
    if ($batteryLevel !== null && $batteryLevel <= 15) {
        createAlert($parentId, $childId, 'low_battery', 
            "Low battery on {$device['child_name']}'s device",
            "Battery level: {$batteryLevel}%"
        );
    }
    
    jsonResponse(['success' => true, 'message' => 'Location saved']);
}

// GET - Parent fetches location history
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $parent = getAuthParent();
    if (!$parent) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    
    $childId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;
    $date = sanitize($_GET['date'] ?? date('Y-m-d'));
    
    if ($childId === 0) {
        jsonResponse(['error' => 'child_id is required'], 400);
    }
    
    // Verify this child belongs to this parent
    $parentId = (int) $parent['id'];
    $check = $db->query("
        SELECT c.id FROM children c
        JOIN families f ON c.family_id = f.id
        WHERE c.id = $childId AND f.parent_id = $parentId
    ");
    
    if (!$check || $check->num_rows === 0) {
        jsonResponse(['error' => 'Child not found'], 404);
    }
    
    // Get latest location
    $latest = $db->query("
        SELECT * FROM location_history
        WHERE child_id = $childId
        ORDER BY recorded_at DESC LIMIT 1
    ");
    
    $latestLocation = ($latest && $latest->num_rows > 0) ? $latest->fetch_assoc() : null;
    
    // Get history for the date
    $history = $db->query("
        SELECT latitude, longitude, accuracy, address_text, source, battery_level, recorded_at
        FROM location_history
        WHERE child_id = $childId AND DATE(recorded_at) = '$date'
        ORDER BY recorded_at ASC
    ");
    
    $locations = [];
    if ($history) {
        while ($row = $history->fetch_assoc()) {
            $locations[] = $row;
        }
    }
    
    jsonResponse([
        'latest' => $latestLocation,
        'history' => $locations,
        'date' => $date
    ]);
}

/**
 * Check if child has entered/exited any geofences
 */
function checkGeofences(mysqli $db, int $childId, int $parentId, float $lat, float $lng): void {
    $result = $db->query("SELECT * FROM geofences WHERE child_id = $childId AND is_active = 1");
    
    if (!$result) return;
    
    while ($fence = $result->fetch_assoc()) {
        $distance = haversineDistance($lat, $lng, (float) $fence['latitude'], (float) $fence['longitude']);
        $isInside = $distance <= $fence['radius_meters'];
        
        // Get last event for this geofence
        $lastEvent = $db->query("
            SELECT event_type FROM geofence_events
            WHERE geofence_id = {$fence['id']} AND child_id = $childId
            ORDER BY occurred_at DESC LIMIT 1
        ");
        
        $wasInside = false;
        if ($lastEvent && $lastEvent->num_rows > 0) {
            $lastRow = $lastEvent->fetch_assoc();
            $wasInside = ($lastRow['event_type'] === 'enter');
        }
        
        $now = date('Y-m-d H:i:s');
        
        if ($isInside && !$wasInside && $fence['notify_on_enter']) {
            $db->query("
                INSERT INTO geofence_events (geofence_id, child_id, event_type, latitude, longitude, occurred_at)
                VALUES ({$fence['id']}, $childId, 'enter', $lat, $lng, '$now')
            ");
            createAlert($parentId, $childId, 'geofence_enter',
                "Entered: {$fence['name']}",
                "Child entered the safe zone '{$fence['name']}'"
            );
        } elseif (!$isInside && $wasInside && $fence['notify_on_exit']) {
            $db->query("
                INSERT INTO geofence_events (geofence_id, child_id, event_type, latitude, longitude, occurred_at)
                VALUES ({$fence['id']}, $childId, 'exit', $lat, $lng, '$now')
            ");
            createAlert($parentId, $childId, 'geofence_exit',
                "Left: {$fence['name']}",
                "Child left the safe zone '{$fence['name']}'"
            );
        }
    }
}

/**
 * Calculate distance between two lat/lng points in meters
 */
function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float {
    $earthRadius = 6371000; // meters
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLng / 2) * sin($dLng / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $earthRadius * $c;
}
