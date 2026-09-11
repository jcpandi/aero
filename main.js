/* ==========================================================================
   AERO/RUN — High-Performance Landing Page Engine
   Interactive Mechanics, 3D Shoe Engine & Telemetry Observer
   ========================================================================== */

import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
  initVideoController();
  init3DShoeEngine();
  initHotspotInteractions();
  initHeroObserver();
  initNavObserver();
  initScrollRevealObserver();
  initAccessibilityListeners();
});

/**
 * 1. Video Loading & Fallback Controller
 */
function initVideoController() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  const remoteVideoUrl = 'https://media.dinamosites.com/library/v1/video/aero-run-loop-e45a8619dfea.mp4';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  video.addEventListener('error', () => {
    console.warn('Local video source failed, falling back to remote URL...');
    if (video.src !== remoteVideoUrl) {
      video.src = remoteVideoUrl;
      video.load();
      video.play().catch(err => console.log('Autoplay prevented:', err));
    }
  });

  video.play().catch(err => {
    console.log('Initial autoplay state:', err);
  });
}

/**
 * 2. Three.js 3D Rotating Shoe Engine & 3D Hotspot Sync
 */
let scene, camera, renderer, shoeGroup, orbitParticles;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotationX = 0.15;
let targetRotationY = -0.6;
let currentRotationX = 0.15;
let currentRotationY = -0.6;
let is3DEngineActive = true;
let anim3DFrameId = null;

// 3D Hotspot Anchor Positions relative to shoe group
const hotspot3DAnchors = {
  foam: new THREE.Vector3(-0.6, -0.45, 0.45),
  plate: new THREE.Vector3(0.7, -0.25, 0.25),
  upper: new THREE.Vector3(0.2, 0.45, -0.15)
};

function init3DShoeEngine() {
  const container = document.getElementById('canvas-3d-container');
  const canvas = document.getElementById('shoe-3d-canvas');

  if (!container || !canvas) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
  camera.position.set(0, 0, 9);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  // Key Chartreuse Accent Directional Light
  const chartreuseLight = new THREE.DirectionalLight(0xCCFF00, 3.5);
  chartreuseLight.position.set(5, 8, 5);
  scene.add(chartreuseLight);

  // Crisp White Rim Light
  const rimLight = new THREE.DirectionalLight(0xffffff, 2.5);
  rimLight.position.set(-8, -4, -5);
  scene.add(rimLight);

  // Soft Studio Fill Light
  const fillLight = new THREE.PointLight(0xffffff, 1.8, 50);
  fillLight.position.set(0, 5, 5);
  scene.add(fillLight);

  // Build Procedural 3D Athletic Shoe Model Group
  shoeGroup = createShoe3DModel();
  
  // Offset shoe to center-right area (right 60% of viewport)
  updateShoePositionForViewport();
  scene.add(shoeGroup);

  // Add 3D Chartreuse Particle Orbit Ring
  orbitParticles = createOrbitParticleRing();
  shoeGroup.add(orbitParticles);

  // Setup Drag / Hover Interactions
  setup3DInteractions(container);

  // Handle Resize
  window.addEventListener('resize', onWindowResize);

  // Start 3D Render Loop
  animate3DShoe();
}

/**
 * Construct Aerodynamic Procedural 3D Shoe Geometry & Materials
 */
