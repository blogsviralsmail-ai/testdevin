<?php
require_once '../includes/config.php';

// Check if logged in as admin or employee
if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

$conn = getDBConnection();

// Get statistics
$totalCustomers = $conn->query("SELECT COUNT(*) as count FROM masons WHERE status = 'active'")->fetch_assoc()['count'];
$totalVisits = $conn->query("SELECT COUNT(*) as count FROM mason_visits")->fetch_assoc()['count'];
$totalRewards = $conn->query("SELECT SUM(rewards) as total FROM mason_visits")->fetch_assoc()['total'] ?? 0;
$pendingVisits = $conn->query("SELECT COUNT(*) as count FROM pending_visits")->fetch_assoc()['count'];
$totalProducts = $conn->query("SELECT COUNT(*) as count FROM products")->fetch_assoc()['count'];
$totalCategories = $conn->query("SELECT COUNT(*) as count FROM categories")->fetch_assoc()['count'];
$totalEnquiries = $conn->query("SELECT COUNT(*) as count FROM enquiries WHERE status = 'new'")->fetch_assoc()['count'];

// Get recent visits
$recentVisits = $conn->query("SELECT mv.*, m.name as customer_name, m.mobile as customer_mobile 
                              FROM mason_visits mv 
                              JOIN masons m ON mv.mason_id = m.id 
                              ORDER BY mv.created_at DESC LIMIT 10");

// Get top customers
$topCustomers = $conn->query("SELECT * FROM masons ORDER BY total_rewards DESC LIMIT 5");

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - JP Tiles</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
        <div class="admin-wrapper">
            <?php include 'sidebar.php'; ?>

        <!-- Main Content -->
        <main class="admin-content">
            <div class="admin-header">
                <h1>Dashboard</h1>
                <div>
                    <span>Welcome, <?php echo $_SESSION['user_name']; ?></span>
                </div>
            </div>

            <?php if (hasPermission('view_customers')): ?>
                        <!-- Stats Grid -->
                        <div class="stats-grid">
                            <div class="stat-card primary">
                                <h4>Total Customers</h4>
                                <div class="value"><?php echo $totalCustomers; ?></div>
                            </div>
                            <div class="stat-card">
                                <h4>Total Visits</h4>
                                <div class="value"><?php echo $totalVisits; ?></div>
                            </div>
                            <div class="stat-card">
                                <h4>Total Rewards</h4>
                                <div class="value"><?php echo $totalRewards; ?></div>
                            </div>
                            <div class="stat-card">
                                <h4>Pending Visits</h4>
                                <div class="value"><?php echo $pendingVisits; ?></div>
                            </div>
                        </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <!-- Recent Visits -->
                <div class="admin-card">
                    <h3>Recent Visits</h3>
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Customer</th>
                                                    <th>Date</th>
                                                    <th>Rewards</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <?php while($visit = $recentVisits->fetch_assoc()): ?>
                                                <tr>
                                                    <td>
                                                        <strong><?php echo $visit['customer_name']; ?></strong><br>
                                                        <small><?php echo $visit['customer_mobile']; ?></small>
                                                    </td>
                                                    <td><?php echo formatDate($visit['visit_date']); ?></td>
                                                    <td><span class="badge badge-success"><?php echo $visit['rewards']; ?></span></td>
                                                </tr>
                                                <?php endwhile; ?>
                                            </tbody>
                                        </table>
                    <div style="margin-top: 15px;">
                        <a href="visits.php" class="btn btn-outline">View All Visits</a>
                    </div>
                </div>

                                <!-- Top Customers -->
                                <div class="admin-card">
                                    <h3>Top Performers</h3>
                                    <div class="performer-list">
                                        <?php 
                                        $rank = 1;
                                        while($customer = $topCustomers->fetch_assoc()): 
                                        ?>
                                        <div class="performer-item">
                                            <div class="performer-rank"><?php echo $rank; ?></div>
                                            <div class="performer-info">
                                                <h5><?php echo $customer['name']; ?></h5>
                                                <span><?php echo $customer['mobile']; ?></span>
                                            </div>
                                            <div class="performer-rewards"><?php echo $customer['total_rewards']; ?></div>
                                        </div>
                                        <?php 
                                        $rank++;
                                        endwhile; 
                                        ?>
                                    </div>
                                </div>
            </div>

            <!-- Quick Stats -->
            <?php if (isAdmin()): ?>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                <div class="admin-card">
                    <h3><i class="fas fa-box"></i> Products</h3>
                    <p style="font-size: 24px; font-weight: 700;"><?php echo $totalProducts; ?></p>
                    <a href="products.php">Manage Products</a>
                </div>
                <div class="admin-card">
                    <h3><i class="fas fa-folder"></i> Categories</h3>
                    <p style="font-size: 24px; font-weight: 700;"><?php echo $totalCategories; ?></p>
                    <a href="categories.php">Manage Categories</a>
                </div>
                <div class="admin-card">
                    <h3><i class="fas fa-envelope"></i> New Enquiries</h3>
                    <p style="font-size: 24px; font-weight: 700;"><?php echo $totalEnquiries; ?></p>
                    <a href="enquiries.php">View Enquiries</a>
                </div>
            </div>
            <?php endif; ?>
            <?php else: ?>
            <!-- Limited Dashboard for employees with only add permissions -->
            <div class="admin-card">
                <h3>Welcome!</h3>
                <p style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-user-shield" style="font-size: 50px; margin-bottom: 15px; display: block; color: #c9a227;"></i>
                    You have limited access to this system. Use the sidebar menu to access your permitted features.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                    <?php if (hasPermission('add_customer')): ?>
                    <a href="customers.php" class="btn btn-primary"><i class="fas fa-user-plus"></i> Add Customer</a>
                    <?php endif; ?>
                    <?php if (hasPermission('add_visit')): ?>
                    <a href="visits.php" class="btn btn-primary"><i class="fas fa-clipboard-list"></i> Add Visit</a>
                    <?php endif; ?>
                    <?php if (hasPermission('approve_visits')): ?>
                    <a href="pending-visits.php" class="btn btn-primary"><i class="fas fa-clock"></i> Pending Visits</a>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>
        </main>
    </div>
</body>
</html>
<?php $conn->close(); ?>