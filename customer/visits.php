<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Filters
$date_filter = isset($_GET['date_range']) ? $_GET['date_range'] : 'lifetime';
$date_from = sanitize($_GET['date_from'] ?? '');
$date_to = sanitize($_GET['date_to'] ?? '');

$where = "mason_id = $mason_id";

// Calculate date range
switch ($date_filter) {
    case 'this_month':
        $start_date = date('Y-m-01');
        $where .= " AND visit_date >= '$start_date'";
        break;
    case 'month':
        $start_date = date('Y-m-d', strtotime('-1 month'));
        $where .= " AND visit_date >= '$start_date'";
        break;
    case '3months':
        $start_date = date('Y-m-d', strtotime('-3 months'));
        $where .= " AND visit_date >= '$start_date'";
        break;
    case 'year':
        $start_date = date('Y-m-d', strtotime('-1 year'));
        $where .= " AND visit_date >= '$start_date'";
        break;
    case 'custom':
        if (!empty($date_from) && !empty($date_to)) {
            $where .= " AND visit_date BETWEEN '$date_from' AND '$date_to'";
        }
        break;
    case 'lifetime':
    default:
        break;
}

// Get visits
$visits = $conn->query("SELECT * FROM mason_visits WHERE $where ORDER BY visit_date DESC, visit_time DESC");

