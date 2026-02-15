<?php
require_once "../includes/config.php";

if (!isLoggedIn() || !isAdmin()) {
    redirect("login.php");
}

$conn = getDBConnection();
$message = getMessage();

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $title = sanitize($_POST['title']);
        $category = sanitize($_POST['category']);
        $description = sanitize($_POST['description'] ?? '');
        $sort_order = (int)($_POST['sort_order'] ?? 0);
        
        // Handle file upload
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === 0) {
            $allowed = ['pdf'];
            $filename = $_FILES['pdf_file']['name'];
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            
            if (in_array($ext, $allowed)) {
                $new_filename = time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $filename);
                $upload_path = '../uploads/catalogs/' . $new_filename;
                
                if (move_uploaded_file($_FILES['pdf_file']['tmp_name'], $upload_path)) {
                    $stmt = $conn->prepare("INSERT INTO catalogs (title, category, pdf_file, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)");
                    $stmt->bind_param("ssssi", $title, $category, $new_filename, $description, $sort_order);
                    
                    if ($stmt->execute()) {
                        setMessage('success', 'Catalog added successfully');
                    } else {
                        setMessage('danger', 'Error adding catalog to database');
                    }
                } else {
                    setMessage('danger', 'Error uploading file');
                }
            } else {
                setMessage('danger', 'Only PDF files are allowed');
            }
        } else {
            setMessage('danger', 'Please select a PDF file');
        }
        redirect('catalogs.php');
    }
    
    if ($action === 'edit') {
        $id = (int)$_POST['id'];
        $title = sanitize($_POST['title']);
        $category = sanitize($_POST['category']);
        $description = sanitize($_POST['description'] ?? '');
        $sort_order = (int)($_POST['sort_order'] ?? 0);
        $is_active = isset($_POST['is_active']) ? 1 : 0;
        
        // Check if new file uploaded
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === 0) {
            $allowed = ['pdf'];
            $filename = $_FILES['pdf_file']['name'];
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            
            if (in_array($ext, $allowed)) {
                $new_filename = time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $filename);
                $upload_path = '../uploads/catalogs/' . $new_filename;
                
                if (move_uploaded_file($_FILES['pdf_file']['tmp_name'], $upload_path)) {
                    $stmt = $conn->prepare("UPDATE catalogs SET title = ?, category = ?, pdf_file = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?");
                    $stmt->bind_param("ssssiii", $title, $category, $new_filename, $description, $sort_order, $is_active, $id);
                } else {
                    setMessage('danger', 'Error uploading file');
                    redirect('catalogs.php');
                }
            } else {
                setMessage('danger', 'Only PDF files are allowed');
                redirect('catalogs.php');
            }
        } else {
            $stmt = $conn->prepare("UPDATE catalogs SET title = ?, category = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?");
            $stmt->bind_param("sssiii", $title, $category, $description, $sort_order, $is_active, $id);
        }
        
        if ($stmt->execute()) {
            setMessage('success', 'Catalog updated successfully');
        } else {
            setMessage('danger', 'Error updating catalog');
        }
        redirect('catalogs.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        // Get filename to delete
        $result = $conn->query("SELECT pdf_file FROM catalogs WHERE id = $id");
        if ($row = $result->fetch_assoc()) {
            $file_path = '../uploads/catalogs/' . $row['pdf_file'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
        $conn->query("DELETE FROM catalogs WHERE id = $id");
        setMessage('success', 'Catalog deleted');
        redirect('catalogs.php');
    }
}

$catalogs = $conn->query("SELECT * FROM catalogs ORDER BY category, sort_order, created_at DESC");
$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catalogs - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1><i class="fas fa-file-pdf"></i> Manage Catalogs</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Catalog
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <div class="card">
                <div class="card-header">
                    <h3>All Catalogs</h3>
                </div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>PDF</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($catalog = $catalogs->fetch_assoc()): ?>
                            <tr>
                                <td><strong><?php echo htmlspecialchars($catalog['title']); ?></strong></td>
                                <td><span class="badge"><?php echo htmlspecialchars($catalog['category']); ?></span></td>
                                <td>
                                    <a href="../uploads/catalogs/<?php echo $catalog['pdf_file']; ?>" target="_blank" class="btn btn-sm btn-outline">
                                        <i class="fas fa-eye"></i> View
                                    </a>
                                </td>
                                <td><?php echo $catalog['sort_order']; ?></td>
                                <td>
                                    <?php if ($catalog['is_active']): ?>
                                    <span class="status-active"><i class="fas fa-check-circle"></i> Active</span>
                                    <?php else: ?>
                                    <span class="status-inactive"><i class="fas fa-times-circle"></i> Inactive</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <button onclick="editCatalog(<?php echo htmlspecialchars(json_encode($catalog)); ?>)" class="btn btn-sm btn-warning">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this catalog?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $catalog['id']; ?>">
                                        <button type="submit" class="btn btn-sm btn-danger">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Add Modal -->
    <div class="modal" id="addModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-plus-circle"></i> Add New Catalog</h3>
                <button onclick="document.getElementById('addModal').classList.remove('active')" class="close-btn">&times;</button>
            </div>
            <form method="POST" enctype="multipart/form-data">
                <input type="hidden" name="action" value="add">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" name="title" required placeholder="e.g., 12X18 Strawberry Ceramic">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" required>
                            <option value="">Select Category</option>
                            <option value="Tiles">Tiles</option>
                            <option value="Bath">Bath</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Tile Chemical">Tile Chemical</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>PDF File *</label>
                    <input type="file" name="pdf_file" accept=".pdf" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="3" placeholder="Optional description"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="document.getElementById('addModal').classList.remove('active')" class="btn btn-outline">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Add Catalog</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal" id="editModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Catalog</h3>
                <button onclick="document.getElementById('editModal').classList.remove('active')" class="close-btn">&times;</button>
            </div>
            <form method="POST" enctype="multipart/form-data">
                <input type="hidden" name="action" value="edit">
                <input type="hidden" name="id" id="edit_id">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" name="title" id="edit_title" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" id="edit_category" required>
                            <option value="">Select Category</option>
                            <option value="Tiles">Tiles</option>
                            <option value="Bath">Bath</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Tile Chemical">Tile Chemical</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="sort_order" id="edit_sort_order" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>PDF File (Leave empty to keep current)</label>
                    <input type="file" name="pdf_file" accept=".pdf">
                    <small id="current_file" style="color: #666;"></small>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" id="edit_description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="is_active" id="edit_is_active" value="1">
                        Active
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="document.getElementById('editModal').classList.remove('active')" class="btn btn-outline">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Catalog</button>
                </div>
            </form>
        </div>
    </div>

    <script>
    function editCatalog(catalog) {
        document.getElementById('edit_id').value = catalog.id;
        document.getElementById('edit_title').value = catalog.title;
        document.getElementById('edit_category').value = catalog.category;
        document.getElementById('edit_sort_order').value = catalog.sort_order || 0;
        document.getElementById('edit_description').value = catalog.description || '';
        document.getElementById('edit_is_active').checked = catalog.is_active == 1;
        document.getElementById('current_file').textContent = 'Current: ' + catalog.pdf_file;
        document.getElementById('editModal').classList.add('active');
    }
    </script>
</body>
</html>
