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
        $image = sanitize($_POST['image']);
        $category = sanitize($_POST['category']);
        $sort_order = (int)$_POST['sort_order'];
        
        $stmt = $conn->prepare("INSERT INTO gallery (title, image, category, sort_order) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $title, $image, $category, $sort_order);
        
        if ($stmt->execute()) {
            setMessage('success', 'Image added successfully');
        } else {
            setMessage('danger', 'Error adding image');
        }
        redirect('gallery.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $title = sanitize($_POST['title']);
        $image = sanitize($_POST['image']);
        $category = sanitize($_POST['category']);
        $sort_order = (int)$_POST['sort_order'];
        $status = sanitize($_POST['status']);
        
        $stmt = $conn->prepare("UPDATE gallery SET title = ?, image = ?, category = ?, sort_order = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sssisi", $title, $image, $category, $sort_order, $status, $id);
        
        if ($stmt->execute()) {
            setMessage('success', 'Image updated successfully');
        } else {
            setMessage('danger', 'Error updating image');
        }
        redirect('gallery.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM gallery WHERE id = $id");
        setMessage('success', 'Image deleted');
        redirect('gallery.php');
    }
    
    if ($action === 'bulk_add') {
        $images = explode("\n", trim($_POST['images']));
        $category = sanitize($_POST['category']);
        $count = 0;
        
        foreach ($images as $image) {
            $image = trim(sanitize($image));
            if (!empty($image)) {
                $stmt = $conn->prepare("INSERT INTO gallery (image, category) VALUES (?, ?)");
                $stmt->bind_param("ss", $image, $category);
                if ($stmt->execute()) $count++;
            }
        }
        
        setMessage('success', "$count images added successfully");
        redirect('gallery.php');
    }
}

$gallery = $conn->query("SELECT * FROM gallery ORDER BY sort_order, created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Gallery</h1>
                <div>
                    <button onclick="document.getElementById('bulkModal').classList.add('active')" class="btn btn-outline">
                        <i class="fas fa-images"></i> Bulk Add
                    </button>
                    <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Image
                    </button>
                </div>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Gallery Grid -->
            <div class="admin-card">
                <h3>All Images (<?php echo $gallery->num_rows; ?>)</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    <?php while($img = $gallery->fetch_assoc()): ?>
                    <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; position: relative;">
                        <img src="<?php echo $img['image']; ?>" alt="" style="width: 100%; height: 150px; object-fit: cover;">
                        <div style="padding: 10px;">
                            <p style="font-size: 12px; color: #666; margin: 0;"><?php echo $img['title'] ?: 'No Title'; ?></p>
                            <span class="badge badge-<?php echo $img['status'] === 'active' ? 'success' : 'danger'; ?>" style="font-size: 10px;">
                                <?php echo ucfirst($img['status']); ?>
                            </span>
                        </div>
                        <div style="position: absolute; top: 5px; right: 5px; display: flex; gap: 5px;">
                            <button onclick="editImage(<?php echo htmlspecialchars(json_encode($img)); ?>)" class="action-btn edit" style="background: white;" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                <input type="hidden" name="action" value="delete">
                                <input type="hidden" name="id" value="<?php echo $img['id']; ?>">
                                <button type="submit" class="action-btn delete" style="background: white;" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
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
                <h3>Add Image</h3>
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
                        <label>Image URL *</label>
                        <input type="text" name="image" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" placeholder="e.g., Projects, Showroom">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" value="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Image</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Bulk Add Modal -->
    <div id="bulkModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Bulk Add Images</h3>
                <button class="close-modal" onclick="document.getElementById('bulkModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="bulk_add">
                    <div class="form-group">
                        <label>Image URLs (one per line) *</label>
                        <textarea name="images" rows="10" required placeholder="Enter image URLs, one per line"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" placeholder="e.g., Projects, Showroom">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('bulkModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add All Images</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Image</h3>
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
                        <label>Image URL *</label>
                        <input type="text" name="image" id="edit_image" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" id="edit_category">
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
                    <button type="submit" class="btn btn-primary">Update Image</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function editImage(img) {
            document.getElementById('edit_id').value = img.id;
            document.getElementById('edit_title').value = img.title || '';
            document.getElementById('edit_image').value = img.image;
            document.getElementById('edit_category').value = img.category || '';
            document.getElementById('edit_sort_order').value = img.sort_order;
            document.getElementById('edit_status').value = img.status;
            document.getElementById('editModal').classList.add('active');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
