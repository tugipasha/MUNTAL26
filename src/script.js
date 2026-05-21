import './styles.css';
import 'lenis/dist/lenis.css';
import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { vertexShader, fragmentShader } from './shaders.js';

const CONFIG = {
  totalImages: 10,
  tilesPerRevolution: 15,
  revolutions: 5,
  startRadius: 5,
  endRadius: 3.5,
  tileHeightRatio: 1.1,
  tileSegments: 24,
  spiralGap: 0.35,
  tileOverlap: 0.005,
  cameraZ: 12,
  cameraSmoothing: 0.075,
  baseRotationSpeed: 0.001,
  scrollRotationMultiplier: 0.0035,
  rotationDecay: 0.9,
  scrollMultiplier: 1.25,
  cameraYMultiplier: 0.2,
  parallaxStrength: 0.1,
  spiralOffsetY: -2.0,
};

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector('.hero');

const state = {
  isMobile: window.innerWidth < 768,
  width: 0,
  height: 0,
  scrollProgress: 0,
  scrollVelocity: 0,
  spinVelocity: 0,
  targetCameraY: 0,
  currentCameraY: 0,
  mouseX: 0,
  mouseY: 0,
  targetTiltX: 0,
  targetTiltZ: 0,
  currentTiltX: 0,
  currentTiltZ: 0,
};

let scene;
let camera;
let renderer;
let spiral;

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  smoothTouch: false,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

ScrollTrigger.scrollerProxy(document.documentElement, {
  scrollTop(value) {
    if (arguments.length) {
      lenis.scrollTo(value, { immediate: true });
    }
    return lenis.scroll;
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
});

lenis.on('scroll', ({ scroll, limit, velocity }) => {
  state.scrollProgress = Math.min(scroll / Math.max(limit, 1), 1);
  state.scrollVelocity = velocity;
  state.spinVelocity +=
    velocity * CONFIG.scrollRotationMultiplier * CONFIG.scrollMultiplier;
  ScrollTrigger.update();

  // Add hero layer effect
  const hero = document.querySelector('.hero');
  if (hero) {
    // Calculate hero opacity and scale based on scroll
    const heroScrollThreshold = window.innerHeight * 0.8;
    const heroProgress = Math.min(scroll / heroScrollThreshold, 1);
    hero.style.opacity = 1 - (heroProgress * 0.25); // Fade out slightly
    hero.style.transform = `scale(${1 - (heroProgress * 0.05)})`; // Subtle scale
  }
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

const ctx = gsap.context(() => {
  gsap.utils.toArray('.reveal-text').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true,
        },
      }
    );
  });
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => ctx.revert());
}

window.addEventListener('load', () => ScrollTrigger.refresh());

function initMobileNav() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('is-open');
    menu.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  };

  const openMenu = () => {
    menu.removeAttribute('hidden');
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-open');
  };

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMenu();
  });
}

initMobileNav();
initApplyForm();

