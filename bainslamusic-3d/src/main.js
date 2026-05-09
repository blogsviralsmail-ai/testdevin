/**
 * Bainsla Music - 3D Immersive Website
 * Main entry point
 */
import { SceneManager } from './scene.js';
import { ParticleSystem } from './effects/particles.js';
import { PostProcessing } from './effects/postprocessing.js';
import { NavigationController } from './controls/navigation.js';
import { UIManager } from './ui/overlays.js';
import { LoadingManager } from './utils/loader.js';

class BainslaMusic3D {
  constructor() {
    this.currentSection = 0;
    this.totalSections = 5;
    this.isTransitioning = false;
    this.scrollCooldown = false;
    this.loader = new LoadingManager();
    this.init();
  }

  async init() {
    try {
      this.loader.updateStatus('Setting up 3D renderer...');
      this.loader.updateProgress(10);

      const canvas = document.getElementById('webgl-canvas');
      this.scene = new SceneManager(canvas);
      await this.scene.init();
      this.loader.updateProgress(30);

      this.loader.updateStatus('Creating particle universe...');
      this.particles = new ParticleSystem(this.scene);
      this.loader.updateProgress(50);

      this.loader.updateStatus('Applying visual effects...');
      this.postProcess = new PostProcessing(this.scene);
      this.loader.updateProgress(65);

      this.loader.updateStatus('Building navigation...');
      this.navigation = new NavigationController(this.scene, this);
      this.loader.updateProgress(80);

      this.loader.updateStatus('Loading interface...');
      this.ui = new UIManager(this);
      this.loader.updateProgress(90);

      this.setupEventListeners();
      this.populateVideos();
      this.loader.updateProgress(100);

      this.loader.updateStatus('Ready!');
      await this.delay(500);
      this.loader.hide();

      this.animate();
    } catch (error) {
      console.error('Initialization error:', error);
      this.loader.updateStatus('Starting experience...');
      this.loader.updateProgress(100);
      await this.delay(300);
      this.loader.hide();
      this.animate();
    }
  }

  setupEventListeners() {
    // Scroll / Wheel navigation
    let lastScrollTime = 0;
    window.addEventListener('wheel', (e) => {
      const now = Date.now();
      if (now - lastScrollTime < 1200 || this.isTransitioning) return;
      lastScrollTime = now;

      if (e.deltaY > 30) {
        this.navigateSection(1);
      } else if (e.deltaY < -30) {
        this.navigateSection(-1);
      }
    }, { passive: true });

    // Touch navigation
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isTransitioning) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) {
        this.navigateSection(diff > 0 ? 1 : -1);
      }
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (this.isTransitioning) return;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          this.navigateSection(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          this.navigateSection(-1);
          break;
        case 'Home':
          e.preventDefault();
          this.goToSection(0);
          break;
        case 'End':
          e.preventDefault();
          this.goToSection(this.totalSections - 1);
          break;
      }
    });

    // Resize handler
    window.addEventListener('resize', () => {
      this.scene.onResize();
      if (this.postProcess) this.postProcess.onResize();
    });
  }

  navigateSection(direction) {
    const newSection = this.currentSection + direction;
    if (newSection < 0 || newSection >= this.totalSections) return;
    this.goToSection(newSection);
  }

  goToSection(index) {
    if (index === this.currentSection || this.isTransitioning) return;
    if (index < 0 || index >= this.totalSections) return;

    this.isTransitioning = true;
    const oldSection = this.currentSection;
    this.currentSection = index;

    // Hide scroll hint after first navigation
    const scrollHint = document.getElementById('scroll-hint');
    if (scrollHint) scrollHint.classList.add('hidden');

    // Animate camera to new section
    this.navigation.transitionTo(index, () => {
      this.isTransitioning = false;
    });

    // Update UI
    this.ui.updateSection(index, oldSection);
  }

  populateVideos() {
    const videoIds = [
      'zBaFU-FykYc', 'DBWdAQpFbwM', 'xUDdv9ytMYY', 'LJs9Ss4El-8',
      'eNm1JkwJ-cA', 'Kqi2YIMTamA', 'vTfdZj1PprI', '1qGsPhuVJyE',
      '8dzQRsQc_ek', 'XwUfientFrE', 'bMxJpL0A0aY', '3MNPFjfemZo',
      'dv1eg80KdcY', '9bFUsWHc1Q8', 'r9v9DgjHp3s', 'ZoC9SrjfYZQ',
      'Z0rN10nclE0', 'CLqLm9y1UuY'
    ];

    const grid = document.getElementById('videos-grid');
    if (!grid) return;

    grid.innerHTML = videoIds.map(id => `
      <div class="video-thumb" data-video-id="${id}">
        <img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" 
             alt="Bainsla Music Video" loading="lazy" />
        <div class="play-icon"></div>
      </div>
    `).join('');

    grid.addEventListener('click', (e) => {
      const thumb = e.target.closest('.video-thumb');
      if (!thumb) return;
      const videoId = thumb.dataset.videoId;
      this.openVideoModal(videoId);
    });
  }

  openVideoModal(videoId) {
    const modal = document.getElementById('video-modal');
    const player = document.getElementById('video-player');
    player.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
      allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove('hidden');

    const close = () => {
      modal.classList.add('hidden');
      player.innerHTML = '';
    };

    modal.querySelector('.modal-close').onclick = close;
    modal.querySelector('.modal-backdrop').onclick = close;
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        close();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    if (this.scene) this.scene.update(time);
    if (this.particles) this.particles.update(time);
    if (this.navigation) this.navigation.update(time);

    if (this.postProcess && this.postProcess.enabled) {
      this.postProcess.render();
    } else if (this.scene) {
      this.scene.render();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the experience
window.addEventListener('DOMContentLoaded', () => {
  window.app = new BainslaMusic3D();
});
