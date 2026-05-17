// lib/recovery-emails.js
// 3-email abandoned checkout recovery sequence.
// A/B test ready: two subject line variants per email.

const nodemailer = require('nodemailer');

// Email configuration
function getTransporter() {
  const password = process.env.EMAIL_PASSWORD;
  if (!password) {
    throw new Error('EMAIL_PASSWORD env var not set');
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    auth: {
      user: 'crazycompanyincmail@gmail.com',
      pass: password,
    },
  });
}

const FROM = '"PulsoHQ" <crazycompanyincmail@gmail.com>';
const REPLY_TO = 'crazycompanyincmail@gmail.com';

// A/B subject line variants
const SUBJECTS = {
  email1: {
    A: 'Olvidaste algo en PulsoHQ 👀',
    B: 'Tu plan está esperándote',
  },
  email2: {
    A: '24h sin tu plan — aquí tienes 15% OFF',
    B: '¿Aún interesado? Te guardamos tu plan + descuento',
  },
  email3: {
    A: 'Última oportunidad: tu plan expira pronto ⏰',
    B: 'Última llamada — tu plan PulsoHQ te espera',
  },
};

// Pick A/B variant deterministically based on email hash
function pickVariant(email, emailNumber) {
  const key = `email${emailNumber}`;
  const hash = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 2 === 0 ? 'A' : 'B';
}

function getSubject(emailNumber, email) {
  const variant = pickVariant(email, emailNumber);
  return SUBJECTS[`email${emailNumber}`][variant];
}

function formatAmount(amountCents, currency) {
  const amount = (amountCents / 100).toFixed(2);
  const symbol = currency === 'eur' ? '€' : '$';
  return `${symbol}${amount}`;
}

// Email 1: Immediate (1h after abandonment) — "Olvidaste algo..."
function buildEmail1(recovery) {
  const subject = getSubject(1, recovery.email);
  const planDisplay = recovery.plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const amount = formatAmount(recovery.amount, recovery.currency);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#060A14;font-family:'Inter',-apple-system,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td style="text-align:center;padding-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#3B82F6;letter-spacing:-0.5px;">PulsoHQ</span>
  </td></tr>
  <tr><td style="background:#1E293B;border-radius:16px;padding:40px;border:1px solid #334155;">
    <h1 style="font-size:22px;font-weight:700;color:#F8FAFC;margin:0 0 16px;">Olvidaste completar tu suscripción</h1>
    <p style="font-size:15px;line-height:1.6;color:#94A3B8;margin:0 0 24px;">
      Notamos que estabas a punto de suscribirte al plan <strong style="color:#F8FAFC;">${planDisplay}</strong> (${amount}) pero no completaste el proceso.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#94A3B8;margin:0 0 32px;">
      Tus agentes de IA están listos para empezar a trabajar. Solo falta un clic.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="background:#3B82F6;border-radius:8px;text-align:center;">
        <a href="https://pulsohq-web.vercel.app/#precios" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">Completar suscripción →</a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748B;text-align:center;margin:24px 0 0;">
      Si tienes cualquier duda, responde a este email.
    </p>
  </td></tr>
  <tr><td style="text-align:center;padding-top:24px;">
    <p style="font-size:12px;color:#475569;">PulsoHQ · Agentes de IA que trabajan 24/7</p>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Olvidaste completar tu suscripción

Estabas a punto de suscribirte al plan ${planDisplay} (${amount}) pero no completaste el proceso.

Tus agentes de IA están listos. Solo falta un clic:
https://pulsohq-web.vercel.app/#precios

Si tienes dudas, responde a este email.

— PulsoHQ`;

  return { subject, html, text };
}

// Email 2: 24h — Discount URGENT15 + social proof
function buildEmail2(recovery) {
  const subject = getSubject(2, recovery.email);
  const planDisplay = recovery.plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const amount = formatAmount(recovery.amount, recovery.currency);
  const discountedAmount = formatAmount(Math.round(recovery.amount * 0.85), recovery.currency);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#060A14;font-family:'Inter',-apple-system,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td style="text-align:center;padding-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#3B82F6;letter-spacing:-0.5px;">PulsoHQ</span>
  </td></tr>
  <tr><td style="background:#1E293B;border-radius:16px;padding:40px;border:1px solid #334155;">
    <h1 style="font-size:22px;font-weight:700;color:#F8FAFC;margin:0 0 16px;">Te guardamos tu plan + un descuento exclusivo</h1>
    <p style="font-size:15px;line-height:1.6;color:#94A3B8;margin:0 0 16px;">
      Han pasado 24h desde que viste el plan <strong style="color:#F8FAFC;">${planDisplay}</strong>. Queremos que lo pruebes.
    </p>
    <div style="background:#0F172A;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #334155;">
      <p style="font-size:14px;color:#94A3B8;margin:0 0 8px;">Tu plan:</p>
      <p style="font-size:18px;font-weight:700;color:#F8FAFC;margin:0 0 4px;">${planDisplay}</p>
      <p style="font-size:14px;color:#64748B;margin:0 0 12px;text-decoration:line-through;">${amount}</p>
      <p style="font-size:24px;font-weight:800;color:#34D399;margin:0;">${discountedAmount} <span style="font-size:14px;font-weight:400;color:#94A3B8;">con URGENT15</span></p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#94A3B8;margin:0 0 16px;">
      <strong style="color:#F8FAFC;">Caso real:</strong> Una agencia de marketing usó PulsoHQ para automatizar su prospección. En 2 semanas, generaron 3x más leads sin contratar a nadie.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td style="background:#3B82F6;border-radius:8px;text-align:center;">
        <a href="https://pulsohq-web.vercel.app/?promo=URGENT15#precios" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">Suscribirme con 15% OFF →</a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#64748B;text-align:center;margin:24px 0 0;">
      Código: <strong style="color:#34D399;">URGENT15</strong> · Válido por 48h
    </p>
  </td></tr>
  <tr><td style="text-align:center;padding-top:24px;">
    <p style="font-size:12px;color:#475569;">PulsoHQ · Agentes de IA que trabajan 24/7</p>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Te guardamos tu plan + un descuento exclusivo

Han pasado 24h desde que viste el plan ${planDisplay}.

Queremos que lo pruebes con 15% de descuento:
- Plan: ${planDisplay}
- Precio original: ${amount}
- Con URGENT15: ${discountedAmount}

Caso real: Una agencia de marketing usó PulsoHQ para automatizar su prospección. En 2 semanas, generaron 3x más leads sin contratar a nadie.

Suscribirte con descuento:
https://pulsohq-web.vercel.app/?promo=URGENT15#precios

Código: URGENT15 · Válido por 48h

— PulsoHQ`;

  return { subject, html, text };
}

