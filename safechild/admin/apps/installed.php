<?php
$pageTitle = 'Installed Apps';
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

$success = '';

// Handle block/unblock
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $packageName = sanitize($_POST['package_name'] ?? '');
    
    if ($action === 'block' && !empty($packageName)) {
        $existing = $db->query("SELECT id FROM app_block_rules WHERE child_id = $selectedChildId AND package_name = '$packageName'");
        if (!$existing || $existing->num_rows === 0) {
            $db->query("INSERT INTO app_block_rules (child_id, package_name, block_type) VALUES ($selectedChildId, '$packageName', 'always')");
        }
        $db->query("UPDATE child_apps SET is_blocked = 1 WHERE child_id = $selectedChildId AND package_name = '$packageName'");
        $success = 'App blocked';
        logAudit($parentId, 'app_blocked', 'child_apps', 0, $packageName);
    } elseif ($action === 'unblock' && !empty($packageName)) {
        $db->query("DELETE FROM app_block_rules WHERE child_id = $selectedChildId AND package_name = '$packageName'");
        $db->query("UPDATE child_apps SET is_blocked = 0 WHERE child_id = $selectedChildId AND package_name = '$packageName'");
        $success = 'App unblocked';
        logAudit($parentId, 'app_unblocked', 'child_apps', 0, $packageName);
    }
}

// Get apps
$apps = [];
if ($selectedChildId > 0) {
    $appsResult = $db->query("
        SELECT ca.*, abr.id as rule_id
        FROM child_apps ca
        LEFT JOIN app_block_rules abr ON ca.package_name = abr.package_name AND abr.child_id = $selectedChildId AND abr.is_active = 1
        WHERE ca.child_id = $selectedChildId AND ca.is_system_app = 0
        ORDER BY ca.app_name ASC
    ");
    if ($appsResult) {
        while ($row = $appsResult->fetch_assoc()) {
            $apps[] = $row;
        }
    }
}
?>

<?php if ($success): ?><div class="success-message"><?= htmlspecialchars($success) ?></div><?php endif; ?>

<div class="card">
    <div class="card-header">
        <h3><i class="fas fa-th-large"></i> Installed Apps</h3>
        <select class="form-control" style="width:200px;" onchange="window.location.href='/safechild/admin/apps/installed.php?child_id='+this.value">
            <?php foreach ($children as $c): ?>
                <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                    <?= htmlspecialchars($c['name']) ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>
    
    <?php if (empty($apps)): ?>
        <div class="empty-state">
            <i class="fas fa-th-large"></i>
            <h3>No apps synced yet</h3>
            <p>Apps will appear here once the child's device syncs</p>
        </div>
    <?php else: ?>
    <div class="table-responsive">
        <table>
            <thead>
                <tr><th>App Name</th><th>Package</th><th>Category</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
                <?php foreach ($apps as $app): ?>
                <tr>
                    <td><strong><?= htmlspecialchars($app['app_name']) ?></strong></td>
                    <td><small style="color:var(--gray);"><?= htmlspecialchars($app['package_name']) ?></small></td>
                    <td><?= htmlspecialchars($app['category'] ?? '-') ?></td>
                    <td>
                        <?php if ($app['rule_id']): ?>
                            <span class="badge badge-danger">Blocked</span>
                        <?php else: ?>
                            <span class="badge badge-success">Allowed</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <form method="POST" style="display:inline;">
                            <input type="hidden" name="package_name" value="<?= htmlspecialchars($app['package_name']) ?>">
                            <?php if ($app['rule_id']): ?>
                                <input type="hidden" name="action" value="unblock">
                                <button type="submit" class="btn btn-sm btn-success">
                                    <i class="fas fa-check"></i> Unblock
                                </button>
                            <?php else: ?>
                                <input type="hidden" name="action" value="block">
                                <button type="submit" class="btn btn-sm btn-danger">
                                    <i class="fas fa-ban"></i> Block
                                </button>
                            <?php endif; ?>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <p style="margin-top:12px; font-size:13px; color:var(--gray);">
        Total: <?= count($apps) ?> apps | Blocked: <?= count(array_filter($apps, function($a) { return $a['rule_id']; })) ?>
    </p>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
