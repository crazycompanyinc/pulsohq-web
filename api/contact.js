const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function getPassword() {
  try {
    const envPath = path.join(process.env.HOME || '/root', '.hermes', '.env');
    const env = fs.readFileSync(envPath, 'utf8');
    for (const line of env.split('\n')) {
      if (line.startsWith('EMAIL_PASSWORD=')) {
        return line.split('=', 1)[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch(e) {}
  return process.env.EMAIL_PASSWORD || '';
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, empresa, message } = req.body || {};
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const password = getPassword();
  if (!password) {
    return res.status(500).json({ error: 'Email no configurado en el servidor' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'crazycompanyincmail@gmail.com',
      pass: password
    }
  });

  try {
    await transporter.sendMail({
      from: '"PulsoHQ Web" <crazycompanyincmail@gmail.com>',
      to: 'crazycompanyincmail@gmail.com',
      replyTo: email,
      subject: `Contacto PulsoHQ - ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${empresa || 'No especificada'}\n\nMensaje:\n${message}\n\n---\nEnviado desde pulsohq-web.vercel.app`,
      html: `<h2>Nuevo contacto desde PulsoHQ</h2><p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Empresa:</strong> ${empresa || 'No especificada'}</p><hr><p>${message.replace(/\n/g, '<br>')}</p><hr><p><small>Enviado desde pulsohq-web.vercel.app</small></p>`
    });
    
    return res.status(200).json({ ok: true, message: 'Email enviado correctamente' });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ error: 'Error al enviar el email: ' + err.message });
  }
};
