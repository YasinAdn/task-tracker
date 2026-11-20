(function () {
  'use strict';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- Three.js Subtle Sharp Wireframe Depth (No Circles/Blobs) -------------------- */

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

    const prismGroup = new THREE.Group();
    scene.add(prismGroup);

    // Subtle crisp angular wireframe prisms only (zero filled circles, spheres, or round dots)
    const shards = [];

    function addCrystalEdges(geometry, colorHex, opacity, pos, rotSpeed, scale) {
      const edgesGeo = new THREE.EdgesGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity
      });
      const lines = new THREE.LineSegments(edgesGeo, lineMat);
      lines.position.set(pos[0], pos[1], pos[2]);
      lines.scale.setScalar(scale);
      prismGroup.add(lines);
      shards.push({
        mesh: lines,
        material: lineMat,
        baseY: pos[1],
        rotX: rotSpeed[0],
        rotY: rotSpeed[1],
        rotZ: rotSpeed[2]
      });
    }

    addCrystalEdges(
      new THREE.OctahedronGeometry(2.1, 0),
      0x69be28,
      0.13,
      [-8.6, 3.6, -6.5],
      [0.0014, 0.0022, 0.0008],
      1.0
    );
    addCrystalEdges(
      new THREE.TetrahedronGeometry(2.0, 0),
      0x9be85c,
      0.11,
      [8.8, -3.4, -7.0],
      [-0.0016, 0.0019, -0.0011],
      1.05
    );
    addCrystalEdges(
      new THREE.BoxGeometry(2.2, 2.2, 2.2),
      0x64748b,
      0.12,
      [8.4, 3.8, -8.5],
      [0.0011, -0.0017, 0.0013],
      0.95
    );

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

      currentX += (pointerX * 0.55 - currentX) * 0.045;
      currentY += (-pointerY * 0.4 - currentY) * 0.045;
      const scrollBias = (window.scrollY || 0) * 0.001;

      prismGroup.position.x = currentX;
      prismGroup.position.y = currentY + scrollBias;
      prismGroup.rotation.y = currentX * 0.05;
      prismGroup.rotation.x = currentY * 0.035;

      for (let i = 0; i < shards.length; i += 1) {
        const s = shards[i];
        s.mesh.rotation.x += s.rotX;
        s.mesh.rotation.y += s.rotY;
        s.mesh.rotation.z += s.rotZ;
        s.mesh.position.y = s.baseY + Math.sin(elapsed * 0.55 + i * 2.1) * 0.25;
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && rafId === null) {
        clock.getDelta();
        rafId = requestAnimationFrame(tick);
      }
    });

    threeState = { shards };
    rafId = requestAnimationFrame(tick);
  }

  function setTheme(theme) {
    if (!threeState) return;
    const isLight = theme === 'light';
    threeState.shards.forEach((s, idx) => {
      if (idx < 2) {
        s.material.opacity = isLight ? 0.16 : 0.12;
      } else {
        s.material.opacity = isLight ? 0.14 : 0.11;
      }
    });
  }

  /* -------------------- GSAP Choreographed & Tactile Animations -------------------- */

  function hasGsap() {
    return !prefersReducedMotion && typeof window !== 'undefined' && typeof window.gsap !== 'undefined';
  }

  let entrancePlayed = false;
  let interactiveWired = false;

  const INTERACTIVE_BTN_SELECTOR = [
    '.btn',
    '.icon-btn',
    '.pill-btn',
    '.seg-btn',
    '.scope-btn',
    '.scope-form-btn',
    '.view-tab',
    '.density-toggle-btn',
    '.template-btn',
    '.now-pill-btn',
    '.snooze-btn',
    '.snooze-15m-btn',
    '.move-today-btn',
    '.sidebar-toggle-btn',
    '.link-btn',
    '.mobile-add-fab',
    '.task-date-badge',
    '.fc-fold-pill'
  ].join(', ');

  const GLASS_GLARE_SELECTOR = '.card, .schedule-panel, .task-card.folding-card, .modal-card, .login-card';

  function wireInteractiveMotion() {
    if (interactiveWired || !hasGsap()) return;
    interactiveWired = true;

    const gsap = window.gsap;

    // 1. Tactile GSAP spring animations on EVERY button, pill, tab, and control
    document.addEventListener('pointerover', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(INTERACTIVE_BTN_SELECTOR) : null;
      if (!btn || btn.disabled) return;
      if (btn.contains(e.relatedTarget)) return;

      gsap.killTweensOf(btn);
      gsap.to(btn, {
        y: -1.5,
        scale: 1.03,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }, true);

    document.addEventListener('pointerout', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(INTERACTIVE_BTN_SELECTOR) : null;
      if (!btn) return;
      if (btn.contains(e.relatedTarget)) return;

      gsap.killTweensOf(btn);
      gsap.to(btn, {
        y: 0,
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
        clearProps: 'transform'
      });
    }, true);

    document.addEventListener('pointerdown', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(INTERACTIVE_BTN_SELECTOR) : null;
      if (btn && !btn.disabled) {
        gsap.killTweensOf(btn);
        gsap.to(btn, {
          y: 1,
          scale: 0.94,
          duration: 0.09,
          ease: 'power2.out'
        });
        return;
      }

      const card = e.target && e.target.closest ? e.target.closest('.folding-card .fc-cell-closed') : null;
      if (card) {
        const outerCard = card.closest('.folding-card');
        if (outerCard) {
          gsap.to(outerCard, { scale: 0.99, duration: 0.1, ease: 'power2.out' });
        }
      }
    }, true);

    document.addEventListener('pointerup', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(INTERACTIVE_BTN_SELECTOR) : null;
      if (btn && !btn.disabled) {
        gsap.killTweensOf(btn);
        gsap.to(btn, {
          y: -1,
          scale: 1.02,
          duration: 0.22,
          ease: 'back.out(2.2)',
          clearProps: 'transform'
        });
      }

      const outerCard = e.target && e.target.closest ? e.target.closest('.folding-card') : null;
      if (outerCard) {
        gsap.to(outerCard, { scale: 1, duration: 0.24, ease: 'back.out(1.6)', clearProps: 'transform' });
      }
    }, true);

    // 2. Smooth GSAP card hover elevation + Liquid Glass specular cursor tracking across cards/panels
    document.addEventListener('pointerover', (e) => {
      const card = e.target && e.target.closest ? e.target.closest('.folding-card, .stat-box') : null;
      if (!card || card.contains(e.relatedTarget)) return;

      gsap.to(card, {
        y: -2.5,
        duration: 0.24,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }, true);

    document.addEventListener('pointerout', (e) => {
      const card = e.target && e.target.closest ? e.target.closest('.folding-card, .stat-box') : null;
      if (!card || card.contains(e.relatedTarget)) return;

      gsap.to(card, {
        y: 0,
        duration: 0.28,
        ease: 'power2.out',
        clearProps: 'transform'
      });
    }, true);

    // Pointer-tracked liquid glass edge refraction on panels, cards & form fields
    document.addEventListener('pointermove', (e) => {
      const surface = e.target && e.target.closest ? e.target.closest(GLASS_GLARE_SELECTOR) : null;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      surface.style.setProperty('--glint-x', `${xPct.toFixed(1)}%`);
      surface.style.setProperty('--glint-y', `${yPct.toFixed(1)}%`);
    }, { passive: true });
  }

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
    wireInteractiveMotion();
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
