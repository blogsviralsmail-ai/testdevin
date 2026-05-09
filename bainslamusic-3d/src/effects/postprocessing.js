/**
 * Post-Processing Effects
 * Bloom, vignette, color grading
 */
import * as THREE from 'three';

export class PostProcessing {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.enabled = false;

    try {
      this.setupComposer();
    } catch (e) {
      console.warn('Post-processing not available, using direct rendering');
      this.enabled = false;
    }
  }

  setupComposer() {
    // Simple bloom-like effect using additive rendering
    // We'll use custom full-screen quad for glow effect
    const renderer = this.sceneManager.renderer;
    const size = new THREE.Vector2();
    renderer.getSize(size);

    // Create render targets
    this.renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    });

    // Simple bloom via brightness extraction
    this.bloomTarget = new THREE.WebGLRenderTarget(
      size.x / 4,
      size.y / 4,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      }
    );

    // Full-screen quad for compositing
    this.fsQuad = this.createFSQuad();
    this.enabled = true;
  }

  createFSQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uVignette: { value: 0.4 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uVignette;
        uniform float uTime;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Vignette
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = 1.0 - smoothstep(0.3, 0.9, dist) * uVignette;
          color.rgb *= vignette;
          
          // Subtle color grading - slight blue tint in shadows
          color.rgb = mix(color.rgb, color.rgb * vec3(0.9, 0.95, 1.1), 0.15);
          
          // Slight film grain
          float grain = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
          color.rgb += (grain - 0.5) * 0.02;
          
          gl_FragColor = color;
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    return { scene, camera, mesh, material };
  }

  render() {
    if (!this.enabled) {
      this.sceneManager.render();
      return;
    }

    const renderer = this.sceneManager.renderer;
    const scene = this.sceneManager.scene;
    const camera = this.sceneManager.camera;

    // Render scene to texture
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    // Composite with post-processing
    this.fsQuad.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.fsQuad.material.uniforms.uTime.value = performance.now() * 0.001;

    renderer.render(this.fsQuad.scene, this.fsQuad.camera);
  }

  onResize() {
    if (!this.enabled) return;
    const size = new THREE.Vector2();
    this.sceneManager.renderer.getSize(size);
    this.renderTarget.setSize(size.x, size.y);
    this.bloomTarget.setSize(size.x / 4, size.y / 4);
  }
}
