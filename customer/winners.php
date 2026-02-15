<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Get all winners with photos
$winners = $conn->query("SELECT rw.*, m.name as mason_name, o.title as offer_title 
                         FROM reward_winners rw 
                         JOIN masons m ON rw.mason_id = m.id 
                         LEFT JOIN offers o ON rw.offer_id = o.id 
                         ORDER BY rw.prize_date DESC");

$logo = getSetting('logo', 'https://jptiles.in/assets/images/logo.webp');
$site_name = getSetting('site_name', 'JP Tiles');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Winners - <?php echo $site_name; ?> Customer Portal</title>
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
            <a href="offers.php"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php" class="active"><i class="fas fa-trophy"></i> Winners</a>
            <a href="change-password.php"><i class="fas fa-key"></i> Password</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <h1 style="margin-bottom: 20px;"><i class="fas fa-trophy"></i> Winners Gallery</h1>

            <!-- Winners Grid -->
            <?php if ($winners->num_rows > 0): ?>
            <div class="winners-grid">
                <?php while($winner = $winners->fetch_assoc()): 
                    $photos = $conn->query("SELECT * FROM winner_photos WHERE winner_id = {$winner['id']}");
                    $isCurrentUser = $winner['mason_id'] == $mason_id;
                ?>
                <div class="winner-card <?php echo $isCurrentUser ? 'current-user' : ''; ?>">
                    <div class="winner-header">
                        <div class="winner-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="winner-info">
                            <h3>
                                <?php echo $winner['mason_name']; ?>
                                <?php if ($isCurrentUser): ?>
                                <span class="you-badge">You!</span>
                                <?php endif; ?>
                            </h3>
                            <p><?php echo $winner['offer_title'] ?: 'Special Reward'; ?></p>
                        </div>
                        <div class="winner-trophy">
                            <i class="fas fa-trophy"></i>
                        </div>
                    </div>
                    
                    <div class="winner-prize">
                        <i class="fas fa-gift"></i>
                        <span><?php echo $winner['prize_given']; ?></span>
                    </div>
                    
                    <?php if ($photos->num_rows > 0): ?>
                    <div class="winner-photos">
                        <?php while($photo = $photos->fetch_assoc()): ?>
                        <div class="photo-item" onclick="openLightbox('<?php echo $photo['photo_path']; ?>')">
                            <img src="<?php echo $photo['photo_path']; ?>" alt="">
                        </div>
                        <?php endwhile; ?>
                    </div>
                    <?php endif; ?>
                    
                    <div class="winner-date">
                        <i class="fas fa-calendar"></i>
                        <?php echo formatDate($winner['prize_date']); ?>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>
            <?php else: ?>
            <div class="no-winners">
                <i class="fas fa-trophy"></i>
                <h3>No Winners Yet</h3>
                <p>Be the first to win! Keep earning rewards to participate in offers.</p>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox" onclick="closeLightbox()">
        <span class="close-lightbox">&times;</span>
        <img id="lightbox-img" src="" alt="">
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
        .winners-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        .winner-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        .winner-card.current-user {
            border: 3px solid #ffd700;
            background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
        }
        .winner-header {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
        }
        .winner-avatar {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .winner-info {
            flex: 1;
        }
        .winner-info h3 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .winner-info p {
            font-size: 14px;
            opacity: 0.8;
        }
        .you-badge {
            background: #ffd700;
            color: #333;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 10px;
        }
        .winner-trophy {
            font-size: 30px;
            color: #ffd700;
        }
        .winner-prize {
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 600;
            border-bottom: 1px solid #eee;
        }
        .winner-prize i {
            color: #ffa000;
        }
        .winner-photos {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            padding: 15px;
        }
        .photo-item {
            aspect-ratio: 1;
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .photo-item:hover {
            transform: scale(1.05);
        }
        .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .winner-date {
            padding: 15px 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        .no-winners {
            text-align: center;
            padding: 60px;
            background: white;
            border-radius: 15px;
        }
        .no-winners i {
            font-size: 60px;
            color: #ddd;
            margin-bottom: 20px;
        }
        .no-winners h3 {
            margin-bottom: 10px;
        }
        .no-winners p {
            color: #666;
        }
        .lightbox {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        }
        .lightbox.active {
            display: flex;
        }
        .lightbox img {
            max-width: 90%;
            max-height: 90%;
            border-radius: 10px;
        }
        .close-lightbox {
            position: absolute;
            top: 20px;
            right: 30px;
            color: white;
            font-size: 40px;
            cursor: pointer;
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
            .winners-grid {
                grid-template-columns: 1fr;
            }
            .winner-header {
                padding: 15px;
            }
            .winner-info h3 {
                font-size: 16px;
            }
        }
    </style>

    <script>
        function openLightbox(src) {
            document.getElementById('lightbox-img').src = src;
            document.getElementById('lightbox').classList.add('active');
        }
        
        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
