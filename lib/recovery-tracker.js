// lib/recovery-tracker.js
// Simple JSON-file-based store for tracking abandoned checkout recovery state.
// In production this would be a DB, but for Vercel serverless we use a file
// in /tmp (ephemeral) + the cron script handles the actual sending.

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.RECOVERY_DATA_DIR || '/root/.hermes/workspace/pulsohq-web/data';
const RECOVERY_FILE = path.join(DATA_DIR, 'recoveries.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadRecoveries() {
  ensureDir();
  if (!fs.existsSync(RECOVERY_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(RECOVERY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveRecoveries(data) {
  ensureDir();
  fs.writeFileSync(RECOVERY_FILE, JSON.stringify(data, null, 2));
}

function addRecovery(sessionId, email, plan, amount, currency) {
  const data = loadRecoveries();
  data[sessionId] = {
    sessionId,
    email,
    plan,
    amount,
    currency: currency || 'eur',
    createdAt: new Date().toISOString(),
    emailsSent: [],
    status: 'pending', // pending, recovered, expired, completed
  };
  saveRecoveries(data);
  return data[sessionId];
}

function markEmailSent(sessionId, emailNumber) {
  const data = loadRecoveries();
  if (!data[sessionId]) return null;
  data[sessionId].emailsSent.push({
    emailNumber,
    sentAt: new Date().toISOString(),
  });
  saveRecoveries(data);
  return data[sessionId];
}

function markRecovered(sessionId) {
  const data = loadRecoveries();
  if (!data[sessionId]) return null;
  data[sessionId].status = 'recovered';
  data[sessionId].recoveredAt = new Date().toISOString();
  saveRecoveries(data);
  return data[sessionId];
}

function markExpired(sessionId) {
  const data = loadRecoveries();
  if (!data[sessionId]) return null;
  data[sessionId].status = 'expired';
  saveRecoveries(data);
  return data[sessionId];
}

function getPendingRecoveries() {
  const data = loadRecoveries();
  return Object.values(data).filter(r => r.status === 'pending');
}

function getRecovery(sessionId) {
  const data = loadRecoveries();
  return data[sessionId] || null;
}

function removeRecovery(sessionId) {
  const data = loadRecoveries();
  delete data[sessionId];
  saveRecoveries(data);
}

module.exports = {
  loadRecoveries,
  saveRecoveries,
  addRecovery,
  markEmailSent,
  markRecovered,
  markExpired,
  getPendingRecoveries,
  getRecovery,
  removeRecovery,
};
