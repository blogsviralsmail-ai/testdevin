<?php
require_once '../includes/config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('login.php');
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $title = sanitize($_POST['title']);
        $description = sanitize($_POST['description']);
        $min_rewards = (float)$_POST['min_rewards'];
        $prize_description = sanitize($_POST['prize_description']);
        $start_date = sanitize($_POST['start_date']);
        $end_date = sanitize($_POST['end_date']);
        $is_visible = isset($_POST['is_visible']) ? 1 : 0;
        $image = sanitize($_POST['image']);
        
        $stmt = $conn->prepare("INSERT INTO offers (title, description, image, min_rewards, prize_description, start_date, end_date, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssdsssi", $title, $description, $image, $min_rewards, $prize_description, $start_date, $end_date, $is_visible);
        
        if ($stmt->execute()) {
            setMessage('success', 'Offer added successfully');
        } else {
            setMessage('danger', 'Error adding offer');
        }
        redirect('offers.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $title = sanitize($_POST['title']);
        $description = sanitize($_POST['description']);
        $min_rewards = (float)$_POST['min_rewards'];
        $prize_description = sanitize($_POST['prize_description']);
        $start_date = sanitize($_POST['start_date']);
        $end_date = sanitize($_POST['end_date']);
        $is_visible = isset($_POST['is_visible']) ? 1 : 0;
        $image = sanitize($_POST['image']);
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE offers SET title = ?, description = ?, image = ?, min_rewards = ?, prize_description = ?, start_date = ?, end_date = ?, is_visible = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sssdsssisi", $title, $description, $image, $min_rewards, $prize_description, $start_date, $end_date, $is_visible, $status, $id);
        
        if ($stmt->execute()) {
            setMessage('success', 'Offer updated successfully');
        } else {
            setMessage('danger', 'Error updating offer');
        }
        redirect('offers.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM offers WHERE id = $id");
        setMessage('success', 'Offer deleted');
        redirect('offers.php');
    }
    
    if ($action === 'toggle_visibility') {
        $id = (int)$_POST['id'];
        $conn->query("UPDATE offers SET is_visible = NOT is_visible WHERE id = $id");
        setMessage('success', 'Visibility toggled');
        redirect('offers.php');
    }
}

$offers = $conn->query("SELECT * FROM offers ORDER BY created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offers - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Offers Management</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Offer
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Offers List -->
            <div class="admin-card">
                <h3>All Offers</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Min Rewards</th>
                            <th>Duration</th>
                            <th>Visible</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($offer = $offers->fetch_assoc()): ?>
                        <tr>
                            <td>
                                <strong><?php echo $offer['title']; ?></strong><br>
                                <small><?php echo substr($offer['description'], 0, 50); ?>...</small>
                            </td>
                            <td><?php echo formatCurrency($offer['min_rewards']); ?></td>
                            <td>
                                <?php echo formatDate($offer['start_date']); ?> - <?php echo formatDate($offer['end_date']); ?>
                            </td>
                            <td>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="toggle_visibility">
                                    <input type="hidden" name="id" value="<?php echo $offer['id']; ?>">
                                    <button type="submit" class="badge badge-<?php echo $offer['is_visible'] ? 'success' : 'danger'; ?>" style="border: none; cursor: pointer;">
                                        <?php echo $offer['is_visible'] ? 'Visible' : 'Hidden'; ?>
                                    </button>
                                </form>
                            </td>
                            <td>
                                <span class="badge badge-<?php echo $offer['status'] === 'active' ? 'success' : 'danger'; ?>">
                                    <?php echo ucfirst($offer['status']); ?>
                                </span>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="editOffer(<?php echo htmlspecialchars(json_encode($offer)); ?>)" class="action-btn edit" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $offer['id']; ?>">
                                        <button type="submit" class="action-btn delete" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Add New Offer</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" name="image">
                    </div>
                    <div class="form-group">
                        <label>Minimum Rewards Required</label>
                        <input type="number" name="min_rewards" step="0.01" value="0">
                    </div>
                    <div class="form-group">
                        <label>Prize Description</label>
                        <textarea name="prize_description" rows="2"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="date" name="start_date">
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="date" name="end_date">
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" name="is_visible" checked>
                            <span>Visible to Masons</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Offer</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Edit Offer</h3>
                <button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div class="form-group">
                        <label>Title *</label>
                        <input type="text" name="title" id="edit_title" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" id="edit_description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input type="text" name="image" id="edit_image">
                    </div>
                    <div class="form-group">
                        <label>Minimum Rewards Required</label>
                        <input type="number" name="min_rewards" id="edit_min_rewards" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Prize Description</label>
                        <textarea name="prize_description" id="edit_prize_description" rows="2"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="date" name="start_date" id="edit_start_date">
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="date" name="end_date" id="edit_end_date">
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" name="is_visible" id="edit_is_visible">
                            <span>Visible to Masons</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" id="edit_status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('editModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Offer</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editOffer(offer) {
            document.getElementById('edit_id').value = offer.id;
            document.getElementById('edit_title').value = offer.title;
            document.getElementById('edit_description').value = offer.description;
            document.getElementById('edit_image').value = offer.image;
            document.getElementById('edit_min_rewards').value = offer.min_rewards;
            document.getElementById('edit_prize_description').value = offer.prize_description;
            document.getElementById('edit_start_date').value = offer.start_date;
            document.getElementById('edit_end_date').value = offer.end_date;
            document.getElementById('edit_is_visible').checked = offer.is_visible == 1;
            document.getElementById('edit_status').value = offer.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
