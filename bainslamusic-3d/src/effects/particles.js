/**
 * Particle System - Music notes, stars, ambient particles
 */
import * as THREE from 'three';

export class ParticleSystem {
  constructor(sceneManager) {
    this.scene = sceneManager.scene;
    this.particles = [];
    this.createMusicParticles();
    this.createAmbientDust();
    this.createEnergyWaves();
  }

  createMusicParticles() {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color(0xff2d55),
      new THREE.Color(0x00f0ff),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xfbbf24)
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 25;
      positions[i3 + 2] = Math.random() * -150;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.1 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.musicParticles = new THREE.Points(geometry, material);
    this.musicBasePositions = new Float32Array(positions);
    this.scene.add(this.musicParticles);
    this.particles.push(this.musicParticles);
  }

  createAmbientDust() {
    const count = 300;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = Math.random() * -150;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
    this.particles.push(this.dustParticles);
  }

  createEnergyWaves() {
    // Create circular wave rings at section transition points
    const sectionZ = [0, -30, -60, -90, -120];

    sectionZ.forEach((z, index) => {
      const ringGeo = new THREE.RingGeometry(8, 8.1, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: [0xff2d55, 0x00f0ff, 0xa855f7, 0xfbbf24, 0xff2d55][index],
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0, z - 15);
      ring.userData.waveRing = true;
      ring.userData.baseOpacity = 0.08;
      this.scene.add(ring);
      this.particles.push(ring);
    });
  }

  update(time) {
    // Animate music particles - gentle float using absolute positions
    if (this.musicParticles && this.musicBasePositions) {
      const positions = this.musicParticles.geometry.attributes.position.array;
      const base = this.musicBasePositions;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = base[i] + Math.cos(time * 0.3 + base[i + 2] * 0.3) * 0.5;
        positions[i + 1] = base[i + 1] + Math.sin(time * 0.5 + base[i] * 0.5) * 0.5;
      }
      this.musicParticles.geometry.attributes.position.needsUpdate = true;
      this.musicParticles.rotation.y = time * 0.02;
    }

    // Animate dust
    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.01;
      this.dustParticles.rotation.x = Math.sin(time * 0.05) * 0.02;
    }

    // Animate wave rings
    this.particles.forEach(p => {
      if (p.userData && p.userData.waveRing) {
        const scale = 1 + Math.sin(time * 0.5) * 0.15;
        p.scale.set(scale, scale, 1);
        p.material.opacity = p.userData.baseOpacity + Math.sin(time) * 0.03;
      }
    });
  }
}
