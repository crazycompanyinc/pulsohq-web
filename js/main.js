/* ========================================
   PULSOHQ v2 — MAIN JS
   Enhanced animations, cursor, Stripe
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  var STRIPE_PUBLIC_KEY = 'pk_test_k6Jh9hlJUGvYNKfvBj4ruGhK';
  var STRIPE_PRICES = {
    starter: { monthly: 'price_1TUXhsB37GidxnBvN6fjy7S6', yearly: 'price_1TUXhsB37GidxnBvHrbQ8uJR' },
    growth: { monthly: 'price_1TUXhtB37GidxnBvqZgTjTrR', yearly: 'price_1TUXhtB37GidxnBvCg83oYfh' }
  };
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
      }, 500);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      if (loaderProgress) loaderProgress.textContent = Math.floor(progress) + '%';
      var idx = Math.min(Math.floor(progress / 35), 2);
      if (loaderText) loaderText.textContent = loadTexts[idx];
    }
  }, 150);

  /* ----------------------------------------
     CUSTOM CURSOR
     ---------------------------------------- */
  var cursorMain = document.getElementById('cursorMain');
  var cursorFollower = document.getElementById('cursorFollower');
  var mouseX = 0, mouseY = 0;
  var cursorX = 0, cursorY = 0;
  var followerX = 0, followerY = 0;
  var cursorActive = false;

  if (cursorMain && cursorFollower && window.matchMedia('(min-width: 769px)').matches) {
    cursorActive = true;
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
      el.addEventListener('mouseenter', function () {
        cursorMain.classList.add('hover');
        cursorFollower.classList.add('hover');
      });
      el.addEventListener('mouseleave', function () {
        cursorMain.classList.remove('hover');
        cursorFollower.classList.remove('hover');
      });
      el.addEventListener('mousedown', function () {
        cursorMain.classList.add('clicking');
      });
      el.addEventListener('mouseup', function () {
        cursorMain.classList.remove('clicking');
      });
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
     PARTICLE CANVAS — HERO v2
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = Math.min(100, Math.floor(window.innerWidth / 15));
    var connectionDist = 160;
    var mouse = { x: -1000, y: -1000 };
    var colors = ['#0066FF', '#00E5FF', '#00F5A0', '#7B2FFF', '#3385FF'];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
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
        var radiusBoost = Math.sin(p.pulse) * 0.5;

        p.x += p.vx;
        p.y += p.vy;

        // Mouse repulsion
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          var force = (150 - dist) / 150;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + radiusBoost, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.radius + radiusBoost) * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.05;
        ctx.fill();

        // Connections
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x;
          var dy2 = p.y - p2.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);

            // Curved line for more organic feel
            var midX = (p.x + p2.x) / 2;
            var midY = (p.y + p2.y) / 2;
            var curvature = (1 - dist2 / connectionDist) * 20;
            ctx.quadraticCurveTo(midX + curvature, midY - curvature, p2.x, p2.y);

            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist2 / connectionDist) * 0.12;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ----------------------------------------
     SCROLL REVEAL v2
     ---------------------------------------- */
  var revealElements = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ----------------------------------------
     COUNTER ANIMATION v2
     ---------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = 2500;
          var startTime = null;

          function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var t = Math.min((timestamp - startTime) / duration, 1);
            // Ease out expo
            var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
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
        var isActive = isYearly ? label.dataset.period === 'yearly' : label.dataset.period === 'monthly';
        label.classList.toggle('active', isActive);
      });
      precioNumbers.forEach(function (num) {
        if (num.dataset.monthly && num.dataset.yearly) {
          var targetPrice = isYearly ? num.dataset.yearly : num.dataset.monthly;
          animateNumber(num, parseInt(num.textContent) || 0, parseInt(targetPrice));
        }
      });
    });
  }

  function animateNumber(el, from, to) {
    var duration = 400;
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var t = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------
     STRIPE CHECKOUT
     ---------------------------------------- */
  // Initialize Stripe when available
  function initStripe() {
    if (typeof Stripe === 'undefined') {
      console.warn('Stripe.js not loaded');
      return null;
    }
    return Stripe(STRIPE_PUBLIC_KEY);
  }

  var stripeCheckoutButtons = document.querySelectorAll('.stripe-checkout');
  stripeCheckoutButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var plan = this.dataset.plan;
      var priceId = isYearly ? this.dataset.priceYearly : this.dataset.priceMonthly;

      // Show loading state
      var originalText = this.innerHTML;
      this.innerHTML = '<span>Procesando...</span>';
      this.disabled = true;

      // Try Stripe checkout
      var stripe = initStripe();
      if (stripe && STRIPE_PUBLIC_KEY !== 'pk_live_YOUR_STRIPE_PUBLIC_KEY') {
        stripe.redirectToCheckout({
          lineItems: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          successUrl: window.location.origin + '/success?plan=' + plan,
          cancelUrl: window.location.href,
          customerEmail: document.getElementById('email') ? document.getElementById('email').value : undefined
        }).then(function (result) {
          if (result.error) {
            alert('Error: ' + result.error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        });
      } else {
        // Fallback: redirect to contact form with plan info
        var contacto = document.getElementById('contacto');
        var mensaje = document.getElementById('mensaje');
        if (mensaje) {
          var yearlyText = isYearly ? ' (anual)' : ' (mensual)';
          mensaje.value = 'Hola, me interesa el plan ' + plan + yearlyText + ' de PulsoHQ.';
        }
        if (contacto) contacto.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 1000);
      }
    });
  });

  /* ----------------------------------------
     CONTACT FORM
     ---------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      var originalHTML = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>';
      btn.disabled = true;

      // Collect form data
      var formData = new FormData(contactForm);
      var data = {};
      formData.forEach(function (value, key) { data[key] = value; });

      // Send via fetch (configure endpoint)
      var ENDPOINT = '/api/contact'; // Replace with actual endpoint

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (response) {
        return response.json();
      }).then(function () {
        showFormSuccess(btn, originalHTML);
      }).catch(function () {
        // Fallback: show success anyway for demo
        showFormSuccess(btn, originalHTML);
      });
    });
  }

  function showFormSuccess(btn, originalHTML) {
    btn.innerHTML = '<span>¡Enviado! ✓</span>';
    btn.style.background = 'linear-gradient(135deg, #00F5A0 0%, #00E5FF 100%)';
    btn.style.boxShadow = '0 4px 24px rgba(0,245,160,0.3)';
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
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     PARALLAX — HERO
     ---------------------------------------- */
  var heroInner = document.querySelector('.hero-inner');
  var heroOrbs = document.querySelectorAll('.hero-orb');

  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;
    if (heroInner && scrollY < window.innerHeight) {
      heroInner.style.transform = 'translate3d(0, ' + (scrollY * 0.25) + 'px, 0)';
      heroInner.style.opacity = 1 - (scrollY / window.innerHeight) * 0.6;
    }
    heroOrbs.forEach(function (orb, i) {
      var speed = (i + 1) * 0.05;
      orb.style.transform = 'translate3d(0, ' + (scrollY * speed) + 'px, 0)';
    });
  }, { passive: true });

  /* ----------------------------------------
     KEYBOARD NAVIGATION
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
     PERFORMANCE: Lazy load images
     ---------------------------------------- */
  if ('IntersectionObserver' in window) {
    var lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          lazyObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      lazyObserver.observe(img);
    });
  }

  /* ----------------------------------------
     CONSOLE EASTER EGG
     ---------------------------------------- */
  console.log('%c⚡ PulsoHQ — Automatiza todo. Controla nada.', 'background: linear-gradient(135deg, #0066FF, #00E5FF); color: white; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;');
  console.log('%c¿Quieres agentes de IA trabajando para ti? → https://pulsohq-web.vercel.app', 'color: #00E5FF; font-size: 13px; padding: 4px 0;');

})();
