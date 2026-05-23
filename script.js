/* ================================================================
   Mashuk khan pranta PORTFOLIO – script.js
   Handles: Preloader · 3D Canvas · Cursor · Typewriter · Scroll
            Parallax · Particles · Project Filter · Contact Form
   ================================================================ */

'use strict';

// ── HELPERS ─────────────────────────────────────────────────
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const map = (v, a1, b1, a2, b2) => a2 + ((v - a1) / (b1 - a1)) * (b2 - a2);

// ── STATE ────────────────────────────────────────────────────
const state = {
  mouse: { x: 0, y: 0, normX: 0, normY: 0 },
  scroll: 0,
  preloaderDone: false,
};

// ── PRELOADER ────────────────────────────────────────────────
function initPreloader() {
  const preloader = $('#preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      state.preloaderDone = true;
      triggerRevealAnimations();
      animateCounters();
    }, 1200);
  });
}

// ── CUSTOM CURSOR ────────────────────────────────────────────
function initCursor() {
  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  if (!dot || !ring) return;

  let ringX = 0, ringY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.mouse.normX = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.normY = (e.clientY / window.innerHeight) * 2 - 1;

    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  });

  function updateRing() {
    ringX = lerp(ringX, state.mouse.x, 0.12);
    ringY = lerp(ringY, state.mouse.y, 0.12);
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    rafId = requestAnimationFrame(updateRing);
  }
  updateRing();

  // Hover state for interactive elements
  const hoverTargets = 'a, button, .project-card, .skill-pill, .contact-link-item, .gallery-card, .filter-btn';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('hovering');
  });

  document.addEventListener('mousedown', () => { dot.style.transform = 'translate(-50%,-50%) scale(0.7)'; });
  document.addEventListener('mouseup', () => { dot.style.transform = 'translate(-50%,-50%) scale(1)'; });
}

// ── NAVBAR ───────────────────────────────────────────────────
function initNavbar() {
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  // Scroll behavior
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    state.scroll = window.scrollY;
    const currentScroll = window.scrollY;

    // Shrink on scroll
    if (currentScroll > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;

    // Active link highlighting
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (currentScroll >= sectionTop) current = section.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === current) link.classList.add('active');
    });
  }, { passive: true });

  // Hamburger
  const hamburger = $('#hamburger');
  const overlay = $('#mobileMenuOverlay');
  const closeBtn = $('#mobileMenuClose');
  const closeLinks = $$('[data-close-menu]');

  function openMenu() {
    hamburger.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    hamburger.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });
  closeBtn?.addEventListener('click', closeMenu);
  closeLinks.forEach(link => link.addEventListener('click', closeMenu));
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeMenu(); });
}

