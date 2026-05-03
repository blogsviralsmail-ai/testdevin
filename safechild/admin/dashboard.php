<?php
/**
 * SafeChild Admin - Main Dashboard
 */
$pageTitle = 'Dashboard';
require_once __DIR__ . '/includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

// Get family
$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$family = $familyResult ? $familyResult->fetch_assoc() : null;
$familyId = $family ? (int) $family['id'] : 0;

// Get children count
$childrenResult = $db->query("SELECT COUNT(*) as cnt FROM children WHERE family_id = $familyId");
$childrenCount = ($childrenResult && $row = $childrenResult->fetch_assoc()) ? (int) $row['cnt'] : 0;

// Get devices count & online
$devicesResult = $db->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 1 ELSE 0 END) as online
    FROM child_devices cd
    JOIN children c ON cd.child_id = c.id
    WHERE c.family_id = $familyId AND cd.is_active = 1
");
$devices = ($devicesResult && $row = $devicesResult->fetch_assoc()) ? $row : ['total' => 0, 'online' => 0];

// Get today's screen time across all children
$today = date('Y-m-d');
$screenTimeResult = $db->query("
    SELECT COALESCE(SUM(total_minutes), 0) as total_min
    FROM screen_time_logs stl
    JOIN children c ON stl.child_id = c.id
    WHERE c.family_id = $familyId AND stl.date = '$today'
");
$totalScreenTime = ($screenTimeResult && $row = $screenTimeResult->fetch_assoc()) ? (int) $row['total_min'] : 0;

// Get unread alerts
$alertsResult = $db->query("SELECT COUNT(*) as cnt FROM parent_alerts WHERE parent_id = $parentId AND is_read = 0");
$unreadCount = ($alertsResult && $row = $alertsResult->fetch_assoc()) ? (int) $row['cnt'] : 0;

// Get children with their device status
$children = [];
$childrenList = $db->query("
    SELECT c.*, cd.device_name, cd.last_seen, cd.model, cd.is_active as device_active,
           cd.device_id
    FROM children c
    LEFT JOIN child_devices cd ON c.id = cd.child_id AND cd.is_active = 1
    WHERE c.family_id = $familyId
    ORDER BY c.name ASC
");
if ($childrenList) {
    while ($row = $childrenList->fetch_assoc()) {
        $children[] = $row;
    }
}

// Get recent alerts
$recentAlerts = [];
$alertsList = $db->query("
    SELECT pa.*, c.name as child_name
    FROM parent_alerts pa
    JOIN children c ON pa.child_id = c.id
    WHERE pa.parent_id = $parentId
    ORDER BY pa.created_at DESC LIMIT 10
");
if ($alertsList) {
    while ($row = $alertsList->fetch_assoc()) {
        $recentAlerts[] = $row;
    }
}
?>

<!-- Stats -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-child"></i></div>
        <div class="stat-info">
            <h4><?= $childrenCount ?></h4>
            <p>Children</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-mobile-alt"></i></div>
        <div class="stat-info">
            <h4><?= $devices['online'] ?>/<?= $devices['total'] ?></h4>
            <p>Devices Online</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon yellow"><i class="fas fa-clock"></i></div>
        <div class="stat-info">
            <h4><?= floor($totalScreenTime / 60) ?>h <?= $totalScreenTime % 60 ?>m</h4>
            <p>Screen Time Today</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-bell"></i></div>
        <div class="stat-info">
            <h4><?= $unreadCount ?></h4>
            <p>Unread Alerts</p>
        </div>
    </div>
</div>

<!-- Children Cards -->
<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-child"></i> My Children</h3>
        <a href="/safechild/admin/children/add.php" class="btn btn-primary btn-sm">
            <i class="fas fa-plus"></i> Add Child
        </a>
    </div>
    
    <?php if (empty($children)): ?>
        <div class="empty-state">
            <i class="fas fa-child"></i>
            <h3>No children added yet</h3>
            <p>Add your first child to start monitoring</p>
            <a href="/safechild/admin/children/add.php" class="btn btn-primary" style="margin-top:16px;">
                <i class="fas fa-plus"></i> Add Child
            </a>
        </div>
    <?php else: ?>
        <div class="grid-3">
            <?php foreach ($children as $child): 
                $isOnline = $child['last_seen'] && strtotime($child['last_seen']) >= strtotime('-10 minutes');
            ?>
            <div class="child-card">
                <div class="avatar"><?= strtoupper(substr($child['name'], 0, 1)) ?></div>
                <h3><?= htmlspecialchars($child['name']) ?></h3>
                <?php if ($child['age']): ?>
                    <p style="font-size:13px; color:var(--gray);">Age: <?= $child['age'] ?></p>
                <?php endif; ?>
                
                <?php if ($child['device_name']): ?>
                    <div class="device-status" style="margin-top:8px;">
                        <span class="status-dot <?= $isOnline ? 'online' : 'offline' ?>"></span>
                        <?= $isOnline ? 'Online' : 'Offline' ?>
                        <?php if ($child['last_seen']): ?>
                            <br><small><?= timeAgo($child['last_seen']) ?></small>
                        <?php endif; ?>
                    </div>
                    <p style="font-size:12px; color:var(--gray); margin-top:4px;">
                        <?= htmlspecialchars($child['device_name'] ?? $child['model'] ?? '') ?>
                    </p>
                <?php else: ?>
                    <div class="device-status" style="margin-top:8px;">
                        <span class="badge badge-warning">No device paired</span>
                    </div>
                <?php endif; ?>
                
                <div class="child-actions">
                    <a href="/safechild/admin/location/live.php?child_id=<?= $child['id'] ?>" class="btn btn-sm btn-outline">
                        <i class="fas fa-map-marker-alt"></i> Location
                    </a>
                    <a href="/safechild/admin/children/view.php?id=<?= $child['id'] ?>" class="btn btn-sm btn-outline">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <?php if (!$child['device_name']): ?>
                        <a href="/safechild/admin/children/pair.php?child_id=<?= $child['id'] ?>" class="btn btn-sm btn-primary">
                            <i class="fas fa-link"></i> Pair Device
                        </a>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<!-- Recent Alerts -->
<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-bell"></i> Recent Alerts</h3>
        <a href="/safechild/admin/alerts/list.php" class="btn btn-outline btn-sm">View All</a>
    </div>
    
    <?php if (empty($recentAlerts)): ?>
        <div class="empty-state">
            <i class="fas fa-bell-slash"></i>
            <h3>No alerts yet</h3>
            <p>Alerts will appear here when events are detected</p>
        </div>
    <?php else: ?>
        <?php foreach ($recentAlerts as $alert): 
            $alertIcons = [
                'geofence_exit' => ['fas fa-sign-out-alt', 'red'],
                'geofence_enter' => ['fas fa-sign-in-alt', 'green'],
                'screen_time_exceeded' => ['fas fa-clock', 'yellow'],
                'bedtime_violation' => ['fas fa-moon', 'purple'],
                'blocked_app_attempt' => ['fas fa-ban', 'red'],
                'blocked_site_attempt' => ['fas fa-globe', 'red'],
                'new_app_installed' => ['fas fa-download', 'blue'],
                'sos_triggered' => ['fas fa-exclamation-triangle', 'red'],
                'device_offline' => ['fas fa-wifi', 'yellow'],
                'low_battery' => ['fas fa-battery-quarter', 'yellow'],
                'location_permission_disabled' => ['fas fa-location-arrow', 'red'],
                'app_uninstalled' => ['fas fa-trash', 'red'],
            ];
            $icon = $alertIcons[$alert['alert_type']] ?? ['fas fa-info-circle', 'blue'];
        ?>
        <div class="alert-item <?= !$alert['is_read'] ? 'unread' : '' ?>">
            <div class="alert-icon stat-icon <?= $icon[1] ?>" style="width:36px;height:36px;font-size:14px;">
                <i class="<?= $icon[0] ?>"></i>
            </div>
            <div class="alert-content">
                <h4><?= htmlspecialchars($alert['title']) ?></h4>
                <p><?= htmlspecialchars($alert['child_name']) ?> &mdash; <?= htmlspecialchars($alert['message'] ?? '') ?></p>
            </div>
            <span class="alert-time"><?= timeAgo($alert['created_at']) ?></span>
        </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
