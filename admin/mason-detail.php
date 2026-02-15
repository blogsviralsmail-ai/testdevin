<?php
require_once '../includes/config.php';

// Check if admin is logged in
if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Get mason ID
$mason_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$mason_id) {
    redirect('masons.php');
}

// Handle password reset
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['reset_password'])) {
    $new_password = $_POST['new_password'];
    $hashed = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Get user_id for this mason
    $mason = $conn->query("SELECT user_id FROM masons WHERE id = $mason_id")->fetch_assoc();
    if ($mason && $mason['user_id']) {
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashed, $mason['user_id']);
        if ($stmt->execute()) {
            setMessage('success', 'Password reset successfully!');
        } else {
            setMessage('danger', 'Error resetting password.');
        }
    }
    redirect("mason-detail.php?id=$mason_id");
}

// Get mason details
$mason = $conn->query("SELECT m.*, u.mobile as user_mobile FROM masons m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = $mason_id")->fetch_assoc();

if (!$mason) {
    redirect('masons.php');
}

// Get visits
$visits = $conn->query("SELECT * FROM mason_visits WHERE mason_id = $mason_id ORDER BY visit_date DESC, visit_time DESC");

// Get total stats
$stats = $conn->query("SELECT COUNT(*) as total_visits, SUM(amount) as total_amount, SUM(rewards) as total_rewards FROM mason_visits WHERE mason_id = $mason_id")->fetch_assoc();

include 'sidebar.php';
?>

<main class="admin-main">
    <div class="admin-header">
        <h1>Mason Details</h1>
        <a href="masons.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back to List</a>
    </div>

    <?php if ($message): ?>
    <div class="alert alert-<?php echo $message['type']; ?>">
        <?php echo $message['text']; ?>
    </div>
    <?php endif; ?>

    <div class="detail-grid">
        <!-- Mason Info Card -->
        <div class="detail-card">
            <div class="card-header">
                <h3><i class="fas fa-user"></i> Mason Information</h3>
            </div>
            <div class="card-body">
                <div class="info-row">
                    <label>Name:</label>
                    <span><?php echo $mason['name']; ?></span>
                </div>
                <div class="info-row">
                    <label>Mobile:</label>
                    <span><?php echo $mason['mobile']; ?></span>
                </div>
                <div class="info-row">
                    <label>Address:</label>
                    <span><?php echo $mason['address'] ?: 'N/A'; ?></span>
                </div>
                <div class="info-row">
                    <label>Status:</label>
                    <span class="badge badge-<?php echo $mason['status'] == 'active' ? 'success' : 'danger'; ?>">
                        <?php echo ucfirst($mason['status']); ?>
                    </span>
                </div>
                <div class="info-row">
                    <label>Joined:</label>
                    <span><?php echo date('d M Y', strtotime($mason['created_at'])); ?></span>
                </div>
            </div>
        </div>

        <!-- Stats Card -->
        <div class="detail-card">
            <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Statistics</h3>
            </div>
            <div class="card-body">
                <div class="stat-boxes">
                    <div class="stat-box">
                        <h4><?php echo $stats['total_visits'] ?: 0; ?></h4>
                        <p>Total Visits</p>
                    </div>
                    <div class="stat-box">
                        <h4><?php echo formatCurrency($stats['total_amount'] ?: 0); ?></h4>
                        <p>Total Amount</p>
                    </div>
                    <div class="stat-box highlight">
                        <h4><?php echo formatCurrency($stats['total_rewards'] ?: 0); ?></h4>
                        <p>Total Rewards</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Password Reset Card -->
        <div class="detail-card">
            <div class="card-header">
                <h3><i class="fas fa-key"></i> Reset Password</h3>
            </div>
            <div class="card-body">
                <form method="POST" class="password-form">
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" name="new_password" required minlength="5" placeholder="Enter new password">
                    </div>
                    <button type="submit" name="reset_password" class="btn btn-warning">
                        <i class="fas fa-sync"></i> Reset Password
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Visits Table -->
    <div class="detail-card full-width">
        <div class="card-header">
            <h3><i class="fas fa-history"></i> Visit History</h3>
        </div>
        <div class="card-body">
            <?php if ($visits->num_rows > 0): ?>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Rewards</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while($visit = $visits->fetch_assoc()): ?>
                    <tr>
                        <td><?php echo date('d M Y', strtotime($visit['visit_date'])); ?></td>
                        <td><?php echo date('h:i A', strtotime($visit['visit_time'])); ?></td>
                        <td><?php echo $visit['items_description']; ?></td>
                        <td><?php echo formatCurrency($visit['amount']); ?></td>
                        <td class="text-success"><?php echo formatCurrency($visit['rewards']); ?></td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
            <?php else: ?>
            <p class="no-data">No visits recorded yet.</p>
            <?php endif; ?>
        </div>
    </div>
</main>

<style>
.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}
.detail-card {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    overflow: hidden;
}
.detail-card.full-width {
    grid-column: 1 / -1;
}
.card-header {
    background: #f8f9fa;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
}
.card-header h3 {
    margin: 0;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.card-body {
    padding: 20px;
}
.info-row {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child {
    border-bottom: none;
}
.info-row label {
    width: 100px;
    font-weight: 600;
    color: #666;
}
.stat-boxes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}
.stat-box {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
}
.stat-box.highlight {
    background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
    color: white;
}
.stat-box h4 {
    font-size: 24px;
    margin-bottom: 5px;
}
.stat-box p {
    margin: 0;
    font-size: 12px;
    opacity: 0.8;
}
.password-form .form-group {
    margin-bottom: 15px;
}
.password-form input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}
.btn-warning {
    background: #ffc107;
    color: #333;
}
.no-data {
    text-align: center;
    color: #999;
    padding: 40px;
}
</style>

<?php $conn->close(); ?>
