<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Get active offers
$offers = $conn->query("SELECT * FROM offers WHERE is_visible = 1 AND status = 'active' ORDER BY created_at DESC");

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offers - <?php echo $site_name; ?> Customer Portal</title>
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
            <a href="rewards.php"><i class="fas fa-gift"></i> Rewards</a>
            <a href="offers.php" class="active"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php"><i class="fas fa-trophy"></i> Winners</a>
            <a href="change-password.php"><i class="fas fa-key"></i> Password</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <h1 style="margin-bottom: 20px;"><i class="fas fa-tags"></i> Current Offers</h1>

            <!-- Your Rewards Status -->
            <div class="rewards-status">
                <div class="status-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="status-info">
                    <span>Your Current Rewards</span>
                    <strong><?php echo formatCurrency($mason['total_rewards']); ?></strong>
                </div>
            </div>

            <!-- Offers Grid -->
            <?php if ($offers->num_rows > 0): ?>
            <div class="offers-grid">
                <?php while($offer = $offers->fetch_assoc()): 
                    $eligible = $mason['total_rewards'] >= $offer['min_rewards'];
                ?>
                <div class="offer-card <?php echo $eligible ? 'eligible' : ''; ?>">
                    <?php if ($offer['image']): ?>
                    <div class="offer-image">
                        <img src="<?php echo $offer['image']; ?>" alt="<?php echo $offer['title']; ?>">
                        <?php if ($eligible): ?>
                        <div class="eligible-badge"><i class="fas fa-check-circle"></i> You're Eligible!</div>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    <div class="offer-content">
                        <h3><?php echo $offer['title']; ?></h3>
                        <p class="offer-description"><?php echo $offer['description']; ?></p>
                        
                        <div class="offer-prize">
                            <i class="fas fa-gift"></i>
                            <span><?php echo $offer['prize_description']; ?></span>
                        </div>
                        
                        <div class="offer-requirements">
                            <div class="requirement">
                                <span class="label">Minimum Rewards Required</span>
                                <span class="value"><?php echo formatCurrency($offer['min_rewards']); ?></span>
                            </div>
                            <div class="requirement">
                                <span class="label">Your Rewards</span>
                                <span class="value <?php echo $eligible ? 'text-success' : 'text-danger'; ?>">
                                    <?php echo formatCurrency($mason['total_rewards']); ?>
                                </span>
                            </div>
                        </div>
                        
                        <?php if (!$eligible): ?>
                        <div class="progress-bar">
                            <div class="progress" style="width: <?php echo min(100, ($mason['total_rewards'] / $offer['min_rewards']) * 100); ?>%"></div>
                        </div>
                        <p class="progress-text">
                            <?php echo formatCurrency($offer['min_rewards'] - $mason['total_rewards']); ?> more to go!
                        </p>
                        <?php endif; ?>
                        
                        <div class="offer-validity">
                            <i class="fas fa-calendar"></i>
                            Valid till <?php echo formatDate($offer['end_date']); ?>
                        </div>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>
            <?php else: ?>
            <div class="no-offers">
                <i class="fas fa-tags"></i>
                <h3>No Active Offers</h3>
                <p>Check back later for exciting offers!</p>
            </div>
            <?php endif; ?>
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
        .rewards-status {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 15px;
            padding: 20px 30px;
            color: white;
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-icon {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .status-info span {
            display: block;
            opacity: 0.8;
            font-size: 14px;
        }
        .status-info strong {
            font-size: 28px;
        }
        .offers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        .offer-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
            transition: transform 0.3s;
        }
        .offer-card:hover {
            transform: translateY(-5px);
        }
        .offer-card.eligible {
            border: 3px solid #4caf50;
        }
        .offer-image {
            position: relative;
            height: 200px;
        }
        .offer-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .eligible-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #4caf50;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .offer-content {
            padding: 25px;
        }
        .offer-content h3 {
            font-size: 22px;
            margin-bottom: 10px;
        }
        .offer-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .offer-prize {
            background: linear-gradient(135deg, #fff9c4 0%, #ffecb3 100%);
            padding: 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .offer-prize i {
            color: #ffa000;
            font-size: 20px;
        }
        .offer-requirements {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .requirement {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .requirement .label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .requirement .value {
            font-size: 18px;
            font-weight: 700;
        }
        .text-success {
            color: #4caf50;
        }
        .text-danger {
            color: #f44336;
        }
        .progress-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .progress {
            height: 100%;
            background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
            border-radius: 4px;
        }
        .progress-text {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .offer-validity {
            text-align: center;
            color: #999;
            font-size: 14px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        .no-offers {
            text-align: center;
            padding: 60px;
            background: white;
            border-radius: 15px;
        }
        .no-offers i {
            font-size: 60px;
            color: #ddd;
            margin-bottom: 20px;
        }
        .no-offers h3 {
            margin-bottom: 10px;
        }
        .no-offers p {
            color: #666;
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
            .rewards-status {
                padding: 15px;
            }
            .status-icon {
                width: 50px;
                height: 50px;
                font-size: 20px;
            }
            .status-info strong {
                font-size: 22px;
            }
            .offers-grid {
                grid-template-columns: 1fr;
            }
            .offer-requirements {
                grid-template-columns: 1fr;
            }
        }
    </style>
</body>
</html>
<?php $conn->close(); ?>
