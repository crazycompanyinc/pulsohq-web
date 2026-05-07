/* ========================================
   PULSOHQ v6 — Production LIVE
   Stripe LIVE Payment Links + Serverless Contact
   ======================================== */

(function () {
  'use strict';

  /* STRIPE LIVE Payment Links */
  var STRIPE_LINKS = {
    starter: {
      monthly: 'https://buy.stripe.com/3cI8wOfz49h61BUfAygA803',
      yearly:  'https://buy.stripe.com/5kQdR89aGfFu0xQ742gA804'
    },
    growth: {
      monthly: 'https://buy.stripe.com/9B68wO9aGdxmcgybkigA805',
      yearly:  'https://buy.stripe.com/8x214m9aGgJyfsKcomgA806'
    }
  };
  var isYearly = false;

  function updateStripeLinks() {
    var s = document.getElementById('starter-btn');
    var g = document.getElementById('growth-btn');
    if (s) s.href = isYearly ? STRIPE_LINKS.starter.yearly : STRIPE_LINKS.starter.monthly;
    if (g) g.href = isYearly ? STRIPE_LINKS.growth.yearly : STRIPE_LINKS.growth.monthly;
  }

  /* LOADER */
  var lbf = document.getElementById('loaderBarFill');
  var lt = document.getElementById('loaderText');
  var ld = document.getElementById('loader');
  var progress = 0;
  var li = setInterval(function () {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100; clearInterval(li);
      if (lbf) lbf.style.width = '100%';
      if (lt) lt.textContent = 'Listo.';
      setTimeout(function () { if (ld) ld.classList.add('hidden'); }, 300);
    } else {
      if (lbf) lbf.style.width = progress + '%';
      if (lt) lt.textContent = progress < 60 ? 'Inicializando...' : 'Cargando...';
    }
  }, 100);

  function showToast(msg, color) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);padding:10px 24px;border-radius:999px;font-weight:600;font-size:13px;z-index:99999;opacity:0;transition:opacity 0.4s;' +
      'background:' + (color || '#3B82F6') + ';color:#fff;';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 5000);
  }

  /* CURSOR */
  var cm = document.getElementById('cursorMain');
  var cf = document.getElementById('cursorFollower');
  var mx = 0, my = 0, cx = 0, cy = 0, fx = 0, fy = 0, cv = false;
  if (cm && cf && window.matchMedia('(min-width: 769px)').matches) {
    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', function (e) {
      if (!cv) { cv = true; document.body.classList.add('cursor-active'); }
      mx = e.clientX; my = e.clientY;
    });
    (function ac() {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      fx += (mx - fx) * 0.06; fy += (my - fy) * 0.06;
      cm.style.left = cx + 'px'; cm.style.top = cy + 'px';
      cf.style.left = fx + 'px'; cf.style.top = fy + 'px';
      requestAnimationFrame(ac);
    })();
    document.querySelectorAll('a, button, input, textarea, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cm.classList.add('hover'); cf.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cm.classList.remove('hover'); cf.classList.remove('hover'); });
    });
  }

  /* NAV */
  var nav = document.getElementById('nav');
  var nt = document.getElementById('navToggle');
  var nl = document.getElementById('navLinks');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 50); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  if (nt && nl) {
    nt.addEventListener('click', function () {
      var o = nl.classList.toggle('open'); nt.classList.toggle('active'); nt.setAttribute('aria-expanded', o);
      document.body.style.overflow = o ? 'hidden' : '';
    });
    nl.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () { nl.classList.remove('open'); nt.classList.remove('active'); nt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
    });
  }

  /* PARTICLES */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d'), particles = [], pCount = Math.min(35, Math.floor(window.innerWidth / 28)), cd = 100;
    var mouse = { x: -1000, y: -1000 }, colors = ['#3B82F6', '#22D3EE', '#34D399', '#8B5CF6'];
    function rc() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    rc(); window.addEventListener('resize', rc);
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    for (var i = 0; i < pCount; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() + 0.2, c: colors[i % colors.length] });
    (function dp() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i]; p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 60 && d > 0) { var f = (60 - d) / 60; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.2; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j], dx2 = p.x - p2.x, dy2 = p.y - p2.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < cd) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = p.c; ctx.globalAlpha = (1 - d2 / cd) * 0.03; ctx.lineWidth = 0.3; ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1; requestAnimationFrame(dp);
    })();
  }

  /* SCROLL REVEAL */
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('revealed'); }); }, { threshold: 0.05 }).observe(el);
    } else { el.classList.add('revealed'); }
  });

  /* COUNTERS */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var t = parseInt(el.getAttribute('data-count'), 10), s = null;
            function a(ts) { if (!s) s = ts; var p = Math.min((ts - s) / 2000, 1); el.textContent = Math.floor((p === 1 ? 1 : 1 - Math.pow(2, -10 * p)) * t).toLocaleString(); if (p < 1) requestAnimationFrame(a); }
            requestAnimationFrame(a);
          }
        });
      }, { threshold: 0.5 }).observe(el);
    }
  });

  /* PRICE TOGGLE */
  var pt = document.getElementById('precioToggle');
  if (pt) {
    pt.addEventListener('change', function () {
      isYearly = this.checked;
      document.querySelectorAll('.toggle-label').forEach(function (l) { l.classList.toggle('active', isYearly ? l.dataset.period === 'yearly' : l.dataset.period === 'monthly'); });
      document.querySelectorAll('.precio-number').forEach(function (n) {
        if (n.dataset.monthly && n.dataset.yearly) an(n, parseInt(n.textContent) || 0, parseInt(isYearly ? n.dataset.yearly : n.dataset.monthly));
      });
      updateStripeLinks();
    });
  }
  function an(el, from, to) { var d = 300, s = null; function step(ts) { if (!s) s = ts; var t = Math.min((ts - s) / d, 1); el.textContent = Math.floor(from + (to - from) * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); } requestAnimationFrame(step); }
  updateStripeLinks();

  /* CONTACT FORM */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('submitBtn');
      var status = document.getElementById('formStatus');
      var orig = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>'; btn.disabled = true;
      status.style.display = 'none';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          empresa: document.getElementById('empresa').value.trim(),
          message: document.getElementById('mensaje').value.trim()
        })
      })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, data: d }; }); })
      .then(function (r) {
        if (r.ok) {
          status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#34D399;';
          status.textContent = '¡Mensaje enviado! Te responderemos en menos de 24h.';
          form.reset();
        } else { throw new Error(r.data.error || 'Error'); }
      })
      .catch(function (err) {
        status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
        status.textContent = 'Error: ' + err.message + '. Escríbenos a crazycompanyincmail@gmail.com';
      })
      .finally(function () { btn.innerHTML = orig; btn.disabled = false; });
    });
  }

  /* SMOOTH SCROLL */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { var t = document.querySelector(this.getAttribute('href')); if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); } });
  });

  /* KEYBOARD */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nl && nl.classList.contains('open')) { nl.classList.remove('open'); nt.classList.remove('active'); nt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  });

  /* CHECK URL PARAMS */
  var params = new URLSearchParams(window.location.search);
  if (params.get('success')) { showToast('¡Pago completado! Te contactamos en breve.', '#34D399'); window.history.replaceState({}, document.title, window.location.pathname); }
  if (params.get('sent')) { showToast('¡Mensaje enviado! Te responderemos en menos de 24h.', '#3B82F6'); window.history.replaceState({}, document.title, window.location.pathname); }

  console.log('%c⚡ PulsoHQ LIVE', 'background: linear-gradient(135deg, #3B82F6, #22D3EE); color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold;');
})();
