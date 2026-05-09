/**
 * Three.js Scene Manager
 * WebGPU with WebGL fallback
 */
import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.objects = [];
    this.sectionObjects = [];
  }

  async init() {
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 15);

    // Try WebGPU first, fallback to WebGL
    this.renderer = this.createRenderer();

    // Scene setup
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    this.setupLighting();
    this.createSectionEnvironments();
    this.createBackground();
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0a0a1a, 1);
    return renderer;
  }

  setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x1a1a3e, 0.5);
    this.scene.add(ambient);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Colored point lights for each section
    this.sectionLights = [];

    const lightConfigs = [
      { color: 0xff2d55, pos: [0, 2, 12], intensity: 3 },    // Home - red
      { color: 0x00f0ff, pos: [0, 2, -18], intensity: 3 },   // About - cyan
      { color: 0xa855f7, pos: [0, 2, -48], intensity: 3 },   // Services - purple
      { color: 0xfbbf24, pos: [0, 2, -78], intensity: 3 },   // Videos - gold
      { color: 0xff2d55, pos: [0, 2, -108], intensity: 3 },  // Contact - red
    ];

    lightConfigs.forEach(config => {
      const light = new THREE.PointLight(config.color, config.intensity, 30);
      light.position.set(...config.pos);
      this.scene.add(light);
      this.sectionLights.push(light);
    });
  }

  createSectionEnvironments() {
    const sectionPositions = [0, -30, -60, -90, -120];

    sectionPositions.forEach((z, index) => {
      const group = new THREE.Group();
      group.position.z = z;

      switch (index) {
        case 0: this.createHomeEnvironment(group); break;
        case 1: this.createAboutEnvironment(group); break;
        case 2: this.createServicesEnvironment(group); break;
        case 3: this.createVideosEnvironment(group); break;
        case 4: this.createContactEnvironment(group); break;
      }

      this.scene.add(group);
      this.sectionObjects.push(group);
    });
  }

  createHomeEnvironment(group) {
    // Large glowing music note sphere
    const sphereGeo = new THREE.IcosahedronGeometry(3, 2);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      emissive: 0xff2d55,
      emissiveIntensity: 0.3,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 0, -2);
    sphere.userData.rotate = true;
    sphere.userData.speed = 0.3;
    group.add(sphere);
    this.objects.push(sphere);

    // Inner solid sphere
    const innerGeo = new THREE.IcosahedronGeometry(2, 1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.3
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(0, 0, -2);
    inner.userData.rotate = true;
    inner.userData.speed = -0.2;
    group.add(inner);
    this.objects.push(inner);

    // Orbiting rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(4 + i * 0.7, 0.03, 8, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0xff2d55 : i === 1 ? 0x00f0ff : 0xa855f7,
        emissive: i === 0 ? 0xff2d55 : i === 1 ? 0x00f0ff : 0xa855f7,
        emissiveIntensity: 0.5
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0, -2);
      ring.rotation.x = Math.PI / 2 + i * 0.4;
      ring.rotation.z = i * 0.6;
      ring.userData.rotate = true;
      ring.userData.speed = 0.15 + i * 0.1;
      ring.userData.axis = i;
      group.add(ring);
      this.objects.push(ring);
    }

    // Floating music-themed small objects
    for (let i = 0; i < 20; i++) {
      const geo = Math.random() > 0.5
        ? new THREE.OctahedronGeometry(0.15 + Math.random() * 0.2)
        : new THREE.TetrahedronGeometry(0.15 + Math.random() * 0.2);
      const mat = new THREE.MeshStandardMaterial({
        color: [0xff2d55, 0x00f0ff, 0xa855f7][Math.floor(Math.random() * 3)],
        emissive: [0xff2d55, 0x00f0ff, 0xa855f7][Math.floor(Math.random() * 3)],
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        -2 + (Math.random() - 0.5) * 10
      );
      mesh.userData.float = true;
      mesh.userData.floatSpeed = 0.3 + Math.random() * 0.5;
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      mesh.userData.rotate = true;
      mesh.userData.speed = 0.5 + Math.random() * 1;
      group.add(mesh);
      this.objects.push(mesh);
    }
  }

  createAboutEnvironment(group) {
    // Central DNA-like helix
    const helixPoints = [];
    for (let i = 0; i < 100; i++) {
      const t = i * 0.15;
      helixPoints.push(new THREE.Vector3(
        Math.sin(t) * 2,
        t - 7.5,
        Math.cos(t) * 2
      ));
    }
    const helixGeo = new THREE.BufferGeometry().setFromPoints(helixPoints);
    const helixMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6
    });
    const helix = new THREE.Line(helixGeo, helixMat);
    helix.position.set(6, 0, 0);
    helix.userData.rotate = true;
    helix.userData.speed = 0.2;
    group.add(helix);
    this.objects.push(helix);

    // Second helix strand
    const helix2Points = [];
    for (let i = 0; i < 100; i++) {
      const t = i * 0.15;
      helix2Points.push(new THREE.Vector3(
        Math.sin(t + Math.PI) * 2,
        t - 7.5,
        Math.cos(t + Math.PI) * 2
      ));
    }
    const helix2Geo = new THREE.BufferGeometry().setFromPoints(helix2Points);
    const helix2Mat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.6
    });
    const helix2 = new THREE.Line(helix2Geo, helix2Mat);
    helix2.position.set(6, 0, 0);
    helix2.userData.rotate = true;
    helix2.userData.speed = 0.2;
    group.add(helix2);
    this.objects.push(helix2);

    // Team representation - glowing cubes
    const teamPositions = [
      { x: -5, y: 2, color: 0xff2d55 },
      { x: -5, y: 0, color: 0x00f0ff },
      { x: -5, y: -2, color: 0xa855f7 },
    ];

    teamPositions.forEach(tp => {
      const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: tp.color,
        emissive: tp.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set(tp.x, tp.y, 0);
      cube.userData.rotate = true;
      cube.userData.speed = 0.5;
      cube.userData.float = true;
      cube.userData.floatSpeed = 0.4;
      cube.userData.floatOffset = tp.y;
      group.add(cube);
      this.objects.push(cube);
    });
  }

  createServicesEnvironment(group) {
    // Pentagon arrangement of service nodes
    const serviceColors = [0xff2d55, 0x00f0ff, 0xa855f7, 0xfbbf24, 0x10b981];
    const radius = 5;

    serviceColors.forEach((color, i) => {
      const angle = (i / serviceColors.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Service node
      const nodeGeo = new THREE.DodecahedronGeometry(0.6);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, 0);
      node.userData.rotate = true;
      node.userData.speed = 0.5;
      node.userData.float = true;
      node.userData.floatSpeed = 0.3;
      node.userData.floatOffset = i;
      group.add(node);
      this.objects.push(node);

      // Connection line to center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, 0),
        new THREE.Vector3(0, 0, 0)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      group.add(new THREE.Line(lineGeo, lineMat));
    });

    // Center hub
    const hubGeo = new THREE.IcosahedronGeometry(1, 1);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff2d55,
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.userData.rotate = true;
    hub.userData.speed = 0.3;
    group.add(hub);
    this.objects.push(hub);
  }

  createVideosEnvironment(group) {
    // Grid of floating screens
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const screenGeo = new THREE.PlaneGeometry(2.5, 1.5);
        const screenMat = new THREE.MeshStandardMaterial({
          color: 0x111133,
          emissive: [0xff2d55, 0x00f0ff, 0xa855f7, 0xfbbf24][(row * 4 + col) % 4],
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(
          (col - 1.5) * 3.2,
          (row - 1) * 2.2,
          0
        );
        screen.userData.float = true;
        screen.userData.floatSpeed = 0.2;
        screen.userData.floatOffset = row * 4 + col;

        // Screen border
        const borderGeo = new THREE.EdgesGeometry(screenGeo);
        const borderMat = new THREE.LineBasicMaterial({
          color: [0xff2d55, 0x00f0ff, 0xa855f7, 0xfbbf24][(row * 4 + col) % 4],
          transparent: true,
          opacity: 0.4
        });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        screen.add(border);

        group.add(screen);
        this.objects.push(screen);
      }
    }
  }

  createContactEnvironment(group) {
    // Glowing globe wireframe
    const globeGeo = new THREE.SphereGeometry(3, 24, 24);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      emissive: 0xff2d55,
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.position.set(0, 0, -3);
    globe.userData.rotate = true;
    globe.userData.speed = 0.1;
    group.add(globe);
    this.objects.push(globe);

    // Location pin effect - vertical beam
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 8, 8);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(1.5, 0, -1);
    group.add(beam);

    // Signal rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.8 + i * 0.5, 0.85 + i * 0.5, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.3 - i * 0.08,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(1.5, 0, -1);
      ring.rotation.x = Math.PI / 2;
      ring.userData.pulse = true;
      ring.userData.pulseSpeed = 0.5;
      ring.userData.pulseOffset = i * 0.5;
      group.add(ring);
      this.objects.push(ring);
    }
  }

  createBackground() {
    // Starfield
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = (Math.random() - 0.5) * 200;
      positions[i3 + 2] = (Math.random() - 0.5) * 300 - 60;

      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.2 + 0.6, 0.8, 0.6 + Math.random() * 0.4);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);

    // Grid floor
    const gridHelper = new THREE.GridHelper(100, 50, 0x1a1a4e, 0x0d0d2e);
    gridHelper.position.y = -6;
    gridHelper.position.z = -60;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    this.scene.add(gridHelper);
  }

  update(time) {
    // Animate all objects
    this.objects.forEach(obj => {
      if (obj.userData.rotate) {
        const speed = obj.userData.speed || 0.5;
        if (obj.userData.axis === 0) {
          obj.rotation.y += 0.005 * speed;
          obj.rotation.z += 0.002 * speed;
        } else if (obj.userData.axis === 1) {
          obj.rotation.x += 0.003 * speed;
          obj.rotation.z += 0.005 * speed;
        } else if (obj.userData.axis === 2) {
          obj.rotation.x += 0.004 * speed;
          obj.rotation.y += 0.003 * speed;
        } else {
          obj.rotation.x += 0.003 * speed;
          obj.rotation.y += 0.005 * speed;
        }
      }

      if (obj.userData.float) {
        const offset = obj.userData.floatOffset || 0;
        const speed = obj.userData.floatSpeed || 0.5;
        obj.position.y += Math.sin(time * speed + offset) * 0.003;
      }

      if (obj.userData.pulse) {
        const offset = obj.userData.pulseOffset || 0;
        const speed = obj.userData.pulseSpeed || 0.5;
        const scale = 1 + Math.sin(time * speed + offset) * 0.2;
        obj.scale.set(scale, scale, scale);
      }
    });

    // Slowly rotate stars
    if (this.stars) {
      this.stars.rotation.y += 0.0001;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