function createShoe3DModel() {
  const group = new THREE.Group();

  // Material Definitions
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    roughness: 0.35,
    metalness: 0.25
  });

  const chartreuseMat = new THREE.MeshStandardMaterial({
    color: 0xCCFF00,
    emissive: 0xCCFF00,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.8
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c0f,
    roughness: 0.15,
    metalness: 0.95
  });

  const upperMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d24,
    roughness: 0.75,
    metalness: 0.1
  });

  const laceMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e38,
    roughness: 0.8
  });

  // 1. Aerodynamic Supercritical Midsole
  const soleShape = new THREE.Shape();
  soleShape.moveTo(-2.2, -0.4);
  soleShape.bezierCurveTo(-1.8, -0.65, 1.2, -0.65, 2.4, -0.3);
  soleShape.bezierCurveTo(2.6, -0.1, 2.2, 0.15, 1.8, 0.1);
  soleShape.bezierCurveTo(1.0, -0.05, -1.5, -0.15, -2.2, -0.4);

  const extrudeSettings = { depth: 0.9, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: 0.12, bevelThickness: 0.12 };
  const soleGeo = new THREE.ExtrudeGeometry(soleShape, extrudeSettings);
  soleGeo.center();
  const soleMesh = new THREE.Mesh(soleGeo, soleMat);
  soleMesh.scale.set(1.4, 0.9, 1);
  group.add(soleMesh);

  // 2. Chartreuse Neon Energy Return Strip
  const stripeGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 16);
  const stripeMesh = new THREE.Mesh(stripeGeo, chartreuseMat);
  stripeMesh.rotation.z = Math.PI / 2.1;
  stripeMesh.position.set(0, -0.28, 0.48);
  group.add(stripeMesh);

  // 3. Carbon Vector Plate Core
  const carbonPlateGeo = new THREE.BoxGeometry(3.6, 0.06, 0.8);
  const carbonPlateMesh = new THREE.Mesh(carbonPlateGeo, carbonMat);
  carbonPlateMesh.position.set(0, -0.15, 0);
  carbonPlateMesh.rotation.z = -0.08;
  group.add(carbonPlateMesh);

  // 4. Ergonomic Micro-Knit Upper Mesh
  const upperGeo = new THREE.SphereGeometry(1.4, 32, 24);
  upperGeo.scale(1.7, 0.7, 0.6);
  const upperMesh = new THREE.Mesh(upperGeo, upperMat);
  upperMesh.position.set(-0.1, 0.35, 0);
  group.add(upperMesh);

  // Forefoot curvature shape
  const toeGeo = new THREE.ConeGeometry(0.75, 1.6, 24);
  const toeMesh = new THREE.Mesh(toeGeo, upperMat);
  toeMesh.rotation.z = -Math.PI / 2.3;
  toeMesh.position.set(1.2, 0.12, 0);
  group.add(toeMesh);

  // Heel Counter
  const heelGeo = new THREE.SphereGeometry(0.75, 24, 24);
  const heelMesh = new THREE.Mesh(heelGeo, soleMat);
  heelMesh.position.set(-1.6, 0.4, 0);
  group.add(heelMesh);

  // Chartreuse Heel Pull Tab
  const tabGeo = new THREE.BoxGeometry(0.12, 0.5, 0.25);
  const tabMesh = new THREE.Mesh(tabGeo, chartreuseMat);
  tabMesh.position.set(-2.05, 0.75, 0);
  tabMesh.rotation.z = 0.3;
  group.add(tabMesh);

  // Laces Structure
  for (let i = 0; i < 5; i++) {
    const laceGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
    const laceMesh = new THREE.Mesh(laceGeo, laceMat);
    laceMesh.rotation.x = Math.PI / 2;
    laceMesh.rotation.z = 0.2;
    laceMesh.position.set(-0.6 + i * 0.38, 0.62 + i * 0.05, 0);
    group.add(laceMesh);
  }

  // Initial Rotation Tilt
  group.rotation.x = 0.15;
  group.rotation.y = -0.6;
  group.rotation.z = 0.05;

  return group;
}

/**
 * 3D Chartreuse Particle Orbit Ring encircling Midsole
 */
function createOrbitParticleRing() {
  const particleCount = 180;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const radius = 2.8;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.sin(angle * 2) * 0.35) - 0.2;
    positions[i * 3 + 2] = Math.sin(angle) * (radius * 0.55);

    colors[i * 3] = 0.8;    // R
    colors[i * 3 + 1] = 1.0;  // G (Chartreuse)
    colors[i * 3 + 2] = 0.0;  // B
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.85
  });

  const particleSystem = new THREE.Points(geometry, material);
  particleSystem.rotation.z = -0.2;
  return particleSystem;
}

/**
 * Adjust 3D Shoe position depending on screen width (Keep 38% left clear)
 */
function updateShoePositionForViewport() {
  if (!shoeGroup) return;

  const width = window.innerWidth;
  if (width <= 768) {
    shoeGroup.position.set(0, -0.2, 0);
    shoeGroup.scale.set(0.85, 0.85, 0.85);
  } else {
    // Offset shoe to right 60% region of screen
    shoeGroup.position.set(1.8, -0.15, 0);
    shoeGroup.scale.set(1.15, 1.15, 1.15);
  }
}

/**
 * 3D Canvas Drag & Inertia Interactions
 */
