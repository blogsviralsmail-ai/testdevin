<?php
$pageTitle = 'Payout Requests';
require_once __DIR__ . '/_header.php';
$pdo = getPDO();

$agentFull = getAgentById($agent['id']);
$minPayout = (float)getSetting('min_payout_amount', '200');
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrfVerify();
    $amount = (float)$_POST['amount'];
    $method = $_POST['method'] === 'upi' ? 'upi' : 'bank';
    $upi = sanitize($_POST['upi_id'] ?? '');
    $bankHolder = sanitize($_POST['bank_account_holder'] ?? '');
    $bankAcc = sanitize($_POST['bank_account_number'] ?? '');
    $bankIfsc = sanitize($_POST['bank_ifsc'] ?? '');
    $bankName = sanitize($_POST['bank_name'] ?? '');
    $note = sanitize($_POST['agent_note'] ?? '');

    if ($amount < $minPayout) {
        $error = 'Minimum payout is ' . money($minPayout);
    } elseif ($amount > (float)$agentFull['wallet_balance']) {
        $error = 'Insufficient wallet balance.';
    } elseif ($method === 'upi' && !$upi) {
        $error = 'UPI ID is required.';
    } elseif ($method === 'bank' && (!$bankHolder || !$bankAcc || !$bankIfsc)) {
        $error = 'Bank details are required.';
    } else {
        // Save defaults back to agent profile for convenience (outside the payout
        // transaction since this is idempotent user-convenience data).
        $pdo->prepare("UPDATE agents SET upi_id=?, bank_account_holder=?, bank_account_number=?, bank_ifsc=?, bank_name=? WHERE id=?")
            ->execute([$upi, $bankHolder, $bankAcc, $bankIfsc, $bankName, $agent['id']]);

        // Create the payout row first (status='pending') so we have an ID to reference
        // in the wallet ledger entry, then debit the wallet atomically. If the debit
        // fails (insufficient balance due to a concurrent payout), we delete the
        // just-inserted payout so no orphaned pending record is left for the admin
        // to approve. walletDebit() uses a conditional UPDATE that only succeeds
        // when the balance is sufficient, so it's race-safe at the row level.
        $pdo->prepare("INSERT INTO payouts (agent_id, amount, method, upi_id, bank_account_holder, bank_account_number, bank_ifsc, bank_name, agent_note, status, requested_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())")
            ->execute([$agent['id'], $amount, $method, $upi, $bankHolder, $bankAcc, $bankIfsc, $bankName, $note]);
        $payoutId = $pdo->lastInsertId();
        $debited = walletDebit($agent['id'], $amount, 'payout', $payoutId, 'Payout request #' . $payoutId);
        if (!$debited) {
            $pdo->prepare("DELETE FROM payouts WHERE id = ? AND status = 'pending'")->execute([$payoutId]);
            $error = 'Insufficient wallet balance.';
        } else {
            setFlash('success', 'Payout request submitted.');
            redirect('payout-requests.php');
        }
    }
}

$stmt = $pdo->prepare("SELECT * FROM payouts WHERE agent_id = ? ORDER BY id DESC");
$stmt->execute([$agent['id']]);
$rows = $stmt->fetchAll();
?>
<div class="jc-admin-actions">
    <h2>Request Payout</h2>
    <div>Wallet: <strong style="color:#2a9d2a;"><?php echo money($agentFull['wallet_balance']); ?></strong></div>
</div>

<?php if ($error): ?><div class="jc-alert jc-alert-error"><?php echo e($error); ?></div><?php endif; ?>

<div class="jc-panel" style="margin-bottom:20px;">
    <h3 style="margin-top:0;color:#0d2d66;">New Payout Request</h3>
    <p style="color:#888;font-size:13px;">Minimum payout: <strong><?php echo money($minPayout); ?></strong>. Admin will transfer and upload proof screenshot.</p>
    <form method="post">
        <?php echo csrfField(); ?>
        <div class="jc-row">
            <div class="jc-form-group">
                <label>Amount*</label>
                <input class="jc-input" type="number" step="0.01" name="amount" required min="<?php echo $minPayout; ?>" max="<?php echo $agentFull['wallet_balance']; ?>" value="<?php echo $agentFull['wallet_balance']; ?>">
            </div>
            <div class="jc-form-group">
                <label>Method*</label>
                <select class="jc-select" name="method" id="methodSelect" onchange="document.getElementById('upiBox').style.display=this.value==='upi'?'block':'none';document.getElementById('bankBox').style.display=this.value==='bank'?'block':'none';">
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                </select>
            </div>
        </div>

        <div id="upiBox" style="display:none;">
            <div class="jc-form-group"><label>UPI ID*</label><input class="jc-input" name="upi_id" value="<?php echo e($agentFull['upi_id']); ?>" placeholder="yourname@upi"></div>
        </div>
        <div id="bankBox">
            <div class="jc-row">
                <div class="jc-form-group"><label>Account Holder*</label><input class="jc-input" name="bank_account_holder" value="<?php echo e($agentFull['bank_account_holder']); ?>"></div>
                <div class="jc-form-group"><label>Account Number*</label><input class="jc-input" name="bank_account_number" value="<?php echo e($agentFull['bank_account_number']); ?>"></div>
            </div>
            <div class="jc-row">
                <div class="jc-form-group"><label>IFSC*</label><input class="jc-input" name="bank_ifsc" value="<?php echo e($agentFull['bank_ifsc']); ?>"></div>
                <div class="jc-form-group"><label>Bank Name</label><input class="jc-input" name="bank_name" value="<?php echo e($agentFull['bank_name']); ?>"></div>
            </div>
        </div>
        <div class="jc-form-group"><label>Note (optional)</label><textarea class="jc-textarea" name="agent_note"></textarea></div>
        <button class="jc-btn jc-btn-primary" type="submit" data-confirm="Submit payout request?"><i class="fas fa-paper-plane"></i> Submit Request</button>
    </form>
</div>

<h3 style="color:#0d2d66;">My Payout History</h3>
<div class="jc-panel" style="padding:0;">
<table class="jc-table">
    <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>UTR</th><th>Proof</th></tr></thead>
    <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo formatDateTime($r['requested_at']); ?></td>
                <td><strong><?php echo money($r['amount']); ?></strong></td>
                <td><?php echo strtoupper(e($r['method'])); ?></td>
                <td><span class="jc-badge jc-badge-<?php echo e($r['status']); ?>"><?php echo e($r['status']); ?></span></td>
                <td><?php echo e($r['utr_number'] ?: '-'); ?></td>
                <td>
                    <?php if ($r['screenshot']): ?>
                        <a href="<?php echo e(UPLOAD_URL . '/payouts/' . $r['screenshot']); ?>" target="_blank" class="jc-btn jc-btn-sm jc-btn-outline">View</a>
                    <?php else: ?>-<?php endif; ?>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?><tr><td colspan="6" style="text-align:center;color:#888;">No payout requests yet.</td></tr><?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once __DIR__ . '/_footer.php'; ?>
