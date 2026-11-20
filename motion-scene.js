(function () {
  'use strict';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- Three.js Ambient 3D Scene -------------------- */

  let threeState = null;

  function initThreeBackground() {
    if (prefersReducedMotion || typeof THREE === 'undefined') return;
    const canvas = document.getElementById('threeBgCanvas');
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    // Lighting tailored for soft claymorphism + crisp specular glass rim
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x9be85c, 1.35);
    keyLight.position.set(8, 10, 10);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.4, 35);
    fillLight.position.set(-9, -4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 1.1, 35);
    rimLight.position.set(9, -7, 4);
    scene.add(rimLight);

    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    // Sculpted clay-matte & translucent frosted-glass 3D objects tucked neatly along outer viewport depth
    const floatingShapes = [];

    function addSculptedMesh(geometry, material, pos, rotSpeed, floatOffset, amp) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);
      shapesGroup.add(mesh);
      floatingShapes.push({
        mesh,
        baseY: pos[1],
        baseX: pos[0],
        rotX: rotSpeed[0],
        rotY: rotSpeed[1],
        offset: floatOffset,
        amp
      });
      return mesh;
    }

    // 1. Matte Clay Torus (Top-Left depth)
    addSculptedMesh(
      new THREE.TorusGeometry(1.55, 0.46, 20, 48),
      new THREE.MeshStandardMaterial({
        color: 0x69be28,
        roughness: 0.46,
        metalness: 0.08,
        transparent: true,
        opacity: 0.34
      }),
      [-7.8, 3.8, -5.5],
      [0.0022, 0.0031],
      0.0,
      0.35
    );

    // 2. Frosted Glass Crystal Icosahedron (Right-Mid depth)
    addSculptedMesh(
      new THREE.IcosahedronGeometry(1.75, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0x9be85c,
        roughness: 0.14,
        metalness: 0.05,
        transmission: 0.45,
        transparent: true,
        opacity: 0.24
      }),
      [8.2, 1.8, -6.0],
      [0.0018, -0.0028],
      1.6,
      0.42
    );

    // Crisp outer wireframe halo around crystal
    addSculptedMesh(
      new THREE.IcosahedronGeometry(1.85, 0),
      new THREE.MeshBasicMaterial({
        color: 0x69be28,
        wireframe: true,
        transparent: true,
        opacity: 0.16
      }),
      [8.2, 1.8, -6.0],
      [0.0018, -0.0028],
      1.6,
      0.42
    );

    // 3. Pillowy Clay Sphere (Bottom-Left depth)
    addSculptedMesh(
      new THREE.SphereGeometry(1.3, 28, 28),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.5,
        metalness: 0.06,
        transparent: true,
        opacity: 0.28
      }),
      [-7.4, -4.1, -6.5],
      [0.0014, 0.0019],
      3.1,
      0.3
    );

    // 4. Sculpted Knot (Bottom-Right depth)
    addSculptedMesh(
      new THREE.TorusKnotGeometry(1.05, 0.3, 64, 12),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        roughness: 0.38,
        metalness: 0.18,
        transparent: true,
        opacity: 0.24
      }),
      [7.6, -3.7, -6.2],
      [-0.002, 0.0024],
      4.5,
      0.32
    );

    // Ambient floating dust motes across 3D volume
    const particleCount = 72;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = -2 - Math.random() * 9;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x9be85c,
      size: 0.075,
      transparent: true,
      opacity: 0.42
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    window.addEventListener('pointermove', (e) => {
      pointerX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointerY = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    const clock = new THREE.Clock();

    function tick() {
      if (document.hidden) {
        rafId = null;
        return;
      }
      const elapsed = clock.getElapsedTime();

      currentX += (pointerX * 0.65 - currentX) * 0.04;
      currentY += (-pointerY * 0.45 - currentY) * 0.04;
      const scrollBias = (window.scrollY || 0) * 0.0012;

      shapesGroup.position.x = currentX;
      shapesGroup.position.y = currentY + scrollBias;
      shapesGroup.rotation.y = currentX * 0.06;
      shapesGroup.rotation.x = currentY * 0.04;

      for (let i = 0; i < floatingShapes.length; i += 1) {
        const item = floatingShapes[i];
        item.mesh.rotation.x += item.rotX;
        item.mesh.rotation.y += item.rotY;
        item.mesh.position.y = item.baseY + Math.sin(elapsed * 0.65 + item.offset) * item.amp;
      }

      particles.rotation.y = elapsed * 0.015 + currentX * 0.03;
      particles.rotation.x = currentY * 0.02;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && rafId === null) {
        clock.getDelta();
        rafId = requestAnimationFrame(tick);
      }
    });

    threeState = {
      floatingShapes,
      particleMat,
      ambientLight
    };

    rafId = requestAnimationFrame(tick);
  }

  function setTheme(theme) {
    if (!threeState) return;
    const isLight = theme === 'light';
    threeState.ambientLight.intensity = isLight ? 0.95 : 0.65;
    threeState.particleMat.color.setHex(isLight ? 0x4b9c12 : 0x9be85c);
    threeState.particleMat.opacity = isLight ? 0.34 : 0.42;
  }

  /* -------------------- GSAP Choreographed Animations -------------------- */

  function hasGsap() {
    return !prefersReducedMotion && typeof window !== 'undefined' && typeof window.gsap !== 'undefined';
  }

  let entrancePlayed = false;

  function animateEntrance() {
    if (entrancePlayed || !hasGsap()) return;
    entrancePlayed = true;

    const gsap = window.gsap;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } });

    const topbar = document.querySelector('.topbar');
    const sidebarCards = document.querySelectorAll('.sidebar .card');
    const panel = document.querySelector('.schedule-panel');

    if (topbar) {
      tl.fromTo(topbar, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42 });
    }
    if (sidebarCards.length) {
      tl.fromTo(
        sidebarCards,
        { y: 18, opacity: 0, scale: 0.985 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: 0.065 },
        '-=0.25'
      );
    }
    if (panel) {
      tl.fromTo(
        panel,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.48 },
        '-=0.35'
      );
    }
  }

  function animateTaskList(rootEl) {
    if (!hasGsap() || !rootEl) return;
    const cards = rootEl.querySelectorAll('.folding-card');
    if (!cards || cards.length === 0) return;

    // Limit stagger wave cleanly so large lists feel snappy
    const animatedTargets = Array.from(cards).slice(0, 14);
    window.gsap.killTweensOf(animatedTargets);
    window.gsap.fromTo(
      animatedTargets,
      { y: 14, opacity: 0, scale: 0.985 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.36,
        stagger: 0.035,
        ease: 'power2.out',
        clearProps: 'transform,opacity'
      }
    );
  }

  function animateCardUnfold(cardEl) {
    if (!hasGsap() || !cardEl) return;
    const openEl = cardEl.querySelector('.fc-cell-open');
    const closedEl = cardEl.querySelector('.fc-cell-closed');
    const isExpanded = cardEl.classList.contains('is-expanded');
    const target = isExpanded ? openEl : closedEl;
    if (!target) return;

    window.gsap.killTweensOf(target);
    window.gsap.fromTo(
      target,
      isExpanded
        ? { rotateX: -14, y: -6, opacity: 0, transformPerspective: 1200, transformOrigin: 'top center' }
        : { scale: 0.985, opacity: 0.72 },
      {
        rotateX: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: isExpanded ? 0.36 : 0.24,
        ease: isExpanded ? 'back.out(1.2)' : 'power2.out',
        clearProps: 'transform,opacity'
      }
    );
  }

  function animateModalOpen(modalEl) {
    if (!hasGsap() || !modalEl) return;
    const card = modalEl.querySelector('.modal-card, .login-card');
    if (!card) return;
    window.gsap.killTweensOf(card);
    window.gsap.fromTo(
      card,
      { scale: 0.93, y: 16, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
    );
  }

  function animateToast(toastEl) {
    if (!hasGsap() || !toastEl) return;
    window.gsap.fromTo(
      toastEl,
      { x: 24, scale: 0.94, opacity: 0 },
      { x: 0, scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
    );
  }

  function pulseElement(el) {
    if (!hasGsap() || !el) return;
    window.gsap.fromTo(
      el,
      { scale: 0.95 },
      { scale: 1, duration: 0.28, ease: 'back.out(2)', clearProps: 'transform' }
    );
  }

  function init() {
    initThreeBackground();
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(initialTheme);
    animateEntrance();
  }

  window.DayflowMotion = {
    init,
    setTheme,
    animateEntrance,
    animateTaskList,
    animateCardUnfold,
    animateModalOpen,
    animateToast,
    pulseElement
  };
})();
