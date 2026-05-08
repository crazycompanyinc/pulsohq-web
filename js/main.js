/* ========================================
   PULSOHQ v11 — Production
   Multi-agent team improvements applied
   ======================================== */

(function () {
  'use strict';

  var isYearly = false;

  function updatePrices() {
    var yearly = isYearly;
    document.querySelectorAll('.precio-number[data-monthly]').forEach(function (n) {
      var m = parseInt(n.dataset.monthly, 10);
      var y = parseInt(n.dataset.yearly, 10);
      ani(n, parseInt(n.textContent) || 0, yearly ? y : m);
    });
    document.querySelectorAll('.period-text').forEach(function (p) {
      p.textContent = yearly ? '/mes · facturado anualmente' : '/mes';
    });
  }

  // goToCheckout is defined inline in <head> for immediate availability

  // Number animation
  function ani(el, from, to) {
    if (from === to) return;
    var d = 400, s = null;
    function step(ts) {
      if (!s) s = ts;
      var t = Math.min((ts - s) / d, 1);
      var ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* LOADER - with safety timeout to prevent infinite blocking */
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
  // Safety: force-hide loader after 5s max (fixes BUG-16: loader interval leak)
  setTimeout(function () { clearInterval(li); if (ld) ld.classList.add('hidden'); }, 5000);

  function showToast(msg, color) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-10px);padding:10px 24px;border-radius:999px;font-weight:600;font-size:13px;z-index:99999;opacity:0;transition:opacity 0.4s, transform 0.4s;' +
      'background:' + (color || '#3B82F6') + ';color:#fff;';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-10px)'; setTimeout(function () { t.remove(); }, 400); }, 5000);
  }

  /* CURSOR (desktop only) */
  var cm = document.getElementById('cursorMain');
  var cf = document.getElementById('cursorFollower');
  if (cm && cf && window.matchMedia('(min-width: 769px)').matches) {
    var mx = 0, my = 0, cx = 0, cy = 0, fx = 0, fy = 0, cv = false;
    var cursorIdleTimer = null;
    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!cv) { cv = true; document.body.classList.add('cursor-active'); }
      // Reset idle timer (fixes BUG-19: cursor rAF when idle)
      clearTimeout(cursorIdleTimer);
      cursorIdleTimer = setTimeout(function () { document.body.classList.remove('cursor-active'); }, 3000);
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
  var lastScroll = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 50);
    lastScroll = y;
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

  /* PARTICLES - with IntersectionObserver to pause when off-screen */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d'), particles = [], pCount = Math.min(30, Math.floor(window.innerWidth / 30)), cd = 100;
    var mouse = { x: -1000, y: -1000 }, colors = ['#3B82F6', '#22D3EE', '#34D399', '#8B5CF6'];
    var particleAnimId = null, particlesActive = true;
    function rc() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    rc();
    // Debounced resize (fixes BUG-17)
    var resizeTimer = null;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(rc, 150); });
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    for (var i = 0; i < pCount; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() + 0.2, c: colors[i % colors.length] });
    (function dp() {
      if (!particlesActive) { particleAnimId = requestAnimationFrame(dp); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i]; p.x += p.vx; p.y += p.vy;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 60 && d > 0) { var f = (60 - d) / 60; p.x += (dx / d) * f; p.y += (dy / d) * f; }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.15; ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j], dx2 = p.x - p2.x, dy2 = p.y - p2.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < cd) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = p.c; ctx.globalAlpha = (1 - d2 / cd) * 0.03; ctx.lineWidth = 0.3; ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1; particleAnimId = requestAnimationFrame(dp);
    })();
    // Pause particles when hero is off-screen (fixes BUG-03: P-03)
    if ('IntersectionObserver' in window) {
      var heroSection = document.getElementById('hero');
      if (heroSection) {
        new IntersectionObserver(function (entries) {
          particlesActive = entries[0].isIntersecting;
        }, { threshold: 0 }).observe(heroSection);
      }
    }
  }

  /* SCROLL REVEAL ANIMATIONS */
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    el.classList.add('reveal-hidden');
  });
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-hidden');
          entry.target.classList.add('reveal-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { revealObserver.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('reveal-visible'); });
  }

  /* STAGGER DELAY for grid children - with fallback for no IntersectionObserver */
  document.querySelectorAll('[data-stagger]').forEach(function (container) {
    var children = container.children;
    if ('IntersectionObserver' in window) {
      var staggerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            for (var i = 0; i < children.length; i++) {
              (function (child, delay) {
                setTimeout(function () {
                  child.style.opacity = '1';
                  child.style.transform = 'translateY(0)';
                }, delay);
              })(children[i], i * 120);
            }
            staggerObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
      for (var i = 0; i < children.length; i++) {
        children[i].style.opacity = '0';
        children[i].style.transform = 'translateY(24px)';
        children[i].style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      staggerObserver.observe(container);
    } else {
      // Fallback: make all stagger children visible (fixes BUG-18)
      for (var i = 0; i < children.length; i++) {
        children[i].style.opacity = '1';
        children[i].style.transform = 'translateY(0)';
      }
    }
  });

  /* COUNTERS */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var rawCount = el.getAttribute('data-count');
            var t = parseInt(rawCount, 10);
            if (isNaN(t)) { el.textContent = rawCount || '0'; return; } // fixes BUG-25
            var s = null;
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
      updatePrices();
    });
    document.querySelectorAll('.toggle-label').forEach(function (label) {
      label.addEventListener('click', function () {
        var wantYearly = this.dataset.period === 'yearly';
        if (wantYearly !== isYearly) {
          isYearly = wantYearly;
          pt.checked = wantYearly;
          document.querySelectorAll('.toggle-label').forEach(function (l) { l.classList.toggle('active', isYearly ? l.dataset.period === 'yearly' : l.dataset.period === 'monthly'); });
          updatePrices();
        }
      });
      label.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
      });
    });
  }
  updatePrices();

  /* CONTACT FORM with sanitization and safe sessionStorage */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="website"]') && form.querySelector('[name="website"]').value) { return; }

      var btn = document.getElementById('submitBtn');
      var status = document.getElementById('formStatus');
      var orig = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>'; btn.disabled = true;
      status.style.display = 'none';

      function sanitize(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }

      var nameVal = sanitize((document.getElementById('name').value || '').trim());
      var emailVal = sanitize((document.getElementById('email').value || '').trim());
      var empresaVal = sanitize((document.getElementById('empresa').value || '').trim());
      var messageVal = sanitize((document.getElementById('mensaje').value || '').trim());

      // Validate non-empty after trim (fixes BUG-13)
      if (!nameVal || nameVal.length < 2) {
        status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
        status.textContent = 'Por favor, introduce tu nombre (mínimo 2 caracteres).';
        btn.innerHTML = orig; btn.disabled = false; return;
      }
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
        status.textContent = 'Por favor, introduce un email válido.';
        btn.innerHTML = orig; btn.disabled = false; return;
      }
      if (!messageVal || messageVal.length < 10) {
        status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
        status.textContent = 'Por favor, describe qué quieres automatizar (mínimo 10 caracteres).';
        btn.innerHTML = orig; btn.disabled = false; return;
      }

      // Safe sessionStorage access (fixes BUG-23)
      try {
        var lastSubmit = parseInt(sessionStorage.getItem('lastContactSubmit') || '0', 10);
        var now = Date.now();
        if (now - lastSubmit < 30000) {
          status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
          status.textContent = 'Espera 30 segundos antes de enviar otro mensaje.';
          btn.innerHTML = orig; btn.disabled = false; return;
        }
      } catch(e) { /* sessionStorage unavailable, continue */ }

      var controller = new AbortController();
      var tout = setTimeout(function () { controller.abort(); }, 10000);

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, email: emailVal, empresa: empresaVal, message: messageVal }),
        signal: controller.signal
      })
      .then(function (r) { clearTimeout(tout); return r.json().then(function (d) { return { ok: r.ok && d.ok, data: d }; }); })
      .then(function (r) {
        if (r.ok) {
          try { sessionStorage.setItem('lastContactSubmit', Date.now().toString()); } catch(e) {}
          status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#34D399;';
          status.textContent = '¡Mensaje enviado! Te responderemos en menos de 24h.';
          form.reset();
          showToast('¡Mensaje enviado!', '#34D399');
        } else { throw new Error(r.data.error || 'Error'); }
      })
      .catch(function (err) {
        clearTimeout(tout);
        status.style.cssText = 'margin-top:12px;font-size:13px;display:block;color:#F97316;';
        if (err.name === 'AbortError') {
          status.textContent = 'El servidor tardó demasiado. Escríbenos a crazycompanyincmail@gmail.com';
        } else {
          status.textContent = 'Error: ' + err.message + '. Escríbenos a crazycompanyincmail@gmail.com';
        }
      })
      .finally(function () { btn.innerHTML = orig; btn.disabled = false; });
    });
  }

  /* SMOOTH SCROLL - with promo bar offset */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (t) {
        e.preventDefault();
        var promoBar = document.getElementById('promoBar');
        var promoHeight = (promoBar && !promoBar.classList.contains('hidden')) ? promoBar.offsetHeight : 0;
        var navHeight = nav ? nav.offsetHeight : 80;
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - navHeight - promoHeight, behavior: 'smooth' });
      }
    });
  });

  /* KEYBOARD */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nl && nl.classList.contains('open')) { nl.classList.remove('open'); nt.classList.remove('active'); nt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  });

  /* PARALLAX HERO on scroll - throttled */
  var heroInner = document.querySelector('.hero-inner');
  if (heroInner) {
    var parallaxTimer = null;
    window.addEventListener('scroll', function () {
      if (parallaxTimer) return;
      parallaxTimer = setTimeout(function () {
        var y = window.scrollY;
        if (y < 600) {
          heroInner.style.transform = 'translateY(' + (y * 0.3) + 'px)';
          heroInner.style.opacity = 1 - (y / 600);
        }
        parallaxTimer = null;
      }, 16); // ~60fps throttle (fixes BUG-20)
    }, { passive: true });
  }

  /* CHECK URL PARAMS */
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) { showToast('¡Pago completado! Te contactamos en breve.', '#34D399'); window.history.replaceState({}, document.title, window.location.pathname); }
    if (params.get('sent')) { showToast('¡Mensaje enviado! Te responderemos en menos de 24h.', '#3B82F6'); window.history.replaceState({}, document.title, window.location.pathname); }
  } catch(e) {}

})();