function initApplyForm() {
  const form = document.getElementById('apply-form');
  const roleSelect = document.getElementById('apply-role');
  const messageEl = document.getElementById('apply-message');
  const panels = document.querySelectorAll('.apply-panel');

  if (!form || !roleSelect || !messageEl) return;

  const showMessage = (text, type) => {
    messageEl.textContent = text;
    messageEl.hidden = false;
    messageEl.classList.remove('apply-form__message--success', 'apply-form__message--error');
    messageEl.classList.add(
      type === 'success' ? 'apply-form__message--success' : 'apply-form__message--error'
    );
  };

  const clearMessage = () => {
    messageEl.hidden = true;
    messageEl.textContent = '';
    messageEl.classList.remove('apply-form__message--success', 'apply-form__message--error');
  };

  const setPanelRequired = (panel, active) => {
    if (!panel) return;
    panel.querySelectorAll('[data-required="true"]').forEach((field) => {
      field.required = active;
    });
    const committeeGroup = panel.querySelector('[data-committee-group]');
    if (committeeGroup) {
      committeeGroup.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.required = false;
      });
    }
  };

  const hideAllPanels = () => {
    panels.forEach((panel) => {
      panel.hidden = true;
      setPanelRequired(panel, false);
    });
  };

  const showPanel = (role) => {
    hideAllPanels();
    clearMessage();
    const panel = document.querySelector(`.apply-panel[data-role="${role}"]`);
    if (!panel) return;
    panel.hidden = false;
    setPanelRequired(panel, true);
  };

  roleSelect.addEventListener('change', () => {
    const role = roleSelect.value;
    if (!role) {
      hideAllPanels();
      return;
    }
    showPanel(role);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage();

    try {
      const role = roleSelect.value;
      if (!role) {
        showMessage('Please select an application type.', 'error');
        roleSelect.focus();
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        showMessage('Please complete all required fields.', 'error');
        return;
      }

      if (role === 'delegate' || role === 'chairboard') {
        const panel = document.querySelector(`.apply-panel[data-role="${role}"]`);
        const checked = panel?.querySelectorAll('input[name="committee"]:checked');
        if (!checked?.length) {
          showMessage('Select at least one committee preference.', 'error');
          return;
        }
      }

      const activePanel = document.querySelector(`.apply-panel[data-role="${role}"]`);
      activePanel?.querySelectorAll('[data-required="true"]').forEach((field) => {
        if (!field.value.trim()) {
          throw new Error('MISSING_FIELD');
        }
      });

      showMessage('Submitted', 'success');
      form.reset();
      hideAllPanels();
      roleSelect.selectedIndex = 0;
    } catch (err) {
      if (err.message === 'MISSING_FIELD') {
        showMessage('Please complete all required fields for this application type.', 'error');
        form.reportValidity();
        return;
      }
      showMessage('Something went wrong. Please try again.', 'error');
      console.error(err);
    }
  });
}

window.addEventListener('mousemove', (e) => {
  if (state.isMobile) return;
  state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  state.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  state.targetTiltX = state.mouseY * CONFIG.parallaxStrength;
  state.targetTiltZ = state.mouseX * CONFIG.parallaxStrength * -0.5;
});

function createCurvedTileGeometry(radius, arcAngle, tileHeight, segments) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = t * arcAngle;
    const x = Math.sin(theta) * radius;
    const z = Math.cos(theta) * radius;

    vertices.push(x, tileHeight / 2, z);
    uvs.push(t, 1);

    vertices.push(x, -tileHeight / 2, z);
    uvs.push(t, 0);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createFallbackTexture() {
  const data = new Uint8Array([22, 22, 24, 255]);
  const texture = new THREE.DataTexture(data, 1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function loadTextures(textureLoader, rendererInstance) {
  const anisotropy = rendererInstance.capabilities.getMaxAnisotropy();
  const promises = [];

  for (let i = 1; i <= CONFIG.totalImages; i++) {
    promises.push(
      new Promise((resolve) => {
        textureLoader.load(
          `${import.meta.env.BASE_URL}images/img${i}.jpg`,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = anisotropy;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            resolve(texture);
          },
          undefined,
          () => resolve(createFallbackTexture())
        );
      })
    );
  }

  return Promise.all(promises);
}

function scheduleIdle(callback) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 1500 });
  } else {
    requestAnimationFrame(() => requestAnimationFrame(callback));
  }
}

