<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$categories = getCustomerCategories();

// Handle export
if (isset($_GET['export'])) {
    $type = $_GET['export'];
    $cat_filter = isset($_GET['category']) ? (int)$_GET['category'] : 0;
    
        $where = "1=1";
        if ($cat_filter) {
            $where .= " AND m.category_id = $cat_filter";
        }
        $search_export = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        if (!empty($search_export)) {
            $where .= " AND (m.name LIKE '%$search_export%' OR m.mobile LIKE '%$search_export%')";
        }
    
        if ($type === 'summary') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="customer_summary_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Rank', 'Customer Name', 'Mobile', 'Category', 'Address', 'Total Visits', 'Total Rewards']);
        
        $data = $conn->query("SELECT m.*, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE $where ORDER BY m.total_rewards DESC");
        
        $rank = 1;
        while ($row = $data->fetch_assoc()) {
            fputcsv($output, [
                $rank++,
                $row['name'],
                $row['mobile'],
                $row['category_name'] ?? 'N/A',
                $row['address'],
                $row['total_visits'],
                $row['total_rewards']
            ]);
        }
        fclose($output);
        exit;
    }
    
    if ($type === 'visits') {
        $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="visit_history_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Date', 'Customer Name', 'Mobile', 'Category', 'Items', 'Rewards']);
        
        $visitWhere = "1=1";
        if (!empty($search)) {
            $visitWhere .= " AND (m.name LIKE '%$search%' OR m.mobile LIKE '%$search%')";
        }
        if ($cat_filter) {
            $visitWhere .= " AND m.category_id = $cat_filter";
        }
        
        $data = $conn->query("SELECT mv.*, m.name as customer_name, m.mobile as customer_mobile, cc.name as category_name 
                              FROM mason_visits mv 
                              JOIN masons m ON mv.mason_id = m.id 
                              LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                              WHERE $visitWhere 
                              ORDER BY mv.visit_date DESC");
        
        while ($row = $data->fetch_assoc()) {
            fputcsv($output, [
                $row['visit_date'],
                $row['customer_name'],
                $row['customer_mobile'],
                $row['category_name'] ?? 'N/A',
                $row['items_description'],
                $row['rewards']
            ]);
        }
        fclose($output);
        exit;
    }
}

// Get current tab
$tab = isset($_GET['tab']) ? $_GET['tab'] : 'summary';

// Get filter
$cat_filter = isset($_GET['category']) ? (int)$_GET['category'] : 0;
$search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
$date_filter = isset($_GET['date_range']) ? $_GET['date_range'] : 'lifetime';
$date_from = isset($_GET['date_from']) ? $_GET['date_from'] : '';
$date_to = isset($_GET['date_to']) ? $_GET['date_to'] : '';

// Calculate date range
$date_where = "";
$visit_date_where = "";
switch ($date_filter) {
    case 'this_month':
        $start_date = date('Y-m-01'); // First day of current month
        $date_where = " AND m.created_at >= '$start_date'";
        $visit_date_where = " AND mv.visit_date >= '$start_date'";
        break;
    case 'month':
        $start_date = date('Y-m-d', strtotime('-1 month'));
        $date_where = " AND m.created_at >= '$start_date'";
        $visit_date_where = " AND mv.visit_date >= '$start_date'";
        break;
    case '3months':
        $start_date = date('Y-m-d', strtotime('-3 months'));
        $date_where = " AND m.created_at >= '$start_date'";
        $visit_date_where = " AND mv.visit_date >= '$start_date'";
        break;
    case 'year':
        $start_date = date('Y-m-d', strtotime('-1 year'));
        $date_where = " AND m.created_at >= '$start_date'";
        $visit_date_where = " AND mv.visit_date >= '$start_date'";
        break;
    case 'custom':
        if (!empty($date_from) && !empty($date_to)) {
            $date_from_safe = $conn->real_escape_string($date_from);
            $date_to_safe = $conn->real_escape_string($date_to);
            $date_where = " AND DATE(m.created_at) BETWEEN '$date_from_safe' AND '$date_to_safe'";
            $visit_date_where = " AND mv.visit_date BETWEEN '$date_from_safe' AND '$date_to_safe'";
        }
        break;
    case 'lifetime':
    default:
        $date_where = "";
        $visit_date_where = "";
        break;
}

$where = "1=1";
if ($cat_filter) {
    $where .= " AND m.category_id = $cat_filter";
}
if (!empty($search)) {
    $where .= " AND (m.name LIKE '%$search%' OR m.mobile LIKE '%$search%')";
}
$where .= $date_where;

