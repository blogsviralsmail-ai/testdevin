<?php
$pageTitle = 'Child Details';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];
$childId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($childId === 0) {
    header('Location: /safechild/admin/children/list.php');
    exit;
}

// Get child with device info
$result = $db->query("
    SELECT c.*, cd.device_name, cd.model, cd.manufacturer, cd.android_version,
           cd.app_version, cd.last_seen, cd.paired_at, cd.device_id
    FROM children c
    JOIN families f ON c.family_id = f.id
    LEFT JOIN child_devices cd ON c.id = cd.child_id AND cd.is_active = 1
    WHERE c.id = $childId AND f.parent_id = $parentId
");

if (!$result || $result->num_rows === 0) {
    header('Location: /safechild/admin/children/list.php');
    exit;
}

$child = $result->fetch_assoc();
$isOnline = $child['last_seen'] && strtotime($child['last_seen']) >= strtotime('-10 minutes');

// Get latest location
$locResult = $db->query("
    SELECT * FROM location_history
    WHERE child_id = $childId
    ORDER BY recorded_at DESC LIMIT 1
");
$latestLocation = ($locResult && $locResult->num_rows > 0) ? $locResult->fetch_assoc() : null;

// Get today's screen time
$today = date('Y-m-d');
$stResult = $db->query("
    SELECT total_minutes, unlocks FROM screen_time_logs
    WHERE child_id = $childId AND date = '$today' LIMIT 1
");
$screenTime = ($stResult && $stResult->num_rows > 0) ? $stResult->fetch_assoc() : ['total_minutes' => 0, 'unlocks' => 0];

// Get top apps today
$topApps = [];
$appsResult = $db->query("
    SELECT app_name, usage_minutes, open_count
    FROM app_usage_stats
    WHERE child_id = $childId AND date = '$today'
    ORDER BY usage_minutes DESC LIMIT 5
");
if ($appsResult) {
    while ($row = $appsResult->fetch_assoc()) {
        $topApps[] = $row;
    }
}

// Recent alerts
$alerts = [];
$alertsResult = $db->query("
    SELECT * FROM parent_alerts
    WHERE child_id = $childId
    ORDER BY created_at DESC LIMIT 5
");
if ($alertsResult) {
    while ($row = $alertsResult->fetch_assoc()) {
        $alerts[] = $row;
    }
}
?>

<div style="margin-bottom:20px;">
    <a href="/safechild/admin/children/list.php" class="btn btn-outline btn-sm">
        <i class="fas fa-arrow-left"></i> Back to Children
    </a>
</div>

<!-- Child Info Card -->
<div class="card">
    <div style="display:flex; align-items:center; gap:20px;">
        <div class="avatar" style="width:80px;height:80px;font-size:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;">
            <?= strtoupper(substr($child['name'], 0, 1)) ?>
        </div>
        <div>
            <h2><?= htmlspecialchars($child['name']) ?></h2>
            <?php if ($child['age']): ?>
                <p style="color:var(--gray);">Age: <?= $child['age'] ?></p>
            <?php endif; ?>
            <?php if ($child['device_name']): ?>
                <p style="font-size:14px; margin-top:4px;">
                    <span class="status-dot <?= $isOnline ? 'online' : 'offline' ?>"></span>
                    <?= htmlspecialchars($child['device_name']) ?> 
                    (<?= htmlspecialchars($child['manufacturer'] ?? '') ?> <?= htmlspecialchars($child['model'] ?? '') ?>)
                    &mdash; Android <?= htmlspecialchars($child['android_version'] ?? '') ?>
                </p>
                <p style="font-size:13px; color:var(--gray);">
                    Last seen: <?= $child['last_seen'] ? timeAgo($child['last_seen']) : 'Never' ?>
                    | Paired: <?= $child['paired_at'] ? formatDate($child['paired_at']) : 'Not paired' ?>
                </p>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Quick Stats -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-map-marker-alt"></i></div>
        <div class="stat-info">
            <h4><?= $latestLocation ? number_format($latestLocation['latitude'], 4) . ', ' . number_format($latestLocation['longitude'], 4) : 'N/A' ?></h4>
            <p>Latest Location</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon yellow"><i class="fas fa-clock"></i></div>
        <div class="stat-info">
            <h4><?= floor($screenTime['total_minutes'] / 60) ?>h <?= $screenTime['total_minutes'] % 60 ?>m</h4>
            <p>Screen Time Today</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-unlock"></i></div>
        <div class="stat-info">
            <h4><?= $screenTime['unlocks'] ?></h4>
            <p>Unlocks Today</p>
        </div>
    </div>
</div>

<!-- Grid: Top Apps + Recent Alerts -->
<div class="grid-2">
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-th-large"></i> Top Apps Today</h3>
            <a href="/safechild/admin/apps/usage.php?child_id=<?= $childId ?>" class="btn btn-outline btn-sm">View All</a>
        </div>
        <?php if (empty($topApps)): ?>
            <p style="color:var(--gray); text-align:center; padding:20px;">No app usage data yet</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr><th>App</th><th>Time</th><th>Opens</th></tr>
                </thead>
                <tbody>
                    <?php foreach ($topApps as $app): ?>
                    <tr>
                        <td><?= htmlspecialchars($app['app_name']) ?></td>
                        <td><?= $app['usage_minutes'] ?> min</td>
                        <td><?= $app['open_count'] ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-bell"></i> Recent Alerts</h3>
        </div>
        <?php if (empty($alerts)): ?>
            <p style="color:var(--gray); text-align:center; padding:20px;">No alerts</p>
        <?php else: ?>
            <?php foreach ($alerts as $alert): ?>
            <div class="alert-item">
                <div class="alert-content">
                    <h4><?= htmlspecialchars($alert['title']) ?></h4>
                    <p><?= htmlspecialchars($alert['message'] ?? '') ?></p>
                </div>
                <span class="alert-time"><?= timeAgo($alert['created_at']) ?></span>
            </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Quick Actions -->
<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/safechild/admin/location/live.php?child_id=<?= $childId ?>" class="btn btn-primary">
            <i class="fas fa-map-marker-alt"></i> Live Location
        </a>
        <a href="/safechild/admin/screentime/overview.php?child_id=<?= $childId ?>" class="btn btn-warning">
            <i class="fas fa-clock"></i> Screen Time Rules
        </a>
        <a href="/safechild/admin/apps/installed.php?child_id=<?= $childId ?>" class="btn btn-info" style="background:var(--info);color:white;">
            <i class="fas fa-th-large"></i> Manage Apps
        </a>
        <a href="/safechild/admin/location/geofences.php?child_id=<?= $childId ?>" class="btn btn-success">
            <i class="fas fa-draw-polygon"></i> Safe Zones
        </a>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