function initWebGL() {
  state.width = hero.clientWidth;
  state.height = hero.clientHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, state.width / state.height, 0.1, 100);
  camera.position.set(0, 0, CONFIG.cameraZ + (state.isMobile ? 3 : 0));

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(state.width, state.height);
  renderer.setClearColor(0, 0);

  renderer.domElement.classList.add('hero__canvas');
  hero.appendChild(renderer.domElement);

  spiral = new THREE.Group();
  spiral.position.y = CONFIG.spiralOffsetY;
  scene.add(spiral);

  const totalTiles = CONFIG.tilesPerRevolution * CONFIG.revolutions;
  const angleStep = (Math.PI * 2) / CONFIG.tilesPerRevolution;
  const arcAngle = angleStep + CONFIG.tileOverlap;
  const chord = 2 * CONFIG.startRadius * Math.sin(angleStep / 2);
  const tileHeight = chord * CONFIG.tileHeightRatio;
  const startY = ((totalTiles - 1) * CONFIG.spiralGap) / 2;

  const textureLoader = new THREE.TextureLoader();

  loadTextures(textureLoader, renderer).then((textures) => {
    for (let i = 0; i < totalTiles; i++) {
      const t = i / Math.max(totalTiles - 1, 1);
      const radius = THREE.MathUtils.lerp(CONFIG.startRadius, CONFIG.endRadius, t);
      const geometry = createCurvedTileGeometry(
        radius,
        arcAngle,
        tileHeight,
        CONFIG.tileSegments
      );

      const texture = textures[i % CONFIG.totalImages];
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: texture },
          uCameraPosition: { value: camera.position },
        },
        side: THREE.DoubleSide,
        transparent: true,
      });

      const tile = new THREE.Mesh(geometry, material);
      const normalY = startY - i * CONFIG.spiralGap;
      tile.position.y = normalY + (Math.random() * 20 - 10);
      tile.rotation.y = i * angleStep;
      tile.userData.normalY = normalY;
      spiral.add(tile);
    }

    renderer.domElement.style.opacity = '1';

    setTimeout(() => {
      const tl = gsap.timeline();
      
      spiral.children.forEach((tile, i) => {
        tl.to(tile.position, {
          y: tile.userData.normalY,
          duration: 1.2,
          ease: 'power3.inOut'
        }, i * 0.01);
      });

      tl.to('.hero__topbar, .hero__core, .hero__bottom', {
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
      }, '-=0.8');
    }, 1250);
  });

  function tick() {
    if (spiral) {
      spiral.rotation.y += CONFIG.baseRotationSpeed + state.spinVelocity;
      state.spinVelocity *= CONFIG.rotationDecay;

      if (!state.isMobile) {
        state.currentTiltX +=
          (state.targetTiltX - state.currentTiltX) * CONFIG.cameraSmoothing;
        state.currentTiltZ +=
          (state.targetTiltZ - state.currentTiltZ) * CONFIG.cameraSmoothing;
        spiral.rotation.x = state.currentTiltX;
        spiral.rotation.z = state.currentTiltZ;
      }

      state.targetCameraY = -state.scrollProgress * CONFIG.cameraYMultiplier * 10;
      state.currentCameraY +=
        (state.targetCameraY - state.currentCameraY) * CONFIG.cameraSmoothing;
      camera.position.y = state.currentCameraY;
      camera.lookAt(0, state.currentCameraY * 0.4, 0);

      spiral.children.forEach((tile) => {
        if (tile.material.uniforms?.uCameraPosition) {
          tile.material.uniforms.uCameraPosition.value.copy(camera.position);
        }
      });
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }

    requestAnimationFrame(tick);
  }

  tick();
  handleResize();
}

function handleResize() {
  if (!hero || !camera || !renderer) return;

  state.isMobile = window.innerWidth < 768;
  state.width = hero.clientWidth;
  state.height = hero.clientHeight;

  camera.aspect = state.width / state.height;
  camera.updateProjectionMatrix();
  camera.position.z = CONFIG.cameraZ + (state.isMobile ? 3 : 0);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(state.width, state.height);

  if (state.isMobile) {
    state.targetTiltX = 0;
    state.targetTiltZ = 0;
  }
}

window.addEventListener('resize', handleResize);

if (hero) {
  scheduleIdle(() => initWebGL());
}
