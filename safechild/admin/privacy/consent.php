<?php
$pageTitle = 'Privacy & Data';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];

$familyResult = $db->query("SELECT id FROM families WHERE parent_id = $parentId LIMIT 1");
$familyId = ($familyResult && $row = $familyResult->fetch_assoc()) ? (int) $row['id'] : 0;

$success = '';
$error = '';

// Handle data deletion request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'delete_data') {
        $childId = (int) ($_POST['child_id'] ?? 0);
        $requestType = sanitize($_POST['request_type'] ?? 'child_data');
        
        $db->query("
            INSERT INTO data_deletion_requests (parent_id, child_id, request_type)
            VALUES ($parentId, $childId, '$requestType')
        ");
        
        // Actually delete data based on request type
        if ($requestType === 'child_data' && $childId > 0) {
            $db->query("DELETE FROM location_history WHERE child_id = $childId");
            $db->query("DELETE FROM screen_time_logs WHERE child_id = $childId");
            $db->query("DELETE FROM app_usage_stats WHERE child_id = $childId");
            $db->query("DELETE FROM contact_summary WHERE child_id = $childId");
            $db->query("DELETE FROM web_activity_summary WHERE child_id = $childId");
            $db->query("DELETE FROM parent_alerts WHERE child_id = $childId");
            
            $db->query("UPDATE data_deletion_requests SET status = 'completed', completed_at = NOW() WHERE parent_id = $parentId AND child_id = $childId AND status = 'pending'");
            
            $success = "All monitoring data for this child has been deleted.";
            logAudit($parentId, 'data_deleted', 'children', $childId, 'All monitoring data deleted');
        }
    }
}

// Get consent records
$consents = [];
$cResult = $db->query("
    SELECT cr.*, c.name as child_name
    FROM consent_records cr
    JOIN children c ON cr.child_id = c.id
    WHERE cr.parent_id = $parentId AND cr.revoked_at IS NULL
    ORDER BY cr.consented_at DESC
");
if ($cResult) {
    while ($row = $cResult->fetch_assoc()) {
        $consents[] = $row;
    }
}

// Get children
$children = [];
$result = $db->query("SELECT c.id, c.name FROM children c WHERE c.family_id = $familyId ORDER BY c.name");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $children[] = $row;
    }
}

// Get deletion history
$deletions = [];
$dResult = $db->query("
    SELECT ddr.*, c.name as child_name
    FROM data_deletion_requests ddr
    LEFT JOIN children c ON ddr.child_id = c.id
    WHERE ddr.parent_id = $parentId
    ORDER BY ddr.requested_at DESC LIMIT 10
");
if ($dResult) {
    while ($row = $dResult->fetch_assoc()) {
        $deletions[] = $row;
    }
}
?>

<?php if ($success): ?><div class="success-message"><?= htmlspecialchars($success) ?></div><?php endif; ?>
<?php if ($error): ?><div class="error-message"><?= htmlspecialchars($error) ?></div><?php endif; ?>

<div class="grid-2">
    <!-- Consent Records -->
    <div class="card">
        <div class="card-header">
            <h3><i class="fas fa-file-contract"></i> Consent Records</h3>
        </div>
        
        <?php if (empty($consents)): ?>
            <p style="color:var(--gray); text-align:center; padding:20px;">No consent records yet</p>
        <?php else: ?>
        <div class="table-responsive">
            <table>
                <thead><tr><th>Child</th><th>Type</th><th>Consented</th><th>Date</th></tr></thead>
                <tbody>
                    <?php foreach ($consents as $c): ?>
                    <tr>
                        <td><?= htmlspecialchars($c['child_name']) ?></td>
                        <td><span class="badge badge-info"><?= ucfirst($c['consent_type']) ?></span></td>
                        <td><span class="badge badge-success">Yes</span></td>
                        <td><?= formatDate($c['consented_at']) ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Data Management -->
    <div>
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-trash-alt"></i> Delete Child Data</h3>
            </div>
            <p style="font-size:14px; color:var(--gray); margin-bottom:16px;">
                You can delete all monitoring data for a child at any time (GDPR/COPPA compliance). 
                This will remove location history, screen time logs, app usage data, and alerts.
            </p>
            
            <form method="POST" onsubmit="return confirm('Are you sure you want to delete ALL monitoring data for this child? This cannot be undone.')">
                <input type="hidden" name="action" value="delete_data">
                <input type="hidden" name="request_type" value="child_data">
                
                <div class="form-group">
                    <label>Select Child</label>
                    <select name="child_id" class="form-control" required>
                        <option value="">-- Select --</option>
                        <?php foreach ($children as $c): ?>
                            <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-danger" style="width:100%;justify-content:center;">
                    <i class="fas fa-trash-alt"></i> Delete All Data
                </button>
            </form>
        </div>
        
        <?php if (!empty($deletions)): ?>
        <div class="card">
            <div class="card-header"><h3>Deletion History</h3></div>
            <table>
                <thead><tr><th>Child</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                    <?php foreach ($deletions as $d): ?>
                    <tr>
                        <td><?= htmlspecialchars($d['child_name'] ?? 'All') ?></td>
                        <td><?= ucfirst(str_replace('_', ' ', $d['request_type'])) ?></td>
                        <td><span class="badge <?= $d['status'] === 'completed' ? 'badge-success' : 'badge-warning' ?>"><?= ucfirst($d['status']) ?></span></td>
                        <td><?= formatDate($d['requested_at']) ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Privacy Info -->
<div class="card">
    <div class="card-header"><h3><i class="fas fa-shield-alt"></i> Privacy Policy</h3></div>
    <div style="font-size:14px; line-height:1.8;">
        <h4>SafeChild Privacy Commitment</h4>
        <ul style="padding-left:20px; margin-top:8px;">
            <li><strong>Transparent Monitoring:</strong> Your child always knows when monitoring is active (persistent notification)</li>
            <li><strong>Data Minimization:</strong> We only collect aggregate data (app usage stats, location), NOT message content, keystrokes, or camera images</li>
            <li><strong>Your Data, Your Control:</strong> You can export or delete all data at any time</li>
            <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS)</li>
            <li><strong>No Third-Party Sharing:</strong> Your data is never shared with third parties</li>
            <li><strong>Automatic Deletion:</strong> Data older than <?= getSetting('data_retention_days', '90') ?> days is automatically deleted</li>
            <li><strong>Consent-Based:</strong> All monitoring requires explicit parental consent, recorded with timestamp</li>
        </ul>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
