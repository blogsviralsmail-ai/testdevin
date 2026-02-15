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
        $subtitle = sanitize($_POST['subtitle']);
        $image = sanitize($_POST['image']);
        $link = sanitize($_POST['link']);
        $sort_order = (int)$_POST['sort_order'];
        
        $stmt = $conn->prepare("INSERT INTO sliders (title, subtitle, image, link, sort_order) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssi", $title, $subtitle, $image, $link, $sort_order);
        
        if ($stmt->execute()) {
            setMessage('success', 'Slider added successfully');
        } else {
            setMessage('danger', 'Error adding slider');
        }
        redirect('sliders.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $title = sanitize($_POST['title']);
        $subtitle = sanitize($_POST['subtitle']);
        $image = sanitize($_POST['image']);
        $link = sanitize($_POST['link']);
        $sort_order = (int)$_POST['sort_order'];
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE sliders SET title = ?, subtitle = ?, image = ?, link = ?, sort_order = ?, status = ? WHERE id = ?");
        $stmt->bind_param("ssssssi", $title, $subtitle, $image, $link, $sort_order, $status, $id);
        
        if ($stmt->execute()) {
            setMessage('success', 'Slider updated successfully');
        } else {
            setMessage('danger', 'Error updating slider');
        }
        redirect('sliders.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM sliders WHERE id = $id");
        setMessage('success', 'Slider deleted');
        redirect('sliders.php');
    }
}

$sliders = $conn->query("SELECT * FROM sliders ORDER BY sort_order");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sliders - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Homepage Sliders</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Slider
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Sliders List -->
            <div class="admin-card">
                <h3>All Sliders</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    <?php while($slider = $sliders->fetch_assoc()): ?>
                    <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                        <img src="<?php echo $slider['image']; ?>" alt="" style="width: 100%; height: 150px; object-fit: cover;">
                        <div style="padding: 15px;">
                            <h4><?php echo $slider['title'] ?: 'No Title'; ?></h4>
                            <p style="color: #666; font-size: 14px;"><?php echo $slider['subtitle'] ?: 'No Subtitle'; ?></p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                <span class="badge badge-<?php echo $slider['status'] === 'active' ? 'success' : 'danger'; ?>">
                                    <?php echo ucfirst($slider['status']); ?>
                                </span>
                                <div class="action-btns">
                                    <button onclick="editSlider(<?php echo htmlspecialchars(json_encode($slider)); ?>)" class="action-btn edit" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $slider['id']; ?>">
                                        <button type="submit" class="action-btn delete" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endwhile; ?>
                </div>
            </div>
        </main>
    </div>

    <!-- Add Modal -->
    <div id="addModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Slider</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title">
                    </div>
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" name="subtitle">
                    </div>
                    <div class="form-group">
                        <label>Image URL *</label>
                        <input type="text" name="image" required>
                    </div>
                    <div class="form-group">
                        <label>Link URL</label>
                        <input type="text" name="link">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" value="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Slider</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Slider</h3>
                <button class="close-modal" onclick="document.getElementById('editModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="edit">
                    <input type="hidden" name="id" id="edit_id">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" id="edit_title">
                    </div>
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" name="subtitle" id="edit_subtitle">
                    </div>
                    <div class="form-group">
                        <label>Image URL *</label>
                        <input type="text" name="image" id="edit_image" required>
                    </div>
                    <div class="form-group">
                        <label>Link URL</label>
                        <input type="text" name="link" id="edit_link">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" id="edit_sort_order">
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
                    <button type="submit" class="btn btn-primary">Update Slider</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editSlider(slider) {
            document.getElementById('edit_id').value = slider.id;
            document.getElementById('edit_title').value = slider.title || '';
            document.getElementById('edit_subtitle').value = slider.subtitle || '';
            document.getElementById('edit_image').value = slider.image;
            document.getElementById('edit_link').value = slider.link || '';
            document.getElementById('edit_sort_order').value = slider.sort_order;
            document.getElementById('edit_status').value = slider.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
