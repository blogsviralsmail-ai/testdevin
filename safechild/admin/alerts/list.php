<?php
$pageTitle = 'Alerts';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

// Mark all as read if requested
if (isset($_GET['mark_read'])) {
    $db->query("UPDATE parent_alerts SET is_read = 1 WHERE parent_id = $parentId AND is_read = 0");
    header('Location: /safechild/admin/alerts/list.php');
    exit;
}

// Mark single as read
if (isset($_GET['read_id'])) {
    $readId = (int) $_GET['read_id'];
    $db->query("UPDATE parent_alerts SET is_read = 1 WHERE id = $readId AND parent_id = $parentId");
}

$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$perPage = 20;
$offset = ($page - 1) * $perPage;

// Filter
$filterType = sanitize($_GET['type'] ?? '');
$whereType = !empty($filterType) ? "AND alert_type = '$filterType'" : "";

$totalResult = $db->query("SELECT COUNT(*) as cnt FROM parent_alerts WHERE parent_id = $parentId $whereType");
$total = ($totalResult && $row = $totalResult->fetch_assoc()) ? (int) $row['cnt'] : 0;
$totalPages = ceil($total / $perPage);

$alerts = [];
$result = $db->query("
    SELECT pa.*, c.name as child_name
    FROM parent_alerts pa
    JOIN children c ON pa.child_id = c.id
    WHERE pa.parent_id = $parentId $whereType
    ORDER BY pa.created_at DESC
    LIMIT $perPage OFFSET $offset
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $alerts[] = $row;
    }
}

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
?>

<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-bell"></i> All Alerts (<?= $total ?>)</h3>
        <div style="display:flex; gap:8px;">
            <select class="form-control" style="width:180px;" onchange="window.location.href='/safechild/admin/alerts/list.php?type='+this.value">
                <option value="">All Types</option>
                <option value="sos_triggered" <?= $filterType === 'sos_triggered' ? 'selected' : '' ?>>SOS</option>
                <option value="geofence_exit" <?= $filterType === 'geofence_exit' ? 'selected' : '' ?>>Geofence Exit</option>
                <option value="screen_time_exceeded" <?= $filterType === 'screen_time_exceeded' ? 'selected' : '' ?>>Screen Time</option>
                <option value="new_app_installed" <?= $filterType === 'new_app_installed' ? 'selected' : '' ?>>New App</option>
                <option value="low_battery" <?= $filterType === 'low_battery' ? 'selected' : '' ?>>Low Battery</option>
            </select>
            <a href="/safechild/admin/alerts/list.php?mark_read=1" class="btn btn-outline btn-sm">
                <i class="fas fa-check-double"></i> Mark All Read
            </a>
        </div>
    </div>
    
    <?php if (empty($alerts)): ?>
        <div class="empty-state">
            <i class="fas fa-bell-slash"></i>
            <h3>No alerts</h3>
        </div>
    <?php else: ?>
        <?php foreach ($alerts as $alert):
            $icon = $alertIcons[$alert['alert_type']] ?? ['fas fa-info-circle', 'blue'];
        ?>
        <div class="alert-item <?= !$alert['is_read'] ? 'unread' : '' ?>">
            <div class="alert-icon stat-icon <?= $icon[1] ?>" style="width:40px;height:40px;font-size:16px;">
                <i class="<?= $icon[0] ?>"></i>
            </div>
            <div class="alert-content" style="flex:1;">
                <h4>
                    <?= htmlspecialchars($alert['title']) ?>
                    <?php if (!$alert['is_read']): ?>
                        <span class="badge badge-danger" style="font-size:10px;">New</span>
                    <?php endif; ?>
                </h4>
                <p>
                    <strong><?= htmlspecialchars($alert['child_name']) ?></strong>
                    &mdash; <?= htmlspecialchars($alert['message'] ?? '') ?>
                </p>
            </div>
            <div style="text-align:right;">
                <span class="alert-time"><?= timeAgo($alert['created_at']) ?></span>
                <?php if (!$alert['is_read']): ?>
                    <br><a href="?read_id=<?= $alert['id'] ?>" style="font-size:12px;">Mark read</a>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
        
        <!-- Pagination -->
        <?php if ($totalPages > 1): ?>
        <div style="display:flex; justify-content:center; gap:8px; padding:20px 0;">
            <?php if ($page > 1): ?>
                <a href="?page=<?= $page-1 ?>&type=<?= $filterType ?>" class="btn btn-outline btn-sm">Previous</a>
            <?php endif; ?>
            <span style="padding:8px; color:var(--gray);">Page <?= $page ?> of <?= $totalPages ?></span>
            <?php if ($page < $totalPages): ?>
                <a href="?page=<?= $page+1 ?>&type=<?= $filterType ?>" class="btn btn-outline btn-sm">Next</a>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
