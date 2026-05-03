<?php
$pageTitle = 'My Children';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$family = $familyResult ? $familyResult->fetch_assoc() : null;
$familyId = $family ? (int) $family['id'] : 0;

$children = [];
$result = $db->query("
    SELECT c.*, cd.device_name, cd.model, cd.last_seen, cd.device_id, cd.paired_at,
           cd.android_version, cd.app_version
    FROM children c
    LEFT JOIN child_devices cd ON c.id = cd.child_id AND cd.is_active = 1
    WHERE c.family_id = $familyId
    ORDER BY c.name ASC
");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
    }
}
?>

<div class="card">
    <div class="card-header">
        <h3>All Children</h3>
        <a href="/safechild/admin/children/add.php" class="btn btn-primary btn-sm">
            <i class="fas fa-plus"></i> Add Child
        </a>
    </div>
    
    <?php if (empty($children)): ?>
        <div class="empty-state">
            <i class="fas fa-child"></i>
            <h3>No children added yet</h3>
            <p>Add your first child profile to get started</p>
        </div>
    <?php else: ?>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($children as $child): 
                    $isOnline = $child['last_seen'] && strtotime($child['last_seen']) >= strtotime('-10 minutes');
                ?>
                <tr>
                    <td>
                        <strong><?= htmlspecialchars($child['name']) ?></strong>
                    </td>
                    <td><?= $child['age'] ?: 'N/A' ?></td>
                    <td>
                        <?php if ($child['device_name']): ?>
                            <?= htmlspecialchars($child['device_name']) ?>
                            <br><small style="color:var(--gray)">Android <?= htmlspecialchars($child['android_version'] ?? '') ?></small>
                        <?php else: ?>
                            <span class="badge badge-warning">Not paired</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($child['device_id']): ?>
                            <span class="status-dot <?= $isOnline ? 'online' : 'offline' ?>"></span>
                            <?= $isOnline ? 'Online' : 'Offline' ?>
                        <?php else: ?>
                            -
                        <?php endif; ?>
                    </td>
                    <td><?= $child['last_seen'] ? timeAgo($child['last_seen']) : 'Never' ?></td>
                    <td>
                        <a href="/safechild/admin/children/view.php?id=<?= $child['id'] ?>" class="btn btn-sm btn-outline">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="/safechild/admin/location/live.php?child_id=<?= $child['id'] ?>" class="btn btn-sm btn-outline">
                            <i class="fas fa-map-marker-alt"></i>
                        </a>
                        <?php if (!$child['device_id']): ?>
                        <a href="/safechild/admin/children/pair.php?child_id=<?= $child['id'] ?>" class="btn btn-sm btn-primary">
                            <i class="fas fa-link"></i> Pair
                        </a>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
