<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isMason()) {
    redirect('login.php');
}

$conn = getDBConnection();
$mason_id = $_SESSION['mason_id'];

// Get mason details
$mason = $conn->query("SELECT * FROM masons WHERE id = $mason_id")->fetch_assoc();

// Get recent visits
$recentVisits = $conn->query("SELECT * FROM mason_visits WHERE mason_id = $mason_id ORDER BY visit_date DESC LIMIT 5");

// Get top performers
$topPerformers = $conn->query("SELECT * FROM masons ORDER BY total_rewards DESC LIMIT 5");

// Get active offers
$offers = $conn->query("SELECT * FROM offers WHERE is_visible = 1 AND status = 'active' ORDER BY created_at DESC");

// Get meeting invites for this customer
$meetings = $conn->query("SELECT m.*, mi.attended
    FROM meetings m 
    INNER JOIN meeting_invites mi ON m.id = mi.meeting_id AND mi.customer_id = $mason_id
    ORDER BY m.meeting_date DESC LIMIT 5");

// Get gifts for this customer
$gifts = $conn->query("SELECT gr.*, ge.title as gift_name, ge.description as gift_description,
    CASE WHEN gr.is_delivered = 1 THEN 'delivered' ELSE 'selected' END as status,
    ge.event_date as occasion
    FROM gift_recipients gr 
    LEFT JOIN gift_events ge ON gr.event_id = ge.id 
    WHERE gr.customer_id = $mason_id 
    ORDER BY gr.created_at DESC LIMIT 5");

$logo = getSetting('logo', 'https://jptiles.in/wp-content/uploads/2025/01/Untitled-design-2025-01-31T170820.186.png');
$site_name = getSetting('site_name', 'JP Tiles');
$top_performers_visible = getSetting('top_performers_visible', '1');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo $site_name; ?> Customer Portal</title>
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
            <a href="index.php" class="active"><i class="fas fa-home"></i> Dashboard</a>
            <a href="visits.php"><i class="fas fa-clipboard-list"></i> My Visits</a>
            <a href="rewards.php"><i class="fas fa-gift"></i> Rewards</a>
            <a href="offers.php"><i class="fas fa-tags"></i> Offers</a>
            <a href="winners.php"><i class="fas fa-trophy"></i> Winners</a>
            <a href="change-password.php"><i class="fas fa-key"></i> Password</a>
        </nav>

        <!-- Main Content -->
        <main class="mason-content">
            <!-- Welcome Card -->
            <div class="mason-welcome-card">
                <div class="welcome-photo">
                    <?php if (!empty($mason['photo'])): ?>
                    <img src="../uploads/customers/<?php echo $mason['photo']; ?>" alt="<?php echo $mason['name']; ?>">
                    <?php else: ?>
                    <div class="photo-placeholder"><i class="fas fa-user"></i></div>
                    <?php endif; ?>
                </div>
                <div class="welcome-info">
                    <h2>Hello, <?php echo $mason['name']; ?>!</h2>
                    <p class="welcome-mobile"><i class="fas fa-phone"></i> <?php echo $mason['mobile']; ?></p>
                    <p>Track your visits, rewards, and stay updated with latest offers.</p>
                </div>
                <div class="welcome-stats">
                    <div class="welcome-stat">
                        <span class="stat-num"><?php echo $mason['total_visits']; ?></span>
                        <span class="stat-label">Visits</span>
                    </div>
                    <div class="welcome-stat highlight">
                        <span class="stat-num"><?php echo $mason['total_rewards']; ?></span>
                        <span class="stat-label">Rewards</span>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="mason-stats">
                <div class="mason-stat-card">
                    <div class="stat-icon" style="background: #e3f2fd;">
                        <i class="fas fa-calendar-check" style="color: #1976d2;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Visits</h4>
                        <p class="stat-value"><?php echo $mason['total_visits']; ?></p>
                    </div>
                </div>
                <div class="mason-stat-card">
                    <div class="stat-icon" style="background: #e8f5e9;">
                        <i class="fas fa-rupee-sign" style="color: #388e3c;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Amount</h4>
                        <p class="stat-value"><?php echo formatCurrency($mason['total_amount']); ?></p>
                    </div>
                </div>
                <div class="mason-stat-card highlight">
                    <div class="stat-icon" style="background: rgba(255,255,255,0.2);">
                        <i class="fas fa-gift" style="color: white;"></i>
                    </div>
                    <div class="stat-info">
                        <h4>Total Rewards</h4>
                        <p class="stat-value"><?php echo formatCurrency($mason['total_rewards']); ?></p>
                    </div>
                </div>
            </div>

            <div class="mason-grid">
                <!-- Recent Visits -->
                <div class="mason-card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Recent Visits</h3>
                        <a href="visits.php" class="view-all">View All</a>
                    </div>
                    <div class="card-body">
                        <?php if ($recentVisits->num_rows > 0): ?>
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Amount</th>
                                    <th>Rewards</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php while($visit = $recentVisits->fetch_assoc()): ?>
                                <tr>
                                    <td><?php echo formatDate($visit['visit_date']); ?></td>
                                    <td><?php echo substr($visit['items_description'], 0, 30); ?>...</td>
                                    <td><?php echo formatCurrency($visit['amount']); ?></td>
                                    <td><span class="badge badge-success"><?php echo formatCurrency($visit['rewards']); ?></span></td>
                                </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                        <?php else: ?>
                        <p class="no-data">No visits recorded yet</p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Top Performers -->
                <?php if ($top_performers_visible === '1'): ?>
                <div class="mason-card">
                    <div class="card-header">
                        <h3><i class="fas fa-trophy"></i> Top Performers</h3>
                    </div>
                    <div class="card-body">
                        <div class="performer-list">
                            <?php 
                            $rank = 1;
                            while($performer = $topPerformers->fetch_assoc()): 
                            ?>
                            <div class="performer-item <?php echo $performer['id'] == $mason_id ? 'current-user' : ''; ?>">
                                <div class="performer-rank <?php echo $rank <= 3 ? 'top-' . $rank : ''; ?>">
                                    <?php if ($rank == 1): ?>
                                    <i class="fas fa-crown"></i>
                                    <?php else: ?>
                                    <?php echo $rank; ?>
                                    <?php endif; ?>
                                </div>
                                <div class="performer-info">
                                    <strong><?php echo $performer['name']; ?></strong>
                                    <?php if ($performer['id'] == $mason_id): ?>
                                    <span class="you-badge">You</span>
                                    <?php endif; ?>
                                </div>
                                <div class="performer-rewards">
                                    <?php echo formatCurrency($performer['total_rewards']); ?>
                                </div>
                            </div>
                            <?php 
                            $rank++;
                            endwhile; 
                            ?>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>

            <!-- Active Offers -->
            <?php if ($offers->num_rows > 0): ?>
            <div class="mason-card full-width">
                <div class="card-header">
                    <h3><i class="fas fa-tags"></i> Active Offers</h3>
                    <a href="offers.php" class="view-all">View All</a>
                </div>
                <div class="card-body">
                    <div class="offers-grid">
                        <?php while($offer = $offers->fetch_assoc()): ?>
                        <div class="offer-card">
                            <?php if ($offer['image']): ?>
                            <img src="<?php echo $offer['image']; ?>" alt="" class="offer-image">
                            <?php endif; ?>
                            <div class="offer-content">
                                <h4><?php echo $offer['title']; ?></h4>
                                <p><?php echo $offer['description']; ?></p>
                                <div class="offer-meta">
                                    <span><i class="fas fa-gift"></i> Min Rewards: <?php echo formatCurrency($offer['min_rewards']); ?></span>
                                    <span><i class="fas fa-calendar"></i> Till <?php echo formatDate($offer['end_date']); ?></span>
                                </div>
                            </div>
                        </div>
                        <?php endwhile; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Meeting Invites Section -->
            <div class="mason-card full-width">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-alt"></i> Meeting Invites</h3>
                </div>
                <div class="card-body">
                    <?php if ($meetings && $meetings->num_rows > 0): ?>
                    <div class="meetings-list">
                        <?php while($meeting = $meetings->fetch_assoc()): ?>
                        <div class="meeting-item <?php echo $meeting['attended'] ? 'attended' : ''; ?>">
                            <div class="meeting-icon">
                                <i class="fas <?php echo $meeting['attended'] ? 'fa-check-circle' : 'fa-calendar'; ?>"></i>
                            </div>
                            <div class="meeting-info">
                                <h4><?php echo htmlspecialchars($meeting['title']); ?></h4>
                                <p><i class="fas fa-calendar"></i> <?php echo formatDate($meeting['meeting_date']); ?></p>
                                <p><i class="fas fa-map-marker-alt"></i> <?php echo htmlspecialchars($meeting['location'] ?? 'TBA'); ?></p>
                                <span class="meeting-status <?php echo $meeting['attended'] ? 'status-attended' : 'status-invited'; ?>">
                                    <?php echo $meeting['attended'] ? 'Attended' : 'Invited'; ?>
                                </span>
                            </div>
                            <?php if (!empty($meeting['whatsapp_link'])): ?>
                            <a href="<?php echo htmlspecialchars($meeting['whatsapp_link']); ?>" target="_blank" class="whatsapp-btn">
                                <i class="fab fa-whatsapp"></i> Join WhatsApp
                            </a>
                            <?php endif; ?>
                        </div>
                        <?php endwhile; ?>
                    </div>
                    <?php else: ?>
                    <p class="no-data">No meeting invites yet</p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- My Gifts Section -->
            <div class="mason-card full-width">
                <div class="card-header">
                    <h3><i class="fas fa-gift"></i> My Gifts</h3>
                </div>
                <div class="card-body">
                    <?php if ($gifts && $gifts->num_rows > 0): ?>
                    <div class="gifts-list">
                        <?php while($gift = $gifts->fetch_assoc()): ?>
                        <div class="gift-item <?php echo $gift['status'] == 'delivered' ? 'delivered' : ''; ?>">
                            <div class="gift-icon">
                                <i class="fas <?php echo $gift['status'] == 'delivered' ? 'fa-check-circle' : 'fa-gift'; ?>"></i>
                            </div>
                            <div class="gift-info">
                                <h4><?php echo htmlspecialchars($gift['gift_name'] ?? 'Gift'); ?></h4>
                                <p><?php echo htmlspecialchars($gift['occasion'] ?? ''); ?></p>
                                <span class="gift-status <?php echo $gift['status'] == 'delivered' ? 'status-delivered' : 'status-selected'; ?>">
                                    <?php echo $gift['status'] == 'delivered' ? 'Delivered' : 'Selected for Gift'; ?>
                                </span>
                            </div>
                            <?php if (!empty($gift['delivered_date'])): ?>
                            <div class="gift-date">
                                <i class="fas fa-calendar-check"></i> <?php echo formatDate($gift['delivered_date']); ?>
                            </div>
                            <?php endif; ?>
                        </div>
                        <?php endwhile; ?>
                    </div>
                    <?php else: ?>
                    <p class="no-data">No gifts yet</p>
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
            max-width: 1400px;
            margin: 0 auto;
        }
        .mason-welcome-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 15px;
            padding: 25px;
            color: white;
            display: flex;
            gap: 20px;
            align-items: center;
            margin-bottom: 30px;
        }
        .welcome-photo {
            flex-shrink: 0;
        }
        .welcome-photo img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #c9a227;
        }
        .welcome-photo .photo-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: rgba(255,255,255,0.5);
            border: 3px solid #c9a227;
        }
        .welcome-info {
            flex: 1;
        }
        .welcome-info h2 {
            font-size: 22px;
            margin-bottom: 5px;
        }
        .welcome-mobile {
            color: #c9a227;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .welcome-info p {
            font-size: 13px;
            opacity: 0.8;
        }
        .welcome-stats {
            display: flex;
            gap: 15px;
        }
        .welcome-stat {
            text-align: center;
            padding: 10px 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .welcome-stat.highlight {
            background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%);
        }
        .welcome-stat .stat-num {
            display: block;
            font-size: 24px;
            font-weight: 700;
        }
        .welcome-stat .stat-label {
            font-size: 11px;
            opacity: 0.8;
        }
        .mason-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
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
            color: inherit;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 700;
        }
        .mason-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .mason-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .mason-card.full-width {
            grid-column: 1 / -1;
        }
        .card-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-header h3 {
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .view-all {
            color: #c9a227;
            text-decoration: none;
            font-size: 14px;
        }
        .card-body {
            padding: 20px;
        }
        .simple-table {
            width: 100%;
            border-collapse: collapse;
        }
        .simple-table th, .simple-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .simple-table th {
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
        }
        .performer-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .performer-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
        }
        .performer-item.current-user {
            background: #e8f5e9;
            border: 2px solid #4caf50;
        }
        .performer-rank {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
        }
        .performer-rank.top-1 {
            background: linear-gradient(135deg, #ffd700, #ffb300);
            color: white;
        }
        .performer-rank.top-2 {
            background: linear-gradient(135deg, #c0c0c0, #9e9e9e);
            color: white;
        }
        .performer-rank.top-3 {
            background: linear-gradient(135deg, #cd7f32, #a0522d);
            color: white;
        }
        .performer-info {
            flex: 1;
        }
        .you-badge {
            background: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-left: 10px;
        }
        .performer-rewards {
            font-weight: 700;
            color: #c9a227;
        }
        .offers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .offer-card {
            border: 1px solid #eee;
            border-radius: 10px;
            overflow: hidden;
        }
        .offer-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        .offer-content {
            padding: 15px;
        }
        .offer-content h4 {
            margin-bottom: 10px;
        }
        .offer-content p {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .offer-meta {
            display: flex;
            gap: 15px;
            font-size: 12px;
            color: #999;
        }
        .no-data {
            text-align: center;
            color: #999;
            padding: 30px;
        }
        /* Meeting Invites Styles */
        .meetings-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .meeting-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #c9a227;
        }
        .meeting-item.attended {
            border-left-color: #4caf50;
            background: #e8f5e9;
        }
        .meeting-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #c9a227;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        .meeting-item.attended .meeting-icon {
            background: #4caf50;
        }
        .meeting-info {
            flex: 1;
        }
        .meeting-info h4 {
            margin-bottom: 5px;
            color: #333;
        }
        .meeting-info p {
            font-size: 13px;
            color: #666;
            margin-bottom: 3px;
        }
        .meeting-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-invited {
            background: #fff3cd;
            color: #856404;
        }
        .status-attended {
            background: #d4edda;
            color: #155724;
        }
        .whatsapp-btn {
            background: #25d366;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            text-decoration: none;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .whatsapp-btn:hover {
            background: #128c7e;
        }
        /* Gifts Styles */
        .gifts-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .gift-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #c9a227;
        }
        .gift-item.delivered {
            border-left-color: #4caf50;
            background: #e8f5e9;
        }
        .gift-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #c9a227;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        .gift-item.delivered .gift-icon {
            background: #4caf50;
        }
        .gift-info {
            flex: 1;
        }
        .gift-info h4 {
            margin-bottom: 5px;
            color: #333;
        }
        .gift-info p {
            font-size: 13px;
            color: #666;
            margin-bottom: 5px;
        }
        .gift-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-selected {
            background: #fff3cd;
            color: #856404;
        }
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        .gift-date {
            font-size: 12px;
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
            .mason-grid {
                grid-template-columns: 1fr;
            }
            .mason-welcome-card {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
            .welcome-info h2 {
                font-size: 18px;
            }
            .welcome-stats {
                width: 100%;
                justify-content: center;
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
        }
    </style>
</body>
</html>
<?php $conn->close(); ?>
