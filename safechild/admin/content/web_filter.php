<?php
$pageTitle = 'Content Filter';
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

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add_filter') {
        $filterType = sanitize($_POST['filter_type'] ?? 'blocklist');
        $value = sanitize($_POST['value'] ?? '');
        
        if (!empty($value)) {
            $db->query("INSERT INTO website_filters (child_id, filter_type, value) VALUES ($selectedChildId, '$filterType', '$value')");
            $success = 'Filter added';
            logAudit($parentId, 'website_filter_added', 'website_filters', $db->insert_id, "$filterType: $value");
        }
    } elseif ($action === 'delete') {
        $filterId = (int) ($_POST['filter_id'] ?? 0);
        $db->query("DELETE FROM website_filters WHERE id = $filterId AND child_id = $selectedChildId");
        $success = 'Filter removed';
    }
}

// Get filters
$filters = [];
if ($selectedChildId > 0) {
    $fResult = $db->query("SELECT * FROM website_filters WHERE child_id = $selectedChildId ORDER BY filter_type, value");
    if ($fResult) {
        while ($row = $fResult->fetch_assoc()) {
            $filters[] = $row;
        }
    }
}

// Get recent web activity
$webActivity = [];
if ($selectedChildId > 0) {
    $waResult = $db->query("
        SELECT domain, category, SUM(visit_count) as visits, MAX(was_blocked) as was_blocked, date
        FROM web_activity_summary
        WHERE child_id = $selectedChildId
        GROUP BY domain, date
        ORDER BY date DESC, visits DESC
        LIMIT 20
    ");
    if ($waResult) {
        while ($row = $waResult->fetch_assoc()) {
            $webActivity[] = $row;
        }
    }
}
?>

<?php if ($success): ?><div class="success-message"><?= htmlspecialchars($success) ?></div><?php endif; ?>

<div style="margin-bottom:16px;">
    <select class="form-control" style="width:200px; display:inline-block;" onchange="window.location.href='/safechild/admin/content/web_filter.php?child_id='+this.value">
        <?php foreach ($children as $c): ?>
            <option value="<?= $c['id'] ?>" <?= $selectedChildId == $c['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($c['name']) ?>
            </option>
        <?php endforeach; ?>
    </select>
</div>

<div class="grid-2">
    <!-- Add Filter -->
    <div class="card">
        <div class="card-header"><h3><i class="fas fa-plus-circle"></i> Add Filter</h3></div>
        <form method="POST">
            <input type="hidden" name="action" value="add_filter">
            <div class="form-group">
                <label>Filter Type</label>
                <select name="filter_type" class="form-control">
                    <option value="blocklist">Block (Blocklist)</option>
                    <option value="allowlist">Allow Only (Allowlist)</option>
                    <option value="category">Block Category</option>
                </select>
            </div>
            <div class="form-group">
                <label>Domain or Category</label>
                <input type="text" name="value" class="form-control" placeholder="e.g., facebook.com or adult" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">
                <i class="fas fa-plus"></i> Add Filter
            </button>
        </form>
        
        <div style="margin-top:20px;">
            <h4 style="margin-bottom:12px;">Current Filters</h4>
            <?php if (empty($filters)): ?>
                <p style="color:var(--gray);">No filters set</p>
            <?php else: ?>
                <?php foreach ($filters as $f): ?>
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
                    <div>
                        <span class="badge <?= $f['filter_type'] === 'blocklist' ? 'badge-danger' : ($f['filter_type'] === 'allowlist' ? 'badge-success' : 'badge-warning') ?>">
                            <?= ucfirst($f['filter_type']) ?>
                        </span>
                        <strong style="margin-left:8px;"><?= htmlspecialchars($f['value']) ?></strong>
                    </div>
                    <form method="POST" style="display:inline;">
                        <input type="hidden" name="action" value="delete">
                        <input type="hidden" name="filter_id" value="<?= $f['id'] ?>">
                        <button type="submit" class="btn btn-sm btn-danger"><i class="fas fa-times"></i></button>
                    </form>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Recent Web Activity -->
    <div class="card">
        <div class="card-header"><h3><i class="fas fa-globe"></i> Recent Web Activity</h3></div>
        <?php if (empty($webActivity)): ?>
            <div class="empty-state">
                <i class="fas fa-globe"></i>
                <h3>No web activity data</h3>
                <p>Data will appear when device syncs</p>
            </div>
        <?php else: ?>
        <div class="table-responsive" style="max-height:400px; overflow-y:auto;">
            <table>
                <thead><tr><th>Domain</th><th>Visits</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    <?php foreach ($webActivity as $wa): ?>
                    <tr>
                        <td><?= htmlspecialchars($wa['domain']) ?></td>
                        <td><?= $wa['visits'] ?></td>
                        <td><?= $wa['date'] ?></td>
                        <td>
                            <span class="badge <?= $wa['was_blocked'] ? 'badge-danger' : 'badge-success' ?>">
                                <?= $wa['was_blocked'] ? 'Blocked' : 'Allowed' ?>
                            </span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