// ── HERO 3D CANVAS ───────────────────────────────────────────
function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, shapes = [], particles = [];
  let animFrame;
  let time = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create wireframe polyhedron edges
  function createIcosahedron(cx, cy, radius) {
    const t = (1 + Math.sqrt(5)) / 2;
    const verts = [
      [-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],
      [0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
      [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]
    ].map(([x,y,z]) => {
      const len = Math.sqrt(x*x+y*y+z*z);
      return { x: x/len, y: y/len, z: z/len };
    });

    const faces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];

    const edges = new Set();
    faces.forEach(([a,b,c]) => {
      [[a,b],[b,c],[a,c]].forEach(([i,j]) => {
        const key = Math.min(i,j)+'-'+Math.max(i,j);
        edges.add(key);
      });
    });

    return {
      cx, cy, radius,
      verts,
      edges: [...edges].map(k => k.split('-').map(Number)),
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.008,
      speedY: (Math.random() - 0.5) * 0.008,
      speedZ: (Math.random() - 0.5) * 0.004,
      floatOffset: Math.random() * Math.PI * 2,
      floatAmp: 20 + Math.random() * 30,
      floatSpeed: 0.3 + Math.random() * 0.5,
      alpha: 0.25 + Math.random() * 0.35,
      color: Math.random() > 0.5 ? '56,189,248' : '129,140,248',
    };
  }

  function projectPoint(v, rotX, rotY, rotZ, radius) {
    // Rotate around X
    let y = v.y * Math.cos(rotX) - v.z * Math.sin(rotX);
    let z = v.y * Math.sin(rotX) + v.z * Math.cos(rotX);
    let x = v.x;
    // Rotate around Y
    let x2 = x * Math.cos(rotY) + z * Math.sin(rotY);
    let z2 = -x * Math.sin(rotY) + z * Math.cos(rotY);
    let y2 = y;
    // Rotate around Z
    let x3 = x2 * Math.cos(rotZ) - y2 * Math.sin(rotZ);
    let y3 = x2 * Math.sin(rotZ) + y2 * Math.cos(rotZ);

    // Simple perspective
    const fov = 4;
    const depth = fov + z2;
    return {
      x: (x3 / depth) * radius,
      y: (y3 / depth) * radius,
      z: z2
    };
  }

  function initShapes() {
    shapes = [];
    const positions = [
      [W * 0.15, H * 0.3, 55],
      [W * 0.85, H * 0.2, 45],
      [W * 0.8, H * 0.75, 60],
      [W * 0.05, H * 0.7, 38],
      [W * 0.5, H * 0.1, 42],
    ];
    positions.forEach(([x, y, r]) => shapes.push(createIcosahedron(x, y, r)));
  }

  // Floating particles in canvas
  function initCanvasParticles() {
    particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      alpha: 0.1 + Math.random() * 0.5,
      color: Math.random() > 0.5 ? '56,189,248' : '129,140,248',
    }));
  }

  function drawShape(shape, time) {
    const parallaxX = state.mouse.normX * 25;
    const parallaxY = state.mouse.normY * 15;

    shape.rotX += shape.speedX;
    shape.rotY += shape.speedY;
    shape.rotZ += shape.speedZ;

    const floatY = Math.sin(time * shape.floatSpeed + shape.floatOffset) * shape.floatAmp;

    const cx = shape.cx + parallaxX;
    const cy = shape.cy + floatY + parallaxY;

    const projected = shape.verts.map(v =>
      projectPoint(v, shape.rotX, shape.rotY, shape.rotZ, shape.radius)
    );

    shape.edges.forEach(([a, b]) => {
      const pa = projected[a];
      const pb = projected[b];
      const depthFactor = clamp(map((pa.z + pb.z) / 2, -1, 1, 0.4, 1), 0.4, 1);
      const alpha = shape.alpha * depthFactor;

      ctx.beginPath();
      ctx.moveTo(cx + pa.x, cy + pa.y);
      ctx.lineTo(cx + pb.x, cy + pb.y);
      ctx.strokeStyle = `rgba(${shape.color},${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Draw vertices
    projected.forEach(p => {
      const d = map(p.z, -1, 1, 0.5, 2.5);
      ctx.beginPath();
      ctx.arc(cx + p.x, cy + p.y, d, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${shape.color},${shape.alpha * 0.8})`;
      ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
  }

  // Connection lines between close particles
  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    time += 0.016;

    drawParticles();
    drawConnections();
    shapes.forEach(s => drawShape(s, time));

    animFrame = requestAnimationFrame(animate);
  }

  initShapes();
  initCanvasParticles();
  animate();

  window.addEventListener('resize', () => {
    initShapes();
    initCanvasParticles();
  });
}

