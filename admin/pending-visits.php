<?php
require_once '../includes/config.php';

if (!isLoggedIn() || (!isAdmin() && !hasPermission('approve_visits'))) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['approve'])) {
        $id = (int)$_POST['id'];
        $rewards = (float)$_POST['rewards'];
        $customer_tier = isset($_POST['customer_tier']) ? $_POST['customer_tier'] : 'Silver';
        $reference_by = isset($_POST['reference_by']) ? trim($_POST['reference_by']) : 'Direct';
        
        // Validate tier
        if (!in_array($customer_tier, ['Platinum', 'Gold', 'Silver', 'Brown'])) {
            $customer_tier = 'Silver';
        }
        if (empty($reference_by)) {
            $reference_by = 'Direct';
        }
        
        // Get pending visit
        $pv = $conn->query("SELECT * FROM pending_visits WHERE id = $id")->fetch_assoc();
        if ($pv) {
            // Create actual visit
            $stmt = $conn->prepare("INSERT INTO mason_visits (mason_id, visit_date, visit_time, items_description, rewards, created_by) VALUES (?, ?, ?, ?, ?, ?)");
            $created_by = $_SESSION['user_id'];
            $stmt->bind_param("isssdi", $pv['customer_id'], $pv['visit_date'], $pv['visit_time'], $pv['items_description'], $rewards, $created_by);
            $stmt->execute();
            
            // Update mason totals and tier/reference
            $stmt = $conn->prepare("UPDATE masons SET total_visits = total_visits + 1, total_rewards = total_rewards + ?, is_verified = 1, customer_tier = ?, reference_by = ? WHERE id = ?");
            $stmt->bind_param("dssi", $rewards, $customer_tier, $reference_by, $pv['customer_id']);
            $stmt->execute();
            
            // Delete pending visit
            $conn->query("DELETE FROM pending_visits WHERE id = $id");
            
            setMessage('success', 'Visit approved and rewards added');
        }
        redirect('pending-visits.php');
    }
    
    if (isset($_POST['reject'])) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM pending_visits WHERE id = $id");
        setMessage('success', 'Visit rejected');
        redirect('pending-visits.php');
    }
}

$pending = $conn->query("SELECT pv.*, m.name, m.mobile, m.address, m.customer_tier, m.reference_by, cc.name as category_name 
                         FROM pending_visits pv 
                         JOIN masons m ON pv.customer_id = m.id 
                         LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                         ORDER BY pv.created_at DESC");
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pending Visits - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .tier-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .tier-platinum { background: linear-gradient(135deg, #E5E4E2, #A9A9A9); color: #333; }
        .tier-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; }
        .tier-silver { background: linear-gradient(135deg, #C0C0C0, #A8A8A8); color: #333; }
        .tier-brown { background: linear-gradient(135deg, #8B4513, #A0522D); color: #fff; }
        .approve-form { display: flex; flex-direction: column; gap: 8px; }
        .form-row { display: flex; gap: 5px; align-items: center; }
        .form-row input, .form-row select { padding: 6px 8px; border: 1px solid #ddd; border-radius: 5px; font-size: 12px; }
        .form-row input[type="number"] { width: 80px; }
        .form-row input[type="text"] { width: 120px; }
        .form-row select { width: 100px; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-clock"></i> Pending Visits (QR Registrations)</h1>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <div class="admin-card">
                <p style="margin-bottom: 20px; color: #666;"><i class="fas fa-info-circle"></i> These visits were submitted by customers via QR code. Review and approve with rewards, tier, and reference.</p>
                
                <?php if ($pending->num_rows === 0): ?>
                <p style="text-align: center; padding: 40px; color: #999;"><i class="fas fa-check-circle" style="font-size: 40px;"></i><br><br>No pending visits</p>
                <?php else: ?>
                <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead><tr><th>Customer</th><th>Current Tier</th><th>Date/Time</th><th>Items</th><th>Approve with Details</th></tr></thead>
                    <tbody>
                        <?php while($pv = $pending->fetch_assoc()): 
                            $tierClass = 'tier-' . strtolower($pv['customer_tier'] ?? 'silver');
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo $pv['name']; ?></strong><br>
                                <small><?php echo $pv['mobile']; ?></small><br>
                                <small style="color: #666;"><?php echo $pv['address']; ?></small><br>
                                <small style="color: #888;">Ref: <?php echo $pv['reference_by'] ?? 'Direct'; ?></small>
                            </td>
                            <td>
                                <span class="tier-badge <?php echo $tierClass; ?>"><?php echo $pv['customer_tier'] ?? 'Silver'; ?></span><br>
                                <small style="color: #666;"><?php echo $pv['category_name'] ?? 'N/A'; ?></small>
                            </td>
                            <td><?php echo formatDate($pv['visit_date']); ?><br><small><?php echo date('h:i A', strtotime($pv['visit_time'])); ?></small></td>
                            <td><?php echo $pv['items_description']; ?></td>
                            <td>
                                <form method="POST" class="approve-form">
                                    <input type="hidden" name="id" value="<?php echo $pv['id']; ?>">
                                    <div class="form-row">
                                        <input type="number" name="rewards" placeholder="Rewards" step="0.01" required title="Rewards">
                                        <select name="customer_tier" title="Customer Tier">
                                            <option value="Platinum" <?php echo ($pv['customer_tier'] == 'Platinum') ? 'selected' : ''; ?>>Platinum</option>
                                            <option value="Gold" <?php echo ($pv['customer_tier'] == 'Gold') ? 'selected' : ''; ?>>Gold</option>
                                            <option value="Silver" <?php echo ($pv['customer_tier'] == 'Silver' || !$pv['customer_tier']) ? 'selected' : ''; ?>>Silver</option>
                                            <option value="Brown" <?php echo ($pv['customer_tier'] == 'Brown') ? 'selected' : ''; ?>>Brown</option>
                                        </select>
                                    </div>
                                    <div class="form-row">
                                        <input type="text" name="reference_by" placeholder="Reference By" value="<?php echo htmlspecialchars($pv['reference_by'] ?? 'Direct'); ?>" title="Reference By">
                                        <button type="submit" name="approve" class="btn btn-primary" style="padding: 6px 12px;"><i class="fas fa-check"></i> Approve</button>
                                        <button type="submit" name="reject" class="btn btn-outline" style="padding: 6px 12px; background: #dc3545; color: white; border-color: #dc3545;" onclick="return confirm('Reject this visit?')"><i class="fas fa-times"></i></button>
                                    </div>
                                </form>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
</body>
</html>
<?php $conn->close(); ?>