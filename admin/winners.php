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
        $mason_id = (int)$_POST['mason_id'];
        $offer_id = !empty($_POST['offer_id']) ? (int)$_POST['offer_id'] : null;
        $prize_given = sanitize($_POST['prize_given']);
        $prize_date = sanitize($_POST['prize_date']);
        $notes = sanitize($_POST['notes']);
        
        $stmt = $conn->prepare("INSERT INTO reward_winners (mason_id, offer_id, prize_given, prize_date, notes) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iisss", $mason_id, $offer_id, $prize_given, $prize_date, $notes);
        
        if ($stmt->execute()) {
            $winner_id = $conn->insert_id;
            
            // Handle photo uploads
            if (!empty($_POST['photos'])) {
                $photos = explode("\n", trim($_POST['photos']));
                foreach ($photos as $photo) {
                    $photo = trim(sanitize($photo));
                    if (!empty($photo)) {
                        $stmt2 = $conn->prepare("INSERT INTO winner_photos (winner_id, photo_path) VALUES (?, ?)");
                        $stmt2->bind_param("is", $winner_id, $photo);
                        $stmt2->execute();
                    }
                }
            }
            
            setMessage('success', 'Winner added successfully');
        } else {
            setMessage('danger', 'Error adding winner');
        }
        redirect('winners.php');
    }
    
    if ($action === 'delete') {
        $id = (int)$_POST['id'];
        $conn->query("DELETE FROM winner_photos WHERE winner_id = $id");
        $conn->query("DELETE FROM reward_winners WHERE id = $id");
        setMessage('success', 'Winner deleted');
        redirect('winners.php');
    }
    
    if ($action === 'add_photo') {
        $winner_id = (int)$_POST['winner_id'];
        $photo_path = sanitize($_POST['photo_path']);
        $caption = sanitize($_POST['caption']);
        
        $stmt = $conn->prepare("INSERT INTO winner_photos (winner_id, photo_path, caption) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $winner_id, $photo_path, $caption);
        $stmt->execute();
        setMessage('success', 'Photo added');
        redirect('winners.php');
    }
}

// Get winners
$winners = $conn->query("SELECT rw.*, m.name as mason_name, m.mobile as mason_mobile, o.title as offer_title 
                         FROM reward_winners rw 
                         JOIN masons m ON rw.mason_id = m.id 
                         LEFT JOIN offers o ON rw.offer_id = o.id 
                         ORDER BY rw.prize_date DESC");

// Get masons and offers for dropdowns
$masons = $conn->query("SELECT id, name, mobile FROM masons ORDER BY name");
$offers = $conn->query("SELECT id, title FROM offers ORDER BY created_at DESC");

$logo = getSetting('logo', '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Winners - JP Tiles Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="admin-content">
            <div class="admin-header">
                <h1>Reward Winners</h1>
                <button onclick="document.getElementById('addModal').classList.add('active')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Winner
                </button>
            </div>

            <?php if ($message): ?>
            <div class="alert alert-<?php echo $message['type']; ?>">
                <?php echo $message['text']; ?>
            </div>
            <?php endif; ?>

            <!-- Winners List -->
            <div class="admin-card">
                <h3>All Winners</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mason</th>
                            <th>Offer</th>
                            <th>Prize</th>
                            <th>Date</th>
                            <th>Photos</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($winner = $winners->fetch_assoc()): 
                            $photos = $conn->query("SELECT * FROM winner_photos WHERE winner_id = {$winner['id']}");
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo $winner['mason_name']; ?></strong><br>
                                <small><?php echo $winner['mason_mobile']; ?></small>
                            </td>
                            <td><?php echo $winner['offer_title'] ?: 'N/A'; ?></td>
                            <td><?php echo $winner['prize_given']; ?></td>
                            <td><?php echo formatDate($winner['prize_date']); ?></td>
                            <td>
                                <?php echo $photos->num_rows; ?> photos
                                <button onclick="viewPhotos(<?php echo $winner['id']; ?>)" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;">
                                    <i class="fas fa-images"></i> View
                                </button>
                            </td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="addPhoto(<?php echo $winner['id']; ?>)" class="action-btn edit" title="Add Photo">
                                        <i class="fas fa-camera"></i>
                                    </button>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure?')">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?php echo $winner['id']; ?>">
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
                <h3>Add Winner</h3>
                <button class="close-modal" onclick="document.getElementById('addModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add">
                    <div class="form-group">
                        <label>Select Mason *</label>
                        <select name="mason_id" required>
                            <option value="">Select Mason</option>
                            <?php 
                            $masons->data_seek(0);
                            while($m = $masons->fetch_assoc()): 
                            ?>
                            <option value="<?php echo $m['id']; ?>"><?php echo $m['name']; ?> (<?php echo $m['mobile']; ?>)</option>
                            <?php endwhile; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Related Offer</label>
                        <select name="offer_id">
                            <option value="">Select Offer (Optional)</option>
                            <?php 
                            $offers->data_seek(0);
                            while($o = $offers->fetch_assoc()): 
                            ?>
                            <option value="<?php echo $o['id']; ?>"><?php echo $o['title']; ?></option>
                            <?php endwhile; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Prize Given *</label>
                        <input type="text" name="prize_given" required placeholder="e.g., Smartphone, Cash Prize, etc.">
                    </div>
                    <div class="form-group">
                        <label>Prize Date *</label>
                        <input type="date" name="prize_date" value="<?php echo date('Y-m-d'); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Photo URLs (one per line)</label>
                        <textarea name="photos" rows="3" placeholder="Enter photo URLs, one per line"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('addModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Winner</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Photo Modal -->
    <div id="photoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Photo</h3>
                <button class="close-modal" onclick="document.getElementById('photoModal').classList.remove('active')">&times;</button>
            </div>
            <form method="POST">
                <div class="modal-body">
                    <input type="hidden" name="action" value="add_photo">
                    <input type="hidden" name="winner_id" id="photo_winner_id">
                    <div class="form-group">
                        <label>Photo URL *</label>
                        <input type="text" name="photo_path" required>
                    </div>
                    <div class="form-group">
                        <label>Caption</label>
                        <input type="text" name="caption">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('photoModal').classList.remove('active')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Photo</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function addPhoto(winnerId) {
            document.getElementById('photo_winner_id').value = winnerId;
            document.getElementById('photoModal').classList.add('active');
        }
        
        function viewPhotos(winnerId) {
            window.open('winner-photos.php?id=' + winnerId, '_blank', 'width=800,height=600');
        }
    </script>
</body>
</html>
<?php $conn->close(); ?>
