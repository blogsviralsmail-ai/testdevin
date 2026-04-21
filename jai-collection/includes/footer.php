</main>

<footer class="jc-footer">
    <div class="container">
        <div class="jc-footer-grid">
            <div>
                <h4><?php echo e(getSetting('site_name', SITE_NAME)); ?></h4>
                <p style="color:#b8c4d9;"><?php echo e(getSetting('footer_about', getSetting('site_tagline', SITE_TAGLINE))); ?></p>
                <p style="color:#b8c4d9;">
                    <?php if ($e2=getSetting('site_email','')): ?><i class="fas fa-envelope"></i> <?php echo e($e2); ?><br><?php endif; ?>
                    <?php if ($p2=getSetting('site_phone','')): ?><i class="fas fa-phone"></i> <?php echo e($p2); ?><br><?php endif; ?>
                    <?php if ($a2=getSetting('site_address','')): ?><i class="fas fa-map-marker-alt"></i> <?php echo e($a2); ?><?php endif; ?>
                </p>
            </div>
            <div>
                <h4>Shop</h4>
                <?php foreach (array_slice(getCategories(true, 0), 0, 8) as $c): ?>
                    <a href="<?php echo e(SITE_URL); ?>/category.php?slug=<?php echo e($c['slug']); ?>"><?php echo e($c['name']); ?></a>
                <?php endforeach; ?>
                <a href="<?php echo e(SITE_URL); ?>/categories.php">All Categories</a>
            </div>
            <div>
                <h4>Account</h4>
                <a href="<?php echo e(SITE_URL); ?>/account/login.php">Login</a>
                <a href="<?php echo e(SITE_URL); ?>/account/register.php">Register</a>
                <a href="<?php echo e(SITE_URL); ?>/account/orders.php">My Orders</a>
                <a href="<?php echo e(SITE_URL); ?>/account/forgot-password.php">Forgot Password</a>
                <a href="<?php echo e(SITE_URL); ?>/agent/login.php">Agent Portal</a>
            </div>
            <div>
                <h4>Follow Us</h4>
                <p>
                    <?php $fb = getSetting('facebook_url',''); if ($fb): ?><a href="<?php echo e($fb); ?>" target="_blank" style="font-size:22px;margin-right:10px;display:inline-block;"><i class="fab fa-facebook"></i></a><?php endif; ?>
                    <?php $ig = getSetting('instagram_url',''); if ($ig): ?><a href="<?php echo e($ig); ?>" target="_blank" style="font-size:22px;margin-right:10px;display:inline-block;"><i class="fab fa-instagram"></i></a><?php endif; ?>
                    <?php $yt = getSetting('youtube_url',''); if ($yt): ?><a href="<?php echo e($yt); ?>" target="_blank" style="font-size:22px;margin-right:10px;display:inline-block;"><i class="fab fa-youtube"></i></a><?php endif; ?>
                    <?php $wa = getSetting('whatsapp_number',''); if ($wa): ?><a href="https://wa.me/<?php echo e($wa); ?>" target="_blank" style="font-size:22px;display:inline-block;"><i class="fab fa-whatsapp"></i></a><?php endif; ?>
                </p>
            </div>
        </div>
        <div class="jc-footer-bottom">
            <?php echo e(getSetting('footer_copyright', '© ' . date('Y') . ' ' . getSetting('site_name', SITE_NAME) . '. All rights reserved.')); ?>
        </div>
    </div>
</footer>

<script src="<?php echo e(SITE_URL); ?>/assets/js/main.js"></script>
<script src="<?php echo e(SITE_URL); ?>/assets/js/app.js"></script>
</body>
</html>
