<?php
$pageTitle = 'Location History';
$extraHead = '<style>#map{height:450px;border-radius:12px;}</style>';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$selectedChildId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;
$selectedDate = sanitize($_GET['date'] ?? date('Y-m-d'));

$children = [];
$result = $db->query("SELECT c.id, c.name FROM children c WHERE c.family_id = $familyId ORDER BY c.name");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
        if ($selectedChildId === 0) $selectedChildId = (int) $row['id'];
    }
}

// Get location history for selected child and date
$history = [];
if ($selectedChildId > 0) {
    $histResult = $db->query("
        SELECT latitude, longitude, accuracy, address_text, source, battery_level, recorded_at
        FROM location_history
        WHERE child_id = $selectedChildId AND DATE(recorded_at) = '$selectedDate'
        ORDER BY recorded_at ASC
    ");
    if ($histResult) {
        while ($row = $histResult->fetch_assoc()) {
            $history[] = $row;
        }
    }
}

$historyJson = json_encode($history);
?>

<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-route"></i> Location History</h3>
        <div style="display:flex; gap:12px; align-items:center;">
            <select class="form-control" style="width:180px;" id="childSelect">
                <?php foreach ($children as $c): ?>
                    <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($c['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <input type="date" class="form-control" style="width:180px;" id="dateSelect" value="<?= $selectedDate ?>">
            <button class="btn btn-primary btn-sm" onclick="applyFilter()">
                <i class="fas fa-search"></i> View
            </button>
        </div>
    </div>
    
    <div id="map"></div>
    
    <p style="margin-top:12px; font-size:14px; color:var(--gray);">
        <i class="fas fa-info-circle"></i> Showing <?= count($history) ?> location points for <?= $selectedDate ?>
    </p>
    
    <?php if (!empty($history)): ?>
    <div class="table-responsive" style="margin-top:16px; max-height:300px; overflow-y:auto;">
        <table>
            <thead>
                <tr><th>Time</th><th>Location</th><th>Accuracy</th><th>Battery</th><th>Source</th></tr>
            </thead>
            <tbody>
                <?php foreach ($history as $loc): ?>
                <tr>
                    <td><?= date('h:i A', strtotime($loc['recorded_at'])) ?></td>
                    <td><?= htmlspecialchars($loc['address_text'] ?: number_format($loc['latitude'], 5) . ', ' . number_format($loc['longitude'], 5)) ?></td>
                    <td><?= $loc['accuracy'] ? round($loc['accuracy']) . 'm' : '-' ?></td>
                    <td><?= $loc['battery_level'] !== null ? $loc['battery_level'] . '%' : '-' ?></td>
                    <td><span class="badge badge-info"><?= $loc['source'] ?></span></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php
$extraScripts = <<<SCRIPT
<script>
var history = $historyJson;

function applyFilter() {
    var childId = document.getElementById('childSelect').value;
    var date = document.getElementById('dateSelect').value;
    window.location.href = '/safechild/admin/location/history.php?child_id=' + childId + '&date=' + date;
}

var mapLink = document.createElement('link');
mapLink.rel = 'stylesheet';
mapLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(mapLink);

var s = document.createElement('script');
s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
s.onload = function() {
    var defaultLat = 28.6139, defaultLng = 77.2090;
    if (history.length > 0) {
        defaultLat = parseFloat(history[0].latitude);
        defaultLng = parseFloat(history[0].longitude);
    }
    
    var map = L.map('map').setView([defaultLat, defaultLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    
    if (history.length > 0) {
        var points = history.map(function(h) { return [parseFloat(h.latitude), parseFloat(h.longitude)]; });
        
        // Draw path
        L.polyline(points, {color: '#4F46E5', weight: 3, opacity: 0.7}).addTo(map);
        
        // Start marker (green)
        L.circleMarker(points[0], {radius: 10, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8})
            .addTo(map).bindPopup('Start: ' + history[0].recorded_at);
        
        // End marker (red)
        var last = history[history.length - 1];
        L.circleMarker(points[points.length - 1], {radius: 10, color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.8})
            .addTo(map).bindPopup('Latest: ' + last.recorded_at);
        
        // Intermediate points
        history.forEach(function(h, i) {
            if (i > 0 && i < history.length - 1) {
                L.circleMarker([parseFloat(h.latitude), parseFloat(h.longitude)], {
                    radius: 4, color: '#4F46E5', fillColor: '#4F46E5', fillOpacity: 0.5
                }).addTo(map).bindPopup(h.recorded_at + (h.address_text ? '<br>' + h.address_text : ''));
            }
        });
        
        map.fitBounds(points, {padding: [40, 40]});
    }
};
document.head.appendChild(s);
</script>
SCRIPT;
require_once __DIR__ . '/../includes/footer.php';
?>