// ── DOM PARTICLES ────────────────────────────────────────────
function initDomParticles() {
  const container = $('#particles');
  if (!container) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${100 + Math.random() * 20}%;
      background:rgba(${Math.random() > 0.5 ? '56,189,248' : '129,140,248'},${0.3 + Math.random() * 0.5});
      animation:particle-float ${8 + Math.random() * 12}s linear ${Math.random() * 8}s infinite;
    `;
    container.appendChild(p);
  }
}

// ── TYPEWRITER ───────────────────────────────────────────────
function initTypewriter() {
  const el = $('#typewriterText');
  if (!el) return;

  const words = [
    'CSE Student',
    'Software Developer',
    'Problem Solver',
    'Full-Stack Builder',
    'Algorithm Enthusiast',
    'Open Source Contributor'
  ];

  let wordIndex = 0, charIndex = 0, isDeleting = false;
  const typeSpeed = 80, deleteSpeed = 45, pauseTime = 2200;

  function type() {
    const word = words[wordIndex];
    if (isDeleting) {
      el.textContent = word.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = word.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === word.length) {
      delay = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 400;
    }
    setTimeout(type, delay);
  }
  setTimeout(type, 800);
}

// ── SMOOTH SCROLL ────────────────────────────────────────────
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ── REVEAL ON SCROLL ─────────────────────────────────────────
function initScrollReveal() {
  const elements = $$('.reveal-up, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Don't unobserve – keeps it revealed
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));
}

function triggerRevealAnimations() {
  // Immediately reveal elements in view on load
  const elements = $$('.reveal-up, .reveal-left, .reveal-right');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      el.classList.add('revealed');
    }
  });
}

// ── SKILL BAR ANIMATION ──────────────────────────────────────
function initSkillBars() {
  const fills = $$('.skill-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(fill => observer.observe(fill));
}

// ── COUNTER ANIMATION ────────────────────────────────────────
function animateCounters() {
  const counters = $$('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const duration = 1800;
        const start = performance.now();

        function update(time) {
          const elapsed = time - start;
          const progress = clamp(elapsed / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ── PROJECT FILTER ───────────────────────────────────────────
function initProjectFilter() {
  const filterBtns = $$('.filter-btn');
  const cards = $$('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach((card, i) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.transition = `opacity 0.3s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;

        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = '';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            if (btn.dataset.filter !== 'all' && card.dataset.category !== filter) {
              card.style.display = 'none';
            }
          }, 350);
        }
      });
    });
  });
}

// ── CONTACT FORM ─────────────────────────────────────────────
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submitBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    // Animate to loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    // Submit to Web3Forms
    try {
      const formData = new FormData(form);
      formData.append("access_key", "3151307e-36f1-4276-a5d3-52f20dceb073");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Something went wrong!");
      }

      // Success feedback
      btnLoading.style.display = 'none';
      btnText.style.display = 'inline';
      btnText.textContent = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btn.style.boxShadow = '0 0 30px rgba(16,185,129,0.4)';

      form.reset();
      setTimeout(() => {
        btn.disabled = false;
        btnText.textContent = 'Send Message';
        btn.style.background = '';
        btn.style.boxShadow = '';
      }, 3500);

    } catch (error) {
      console.error(error);
      btnLoading.style.display = 'none';
      btnText.style.display = 'inline';
      btnText.textContent = '❌ Failed to Send';
      btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      setTimeout(() => {
        btn.disabled = false;
        btnText.textContent = 'Send Message';
        btn.style.background = '';
      }, 3500);
    }
  });

  // Input float-label effect
  $$('.form-input, .form-textarea').forEach(input => {
    input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
    input.addEventListener('blur', () => input.parentElement.classList.remove('focused'));
  });
}

