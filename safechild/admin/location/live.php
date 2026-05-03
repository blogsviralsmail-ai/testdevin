<?php
$pageTitle = 'Live Location';
$extraHead = '<style>#map{height:500px;border-radius:12px;}</style>';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

// Get all children
$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$selectedChildId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;

$children = [];
$result = $db->query("
    SELECT c.id, c.name FROM children c
    WHERE c.family_id = $familyId ORDER BY c.name
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
    }
}

// Get latest locations for all/selected children
$whereChild = $selectedChildId > 0 ? "AND lh.child_id = $selectedChildId" : "";
$locations = [];
$locResult = $db->query("
    SELECT lh.*, c.name as child_name
    FROM location_history lh
    JOIN children c ON lh.child_id = c.id
    JOIN families f ON c.family_id = f.id
    WHERE f.parent_id = $parentId $whereChild
    AND lh.id IN (
        SELECT MAX(id) FROM location_history GROUP BY child_id
    )
    ORDER BY lh.recorded_at DESC
");
if ($locResult) {
    while ($row = $locResult->fetch_assoc()) {
        $locations[] = $row;
    }
}

$locationsJson = json_encode($locations);
?>

<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-map-marker-alt"></i> Live Location</h3>
        <div style="display:flex; gap:12px; align-items:center;">
            <select class="form-control" style="width:200px;" onchange="filterChild(this.value)">
                <option value="0">All Children</option>
                <?php foreach ($children as $c): ?>
                    <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($c['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <button class="btn btn-outline btn-sm" onclick="refreshLocations()">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>
    </div>
    
    <div id="map"></div>
    
    <?php if (!empty($locations)): ?>
    <div style="margin-top:16px;">
        <table>
            <thead>
                <tr><th>Child</th><th>Location</th><th>Accuracy</th><th>Battery</th><th>Last Updated</th></tr>
            </thead>
            <tbody>
                <?php foreach ($locations as $loc): ?>
                <tr>
                    <td><strong><?= htmlspecialchars($loc['child_name']) ?></strong></td>
                    <td>
                        <?= htmlspecialchars($loc['address_text'] ?: number_format($loc['latitude'], 5) . ', ' . number_format($loc['longitude'], 5)) ?>
                    </td>
                    <td><?= $loc['accuracy'] ? round($loc['accuracy']) . 'm' : 'N/A' ?></td>
                    <td>
                        <?php if ($loc['battery_level'] !== null): ?>
                            <i class="fas fa-battery-<?= $loc['battery_level'] > 75 ? 'full' : ($loc['battery_level'] > 50 ? 'three-quarters' : ($loc['battery_level'] > 25 ? 'half' : 'quarter')) ?>" 
                               style="color:<?= $loc['battery_level'] > 25 ? 'var(--success)' : 'var(--danger)' ?>"></i>
                            <?= $loc['battery_level'] ?>%
                        <?php else: ?>
                            N/A
                        <?php endif; ?>
                    </td>
                    <td><?= timeAgo($loc['recorded_at']) ?></td>
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
var locations = $locationsJson;

function filterChild(childId) {
    var url = '/safechild/admin/location/live.php';
    if (childId > 0) url += '?child_id=' + childId;
    window.location.href = url;
}

function refreshLocations() {
    window.location.reload();
}

// Initialize map (using Leaflet - free, no API key needed)
var mapScript = document.createElement('link');
mapScript.rel = 'stylesheet';
mapScript.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(mapScript);

var s = document.createElement('script');
s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
s.onload = function() {
    var defaultLat = 28.6139;
    var defaultLng = 77.2090;
    
    if (locations.length > 0) {
        defaultLat = parseFloat(locations[0].latitude);
        defaultLng = parseFloat(locations[0].longitude);
    }
    
    var map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    locations.forEach(function(loc) {
        var marker = L.marker([parseFloat(loc.latitude), parseFloat(loc.longitude)]).addTo(map);
        var popup = '<strong>' + loc.child_name + '</strong><br>' +
                    (loc.address_text || loc.latitude + ', ' + loc.longitude) + '<br>' +
                    '<small>Updated: ' + loc.recorded_at + '</small>';
        if (loc.battery_level) popup += '<br>Battery: ' + loc.battery_level + '%';
        marker.bindPopup(popup);
    });
    
    if (locations.length > 1) {
        var bounds = locations.map(function(l) { return [parseFloat(l.latitude), parseFloat(l.longitude)]; });
        map.fitBounds(bounds, {padding: [50, 50]});
    }
};
document.head.appendChild(s);

// Auto refresh every 60 seconds
setInterval(function() { window.location.reload(); }, 60000);
</script>
SCRIPT;
require_once __DIR__ . '/../includes/footer.php';
?>
