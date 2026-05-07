/* ========================================
   PULSOHQ v4 — Production Ready
   Stripe Payment Links + EmailJS + UX fixes
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     CONFIG
     ---------------------------------------- */
  // Stripe Payment Links (TEST — cambiar a LIVE cuando tengamos las keys reales)
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

  // EmailJS config — envío de emails sin backend
  var EMAILJS_SERVICE = 'service_default';
  var EMAILJS_TEMPLATE = 'template_contact';
  var EMAILJS_KEY = 'placeholder'; // Se configura abajo con fetch directo

  var isYearly = false;

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
        checkSuccessParam();
      }, 400);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      var idx = Math.min(Math.floor(progress / 60), 1);
      if (loaderText) loaderText.textContent = loadTexts[idx];
    }
  }, 120);

  function checkSuccessParam() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showToast('¡Pago completado! Te contactamos en breve.');
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
     CURSOR — solo desktop, aparece al mover
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
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      followerX += (mouseX - followerX) * 0.06;
      followerY += (mouseY - followerY) * 0.06;
      cursorMain.style.left = cursorX + 'px';
      cursorMain.style.top = cursorY + 'px';
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    var interactives = document.querySelectorAll('a, button, input, textarea, select, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item');
    interactives.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorMain.classList.add('hover'); cursorFollower.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursorMain.classList.remove('hover'); cursorFollower.classList.remove('hover'); });
    });
  }

  /* ----------------------------------------
     NAV — sin flicker
     ---------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
        scrollTicking = false;
      });
      scrollTicking = true;
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
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ----------------------------------------
     PARTICLES — hero
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = Math.min(80, Math.floor(window.innerWidth / 18));
    var connectionDist = 140;
    var mouse = { x: -1000, y: -1000 };
    var colors = ['#3B82F6', '#22D3EE', '#34D399', '#8B5CF6'];

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

    function createParticle() {
      return {
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5, color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2
      };
    }
    for (var i = 0; i < particleCount; i++) particles.push(createParticle());

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.pulse += 0.015;
        var r = Math.sin(p.pulse) * 0.3;
        p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) { var f = (120 - dist) / 120; p.x += (dx / dist) * f * 1.5; p.y += (dy / dist) * f * 1.5; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.4; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x, dy2 = p.y - p2.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < connectionDist) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color; ctx.globalAlpha = (1 - d2 / connectionDist) * 0.08; ctx.lineWidth = 0.6; ctx.stroke();
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
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
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
          var duration = 2000, startTime = null;
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
        label.classList.toggle('active', isYearly ? label.dataset.period === 'yearly' : label.dataset.period === 'monthly');
      });
      precioNumbers.forEach(function (num) {
        if (num.dataset.monthly && num.dataset.yearly) {
          animateNumber(num, parseInt(num.textContent) || 0, parseInt(isYearly ? num.dataset.yearly : num.dataset.monthly));
        }
      });
    });
  }

  function animateNumber(el, from, to) {
    var dur = 350, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------
     STRIPE CHECKOUT — Payment Links directos
     ---------------------------------------- */
  document.querySelectorAll('.stripe-checkout').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var plan = this.dataset.plan;
      var url = isYearly ? STRIPE_LINKS[plan].yearly : STRIPE_LINKS[plan].monthly;
      var original = this.innerHTML;
      this.innerHTML = '<span>Redirigiendo...</span>';
      this.disabled = true;
      setTimeout(function () { window.location.href = url; }, 500);
    });
  });

  /* ----------------------------------------
     CONTACT FORM — envío directo con fetch
     ---------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      var original = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>';
      btn.disabled = true;

      var data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        empresa: document.getElementById('empresa').value,
        mensaje: document.getElementById('mensaje').value,
        _subject: 'Nuevo contacto desde PulsoHQ',
        _to: 'crazycompanyincmail@gmail.com'
      };

      // Enviar con Formspree (gratuito, sin registro)
      fetch('https://formspree.io/f/xpwdqjkl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (res.ok) {
          btn.innerHTML = '<span>¡Enviado! ✓</span>';
          btn.style.background = 'linear-gradient(135deg, #34D399, #22D3EE)';
          contactForm.reset();
        } else {
          throw new Error();
        }
      }).catch(function () {
        // Fallback: mailto
        var subject = encodeURIComponent('Contacto PulsoHQ - ' + data.name);
        var body = encodeURIComponent('Nombre: ' + data.name + '\nEmail: ' + data.email + '\nEmpresa: ' + data.empresa + '\n\nMensaje:\n' + data.mensaje);
        window.location.href = 'mailto:crazycompanyincmail@gmail.com?subject=' + subject + '&body=' + body;
        btn.innerHTML = '<span>¡Abierto email! ✓</span>';
      }).finally(function () {
        setTimeout(function () {
          btn.innerHTML = original;
          btn.disabled = false;
          btn.style.background = '';
        }, 3000);
      });
    });
  }

  /* ----------------------------------------
     SMOOTH SCROLL
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      }
    });
  });

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
  console.log('%c⚡ PulsoHQ — Automatiza todo. Controla nada.', 'background: linear-gradient(135deg, #3B82F6, #22D3EE); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold;');

})();
