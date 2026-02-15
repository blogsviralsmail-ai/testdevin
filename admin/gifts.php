<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdminOrEmployee()) {
    redirect('login.php');
}

if (!hasPermission('manage_gifts')) {
    setMessage('danger', 'Access denied');
    redirect('index.php');
}

$conn = getDBConnection();
$message = getMessage();
$categories = getCustomerCategories();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['add_event'])) {
        $title = sanitize($_POST['title']);
        $description = sanitize($_POST['description']);
        $event_date = sanitize($_POST['event_date']);
        $created_by = $_SESSION['user_id'];
        
        $stmt = $conn->prepare("INSERT INTO gift_events (title, description, event_date, created_by) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $title, $description, $event_date, $created_by);
        $stmt->execute();
        setMessage('success', 'Gift event created');
        redirect('gifts.php');
    }
    
    if (isset($_POST['delete_event'])) {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM gift_recipients WHERE event_id = $id");
        $conn->query("DELETE FROM gift_events WHERE id = $id");
        setMessage('success', 'Event deleted');
        redirect('gifts.php');
    }
    
    if (isset($_POST['add_recipient'])) {
        $event_id = (int)$_POST['event_id'];
        $gift_description = sanitize($_POST['gift_description']);
        $added = 0;
        
        // Support multiple customer selection
        if (isset($_POST['customer_ids']) && is_array($_POST['customer_ids'])) {
            $stmt = $conn->prepare("INSERT IGNORE INTO gift_recipients (event_id, customer_id, gift_description) VALUES (?, ?, ?)");
            foreach ($_POST['customer_ids'] as $cust_id) {
                $cust_id = (int)$cust_id;
                $stmt->bind_param("iis", $event_id, $cust_id, $gift_description);
                if ($stmt->execute()) $added++;
            }
        } elseif (isset($_POST['customer_id']) && $_POST['customer_id']) {
            $customer_id = (int)$_POST['customer_id'];
            $stmt = $conn->prepare("INSERT IGNORE INTO gift_recipients (event_id, customer_id, gift_description) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $event_id, $customer_id, $gift_description);
            if ($stmt->execute()) $added = 1;
        }
        
        setMessage('success', "$added recipient(s) added");
        redirect("gifts.php?view=$event_id");
    }
    
    if (isset($_POST['mark_delivered'])) {
        $id = (int)$_POST['id'];
        $event_id = (int)$_POST['event_id'];
        $conn->query("UPDATE gift_recipients SET is_delivered = 1, delivered_date = CURDATE() WHERE id = $id");
        setMessage('success', 'Marked as delivered');
        redirect("gifts.php?view=$event_id");
    }
    
    if (isset($_POST['remove_recipient'])) {
        $id = (int)$_POST['id'];
        $event_id = (int)$_POST['event_id'];
        $conn->query("DELETE FROM gift_recipients WHERE id = $id");
        setMessage('success', 'Recipient removed');
        redirect("gifts.php?view=$event_id");
    }
}

$view_id = (int)($_GET['view'] ?? 0);
$events = $conn->query("SELECT ge.*, 
                        (SELECT COUNT(*) FROM gift_recipients WHERE event_id = ge.id) as total_recipients,
                        (SELECT COUNT(*) FROM gift_recipients WHERE event_id = ge.id AND is_delivered = 1) as delivered_count
                        FROM gift_events ge ORDER BY ge.event_date DESC");
$customers = $conn->query("SELECT m.id, m.name, m.mobile, m.category_id, cc.name as category_name FROM masons m LEFT JOIN customer_categories cc ON m.category_id = cc.id WHERE m.status = 'active' ORDER BY cc.name, m.name");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gift Tracking - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>
        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-gift"></i> Gift Tracking</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary"><i class="fas fa-plus"></i> New Event</button>
            </div>

            <?php if ($message): ?><div class="alert alert-<?php echo $message['type']; ?>"><?php echo $message['text']; ?></div><?php endif; ?>

            <?php if ($view_id): 
                $event = $conn->query("SELECT * FROM gift_events WHERE id = $view_id")->fetch_assoc();
                $recipients = $conn->query("SELECT gr.*, m.name, m.mobile, m.address, cc.name as category_name 
                                           FROM gift_recipients gr 
                                           JOIN masons m ON gr.customer_id = m.id 
                                           LEFT JOIN customer_categories cc ON m.category_id = cc.id 
                                           WHERE gr.event_id = $view_id 
                                           ORDER BY gr.is_delivered, m.name");
            ?>
            <div class="admin-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2><?php echo $event['title']; ?></h2>
                        <p style="color: #666;"><?php echo formatDate($event['event_date']); ?> | <?php echo $event['description']; ?></p>
                    </div>
                    <a href="gifts.php" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back</a>
                </div>
                
                <form method="POST" style="margin-bottom: 20px;">
                    <input type="hidden" name="event_id" value="<?php echo $view_id; ?>">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
                        <select id="giftCategoryFilter" onchange="filterGiftCustomers()" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>"><?php echo $cat['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                        <input type="text" name="gift_description" placeholder="Gift Item (e.g., Diwali Gift Box)" required style="flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <button type="submit" name="add_recipient" class="btn btn-primary"><i class="fas fa-plus"></i> Add Selected</button>
                    </div>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <button type="button" onclick="selectAllGiftCustomers()" style="font-size: 12px; padding: 5px 10px;">Select All</button>
                        <button type="button" onclick="deselectAllGiftCustomers()" style="font-size: 12px; padding: 5px 10px;">Deselect All</button>
                    </div>
                    <div id="giftCustomerList" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: #f9f9f9;">
                        <?php $customers->data_seek(0); while($c = $customers->fetch_assoc()): ?>
                        <label class="gift-customer-item" data-category="<?php echo $c['category_id']; ?>" style="display: flex; align-items: center; padding: 6px; border-bottom: 1px solid #eee; cursor: pointer;">
                            <input type="checkbox" name="customer_ids[]" value="<?php echo $c['id']; ?>" style="margin-right: 10px;">
                            <span><strong><?php echo $c['name']; ?></strong> (<?php echo $c['mobile']; ?>) - <small style="color: #666;"><?php echo $c['category_name'] ?? 'N/A'; ?></small></span>
                        </label>
                        <?php endwhile; ?>
                    </div>
                </form>
                
                <table class="data-table">
                    <thead><tr><th>Customer</th><th>Mobile</th><th>Gift Item</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php while($r = $recipients->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $r['name']; ?></strong><br><small style="color: #666;"><?php echo $r['category_name'] ?? ''; ?></small></td>
                            <td><?php echo $r['mobile']; ?></td>
                            <td><?php echo $r['gift_description']; ?></td>
                            <td>
                                <?php if ($r['is_delivered']): ?>
                                <span class="badge badge-success"><i class="fas fa-check"></i> Delivered</span><br>
                                <small><?php echo formatDate($r['delivered_date']); ?></small>
                                <?php else: ?>
                                <span class="badge badge-warning">Pending</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <?php if (!$r['is_delivered']): ?>
                                    <form method="POST" style="display:inline">
                                        <input type="hidden" name="id" value="<?php echo $r['id']; ?>">
                                        <input type="hidden" name="event_id" value="<?php echo $view_id; ?>">
                                        <button type="submit" name="mark_delivered" class="action-btn edit" title="Mark Delivered"><i class="fas fa-check"></i></button>
                                    </form>
                                    <?php endif; ?>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Remove?')">
                                        <input type="hidden" name="id" value="<?php echo $r['id']; ?>">
                                        <input type="hidden" name="event_id" value="<?php echo $view_id; ?>">
                                        <button type="submit" name="remove_recipient" class="action-btn delete"><i class="fas fa-trash"></i></button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
            <?php else: ?>
            <div class="admin-card">
                <table class="data-table">
                    <thead><tr><th>Event</th><th>Date</th><th>Recipients</th><th>Delivered</th><th>Pending</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php while($e = $events->fetch_assoc()): ?>
                        <tr>
                            <td><strong><?php echo $e['title']; ?></strong><br><small style="color: #666;"><?php echo $e['description']; ?></small></td>
                            <td><?php echo formatDate($e['event_date']); ?></td>
                            <td><?php echo $e['total_recipients']; ?></td>
                            <td><span class="badge badge-success"><?php echo $e['delivered_count']; ?></span></td>
                            <td><span class="badge badge-warning"><?php echo $e['total_recipients'] - $e['delivered_count']; ?></span></td>
                            <td>
                                <div class="action-btns">
                                    <a href="?view=<?php echo $e['id']; ?>" class="action-btn edit"><i class="fas fa-eye"></i></a>
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete?')">
                                        <input type="hidden" name="id" value="<?php echo $e['id']; ?>">
                                        <button type="submit" name="delete_event" class="action-btn delete"><i class="fas fa-trash"></i></button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header"><h3>Create Gift Event</h3><button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button></div>
            <form method="POST">
                <div class="modal-body">
                    <div class="form-group"><label>Event Name *</label><input type="text" name="title" required placeholder="e.g., Diwali 2026, New Year"></div>
                    <div class="form-group"><label>Description</label><textarea name="description" rows="2" placeholder="Details about the gift event"></textarea></div>
                    <div class="form-group"><label>Event Date *</label><input type="date" name="event_date" required></div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button><button type="submit" name="add_event" class="btn btn-primary">Create</button></div>
            </form>
        </div>
    </div>
<script>
function filterGiftCustomers() {
    const catId = document.getElementById('giftCategoryFilter').value;
    document.querySelectorAll('.gift-customer-item').forEach(item => {
        if (catId === '' || item.dataset.category === catId) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectAllGiftCustomers() {
    const catId = document.getElementById('giftCategoryFilter').value;
    document.querySelectorAll('.gift-customer-item').forEach(item => {
        if (catId === '' || item.dataset.category === catId) {
            item.querySelector('input').checked = true;
        }
    });
}

function deselectAllGiftCustomers() {
    document.querySelectorAll('.gift-customer-item input').forEach(cb => cb.checked = false);
}
</script>
</body>
</html>
<?php $conn->close(); ?>
