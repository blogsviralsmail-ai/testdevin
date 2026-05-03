<?php
$pageTitle = 'Pair Device';
require_once __DIR__ . '/../includes/header.php';

$db = getDB();
$parentId = (int) $parent['id'];
$childId = isset($_GET['child_id']) ? (int) $_GET['child_id'] : 0;
$isNew = isset($_GET['new']);

if ($childId === 0) {
    header('Location: /safechild/admin/children/list.php');
    exit;
}

// Verify child belongs to parent
$child = null;
$result = $db->query("
    SELECT c.* FROM children c
    JOIN families f ON c.family_id = f.id
    WHERE c.id = $childId AND f.parent_id = $parentId
");
if ($result && $result->num_rows > 0) {
    $child = $result->fetch_assoc();
}

if (!$child) {
    header('Location: /safechild/admin/children/list.php');
    exit;
}

// Generate pairing code
$pairingCode = generatePairingCode();

// Check if device entry exists, create or update
$existingDevice = $db->query("SELECT id FROM child_devices WHERE child_id = $childId AND paired_at IS NULL");
if ($existingDevice && $existingDevice->num_rows > 0) {
    $deviceRow = $existingDevice->fetch_assoc();
    $db->query("UPDATE child_devices SET pairing_code = '$pairingCode' WHERE id = {$deviceRow['id']}");
} else {
    $tempDeviceId = 'pending_' . bin2hex(random_bytes(16));
    $db->query("
        INSERT INTO child_devices (child_id, device_id, pairing_code, is_active)
        VALUES ($childId, '$tempDeviceId', '$pairingCode', 1)
    ");
}
?>

<div class="card" style="max-width:600px; margin:0 auto;">
    <div class="card-header">
        <h3><i class="fas fa-link"></i> Pair Device for <?= htmlspecialchars($child['name']) ?></h3>
    </div>
    
    <?php if ($isNew): ?>
        <div class="success-message">
            <i class="fas fa-check-circle"></i> Child profile created! Now pair their device.
        </div>
    <?php endif; ?>
    
    <div style="text-align:center; padding:24px 0;">
        <p style="font-size:16px; margin-bottom:24px;">
            Enter this code in the SafeChild app on <strong><?= htmlspecialchars($child['name']) ?></strong>'s phone:
        </p>
        
        <div style="font-size:48px; font-weight:700; letter-spacing:12px; color:var(--primary); 
                    background:var(--light); padding:24px; border-radius:16px; display:inline-block;">
            <?= $pairingCode ?>
        </div>
        
        <p style="margin-top:16px; color:var(--gray); font-size:14px;">
            This code expires in 15 minutes
        </p>
    </div>
    
    <div style="background:var(--light); border-radius:var(--radius-sm); padding:20px; margin-top:16px;">
        <h4 style="margin-bottom:12px;"><i class="fas fa-info-circle"></i> How to Pair:</h4>
        <ol style="padding-left:20px; font-size:14px; line-height:2;">
            <li>Install <strong>SafeChild</strong> app on your child's phone</li>
            <li>Open the app and tap <strong>"Pair with Parent"</strong></li>
            <li>Enter the 6-digit code shown above</li>
            <li>Child will see a notification: <em>"SafeChild is active"</em></li>
            <li>Done! You can now monitor from this dashboard</li>
        </ol>
    </div>
    
    <div style="margin-top:20px; padding:16px; border:1px solid #FEF3C7; border-radius:var(--radius-sm); background:#FFFBEB;">
        <p style="font-size:13px; color:#92400E;">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Important:</strong> Install the app in front of your child. They should know that SafeChild is monitoring their device.
            A persistent notification will always be visible on their phone.
        </p>
    </div>
    
    <div style="display:flex; gap:12px; margin-top:20px;">
        <a href="/safechild/admin/dashboard.php" class="btn btn-primary">
            <i class="fas fa-home"></i> Go to Dashboard
        </a>
        <a href="/safechild/admin/children/list.php" class="btn btn-outline">
            <i class="fas fa-list"></i> View Children
        </a>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
