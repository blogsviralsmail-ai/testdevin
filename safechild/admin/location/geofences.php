<?php
$pageTitle = 'Safe Zones';
$extraHead = '<style>#map{height:400px;border-radius:12px;}</style>';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$selectedChildId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;

$children = [];
$result = $db->query("SELECT c.id, c.name FROM children c WHERE c.family_id = $familyId ORDER BY c.name");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
        if ($selectedChildId === 0) $selectedChildId = (int) $row['id'];
    }
}

$error = '';
$success = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $name = sanitize($_POST['name'] ?? '');
        $lat = (float) ($_POST['latitude'] ?? 0);
        $lng = (float) ($_POST['longitude'] ?? 0);
        $radius = (int) ($_POST['radius_meters'] ?? 200);
        $cId = (int) ($_POST['child_id'] ?? 0);
        
        if (empty($name) || $lat == 0 || $lng == 0) {
            $error = 'Name and location are required';
        } else {
            $db->query("
                INSERT INTO geofences (child_id, name, latitude, longitude, radius_meters)
                VALUES ($cId, '$name', $lat, $lng, $radius)
            ");
            $success = "Safe zone '$name' added!";
            logAudit($parentId, 'geofence_added', 'geofences', $db->insert_id, $name);
        }
    } elseif ($action === 'delete') {
        $fenceId = (int) ($_POST['fence_id'] ?? 0);
        $db->query("DELETE FROM geofences WHERE id = $fenceId AND child_id = $selectedChildId");
        $success = 'Safe zone removed';
    } elseif ($action === 'toggle') {
        $fenceId = (int) ($_POST['fence_id'] ?? 0);
        $db->query("UPDATE geofences SET is_active = NOT is_active WHERE id = $fenceId AND child_id = $selectedChildId");
        $success = 'Safe zone updated';
    }
}

// Get geofences
$geofences = [];
if ($selectedChildId > 0) {
    $fResult = $db->query("SELECT * FROM geofences WHERE child_id = $selectedChildId ORDER BY name");
    if ($fResult) {
        while ($row = $fResult->fetch_assoc()) {
            $geofences[] = $row;
        }
    }
}
$geofencesJson = json_encode($geofences);
?>

<?php if ($error): ?><div class="error-message"><?= htmlspecialchars($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="success-message"><?= htmlspecialchars($success) ?></div><?php endif; ?>

<div class="grid-2">
    <!-- Map -->
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-draw-polygon"></i> Safe Zones Map</h3>
            <select class="form-control" style="width:180px;" onchange="window.location.href='/safechild/admin/location/geofences.php?child_id='+this.value">
                <?php foreach ($children as $c): ?>
                    <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($c['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>
        <div id="map"></div>
        <p style="margin-top:8px; font-size:13px; color:var(--gray);">
            <i class="fas fa-info-circle"></i> Click on the map to set location for new safe zone
        </p>
    </div>
    
    <!-- Add Form + List -->
    <div>
        <div class="card">
            <div class="card-header"><h3>Add Safe Zone</h3></div>
            <form method="POST">
                <input type="hidden" name="action" value="add">
                <input type="hidden" name="child_id" value="<?= $selectedChildId ?>">
                
                <div class="form-group">
                    <label>Zone Name</label>
                    <input type="text" name="name" class="form-control" placeholder="e.g., Home, School" required>
                </div>
                <div class="form-group">
                    <label>Latitude</label>
                    <input type="number" name="latitude" id="lat_input" class="form-control" step="0.000001" required>
                </div>
                <div class="form-group">
                    <label>Longitude</label>
                    <input type="number" name="longitude" id="lng_input" class="form-control" step="0.000001" required>
                </div>
                <div class="form-group">
                    <label>Radius (meters)</label>
                    <input type="number" name="radius_meters" class="form-control" value="200" min="50" max="5000">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">
                    <i class="fas fa-plus"></i> Add Safe Zone
                </button>
            </form>
        </div>
        
        <div class="card">
            <div class="card-header"><h3>Existing Zones</h3></div>
            <?php if (empty($geofences)): ?>
                <p style="color:var(--gray); text-align:center; padding:16px;">No safe zones set</p>
            <?php else: ?>
                <?php foreach ($geofences as $fence): ?>
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
                    <div>
                        <strong><?= htmlspecialchars($fence['name']) ?></strong>
                        <br><small style="color:var(--gray);">Radius: <?= $fence['radius_meters'] ?>m</small>
                        <span class="badge <?= $fence['is_active'] ? 'badge-success' : 'badge-warning' ?>" style="margin-left:8px;">
                            <?= $fence['is_active'] ? 'Active' : 'Disabled' ?>
                        </span>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <form method="POST" style="display:inline;">
                            <input type="hidden" name="action" value="toggle">
                            <input type="hidden" name="fence_id" value="<?= $fence['id'] ?>">
                            <button type="submit" class="btn btn-sm btn-outline" title="Toggle">
                                <i class="fas fa-power-off"></i>
                            </button>
                        </form>
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this safe zone?')">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="fence_id" value="<?= $fence['id'] ?>">
                            <button type="submit" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php
$extraScripts = <<<SCRIPT
<script>
var geofences = $geofencesJson;

var mapLink = document.createElement('link');
mapLink.rel = 'stylesheet';
mapLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(mapLink);

var s = document.createElement('script');
s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
s.onload = function() {
    var defaultLat = 28.6139, defaultLng = 77.2090;
    if (geofences.length > 0) {
        defaultLat = parseFloat(geofences[0].latitude);
        defaultLng = parseFloat(geofences[0].longitude);
    }
    
    var map = L.map('map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    
    geofences.forEach(function(f) {
        var color = f.is_active == 1 ? '#10B981' : '#9CA3AF';
        L.circle([parseFloat(f.latitude), parseFloat(f.longitude)], {
            radius: parseInt(f.radius_meters),
            color: color, fillColor: color, fillOpacity: 0.15
        }).addTo(map).bindPopup('<strong>' + f.name + '</strong><br>Radius: ' + f.radius_meters + 'm');
        
        L.marker([parseFloat(f.latitude), parseFloat(f.longitude)]).addTo(map).bindPopup(f.name);
    });
    
    map.on('click', function(e) {
        document.getElementById('lat_input').value = e.latlng.lat.toFixed(6);
        document.getElementById('lng_input').value = e.latlng.lng.toFixed(6);
    });
    
    if (geofences.length > 1) {
        var bounds = geofences.map(function(f) { return [parseFloat(f.latitude), parseFloat(f.longitude)]; });
        map.fitBounds(bounds, {padding: [50, 50]});
    }
};
document.head.appendChild(s);
</script>
SCRIPT;
require_once __DIR__ . '/../includes/footer.php';
?>
