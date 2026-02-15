<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Get monthly rewards breakdown
$monthlyRewards = $conn->query("SELECT 
    DATE_FORMAT(visit_date, '%Y-%m') as month,
    DATE_FORMAT(MIN(visit_date), '%M %Y') as month_name,
    COUNT(*) as visits,
    SUM(amount) as amount,
    SUM(rewards) as rewards
    FROM mason_visits 
    WHERE mason_id = $mason_id 
    GROUP BY DATE_FORMAT(visit_date, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12");

// Check if mason has won any prizes
$prizes = $conn->query("SELECT rw.*, o.title as offer_title FROM reward_winners rw 
                        LEFT JOIN offers o ON rw.offer_id = o.id 
                        WHERE rw.mason_id = $mason_id 
                        ORDER BY rw.prize_date DESC");

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Rewards - <?php echo $site_name; ?> Customer Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
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
            <a href="visits.php"><i class="fas fa-clipboard-list"></i> My Visits</a>
            <a href="rewards.php" class="active"><i class="fas fa-gift"></i> Rewards</a>
            <a href="offers.php"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php"><i class="fas fa-trophy"></i> Winners</a>
            <a href="change-password.php"><i class="fas fa-key"></i> Password</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <h1 style="margin-bottom: 20px;"><i class="fas fa-gift"></i> My Rewards</h1>

            <!-- Total Rewards Card -->
            <div class="rewards-hero">
                <div class="rewards-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="rewards-info">
                    <h2>Your Total Rewards</h2>
                    <div class="rewards-amount"><?php echo formatCurrency($mason['total_rewards']); ?></div>
                    <p>Keep visiting to earn more rewards!</p>
                </div>
            </div>

            <div class="rewards-grid">
                <!-- Monthly Breakdown -->
                <div class="mason-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-bar"></i> Monthly Breakdown</h3>
                    </div>
                    <div class="card-body">
                        <?php if ($monthlyRewards->num_rows > 0): ?>
                        <div class="monthly-list">
                            <?php while($month = $monthlyRewards->fetch_assoc()): ?>
                            <div class="monthly-item">
                                <div class="month-name"><?php echo $month['month_name']; ?></div>
                                <div class="month-stats">
                                    <span><i class="fas fa-calendar-check"></i> <?php echo $month['visits']; ?> visits</span>
                                    <span><i class="fas fa-rupee-sign"></i> <?php echo formatCurrency($month['amount']); ?></span>
                                </div>
                                <div class="month-rewards">
                                    <span class="badge badge-success"><?php echo formatCurrency($month['rewards']); ?></span>
                                </div>
                            </div>
                            <?php endwhile; ?>
                        </div>
                        <?php else: ?>
                        <p class="no-data">No rewards data available</p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Prizes Won -->
                <div class="mason-card">
                    <div class="card-header">
                        <h3><i class="fas fa-trophy"></i> Prizes Won</h3>
                    </div>
                    <div class="card-body">
                        <?php if ($prizes->num_rows > 0): ?>
                        <div class="prizes-list">
                            <?php while($prize = $prizes->fetch_assoc()): ?>
                            <div class="prize-item">
                                <div class="prize-icon">
                                    <i class="fas fa-award"></i>
                                </div>
                                <div class="prize-info">
                                    <h4><?php echo $prize['prize_given']; ?></h4>
                                    <p><?php echo $prize['offer_title'] ?: 'Special Reward'; ?></p>
                                    <small><?php echo formatDate($prize['prize_date']); ?></small>
                                </div>
                            </div>
                            <?php endwhile; ?>
                        </div>
                        <?php else: ?>
                        <div class="no-prizes">
                            <i class="fas fa-trophy"></i>
                            <p>No prizes won yet</p>
                            <small>Keep earning rewards to win exciting prizes!</small>
                        </div>
                        <?php endif; ?>
                    </div>
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
        .rewards-hero {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            padding: 40px;
            color: white;
            display: flex;
            align-items: center;
            gap: 30px;
            margin-bottom: 30px;
        }
        .rewards-icon {
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        .rewards-info h2 {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .rewards-amount {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .rewards-info p {
            opacity: 0.8;
        }
        .rewards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
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
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .card-body {
            padding: 20px;
        }
        .monthly-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .monthly-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .month-name {
            font-weight: 600;
            min-width: 120px;
        }
        .month-stats {
            display: flex;
            gap: 20px;
            color: #666;
            font-size: 14px;
        }
        .month-rewards {
            font-weight: 700;
        }
        .prizes-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .prize-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: linear-gradient(135deg, #fff9c4 0%, #ffecb3 100%);
            border-radius: 10px;
        }
        .prize-icon {
            width: 50px;
            height: 50px;
            background: #ffd700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        .prize-info h4 {
            margin-bottom: 5px;
        }
        .prize-info p {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .prize-info small {
            color: #999;
        }
        .no-prizes {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        .no-prizes i {
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.3;
        }
        .no-prizes p {
            font-size: 18px;
            margin-bottom: 5px;
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
            .rewards-hero {
                flex-direction: column;
                text-align: center;
                padding: 25px;
            }
            .rewards-icon {
                width: 70px;
                height: 70px;
                font-size: 30px;
            }
            .rewards-amount {
                font-size: 32px;
            }
            .rewards-grid {
                grid-template-columns: 1fr;
            }
            .monthly-item {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</body>
</html>
<?php $conn->close(); ?>
