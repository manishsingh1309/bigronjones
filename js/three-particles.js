// Three.js Particle System
// Subtle 3D particle background for hero section

let scene, camera, renderer, particleSystem, aboutSphere;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Initialize Three.js only when hero section is in view
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px'
};

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !renderer) {
      initHeroParticles();
      heroObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe hero section
const heroSection = document.querySelector('.hero');
if (heroSection) {
  heroObserver.observe(heroSection);
}

// Initialize particles for hero section
function initHeroParticles() {
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded. 3D effects will not render.');
    return;
  }
  
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  
  // Scene setup
  scene = new THREE.Scene();
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
  
  // Create particles
  createParticles();
  
  // Mouse movement tracking
  document.addEventListener('mousemove', onMouseMove);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
}

// Create particle system
function createParticles() {
  const particleCount = window.innerWidth < 768 ? 300 : 500; // Fewer particles on mobile
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  // Orange color (primary brand color)
  const color = new THREE.Color(0xFF4D00);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Random positions in a sphere
    positions[i3] = (Math.random() - 0.5) * 15;
    positions[i3 + 1] = (Math.random() - 0.5) * 15;
    positions[i3 + 2] = (Math.random() - 0.5) * 10;
    
    // Slight color variation
    const colorVariation = 0.8 + Math.random() * 0.2;
    colors[i3] = color.r * colorVariation;
    colors[i3 + 1] = color.g * colorVariation;
    colors[i3 + 2] = color.b * colorVariation;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Particle material
  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  
  // Create particle system
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (!particleSystem) return;
  
  // Smooth mouse follow effect
  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;
  
  // Rotate particle system slowly
  particleSystem.rotation.y += 0.0005;
  particleSystem.rotation.x += targetY * 0.05;
  particleSystem.rotation.y += targetX * 0.05;
  
  // Pulse effect
  const time = Date.now() * 0.0005;
  particleSystem.position.y = Math.sin(time) * 0.1;
  
  // Render scene
  renderer.render(scene, camera);
}

// Mouse move handler
function onMouseMove(event) {
  mouseX = event.clientX - window.innerWidth / 2;
  mouseY = event.clientY - window.innerHeight / 2;
}

// Window resize handler
function onWindowResize() {
  if (!camera || !renderer) return;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize About section 3D sphere (desktop only)
if (window.innerWidth >= 1024) {
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !aboutSphere) {
        initAboutSphere();
        aboutObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const aboutSection = document.querySelector('.about');
  if (aboutSection) {
    aboutObserver.observe(aboutSection);
  }
}

// Initialize wireframe sphere for about section
function initAboutSphere() {
  if (typeof THREE === 'undefined') return;
  
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;
  
  // Scene setup
  const aboutScene = new THREE.Scene();
  
  // Camera setup
  const aboutCamera = new THREE.PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    1000
  );
  aboutCamera.position.z = 3;
  
  // Renderer setup
  const aboutRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  aboutRenderer.setSize(canvas.width, canvas.height);
  aboutRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Create wireframe sphere
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF4D00,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  
  aboutSphere = new THREE.Mesh(geometry, material);
  aboutScene.add(aboutSphere);
  
  // Animation loop for sphere
  function animateSphere() {
    requestAnimationFrame(animateSphere);
    
    // Rotate sphere
    aboutSphere.rotation.x += 0.005;
    aboutSphere.rotation.y += 0.01;
    
    // Render
    aboutRenderer.render(aboutScene, aboutCamera);
  }
  
  animateSphere();
}

// Performance optimization: Pause animations when tab is not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause animations if needed
  } else {
    // Resume animations
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (renderer) {
    renderer.dispose();
  }
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});
