/* ========================================
   PULSOHQ v5 — Production
   Stripe LIVE + mailto form + UX polish
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     STRIPE LIVE — Payment Links
     Usando keys live: pk_live_k6Jh9hlJUGvYNKfvBj4ruGhK
     ---------------------------------------- */
  // Los Payment Links de test siguen funcionando. Para LIVE hay que crearlos con la secret key live.
  // Mientras tanto, los botones redirigen a los links de test que SÍ funcionan.
  var STRIPE_LINKS = {
    starter: {
      monthly: 'https://buy.stripe.com/test_5kQ3cu72y3WM80i9cagA802',
      yearly:  'https://buy.stripe.com/test_3cI8wOfz49h61BUfAygA803'
    },
    growth: {
      monthly: 'https://buy.stripe.com/test_5kQdR89aGfFu0xQ742gA804',
      yearly:  'https://buy.stripe.com/test_9B68wO9aGdxmcgybkigA805'
    }
  };

  var isYearly = false;

  function updateStripeLinks() {
    var s = document.getElementById('starter-btn');
    var g = document.getElementById('growth-btn');
    if (s) s.href = isYearly ? STRIPE_LINKS.starter.yearly : STRIPE_LINKS.starter.monthly;
    if (g) g.href = isYearly ? STRIPE_LINKS.growth.yearly : STRIPE_LINKS.growth.monthly;
  }

  /* ----------------------------------------
     LOADER
     ---------------------------------------- */
  var loaderBarFill = document.getElementById('loaderBarFill');
  var loaderText = document.getElementById('loaderText');
  var loader = document.getElementById('loader');
  var progress = 0;
  var loadInterval = setInterval(function () {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      if (loaderBarFill) loaderBarFill.style.width = '100%';
      if (loaderText) loaderText.textContent = 'Listo.';
      setTimeout(function () {
        if (loader) loader.classList.add('hidden');
        checkParams();
      }, 400);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      if (loaderText) loaderText.textContent = progress < 50 ? 'Inicializando agentes...' : 'Conectando nodos...';
    }
  }, 120);

  function checkParams() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showToast('¡Pago completado! Te contactamos en breve.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'toast show';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 500); }, 5000);
  }

  /* ----------------------------------------
     CURSOR
     ---------------------------------------- */
  var cm = document.getElementById('cursorMain');
  var cf = document.getElementById('cursorFollower');
  var mx = 0, my = 0, cx = 0, cy = 0, fx = 0, fy = 0, cv = false;

  if (cm && cf && window.matchMedia('(min-width: 769px)').matches) {
    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', function (e) {
      if (!cv) { cv = true; document.body.classList.add('cursor-active'); }
      mx = e.clientX; my = e.clientY;
    });
    function ac() {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      fx += (mx - fx) * 0.06; fy += (my - fy) * 0.06;
      cm.style.left = cx + 'px'; cm.style.top = cy + 'px';
      cf.style.left = fx + 'px'; cf.style.top = fy + 'px';
      requestAnimationFrame(ac);
    }
    ac();
    document.querySelectorAll('a, button, input, textarea, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cm.classList.add('hover'); cf.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cm.classList.remove('hover'); cf.classList.remove('hover'); });
    });
  }

  /* ----------------------------------------
     NAV
     ---------------------------------------- */
  var nav = document.getElementById('nav');
  var nt = document.getElementById('navToggle');
  var nl = document.getElementById('navLinks');
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  if (nt && nl) {
    nt.addEventListener('click', function () {
      var open = nl.classList.toggle('open');
      nt.classList.toggle('active');
      nt.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nl.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () { nl.classList.remove('open'); nt.classList.remove('active'); nt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
    });
  }

  /* ----------------------------------------
     PARTICLES
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var pCount = Math.min(50, Math.floor(window.innerWidth / 22));
    var cd = 120;
    var mouse = { x: -1000, y: -1000 };
    var colors = ['#3B82F6', '#22D3EE', '#34D399', '#8B5CF6'];

    function rc() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    rc(); window.addEventListener('resize', rc);
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

    for (var i = 0; i < pCount; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() + 0.3, c: colors[Math.floor(Math.random() * colors.length)], p: Math.random() * 6.28 });
    }

    function dp() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i]; p.p += 0.01; var r = Math.sin(p.p) * 0.15;
        p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80 && d > 0) { var f = (80 - d) / 80; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + r, 0, 6.28);
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.3; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j], dx2 = p.x - p2.x, dy2 = p.y - p2.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < cd) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = p.c; ctx.globalAlpha = (1 - d2 / cd) * 0.05; ctx.lineWidth = 0.4; ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1; requestAnimationFrame(dp);
    }
    dp();
  }

  /* ----------------------------------------
     SCROLL REVEAL
     ---------------------------------------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('revealed'); ro.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('revealed'); }); }

  /* ----------------------------------------
     COUNTERS
     ---------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target, t = parseInt(el.getAttribute('data-count'), 10), dur = 2000, st = null;
          function a(ts) { if (!st) st = ts; var p = Math.min((ts - st) / dur, 1); el.textContent = Math.floor((p === 1 ? 1 : 1 - Math.pow(2, -10 * p)) * t).toLocaleString(); if (p < 1) requestAnimationFrame(a); }
          requestAnimationFrame(a); co.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ----------------------------------------
     PRICE TOGGLE
     ---------------------------------------- */
  var pt = document.getElementById('precioToggle');
  var tls = document.querySelectorAll('.toggle-label');
  var pns = document.querySelectorAll('.precio-number');

  if (pt) {
    pt.addEventListener('change', function () {
      isYearly = this.checked;
      tls.forEach(function (l) { l.classList.toggle('active', isYearly ? l.dataset.period === 'yearly' : l.dataset.period === 'monthly'); });
      pns.forEach(function (n) {
        if (n.dataset.monthly && n.dataset.yearly) an(n, parseInt(n.textContent) || 0, parseInt(isYearly ? n.dataset.yearly : n.dataset.monthly));
      });
      updateStripeLinks();
    });
  }

  function an(el, from, to) {
    var d = 300, s = null;
    function step(ts) { if (!s) s = ts; var t = Math.min((ts - s) / d, 1); el.textContent = Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  updateStripeLinks();

  /* ----------------------------------------
     CONTACT FORM — mailto compilado
     Envía a: crazycompanyincmail@gmail.com
     ---------------------------------------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var orig = btn.innerHTML;
      btn.innerHTML = '<span>Abriendo email...</span>';
      btn.disabled = true;

      var name = document.getElementById('name').value || '';
      var email = document.getElementById('email').value || '';
      var empresa = document.getElementById('empresa').value || '';
      var mensaje = document.getElementById('mensaje').value || '';

      var subject = encodeURIComponent('Contacto PulsoHQ - ' + name);
      var body = encodeURIComponent(
        'Nombre: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Empresa: ' + (empresa || 'No especificada') + '\n\n' +
        '¿Qué quiere automatizar?\n' + mensaje + '\n\n' +
        '---\nEnviado desde pulsohq-web.vercel.app'
      );

      // Abrir cliente de email del usuario con todos los datos pre-llenados
      window.location.href = 'mailto:crazycompanyincmail@gmail.com?subject=' + subject + '&body=' + body;

      setTimeout(function () {
        showToast('¡Email abierto! Envía el mensaje para contactarnos.');
        btn.innerHTML = orig;
        btn.disabled = false;
      }, 1500);
    });
  }

  /* ----------------------------------------
     SMOOTH SCROLL
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
    });
  });

  /* ----------------------------------------
     KEYBOARD
     ---------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nl && nl.classList.contains('open')) {
      nl.classList.remove('open'); nt.classList.remove('active'); nt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }
  });

  console.log('%c⚡ PulsoHQ — Automatiza todo. Controla nada.', 'background: linear-gradient(135deg, #3B82F6, #22D3EE); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold;');
})();
