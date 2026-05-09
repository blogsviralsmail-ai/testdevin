/**
 * Camera Navigation Controller
 * Smooth transitions between sections
 */
import * as THREE from 'three';

export class NavigationController {
  constructor(sceneManager, app) {
    this.scene = sceneManager;
    this.camera = sceneManager.camera;
    this.app = app;

    // Section camera positions (z-axis based movement)
    this.sectionPositions = [
      { x: 0, y: 0, z: 15, lookAt: { x: 0, y: 0, z: 0 } },
      { x: 0, y: 0, z: -15, lookAt: { x: 0, y: 0, z: -30 } },
      { x: 0, y: 0, z: -45, lookAt: { x: 0, y: 0, z: -60 } },
      { x: 0, y: 0, z: -75, lookAt: { x: 0, y: 0, z: -90 } },
      { x: 0, y: 0, z: -105, lookAt: { x: 0, y: 0, z: -120 } },
    ];

    // Animation state
    this.isAnimating = false;
    this.animationProgress = 0;
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
    this.startLookAt = new THREE.Vector3();
    this.endLookAt = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.onComplete = null;

    // Mouse parallax
    this.mouse = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };
    this.parallaxStrength = 0.5;

    this.setupMouseTracking();

    // Set initial position
    const initial = this.sectionPositions[0];
    this.camera.position.set(initial.x, initial.y, initial.z);
    this.currentLookAt.set(initial.lookAt.x, initial.lookAt.y, initial.lookAt.z);
    this.camera.lookAt(this.currentLookAt);
  }

  setupMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Touch parallax for mobile
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null) {
        this.mouse.x = (e.gamma / 45);
        this.mouse.y = (e.beta / 45 - 1);
      }
    });
  }

  transitionTo(sectionIndex, onComplete) {
    const target = this.sectionPositions[sectionIndex];
    if (!target) return;

    this.isAnimating = true;
    this.animationProgress = 0;
    this.onComplete = onComplete;

    this.startPos.copy(this.camera.position);
    this.endPos.set(target.x, target.y, target.z);

    this.startLookAt.copy(this.currentLookAt);
    this.endLookAt.set(target.lookAt.x, target.lookAt.y, target.lookAt.z);
  }

  // Smooth easing function
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  update(time) {
    // Camera transition animation
    if (this.isAnimating) {
      this.animationProgress += 0.025;

      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimating = false;
        if (this.onComplete) this.onComplete();
      }

      const t = this.easeInOutCubic(this.animationProgress);

      this.camera.position.lerpVectors(this.startPos, this.endPos, t);
      this.currentLookAt.lerpVectors(this.startLookAt, this.endLookAt, t);
      this.camera.lookAt(this.currentLookAt);
    }

    // Mouse parallax (subtle)
    if (!this.isAnimating) {
      this.targetParallax.x = this.mouse.x * this.parallaxStrength;
      this.targetParallax.y = -this.mouse.y * this.parallaxStrength * 0.5;

      const basePos = this.sectionPositions[this.app.currentSection];
      if (basePos) {
        this.camera.position.x += (basePos.x + this.targetParallax.x - this.camera.position.x) * 0.03;
        this.camera.position.y += (basePos.y + this.targetParallax.y - this.camera.position.y) * 0.03;
        this.camera.lookAt(this.currentLookAt);
      }
    }
  }
}
