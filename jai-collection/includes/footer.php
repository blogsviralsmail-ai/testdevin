</main>

<footer class="jc-footer">
    <div class="container">
        <div class="jc-footer-cols">
            <div>
                <h4><?php echo e(getSetting('site_name', SITE_NAME)); ?></h4>
                <p style="color:#b8c4d9;"><?php echo e(getSetting('site_tagline', SITE_TAGLINE)); ?></p>
                <p style="color:#b8c4d9;">
                    <i class="fas fa-envelope"></i> <?php echo e(getSetting('site_email', '')); ?><br>
                    <i class="fas fa-phone"></i> <?php echo e(getSetting('site_phone', '')); ?><br>
                    <i class="fas fa-map-marker-alt"></i> <?php echo e(getSetting('site_address', '')); ?>
                </p>
            </div>
            <div>
                <h4>Shop</h4>
                <ul>
                    <?php foreach (array_slice(getCategories(true, 0), 0, 6) as $c): ?>
                        <li><a href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>"><?php echo e($c['name']); ?></a></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <div>
                <h4>Account</h4>
                <ul>
                    <li><a href="<?php echo e(SITE_URL); ?>/account/login.php">Login</a></li>
                    <li><a href="<?php echo e(SITE_URL); ?>/account/register.php">Register</a></li>
                    <li><a href="<?php echo e(SITE_URL); ?>/account/orders.php">My Orders</a></li>
                    <li><a href="<?php echo e(SITE_URL); ?>/agent/login.php">Agent Portal</a></li>
                </ul>
            </div>
            <div>
                <h4>Follow Us</h4>
                <p>
                    <?php $fb = getSetting('facebook_url',''); if ($fb): ?><a href="<?php echo e($fb); ?>" target="_blank" style="font-size:20px;margin-right:10px;"><i class="fab fa-facebook"></i></a><?php endif; ?>
                    <?php $ig = getSetting('instagram_url',''); if ($ig): ?><a href="<?php echo e($ig); ?>" target="_blank" style="font-size:20px;margin-right:10px;"><i class="fab fa-instagram"></i></a><?php endif; ?>
                    <?php $yt = getSetting('youtube_url',''); if ($yt): ?><a href="<?php echo e($yt); ?>" target="_blank" style="font-size:20px;margin-right:10px;"><i class="fab fa-youtube"></i></a><?php endif; ?>
                    <?php $wa = getSetting('whatsapp_number',''); if ($wa): ?><a href="https://wa.me/<?php echo e($wa); ?>" target="_blank" style="font-size:20px;"><i class="fab fa-whatsapp"></i></a><?php endif; ?>
                </p>
            </div>
        </div>
        <div class="jc-footer-bottom">
            &copy; <?php echo date('Y'); ?> <?php echo e(getSetting('site_name', SITE_NAME)); ?>. All rights reserved.
        </div>
    </div>
</footer>

<script src="<?php echo e(SITE_URL); ?>/assets/js/main.js"></script>
</body>
</html>