// Get summary data - sorted by rewards (highest first)
$summaryData = $conn->query("SELECT m.*, cc.name as category_name 
                              FROM masons m 
                              LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                              WHERE $where
                              ORDER BY m.total_rewards DESC");

// Get totals
$totals = $conn->query("SELECT COUNT(*) as total_customers, SUM(total_visits) as total_visits, SUM(total_rewards) as total_rewards 
                         FROM masons m WHERE $where")->fetch_assoc();

// Get visits data
$visitWhere = "1=1";
if (!empty($search)) {
    $visitWhere .= " AND (m.name LIKE '%$search%' OR m.mobile LIKE '%$search%')";
}
if ($cat_filter) {
    $visitWhere .= " AND m.category_id = $cat_filter";
}
$visitWhere .= $visit_date_where;

$visitsData = $conn->query("SELECT mv.*, m.name as customer_name, m.mobile as customer_mobile, cc.name as category_name 
                             FROM mason_visits mv 
                             JOIN masons m ON mv.mason_id = m.id 
                             LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                             WHERE $visitWhere 
                             ORDER BY mv.visit_date DESC
                             LIMIT 500");

// Get customer details if searching
$customerDetails = null;
if (!empty($search)) {
    $customerDetails = $conn->query("SELECT m.*, cc.name as category_name 
                                      FROM masons m 
                                      LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                                      WHERE m.name LIKE '%$search%' OR m.mobile LIKE '%$search%'
                                      LIMIT 10");
}

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <style>
        .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #333; }
        .tab { padding: 12px 24px; cursor: pointer; background: #2d2d2d; color: #999; border: none; font-size: 14px; font-weight: 500; transition: all 0.3s; text-decoration: none; }
        .tab:hover { color: #c9a227; }
        .tab.active { background: #c9a227; color: #000; }
        .search-box { display: flex; gap: 10px; margin-bottom: 20px; }
        .search-box input { flex: 1; padding: 12px 15px; border: 1px solid #444; border-radius: 5px; background: #2d2d2d; color: #fff; font-size: 14px; }
        .search-box input::placeholder { color: #888; }
        .customer-card { background: #2d2d2d; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #c9a227; }
        .customer-card h4 { color: #c9a227; margin: 0 0 10px 0; }
        .customer-card p { color: #ccc; margin: 5px 0; font-size: 14px; }
        .customer-card .stats { display: flex; gap: 20px; margin-top: 10px; flex-wrap: wrap; }
        .customer-card .stat { background: #1a1a1a; padding: 8px 15px; border-radius: 5px; }
        .customer-card .stat span { color: #c9a227; font-weight: bold; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Reports</h1>
                <div>
                    <?php if ($tab === 'summary'): ?>
                    <a href="?export=summary&category=<?php echo $cat_filter; ?>" class="btn btn-primary"><i class="fas fa-download"></i> Export Summary</a>
                    <?php else: ?>
                    <a href="?export=visits&category=<?php echo $cat_filter; ?>&search=<?php echo urlencode($search); ?>" class="btn btn-primary"><i class="fas fa-download"></i> Export Visits</a>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <a href="?tab=summary&category=<?php echo $cat_filter; ?>" class="tab <?php echo $tab === 'summary' ? 'active' : ''; ?>">
                    <i class="fas fa-chart-bar"></i> Summary
                </a>
                <a href="?tab=visits&category=<?php echo $cat_filter; ?>" class="tab <?php echo $tab === 'visits' ? 'active' : ''; ?>">
                    <i class="fas fa-history"></i> Visit History
                </a>
            </div>

            <?php if ($tab === 'summary'): ?>
                        <!-- Summary Tab -->
                        <div class="admin-card">
                            <h3><i class="fas fa-search"></i> Search & Filter</h3>
                            <form method="GET" style="display: flex; gap: 15px; flex-wrap: wrap; align-items: end;">
                                <input type="hidden" name="tab" value="summary">
                                <div class="form-group" style="margin: 0; flex: 2; min-width: 200px;">
                                    <label>Search Customer</label>
                                    <input type="text" name="search" placeholder="Enter name or mobile number..." value="<?php echo htmlspecialchars($search); ?>" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>
                                                                <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                                                                    <label>Category</label>
                                                                    <select name="category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                                        <option value="">All Categories</option>
                                                                        <?php foreach ($categories as $cat): ?>
                                                                        <option value="<?php echo $cat['id']; ?>" <?php echo $cat_filter == $cat['id'] ? 'selected' : ''; ?>>
                                                                            <?php echo $cat['name']; ?>
                                                                        </option>
                                                                        <?php endforeach; ?>
                                                                    </select>
                                                                </div>
                                                                <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                                                                    <label>Date Range</label>
                                                                                                                                    <select name="date_range" id="date_range_summary" onchange="toggleDateFields('summary')" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                                                                                                        <option value="lifetime" <?php echo $date_filter == 'lifetime' ? 'selected' : ''; ?>>Lifetime</option>
                                                                                                                                        <option value="this_month" <?php echo $date_filter == 'this_month' ? 'selected' : ''; ?>>This Month</option>
                                                                                                                                        <option value="month" <?php echo $date_filter == 'month' ? 'selected' : ''; ?>>Last Month</option>
                                                                                                                                        <option value="3months" <?php echo $date_filter == '3months' ? 'selected' : ''; ?>>Last 3 Months</option>
                                                                                                                                        <option value="year" <?php echo $date_filter == 'year' ? 'selected' : ''; ?>>Last Year</option>
                                                                                                                                        <option value="custom" <?php echo $date_filter == 'custom' ? 'selected' : ''; ?>>Custom Date</option>
                                                                                                                                    </select>
                                                                                                                                </div>
                                                                                                                                <div class="form-group" style="margin: 0; flex: 1; min-width: 130px; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_from_summary">
                                                                                                                                    <label>From</label>
                                                                                                                                    <input type="date" name="date_from" value="<?php echo htmlspecialchars($date_from); ?>" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                                                                                                </div>
                                                                                                                                <div class="form-group" style="margin: 0; flex: 1; min-width: 130px; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_to_summary">
                                                                                                                                    <label>To</label>
                                                                                                                                    <input type="date" name="date_to" value="<?php echo htmlspecialchars($date_to); ?>" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                                                                                                </div>
                                                                                                                                <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Search</button>
                                                                                                                                <a href="reports.php?tab=summary" class="btn btn-outline">Clear</a>
                            </form>
                        </div>

            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="stat-card">
                    <h4>Total Customers</h4>
                    <div class="value"><?php echo $totals['total_customers'] ?? 0; ?></div>
                </div>
                <div class="stat-card">
                    <h4>Total Visits</h4>
                    <div class="value"><?php echo $totals['total_visits'] ?? 0; ?></div>
                </div>
                <div class="stat-card primary">
                    <h4>Total Rewards</h4>
                    <div class="value"><?php echo $totals['total_rewards'] ?? 0; ?></div>
                </div>
            </div>

            <div class="admin-card">
                <h3>Customer Summary (<?php echo $summaryData->num_rows; ?> customers) - Highest Rewards First</h3>
                <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Customer</th>
                            <th>Mobile</th>
                            <th>Category</th>
                            <th>Total Visits</th>
                            <th>Total Rewards</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $rank = 1;
                        while($row = $summaryData->fetch_assoc()): 
                        ?>
                        <tr>
                            <td><strong>#<?php echo $rank++; ?></strong></td>
                            <td><strong><?php echo $row['name']; ?></strong></td>
                            <td><?php echo $row['mobile']; ?></td>
                            <td><span class="badge badge-info"><?php echo $row['category_name'] ?? 'N/A'; ?></span></td>
                            <td><?php echo $row['total_visits']; ?></td>
                            <td><span class="badge badge-success" style="font-size: 14px;"><?php echo $row['total_rewards']; ?></span></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
                </div>
            </div>

            <?php else: ?>
            <!-- Visits Tab -->
            <div class="admin-card">
                <h3><i class="fas fa-search"></i> Search Customer Visit History</h3>
                <form method="GET" class="search-box">
                    <input type="hidden" name="tab" value="visits">
                    <input type="hidden" name="category" value="<?php echo $cat_filter; ?>">
                    <input type="text" name="search" placeholder="Enter customer name or mobile number..." value="<?php echo htmlspecialchars($search); ?>">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-search"></i> Search</button>
                    <?php if (!empty($search)): ?>
                    <a href="?tab=visits&category=<?php echo $cat_filter; ?>" class="btn btn-outline">Clear</a>
                    <?php endif; ?>
                </form>
            </div>

            <?php if ($customerDetails && $customerDetails->num_rows > 0): ?>
            <div class="admin-card">
                <h3><i class="fas fa-users"></i> Matching Customers (<?php echo $customerDetails->num_rows; ?>)</h3>
                <?php while($customer = $customerDetails->fetch_assoc()): ?>
                <div class="customer-card">
                    <h4><?php echo $customer['name']; ?></h4>
                    <p><i class="fas fa-phone"></i> <?php echo $customer['mobile']; ?> | <i class="fas fa-tag"></i> <?php echo $customer['category_name'] ?? 'N/A'; ?></p>
                    <p><i class="fas fa-map-marker-alt"></i> <?php echo $customer['address'] ?? 'No address'; ?></p>
                    <div class="stats">
                        <div class="stat">Total Visits: <span><?php echo $customer['total_visits']; ?></span></div>
                        <div class="stat">Total Rewards: <span><?php echo $customer['total_rewards']; ?></span></div>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>
            <?php endif; ?>

                        <div class="admin-card">
                            <h3>Filter by Category & Date</h3>
                            <form method="GET" style="display: flex; gap: 15px; flex-wrap: wrap; align-items: end;">
                                <input type="hidden" name="tab" value="visits">
                                <input type="hidden" name="search" value="<?php echo htmlspecialchars($search); ?>">
                                <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                                    <label>Category</label>
                                    <select name="category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                        <option value="">All Categories</option>
                                        <?php foreach ($categories as $cat): ?>
                                        <option value="<?php echo $cat['id']; ?>" <?php echo $cat_filter == $cat['id'] ? 'selected' : ''; ?>>
                                            <?php echo $cat['name']; ?>
                                        </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
                                    <label>Date Range</label>
                                                            <select name="date_range" id="date_range_visits" onchange="toggleDateFields('visits')" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                                <option value="lifetime" <?php echo $date_filter == 'lifetime' ? 'selected' : ''; ?>>Lifetime</option>
                                                                <option value="this_month" <?php echo $date_filter == 'this_month' ? 'selected' : ''; ?>>This Month</option>
                                                                <option value="month" <?php echo $date_filter == 'month' ? 'selected' : ''; ?>>Last Month</option>
                                                                <option value="3months" <?php echo $date_filter == '3months' ? 'selected' : ''; ?>>Last 3 Months</option>
                                                                <option value="year" <?php echo $date_filter == 'year' ? 'selected' : ''; ?>>Last Year</option>
                                                                <option value="custom" <?php echo $date_filter == 'custom' ? 'selected' : ''; ?>>Custom Date</option>
                                                            </select>
                                                        </div>
                                                        <div class="form-group" style="margin: 0; flex: 1; min-width: 130px; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_from_visits">
                                                            <label>From</label>
                                                            <input type="date" name="date_from" value="<?php echo htmlspecialchars($date_from); ?>" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                        </div>
                                                        <div class="form-group" style="margin: 0; flex: 1; min-width: 130px; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_to_visits">
                                                            <label>To</label>
                                                            <input type="date" name="date_to" value="<?php echo htmlspecialchars($date_to); ?>" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                                        </div>
                                                        <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                                                    </form>
                                                </div>

            <div class="admin-card">
                <h3><i class="fas fa-history"></i> Visit History <?php echo !empty($search) ? '(Filtered)' : '(Recent 500)'; ?> - <?php echo $visitsData->num_rows; ?> visits</h3>
                <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Mobile</th>
                            <th>Category</th>
                            <th>Items</th>
                            <th>Rewards</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($visitsData->num_rows === 0): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; color: #888;">No visits found<?php echo !empty($search) ? ' for "' . htmlspecialchars($search) . '"' : ''; ?></td>
                        </tr>
                        <?php else: ?>
                        <?php while($row = $visitsData->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo date('d M Y', strtotime($row['visit_date'])); ?></strong></td>
                            <td><?php echo $row['customer_name']; ?></td>
                            <td><?php echo $row['customer_mobile']; ?></td>
                            <td><span class="badge badge-info"><?php echo $row['category_name'] ?? 'N/A'; ?></span></td>
                            <td><?php echo $row['items_description'] ?? '-'; ?></td>
                            <td><span class="badge badge-success"><?php echo $row['rewards']; ?></span></td>
                        </tr>
                        <?php endwhile; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
                </div>
            </div>
            <?php endif; ?>

        </main>
    </div>
<script>
function toggleDateFields(tab) {
    var select = document.getElementById('date_range_' + tab);
    var fromField = document.getElementById('date_from_' + tab);
    var toField = document.getElementById('date_to_' + tab);
    
    if (select && fromField && toField) {
        if (select.value === 'custom') {
            fromField.style.display = 'block';
            toField.style.display = 'block';
        } else {
            fromField.style.display = 'none';
            toField.style.display = 'none';
        }
    }
}
</script>
</body>
</html>
<?php $conn->close(); ?>
