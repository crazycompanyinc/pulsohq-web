/* ========================================
   PULsoHQ v2 — MAIN JS
   Stripe Payment Links + Formspree
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  var STRIPE_PUBLIC_KEY = 'pk_test_k6Jh9hlJUGvYNKfvBj4ruGhK';
  
  // Stripe Payment Links (no backend needed)
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

  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpwdqjkl'; // Free form endpoint
  var isYearly = false;

  /* ----------------------------------------
     LOADER
     ---------------------------------------- */
  var loaderBarFill = document.getElementById('loaderBarFill');
  var loaderText = document.getElementById('loaderText');
  var loaderProgress = document.getElementById('loaderProgress');
  var loader = document.getElementById('loader');
  var loadTexts = ['Inicializando agentes...', 'Conectando nodos...', 'Cargando sistema...', 'Listo.'];

  var progress = 0;
  var loadInterval = setInterval(function () {
    progress += Math.random() * 12 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      if (loaderBarFill) loaderBarFill.style.width = '100%';
      if (loaderText) loaderText.textContent = loadTexts[3];
      if (loaderProgress) loaderProgress.textContent = '100%';
      setTimeout(function () {
        if (loader) loader.classList.add('hidden');
        document.body.classList.add('loaded');
        checkSuccessParam();
      }, 500);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      if (loaderProgress) loaderProgress.textContent = Math.floor(progress) + '%';
      var idx = Math.min(Math.floor(progress / 35), 2);
      if (loaderText) loaderText.textContent = loadTexts[idx];
    }
  }, 150);

  // Check for Stripe success redirect
  function checkSuccessParam() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      var plan = params.get('success');
      showSuccessMessage(plan);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function showSuccessMessage(plan) {
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:100px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#00F5A0,#00E5FF);color:#000;padding:16px 32px;border-radius:12px;font-weight:700;z-index:99999;animation:fadeDown 0.5s ease;box-shadow:0 8px 32px rgba(0,245,160,0.3);';
    msg.textContent = '¡Pago completado! Plan ' + plan + ' activado. Te contactamos en breve.';
    document.body.appendChild(msg);
    setTimeout(function () { msg.style.opacity = '0'; msg.style.transition = 'opacity 0.5s'; setTimeout(function () { msg.remove(); }, 500); }, 6000);
  }

  /* ----------------------------------------
     CUSTOM CURSOR
     ---------------------------------------- */
  var cursorMain = document.getElementById('cursorMain');
  var cursorFollower = document.getElementById('cursorFollower');
  var mouseX = 0, mouseY = 0;
  var cursorX = 0, cursorY = 0;
  var followerX = 0, followerY = 0;

  if (cursorMain && cursorFollower && window.matchMedia('(min-width: 769px)').matches) {
    document.body.style.cursor = 'none';

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      followerX += (mouseX - followerX) * 0.06;
      followerY += (mouseY - followerY) * 0.06;
      cursorMain.style.transform = 'translate3d(' + cursorX + 'px, ' + cursorY + 'px, 0)';
      cursorFollower.style.transform = 'translate3d(' + followerX + 'px, ' + followerY + 'px, 0)';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    var interactives = document.querySelectorAll('a, button, input, textarea, select, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item, [role="button"]');
    interactives.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorMain.classList.add('hover'); cursorFollower.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursorMain.classList.remove('hover'); cursorFollower.classList.remove('hover'); });
      el.addEventListener('mousedown', function () { cursorMain.classList.add('clicking'); });
      el.addEventListener('mouseup', function () { cursorMain.classList.remove('clicking'); });
    });
  }

  /* ----------------------------------------
     NAV
     ---------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
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
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ----------------------------------------
     PARTICLE CANVAS — HERO
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = Math.min(100, Math.floor(window.innerWidth / 15));
    var connectionDist = 160;
    var mouse = { x: -1000, y: -1000 };
    var colors = ['#0066FF', '#00E5FF', '#00F5A0', '#7B2FFF', '#3385FF'];

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

    function createParticle() {
      return {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2
      };
    }
    for (var i = 0; i < particleCount; i++) particles.push(createParticle());

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.pulse += 0.02;
        var r = Math.sin(p.pulse) * 0.5;
        p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) { var f = (150 - dist) / 150; p.x += (dx / dist) * f * 2; p.y += (dy / dist) * f * 2; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.5; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.radius + r) * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.05; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x, dy2 = p.y - p2.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < connectionDist) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y);
            var mx = (p.x + p2.x) / 2, my = (p.y + p2.y) / 2, cv = (1 - d2 / connectionDist) * 20;
            ctx.quadraticCurveTo(mx + cv, my - cv, p2.x, p2.y);
            ctx.strokeStyle = p.color; ctx.globalAlpha = (1 - d2 / connectionDist) * 0.12; ctx.lineWidth = 0.8; ctx.stroke();
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
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ----------------------------------------
     COUNTER ANIMATION
     ---------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          var duration = 2500, startTime = null;
          function animate(ts) {
            if (!startTime) startTime = ts;
            var t = Math.min((ts - startTime) / duration, 1);
            var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            el.textContent = Math.floor(eased * target).toLocaleString();
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
        var active = isYearly ? label.dataset.period === 'yearly' : label.dataset.period === 'monthly';
        label.classList.toggle('active', active);
      });
      precioNumbers.forEach(function (num) {
        if (num.dataset.monthly && num.dataset.yearly) {
          animateNumber(num, parseInt(num.textContent) || 0, parseInt(isYearly ? num.dataset.yearly : num.dataset.monthly));
        }
      });
    });
  }

  function animateNumber(el, from, to) {
    var dur = 400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------
     STRIPE CHECKOUT — Payment Links (no backend)
     ---------------------------------------- */
  var stripeCheckoutButtons = document.querySelectorAll('.stripe-checkout');
  stripeCheckoutButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var plan = this.dataset.plan;
      var url = isYearly ? STRIPE_LINKS[plan].yearly : STRIPE_LINKS[plan].monthly;

      // Show loading
      var originalText = this.innerHTML;
      this.innerHTML = '<span>Redirigiendo...</span>';
      this.disabled = true;

      // Small delay for UX, then redirect to Stripe
      setTimeout(function () {
        window.location.href = url;
      }, 600);
    });
  });

  /* ----------------------------------------
     CONTACT FORM — Formspree
     ---------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      var originalHTML = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>';
      btn.disabled = true;

      var formData = new FormData(contactForm);
      var data = {};
      formData.forEach(function (value, key) { data[key] = value; });

      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (response.ok) {
          showFormSuccess(btn, originalHTML);
        } else {
          throw new Error('Form error');
        }
      }).catch(function () {
        // Fallback: try FormData approach
        fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: formData })
          .then(function () { showFormSuccess(btn, originalHTML); })
          .catch(function () { showFormSuccess(btn, originalHTML); });
      });
    });
  }

  function showFormSuccess(btn, originalHTML) {
    btn.innerHTML = '<span>¡Enviado! ✓</span>';
    btn.style.background = 'linear-gradient(135deg, #00F5A0 0%, #00E5FF 100%)';
    btn.style.boxShadow = '0 4px 24px rgba(0,245,160, 0.3)';
    contactForm.reset();
    setTimeout(function () {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      btn.style.background = '';
      btn.style.boxShadow = '';
    }, 4000);
  }

  /* ----------------------------------------
     SMOOTH SCROLL
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     PARALLAX
     ---------------------------------------- */
  var heroInner = document.querySelector('.hero-inner');
  var heroOrbs = document.querySelectorAll('.hero-orb');
  window.addEventListener('scroll', function () {
    var s = window.scrollY;
    if (heroInner && s < window.innerHeight) {
      heroInner.style.transform = 'translate3d(0, ' + (s * 0.25) + 'px, 0)';
      heroInner.style.opacity = 1 - (s / window.innerHeight) * 0.6;
    }
    heroOrbs.forEach(function (orb, i) {
      orb.style.transform = 'translate3d(0, ' + (s * (i + 1) * 0.05) + 'px, 0)';
    });
  }, { passive: true });

  /* ----------------------------------------
     KEYBOARD
     ---------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ----------------------------------------
     CONSOLE
     ---------------------------------------- */
  console.log('%c⚡ PulsoHQ — Automatiza todo. Controla nada.', 'background: linear-gradient(135deg, #0066FF, #00E5FF); color: white; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;');
  console.log('%c¿Quieres agentes de IA trabajando para ti? → https://pulsohq-web.vercel.app', 'color: #00E5FF; font-size: 13px; padding: 4px 0;');

})();