// ── PARALLAX HERO ────────────────────────────────────────────
function initParallax() {
  const heroProfile = $('.hero-profile-wrap');
  const heroContent = $('.hero-content');
  const heroBg = $('.hero-bg-img');

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    if (heroProfile) {
      heroProfile.style.transform = `translateY(-50%) translate(${x * 12}px, ${y * 8}px)`;
    }
    if (heroContent) {
      heroContent.style.transform = `translate(${x * -6}px, ${y * -4}px)`;
    }
    if (heroBg) {
      heroBg.style.transform = `scale(1.05) translate(${x * 8}px, ${y * 5}px)`;
    }
  });

  // Scroll-based parallax for background
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (heroBg) {
      heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.3}px)`;
    }
  }, { passive: true });
}

// ── FLOATING BADGE PARALLAX ──────────────────────────────────
function initBadgeParallax() {
  const badges = $$('.floating-badge');
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    badges.forEach((badge, i) => {
      const depth = (i + 1) * 8;
      badge.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });
}

// ── TILT EFFECT ON CARDS ─────────────────────────────────────
function initCardTilt() {
  $$('.project-card, .skill-category').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'all 0.5s cubic-bezier(0.16,1,0.3,1)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.12s ease';
    });
  });
}

// ── CONTACT CARD TILT ────────────────────────────────────────
function initContactTilt() {
  $$('.contact-card, .contact-form').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ── PROGRESS BAR ─────────────────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position:fixed; top:0; left:0; height:2px; z-index:9999;
    background:linear-gradient(90deg,#38bdf8,#818cf8,#c084fc);
    transition:width 0.1s ease;
    box-shadow: 0 0 8px rgba(56,189,248,0.6);
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

// ── COPY EMAIL ON CLICK ──────────────────────────────────────
function initCopyEmail() {
  // Removed preventDefault and clipboard copy so that the mailto: link
  // can directly open the user's default email app.
}

// ── GALLERY LIGHTBOX ─────────────────────────────────────────
function initGalleryLightbox() {
  const cards = $$('.gallery-card, .gallery-main');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      if (!img) return;

      const lightbox = document.createElement('div');
      lightbox.style.cssText = `
        position:fixed; inset:0; z-index:5000;
        background:rgba(3,7,18,0.95);
        display:flex; align-items:center; justify-content:center;
        backdrop-filter:blur(20px);
        animation:fadeIn 0.3s ease;
        cursor:zoom-out;
      `;

      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.style.cssText = `
        max-width:90vw; max-height:90vh; border-radius:16px;
        box-shadow:0 0 80px rgba(56,189,248,0.3);
        animation:scaleIn 0.3s cubic-bezier(0.16,1,0.3,1);
        object-fit:contain;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = `
        position:absolute; top:24px; right:24px;
        font-size:24px; color:white; background:rgba(255,255,255,0.1);
        border:1px solid rgba(255,255,255,0.2); border-radius:50%;
        width:44px; height:44px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
      `;

      lightbox.appendChild(imgEl);
      lightbox.appendChild(closeBtn);
      document.body.appendChild(lightbox);
      document.body.style.overflow = 'hidden';

      const close = () => {
        lightbox.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(lightbox);
          document.body.style.overflow = '';
        }, 200);
      };

      lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
      closeBtn.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
    });
  });
}

// ── INJECT DYNAMIC CSS ───────────────────────────────────────
function injectDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
  `;
  document.head.appendChild(style);
}

// ── SECTION HIGHLIGHT ────────────────────────────────────────
function initSectionHighlight() {
  const sections = $$('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.setProperty('--section-visible', '1');
      }
    });
  }, { threshold: 0.05 });

  sections.forEach(s => observer.observe(s));
}

// ── MAGNETIC BUTTONS ─────────────────────────────────────────
function initMagneticButtons() {
  $$('.btn-primary, .btn-secondary, .btn-nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translateY(-3px) translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ── INIT ALL ─────────────────────────────────────────────────
function init() {
  injectDynamicStyles();
  initPreloader();
  initCursor();
  initNavbar();
  initHeroCanvas();
  initDomParticles();
  initTypewriter();
  initSmoothScroll();
  initScrollReveal();
  initSkillBars();
  initProjectFilter();
  initContactForm();
  initParallax();
  initBadgeParallax();
  initCardTilt();
  initContactTilt();
  initScrollProgress();
  initCopyEmail();
  initGalleryLightbox();
  initSectionHighlight();
  initMagneticButtons();

  // Counter on DOM ready (for hero section which is immediately visible)
  document.addEventListener('DOMContentLoaded', () => {});
}

// ── KICK OFF ─────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
