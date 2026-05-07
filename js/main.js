/* ========================================
   PULSOHQ v5 — Production
   Stripe LIVE + Formsubmit + UX polish
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     STRIPE LIVE — Payment Links
     ---------------------------------------- */
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

  // Update Stripe links on toggle
  function updateStripeLinks() {
    var starterBtn = document.getElementById('starter-btn');
    var growthBtn = document.getElementById('growth-btn');
    if (starterBtn) starterBtn.href = isYearly ? STRIPE_LINKS.starter.yearly : STRIPE_LINKS.starter.monthly;
    if (growthBtn) growthBtn.href = isYearly ? STRIPE_LINKS.growth.yearly : STRIPE_LINKS.growth.monthly;
  }

  /* ----------------------------------------
     LOADER
     ---------------------------------------- */
  var loaderBarFill = document.getElementById('loaderBarFill');
  var loaderText = document.getElementById('loaderText');
  var loader = document.getElementById('loader');
  var loadTexts = ['Inicializando agentes...', 'Conectando nodos...', 'Listo.'];

  var progress = 0;
  var loadInterval = setInterval(function () {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      if (loaderBarFill) loaderBarFill.style.width = '100%';
      if (loaderText) loaderText.textContent = loadTexts[2];
      setTimeout(function () {
        if (loader) loader.classList.add('hidden');
        checkParams();
      }, 400);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      var idx = Math.min(Math.floor(progress / 60), 1);
      if (loaderText) loaderText.textContent = loadTexts[idx];
    }
  }, 120);

  function checkParams() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showToast('¡Pago completado! Te contactamos en breve.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('sent')) {
      showToast('¡Mensaje enviado! Te responderemos en menos de 24h.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 500); }, 5000);
  }

  /* ----------------------------------------
     CURSOR
     ---------------------------------------- */
  var cursorMain = document.getElementById('cursorMain');
  var cursorFollower = document.getElementById('cursorFollower');
  var mouseX = 0, mouseY = 0;
  var cursorX = 0, cursorY = 0;
  var followerX = 0, followerY = 0;
  var cursorVisible = false;

  if (cursorMain && cursorFollower && window.matchMedia('(min-width: 769px)').matches) {
    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', function (e) {
      if (!cursorVisible) { cursorVisible = true; document.body.classList.add('cursor-active'); }
      mouseX = e.clientX; mouseY = e.clientY;
    });
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.12; cursorY += (mouseY - cursorY) * 0.12;
      followerX += (mouseX - followerX) * 0.06; followerY += (mouseY - followerY) * 0.06;
      cursorMain.style.left = cursorX + 'px'; cursorMain.style.top = cursorY + 'px';
      cursorFollower.style.left = followerX + 'px'; cursorFollower.style.top = followerY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
    document.querySelectorAll('a, button, input, textarea, select, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorMain.classList.add('hover'); cursorFollower.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursorMain.classList.remove('hover'); cursorFollower.classList.remove('hover'); });
    });
  }

  /* ----------------------------------------
     NAV
     ---------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

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

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open'); navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      });
    });
  }

  /* ----------------------------------------
     PARTICLES
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
    var connectionDist = 130;
    var mouse = { x: -1000, y: -1000 };
    var colors = ['#3B82F6', '#22D3EE', '#34D399', '#8B5CF6'];

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.2 + 0.3, color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.pulse += 0.01; var r = Math.sin(p.pulse) * 0.2;
        p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) { var f = (100 - dist) / 100; p.x += (dx / dist) * f; p.y += (dy / dist) * f; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.35; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x, dy2 = p.y - p2.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < connectionDist) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color; ctx.globalAlpha = (1 - d2 / connectionDist) * 0.06; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ----------------------------------------
     SCROLL REVEAL
     ---------------------------------------- */
  var revealElements = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    revealElements.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ----------------------------------------
     COUNTERS
     ---------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          var duration = 2000, startTime = null;
          function animate(ts) {
            if (!startTime) startTime = ts;
            var t = Math.min((ts - startTime) / duration, 1);
            el.textContent = Math.floor((t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) * target).toLocaleString();
            if (t < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { counterObserver.observe(c); });
  }

  /* ----------------------------------------
     PRICE TOGGLE
     ---------------------------------------- */
  var precioToggle = document.getElementById('precioToggle');
  var toggleLabels = document.querySelectorAll('.toggle-label');
  var precioNumbers = document.querySelectorAll('.precio-number');

  if (precioToggle) {
    precioToggle.addEventListener('change', function () {
      isYearly = this.checked;
      toggleLabels.forEach(function (label) {
        label.classList.toggle('active', isYearly ? label.dataset.period === 'yearly' : label.dataset.period === 'monthly');
      });
      precioNumbers.forEach(function (num) {
        if (num.dataset.monthly && num.dataset.yearly) {
          var target = parseInt(isYearly ? num.dataset.yearly : num.dataset.monthly);
          var from = parseInt(num.textContent) || 0;
          animateNumber(num, from, target);
        }
      });
      updateStripeLinks();
    });
  }

  function animateNumber(el, from, to) {
    var dur = 300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Initialize Stripe links
  updateStripeLinks();

  /* ----------------------------------------
     SMOOTH SCROLL
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
    });
  });

  /* ----------------------------------------
     KEYBOARD
     ---------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open'); navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }
  });

  console.log('%c⚡ PulsoHQ — Automatiza todo. Controla nada.', 'background: linear-gradient(135deg, #3B82F6, #22D3EE); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold;');
})();
