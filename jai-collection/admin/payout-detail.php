<?php
$pageTitle = 'Payout Detail';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT p.*, a.name AS agent_name, a.mobile AS agent_mobile, a.email AS agent_email
    FROM payouts p JOIN agents a ON a.id = p.agent_id WHERE p.id = ?");
$stmt->execute([$id]);
$payout = $stmt->fetch();
if (!$payout) { setFlash('error', 'Payout not found.'); redirect('payouts.php'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $action = $_POST['action'] ?? '';
    $admin = currentAdmin();

    // Each state transition uses a conditional UPDATE (WHERE status = 'expected')
    // and checks rowCount() so that a crafted/stale POST can't double-apply a
    // transition. The UI only shows buttons for valid transitions, but we never
    // rely on that — e.g. without this guard, rejecting an already-paid payout
    // would re-credit the agent's wallet (financial double-spend).

    if ($action === 'approve') {
        $upd = $pdo->prepare("UPDATE payouts SET status = 'approved', admin_note = ?, processed_by = ?, processed_at = NOW() WHERE id = ? AND status = 'pending'");
        $upd->execute([sanitize($_POST['admin_note'] ?? ''), $admin['id'], $id]);
        if ($upd->rowCount() === 0) {
            setFlash('error', 'This payout can no longer be approved (status has changed).');
        } else {
            setFlash('success', 'Payout approved. Upload payment screenshot once transferred to mark paid.');
        }
        redirect('payout-detail.php?id=' . $id);
    }

    if ($action === 'reject') {
        // Only refund when we actually flip pending -> rejected. If the payout
        // was already paid/approved/rejected, do nothing (no second refund).
        $upd = $pdo->prepare("UPDATE payouts SET status = 'rejected', admin_note = ?, processed_by = ?, processed_at = NOW() WHERE id = ? AND status = 'pending'");
        $upd->execute([sanitize($_POST['admin_note'] ?? ''), $admin['id'], $id]);
        if ($upd->rowCount() === 0) {
            setFlash('error', 'This payout can no longer be rejected (status has changed).');
        } else {
            walletCredit($payout['agent_id'], $payout['amount'], 'payout_refund', $id, 'Payout #' . $id . ' rejected, amount refunded');
            // walletCredit() bumps lifetime_earned and walletDebit() (used when the
            // payout was requested) bumped lifetime_paid. A refund is neither a
            // real payout nor new earnings, so undo both counter increments.
            $pdo->prepare("UPDATE agents SET lifetime_paid = GREATEST(lifetime_paid - ?, 0), lifetime_earned = GREATEST(lifetime_earned - ?, 0) WHERE id = ?")
                ->execute([$payout['amount'], $payout['amount'], $payout['agent_id']]);
            setFlash('info', 'Payout rejected. Agent wallet refunded.');
        }
        redirect('payout-detail.php?id=' . $id);
    }

    if ($action === 'mark_paid') {
        $utr = sanitize($_POST['utr_number'] ?? '');
        $note = sanitize($_POST['admin_note'] ?? '');

        $screenshot = $payout['screenshot'];
        if (!empty($_FILES['screenshot']['tmp_name'])) {
            $ext = strtolower(pathinfo($_FILES['screenshot']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','webp','pdf'])) {
                $fn = 'payout_' . $id . '_' . time() . '.' . $ext;
                $dest = UPLOAD_DIR . '/payouts/' . $fn;
                if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
                move_uploaded_file($_FILES['screenshot']['tmp_name'], $dest);
                $screenshot = $fn;
            }
        }

        // Only transition pending/approved -> paid. Blocks re-marking an already
        // paid or rejected payout as paid (which would overwrite the UTR and
        // could mask a prior paid record).
        $upd = $pdo->prepare("UPDATE payouts SET status = 'paid', utr_number = ?, admin_note = ?, screenshot = ?, processed_by = ?, processed_at = NOW() WHERE id = ? AND status IN ('pending','approved')");
        $upd->execute([$utr, $note, $screenshot, $admin['id'], $id]);
        if ($upd->rowCount() === 0) {
            setFlash('error', 'This payout can no longer be marked paid (status has changed).');
        } else {
            setFlash('success', 'Payout marked as PAID. Agent has been notified.');
        }
        redirect('payout-detail.php?id=' . $id);
    }
}
?>

<div class="jc-admin-actions">
    <h2>Payout Request #<?php echo (int)$payout['id']; ?></h2>
    <a href="payouts.php" class="jc-btn jc-btn-outline">Back</a>
</div>

<div class="jc-row">
    <div class="jc-panel">
        <h3 style="margin-top:0;color:#0d2d66;">Request Details</h3>
        <p><strong>Agent:</strong> <?php echo e($payout['agent_name']); ?> (<?php echo e($payout['agent_mobile']); ?>)</p>
        <p><strong>Amount:</strong> <span style="font-size:20px;color:#e53935;"><?php echo money($payout['amount']); ?></span></p>
        <p><strong>Method:</strong> <?php echo strtoupper(e($payout['method'])); ?></p>
        <p><strong>Requested:</strong> <?php echo formatDateTime($payout['requested_at']); ?></p>
        <p><strong>Status:</strong> <span class="jc-badge jc-badge-<?php echo e($payout['status']); ?>"><?php echo e($payout['status']); ?></span></p>
        <?php if ($payout['agent_note']): ?><p><strong>Agent Note:</strong> <?php echo e($payout['agent_note']); ?></p><?php endif; ?>

        <h4 style="color:#0d2d66;margin-top:20px;">Payment Destination</h4>
        <?php if ($payout['method'] === 'upi'): ?>
            <p><strong>UPI:</strong> <code><?php echo e($payout['upi_id']); ?></code></p>
        <?php else: ?>
            <p>
                <strong>Holder:</strong> <?php echo e($payout['bank_account_holder']); ?><br>
                <strong>Account:</strong> <code><?php echo e($payout['bank_account_number']); ?></code><br>
                <strong>IFSC:</strong> <code><?php echo e($payout['bank_ifsc']); ?></code><br>
                <strong>Bank:</strong> <?php echo e($payout['bank_name']); ?>
            </p>
        <?php endif; ?>

        <?php if ($payout['screenshot']): ?>
            <h4 style="color:#0d2d66;">Payment Screenshot</h4>
            <?php $ss = UPLOAD_URL . '/payouts/' . $payout['screenshot']; ?>
            <?php if (preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $payout['screenshot'])): ?>
                <img src="<?php echo e($ss); ?>" style="max-width:300px;border-radius:6px;">
            <?php else: ?>
                <a href="<?php echo e($ss); ?>" target="_blank" class="jc-btn jc-btn-outline jc-btn-sm">Download Proof</a>
            <?php endif; ?>
        <?php endif; ?>

        <?php if ($payout['utr_number']): ?>
            <p style="margin-top:14px;"><strong>UTR:</strong> <code><?php echo e($payout['utr_number']); ?></code></p>
        <?php endif; ?>
        <?php if ($payout['admin_note']): ?>
            <p><strong>Admin Note:</strong> <?php echo e($payout['admin_note']); ?></p>
        <?php endif; ?>
    </div>

    <div>
        <?php if ($payout['status'] === 'pending'): ?>
        <div class="jc-panel" style="margin-bottom:16px;">
            <h3 style="margin-top:0;color:#0d2d66;">Approve Request</h3>
            <form method="post">
                <?php echo csrfField(); ?>
                <input type="hidden" name="action" value="approve">
                <div class="jc-form-group"><label>Admin Note (optional)</label><textarea class="jc-textarea" name="admin_note"></textarea></div>
                <button class="jc-btn jc-btn-primary" type="submit">Approve</button>
            </form>
        </div>
        <div class="jc-panel" style="margin-bottom:16px;">
            <h3 style="margin-top:0;color:#8a1a1a;">Reject Request</h3>
            <form method="post">
                <?php echo csrfField(); ?>
                <input type="hidden" name="action" value="reject">
                <div class="jc-form-group"><label>Rejection Reason</label><textarea class="jc-textarea" name="admin_note" required></textarea></div>
                <button class="jc-btn" style="background:#e53935;color:#fff;" type="submit" data-confirm="Reject and refund to wallet?">Reject & Refund</button>
            </form>
        </div>
        <?php endif; ?>

        <?php if (in_array($payout['status'], ['pending','approved'])): ?>
        <div class="jc-panel">
            <h3 style="margin-top:0;color:#0d2d66;">Mark as Paid</h3>
            <p style="color:#888;font-size:13px;">Transfer funds to agent, then upload screenshot + UTR.</p>
            <form method="post" enctype="multipart/form-data">
                <?php echo csrfField(); ?>
                <input type="hidden" name="action" value="mark_paid">
                <div class="jc-form-group"><label>UTR / Transaction Reference</label><input class="jc-input" name="utr_number"></div>
                <div class="jc-form-group"><label>Payment Screenshot</label><input class="jc-input" type="file" name="screenshot" accept="image/*,.pdf"></div>
                <div class="jc-form-group"><label>Note</label><textarea class="jc-textarea" name="admin_note"></textarea></div>
                <button class="jc-btn jc-btn-primary" type="submit">Mark Paid</button>
            </form>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
