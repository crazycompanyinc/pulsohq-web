/* ========================================
   PULSOHQ — MAIN JS
   ======================================== */

(function () {
  'use strict';

  /* ----------------------------------------
     LOADER
     ---------------------------------------- */
  var loaderBarFill = document.getElementById('loaderBarFill');
  var loaderText = document.getElementById('loaderText');
  var loader = document.getElementById('loader');
  var loadTexts = ['Inicializando agentes...', 'Conectando nodos...', 'Cargando sistema...', 'Listo.'];

  var progress = 0;
  var loadInterval = setInterval(function () {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      if (loaderBarFill) loaderBarFill.style.width = '100%';
      if (loaderText) loaderText.textContent = loadTexts[3];
      setTimeout(function () {
        if (loader) loader.classList.add('hidden');
      }, 400);
    } else {
      if (loaderBarFill) loaderBarFill.style.width = progress + '%';
      var idx = Math.min(Math.floor(progress / 35), 2);
      if (loaderText) loaderText.textContent = loadTexts[idx];
    }
  }, 200);

  /* ----------------------------------------
     CUSTOM CURSOR
     ---------------------------------------- */
  var cursor = document.getElementById('cursor');
  var cursorFollower = document.getElementById('cursorFollower');
  var mouseX = 0, mouseY = 0;
  var cursorX = 0, cursorY = 0;
  var followerX = 0, followerY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    followerX += (mouseX - followerX) * 0.08;
    followerY += (mouseY - followerY) * 0.08;

    if (cursor) {
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
    }
    if (cursorFollower) {
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';
    }
    requestAnimationFrame(animateCursor);
  }
  if (window.matchMedia('(min-width: 769px)').matches) animateCursor();

  // Hover effect on interactive elements
  var interactives = document.querySelectorAll('a, button, .agente-card, .servicio-card, .caso-card, .precio-card, .faq-item');
  interactives.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      if (cursor) { cursor.style.transform = 'scale(2.5)'; cursor.style.opacity = '0.5'; }
      if (cursorFollower) { cursorFollower.style.transform = 'scale(1.5)'; cursorFollower.style.borderColor = 'rgba(0,229,255,0.8)'; }
    });
    el.addEventListener('mouseleave', function () {
      if (cursor) { cursor.style.transform = 'scale(1)'; cursor.style.opacity = '1'; }
      if (cursorFollower) { cursorFollower.style.transform = 'scale(1)'; cursorFollower.style.borderColor = 'rgba(0,229,255,0.4)'; }
    });
  });

  /* ----------------------------------------
     NAV SCROLL
     ---------------------------------------- */
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ----------------------------------------
     MOBILE NAV
     ---------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  /* ----------------------------------------
     PARTICLE CANVAS — HERO
     ---------------------------------------- */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = 80;
    var connectionDist = 150;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    var colors = ['#0066FF', '#00E5FF', '#00F5A0', '#7B2FFF'];

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }

    for (var i = 0; i < particleCount; i++) particles.push(createParticle());

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / connectionDist) * 0.15;
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
     AGENTS CONNECTION CANVAS
     ---------------------------------------- */
  var agentsCanvas = document.getElementById('agentsCanvas');
  if (agentsCanvas) {
    var actx = agentsCanvas.getContext('2d');
    var agentCards = document.querySelectorAll('.agente-card');

    function resizeAgentsCanvas() {
      var parent = agentsCanvas.parentElement;
      if (parent) {
        agentsCanvas.width = parent.offsetWidth;
        agentsCanvas.height = parent.offsetHeight;
      }
    }
    resizeAgentsCanvas();
    window.addEventListener('resize', resizeAgentsCanvas);

    function drawAgentConnections() {
      actx.clearRect(0, 0, agentsCanvas.width, agentsCanvas.height);
      if (agentCards.length < 2) return;

      var nodes = [];
      agentCards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var parentRect = agentsCanvas.parentElement.getBoundingClientRect();
        nodes.push({
          x: rect.left - parentRect.left + rect.width / 2,
          y: rect.top - parentRect.top + rect.height / 2
        });
      });

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) {
            actx.beginPath();
            actx.moveTo(nodes[i].x, nodes[i].y);
            actx.lineTo(nodes[j].x, nodes[j].y);
            actx.strokeStyle = 'rgba(0,102,255,0.08)';
            actx.lineWidth = 1;
            actx.stroke();
          }
        }
      }
      requestAnimationFrame(drawAgentConnections);
    }
    drawAgentConnections();
  }

  /* ----------------------------------------
     SCROLL REVEAL
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
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

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
          var duration = 2000;
          var start = 0;
          var startTime = null;

          function animateCounter(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(animateCounter);
          }
          requestAnimationFrame(animateCounter);
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
  if (precioToggle) {
    precioToggle.addEventListener('change', function () {
      var yearly = this.checked;
      document.querySelectorAll('.toggle-label').forEach(function (label) {
        label.classList.toggle('active', yearly ? label.dataset.period === 'yearly' : label.dataset.period === 'monthly');
      });
      document.querySelectorAll('.precio-number').forEach(function (num) {
        if (num.dataset.monthly && num.dataset.yearly) {
          num.textContent = yearly ? num.dataset.yearly : num.dataset.monthly;
        }
      });
    });
  }

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

      // Simulate form submission (replace with actual endpoint)
      setTimeout(function () {
        btn.innerHTML = '<span>¡Enviado!</span> ✓';
        btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        contactForm.reset();
        setTimeout(function () {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.background = '';
        }, 3000);
      }, 1500);
    });
  }

  /* ----------------------------------------
     SMOOTH SCROLL for anchor links
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     PARALLAX on hero
     ---------------------------------------- */
  var heroInner = document.querySelector('.hero-inner');
  window.addEventListener('scroll', function () {
    if (heroInner && window.scrollY < window.innerHeight) {
      heroInner.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px)';
      heroInner.style.opacity = 1 - (window.scrollY / window.innerHeight) * 0.5;
    }
  }, { passive: true });

})();