// Get summary
$summary = $conn->query("SELECT COUNT(*) as total_visits, SUM(amount) as total_amount, SUM(rewards) as total_rewards FROM mason_visits WHERE $where")->fetch_assoc();

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Visits - <?php echo $site_name; ?> Customer Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="mason-style.css">
</head>
<body>
    <div class="mason-wrapper">
        <!-- Header -->
        <header class="mason-header">
            <div class="mason-header-left">
                <img src="<?php echo $logo; ?>" alt="<?php echo $site_name; ?>" style="height: 40px;">
            </div>
            <div class="mason-header-right">
                <span>Welcome, <?php echo $mason['name']; ?></span>
                <a href="logout.php" class="btn btn-outline" style="padding: 8px 15px;"><i class="fas fa-sign-out-alt"></i></a>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="mason-nav">
            <a href="index.php"><i class="fas fa-home"></i> Dashboard</a>
            <a href="visits.php" class="active"><i class="fas fa-clipboard-list"></i> My Visits</a>
            <a href="rewards.php"><i class="fas fa-gift"></i> Rewards</a>
            <a href="offers.php"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php"><i class="fas fa-trophy"></i> Winners</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <h1 style="margin-bottom: 20px;"><i class="fas fa-clipboard-list"></i> My Visit History</h1>

            <!-- Filters -->
            <div class="mason-card" style="margin-bottom: 20px;">
                <div class="card-body">
                    <form method="GET" style="display: flex; gap: 15px; flex-wrap: wrap; align-items: end;">
                        <div class="form-group" style="margin: 0; flex: 1; min-width: 140px;">
                            <label>Date Range</label>
                            <select name="date_range" id="date_range" onchange="toggleDateFields()" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <option value="lifetime" <?php echo $date_filter == 'lifetime' ? 'selected' : ''; ?>>Lifetime</option>
                                <option value="this_month" <?php echo $date_filter == 'this_month' ? 'selected' : ''; ?>>This Month</option>
                                <option value="month" <?php echo $date_filter == 'month' ? 'selected' : ''; ?>>Last Month</option>
                                <option value="3months" <?php echo $date_filter == '3months' ? 'selected' : ''; ?>>Last 3 Months</option>
                                <option value="year" <?php echo $date_filter == 'year' ? 'selected' : ''; ?>>Last Year</option>
                                <option value="custom" <?php echo $date_filter == 'custom' ? 'selected' : ''; ?>>Custom Date</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_from_group">
                            <label>From</label>
                            <input type="date" name="date_from" value="<?php echo $date_from; ?>" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div class="form-group" style="margin: 0; <?php echo $date_filter != 'custom' ? 'display:none;' : ''; ?>" id="date_to_group">
                            <label>To</label>
                            <input type="date" name="date_to" value="<?php echo $date_to; ?>" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-filter"></i> Filter</button>
                        <a href="visits.php" class="btn btn-outline">Clear</a>
                    </form>
                </div>
            </div>

            <!-- Summary -->
            <div class="mason-stats" style="margin-bottom: 20px;">
                <div class="mason-stat-card">
                    <div class="stat-icon" style="background: #e3f2fd;">
                        <i class="fas fa-calendar-check" style="color: #1976d2;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Visits</h4>
                        <p class="stat-value"><?php echo $summary['total_visits'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="mason-stat-card">
                    <div class="stat-icon" style="background: #e8f5e9;">
                        <i class="fas fa-rupee-sign" style="color: #388e3c;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Amount</h4>
                        <p class="stat-value"><?php echo formatCurrency($summary['total_amount'] ?? 0); ?></p>
                    </div>
                </div>
                <div class="mason-stat-card highlight">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
                        <i class="fas fa-gift" style="color: white;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Rewards</h4>
                        <p class="stat-value"><?php echo formatCurrency($summary['total_rewards'] ?? 0); ?></p>
                    </div>
                </div>
            </div>

            <!-- Visits List -->
            <div class="mason-card">
                <div class="card-header">
                    <h3>Visit Details (<?php echo $visits->num_rows; ?> entries)</h3>
                </div>
                <div class="card-body">
                    <?php if ($visits->num_rows > 0): ?>
                    <div class="visits-list">
                        <?php while($visit = $visits->fetch_assoc()): ?>
                        <div class="visit-item">
                            <div class="visit-date">
                                <div class="date-day"><?php echo date('d', strtotime($visit['visit_date'])); ?></div>
                                <div class="date-month"><?php echo date('M Y', strtotime($visit['visit_date'])); ?></div>
                            </div>
                            <div class="visit-details">
                                <div class="visit-time"><i class="fas fa-clock"></i> <?php echo date('h:i A', strtotime($visit['visit_time'])); ?></div>
                                <div class="visit-items"><?php echo $visit['items_description']; ?></div>
                                <?php if ($visit['notes']): ?>
                                <div class="visit-notes"><i class="fas fa-sticky-note"></i> <?php echo $visit['notes']; ?></div>
                                <?php endif; ?>
                            </div>
                            <div class="visit-amounts">
                                <div class="amount">
                                    <span class="label">Amount</span>
                                    <span class="value"><?php echo formatCurrency($visit['amount']); ?></span>
                                </div>
                                <div class="rewards">
                                    <span class="label">Rewards</span>
                                    <span class="value badge badge-success"><?php echo formatCurrency($visit['rewards']); ?></span>
                                </div>
                            </div>
                        </div>
                        <?php endwhile; ?>
                    </div>
                    <?php else: ?>
                    <p class="no-data">No visits found for the selected period</p>
                    <?php endif; ?>
                </div>
            </div>
        </main>
    </div>

    <style>
        .mason-wrapper {
            min-height: 100vh;
            background: #f5f7fa;
        }
        .mason-header {
            background: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .mason-header-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .mason-nav {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 0 30px;
            display: flex;
            gap: 5px;
            overflow-x: auto;
        }
        .mason-nav a {
            color: rgba(255,255,255,0.8);
            padding: 15px 20px;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.3s;
        }
        .mason-nav a:hover, .mason-nav a.active {
            color: white;
            background: rgba(255,255,255,0.1);
        }
        .mason-content {
            padding: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .mason-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .mason-stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        .mason-stat-card.highlight {
            background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
            color: white;
        }
        .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .stat-info h4 {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 700;
        }
        .mason-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .card-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .card-header h3 {
            font-size: 18px;
        }
        .card-body {
            padding: 20px;
        }
        .visits-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .visit-item {
            display: flex;
            gap: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            align-items: center;
        }
        .visit-date {
            text-align: center;
            min-width: 80px;
        }
        .date-day {
            font-size: 28px;
            font-weight: 700;
            color: #c9a227;
        }
        .date-month {
            font-size: 12px;
            color: #666;
        }
        .visit-details {
            flex: 1;
        }
        .visit-time {
            font-size: 12px;
            color: #999;
            margin-bottom: 5px;
        }
        .visit-items {
            font-weight: 500;
            margin-bottom: 5px;
        }
        .visit-notes {
            font-size: 12px;
            color: #666;
        }
        .visit-amounts {
            display: flex;
            gap: 20px;
            text-align: center;
        }
        .visit-amounts .label {
            display: block;
            font-size: 12px;
            color: #999;
            margin-bottom: 5px;
        }
        .visit-amounts .value {
            font-weight: 700;
        }
        .no-data {
            text-align: center;
            color: #999;
            padding: 30px;
        }
        @media (max-width: 768px) {
            .mason-header {
                padding: 10px 15px;
            }
            .mason-header-right span {
                display: none;
            }
            .mason-nav {
                padding: 0 10px;
            }
            .mason-nav a {
                padding: 12px 15px;
                font-size: 13px;
            }
            .mason-content {
                padding: 15px;
            }
            .mason-stats {
                grid-template-columns: 1fr;
            }
            .mason-stat-card {
                padding: 15px;
            }
            .stat-icon {
                width: 50px;
                height: 50px;
                font-size: 20px;
            }
            .stat-value {
                font-size: 20px;
            }
            .visit-item {
                flex-direction: column;
                align-items: flex-start;
            }
            .visit-amounts {
                width: 100%;
                justify-content: space-around;
            }
        }
    </style>
<script>
function toggleDateFields() {
    var select = document.getElementById('date_range');
    var fromField = document.getElementById('date_from_group');
    var toField = document.getElementById('date_to_group');
    
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