function setup3DInteractions(container) {
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    container.classList.add('is-dragging');
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;

      // Clamp X rotation angle
      targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    } else {
      // Subtle parallax hover tilt when not dragging
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;
      targetRotationY = -0.6 + mouseX * 0.5;
      targetRotationX = 0.15 + mouseY * 0.3;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('is-dragging');
  });

  // Touch Support for Mobile
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/**
 * 3D Main Animation & Render Loop
 */
function animate3DShoe() {
  if (!is3DEngineActive) return;

  // Auto 360-degree rotation when not dragging
  if (!isDragging) {
    targetRotationY += 0.006;
  }

  // Smooth lerp interpolation towards target rotation
  currentRotationX += (targetRotationX - currentRotationX) * 0.08;
  currentRotationY += (targetRotationY - currentRotationY) * 0.08;

  if (shoeGroup) {
    shoeGroup.rotation.x = currentRotationX;
    shoeGroup.rotation.y = currentRotationY;
  }

  if (orbitParticles) {
    orbitParticles.rotation.y -= 0.012;
  }

  // Sync 3D Hotspots with screen position
  update3DHotspots();

  renderer.render(scene, camera);
  anim3DFrameId = requestAnimationFrame(animate3DShoe);
}

/**
 * Synchronize HTML Hotspots with 3D Object Screen Coordinates
 */
function update3DHotspots() {
  if (!shoeGroup || !camera) return;

  const width = window.innerWidth;
  if (width <= 768) return; // Hotspots hidden on mobile per rules

  const hotspotMap = {
    foam: document.getElementById('hotspot-foam'),
    plate: document.getElementById('hotspot-plate'),
    upper: document.getElementById('hotspot-upper')
  };

  for (const [key, element] of Object.entries(hotspotMap)) {
    if (!element) continue;

    const anchor3D = hotspot3DAnchors[key].clone();
    
    // Transform 3D anchor position relative to rotated shoe group
    anchor3D.applyMatrix4(shoeGroup.matrixWorld);
    
    // Project 3D coordinate to Normalized Device Coordinates (-1 to +1)
    anchor3D.project(camera);

    // Convert NDC to screen percentage
    const screenX = ((anchor3D.x + 1) / 2) * 100;
    const screenY = ((-anchor3D.y + 1) / 2) * 100;

    element.style.left = `${screenX}%`;
    element.style.top = `${screenY}%`;
  }
}

/**
 * Handle Window Resize
 */
function onWindowResize() {
  const container = document.getElementById('canvas-3d-container');
  if (!container || !renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  updateShoePositionForViewport();
}

/**
 * 3. Interactive Hotspots Controller
 */
function initHotspotInteractions() {
  const hotspotItems = document.querySelectorAll('.hotspot-item');

  hotspotItems.forEach(item => {
    const button = item.querySelector('.hotspot-trigger');
    const card = item.querySelector('.hotspot-card');

    if (!button || !card) return;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = item.classList.contains('active');
      
      hotspotItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.hotspot-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isActive) {
        item.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      }
    });

    button.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot-item')) {
      hotspotItems.forEach(item => {
        item.classList.remove('active');
        const btn = item.querySelector('.hotspot-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/**
 * 4. IntersectionObserver for Hero Section Video & 3D Engine
 */
function initHeroObserver() {
  const heroSection = document.getElementById('hero');
  const video = document.getElementById('hero-video');

  if (!heroSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (video && video.paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          video.play().catch(() => {});
        }
        if (!is3DEngineActive) {
          is3DEngineActive = true;
          animate3DShoe();
        }
      } else {
        if (video && !video.paused) {
          video.pause();
        }
        is3DEngineActive = false;
        if (anim3DFrameId) {
          cancelAnimationFrame(anim3DFrameId);
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(heroSection);
}

/**
 * 5. Scroll Reveal IntersectionObserver for All Sections
 */
function initScrollRevealObserver() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * 6. Navigation Active State Observer
 */
function initNavObserver() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = '#FFFFFF';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => observer.observe(sec));
}

/**
 * 7. Button Listeners & Scroll Feedback
 */
function initAccessibilityListeners() {
  const btnDiscover = document.getElementById('btn-discover');
  const btnFindSize = document.getElementById('btn-find-size');

  if (btnDiscover) {
    btnDiscover.addEventListener('click', () => {
      const designSection = document.getElementById('diseno');
      if (designSection) {
        designSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (btnFindSize) {
    btnFindSize.addEventListener('click', () => {
      alert('Sizing Assistant: Recommended size is US 10.5 (True to Size for Race Fit).');
    });
  }
}
