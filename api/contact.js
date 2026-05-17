// api/contact.js
// Contact form API with security improvements
// Multi-agent team fixes applied

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Rate limiting store (in-memory, resets on deploy)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  if (now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  record.count++;
  return { allowed: true };
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 5000);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPassword() {
  // Use Vercel env vars exclusively (fixes S-06: no filesystem secret read)
  // REQUIRED: Set EMAIL_PASSWORD in Vercel dashboard (Settings → Environment Variables)
  return process.env.EMAIL_PASSWORD || '';
}

// Startup-time check: warn immediately if EMAIL_PASSWORD is missing
if (!getPassword()) {
  console.error('[contact.js] WARNING: EMAIL_PASSWORD env var is not set — contact form submissions will fail with 503');
}

module.exports = async (req, res) => {
  // CORS - restricted to pulsohq domain (fixes S-01: wildcard CORS)
  const allowedOrigin = 'https://pulsohq-web.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Origin validation (fixes S-02: CSRF protection)
  if (req.method === 'POST') {
    const origin = req.headers['origin'] || '';
    const referer = req.headers['referer'] || '';
    if (origin && origin !== allowedOrigin) {
      return res.status(403).json({ error: 'Forbidden: invalid origin' });
    }
    if (referer && !referer.startsWith(allowedOrigin)) {
      return res.status(403).json({ error: 'Forbidden: invalid referer' });
    }
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const rateCheck = checkRateLimit(clientIP);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', rateCheck.retryAfter);
    return res.status(429).json({ error: 'Too many requests. Please wait ' + rateCheck.retryAfter + ' seconds.' });
  }

  const raw = req.body || {};
  const name = sanitize(raw.name);
  const email = sanitize(raw.email);
  const empresa = sanitize(raw.empresa || '');
  const message = sanitize(raw.message);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Nombre requerido (mínimo 2 caracteres)' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Email no válido' });
  }

  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'Mensaje requerido (mínimo 10 caracteres)' });
  }

  const password = getPassword();
  if (!password) {
    console.error('FATAL: EMAIL_PASSWORD env var is not set — contact form will not work');
    return res.status(503).json({ error: 'Email service temporarily unavailable. Please try again later.' });
  }

  // Transporter with timeouts (fixes backend audit)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    auth: {
      user: 'crazycompanyincmail@gmail.com',
      pass: password
    }
  });

  try {
    // Use proper HTML escaping (fixes S-05: XSS in email HTML)
    await transporter.sendMail({
      from: '"PulsoHQ Web" <crazycompanyincmail@gmail.com>',
      to: 'crazycompanyincmail@gmail.com',
      replyTo: email,
      subject: `Contacto PulsoHQ - ${escapeHtml(name)}`,
      text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${empresa || 'No especificada'}\n\nMensaje:\n${message}\n\n---\nEnviado desde pulsohq-web.vercel.app`,
      html: `<h2>Nuevo contacto desde PulsoHQ</h2><p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p><p><strong>Empresa:</strong> ${escapeHtml(empresa) || 'No especificada'}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><p><small>Enviado desde pulsohq-web.vercel.app</small></p>`
    });
    
    return res.status(200).json({ ok: true, message: 'Email enviado correctamente' });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ error: 'Internal server error' }); // Generic error (fixes S-05)
  }
};