// Email 3: 72h — Last chance + direct CTA
function buildEmail3(recovery) {
  const subject = getSubject(3, recovery.email);
  const planDisplay = recovery.plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const amount = formatAmount(recovery.amount, recovery.currency);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#060A14;font-family:'Inter',-apple-system,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <tr><td style="text-align:center;padding-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#3B82F6;letter-spacing:-0.5px;">PulsoHQ</span>
  </td></tr>
  <tr><td style="background:#1E293B;border-radius:16px;padding:40px;border:1px solid #334155;">
    <h1 style="font-size:22px;font-weight:700;color:#F8FAFC;margin:0 0 16px;">Última oportunidad para empezar con PulsoHQ</h1>
    <p style="font-size:15px;line-height:1.6;color:#94A3B8;margin:0 0 24px;">
      Hace 3 días viste nuestro plan <strong style="color:#F8FAFC;">${planDisplay}</strong> (${amount}) y no completaste la suscripción.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#94A3B8;margin:0 0 24px;">
      No queremos ser insistentes, pero tampoco queremos que pierdas la oportunidad de tener un equipo de agentes de IA trabajando 24/7 por tu negocio.
    </p>
    <div style="background:#0F172A;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #334155;text-align:center;">
      <p style="font-size:14px;color:#94A3B8;margin:0 0 8px;">Empieza hoy:</p>
      <p style="font-size:20px;font-weight:700;color:#F8FAFC;margin:0 0 4px;">${planDisplay}</p>
      <p style="font-size:16px;color:#34D399;font-weight:600;margin:0;">${amount}</p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
      <tr><td style="background:#3B82F6;border-radius:8px;text-align:center;">
        <a href="https://pulsohq-web.vercel.app/?promo=URGENT15#precios" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">Empezar ahora →</a>
      </td></tr>
    </table>
    <p style="font-size:14px;color:#94A3B8;text-align:center;margin:0 0 16px;">
      ¿Prefieres hablar con alguien? <a href="mailto:crazycompanyincmail@gmail.com" style="color:#3B82F6;text-decoration:none;">Escríbenos directamente</a>.
    </p>
    <p style="font-size:13px;color:#64748B;text-align:center;margin:0;">
      Si no estás interesado, ignora este email. No te molestaremos más.
    </p>
  </td></tr>
  <tr><td style="text-align:center;padding-top:24px;">
    <p style="font-size:12px;color:#475569;">PulsoHQ · Agentes de IA que trabajan 24/7</p>
  </td></tr>
</table>
</body>
</html>`;

  const text = `Última oportunidad para empezar con PulsoHQ

Hace 3 días viste nuestro plan ${planDisplay} (${amount}) y no completaste la suscripción.

No queremos ser insistentes, pero tampoco queremos que pierdas la oportunidad de tener un equipo de agentes de IA trabajando 24/7.

Empieza hoy: ${planDisplay} por ${amount}
https://pulsohq-web.vercel.app/?promo=URGENT15#precios

¿Prefieres hablar? Escríbenos: crazycompanyincmail@gmail.com

Si no estás interesado, ignora este email. No te molestaremos más.

— PulsoHQ`;

  return { subject, html, text };
}

const EMAIL_BUILDERS = {
  1: buildEmail1,
  2: buildEmail2,
  3: buildEmail3,
};

async function sendRecoveryEmail(recovery, emailNumber) {
  const builder = EMAIL_BUILDERS[emailNumber];
  if (!builder) {
    throw new Error(`Invalid email number: ${emailNumber}`);
  }

  const { subject, html, text } = builder(recovery);
  const transporter = getTransporter();

  const result = await transporter.sendMail({
    from: FROM,
    to: recovery.email,
    replyTo: REPLY_TO,
    subject,
    text,
    html,
  });

  return {
    messageId: result.messageId,
    subject,
    emailNumber,
    to: recovery.email,
  };
}

module.exports = {
  sendRecoveryEmail,
  buildEmail1,
  buildEmail2,
  buildEmail3,
  getSubject,
  pickVariant,
  SUBJECTS,
};
