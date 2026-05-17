#!/usr/bin/env node
// Abandoned Checkout Recovery Email Scheduler
// - Runs every 15 minutes via cron
// - Sends 3-email recovery sequence:
//   Email 1: ~1h after abandonment (subject: "Olvidaste algo...")
//   Email 2: ~24h after abandonment (subject: discount URGENT15 + case study)
//   Email 3: ~72h after abandonment (subject: last chance + direct CTA)
// - Skips if checkout was completed (recovered)
// - Logs all actions
//
// Cron entry (every 15 min):
//   */15 * * * * cd /root/.hermes/workspace/pulsohq-web && /usr/bin/node scripts/recovery-scheduler.js >> /var/log/recovery-scheduler.log 2>&1

const path = require('path');
const fs = require('fs');

// Set up paths
const WORKSPACE = path.join(__dirname, '..');
const LOG_FILE = '/var/log/recovery-scheduler.log';

// Load tracker and email modules
const tracker = require(path.join(WORKSPACE, 'lib/recovery-tracker'));
const { sendRecoveryEmail } = require(path.join(WORKSPACE, 'lib/recovery-emails'));

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {
    // ignore log write errors
  }
}

// Timing thresholds (in milliseconds)
const EMAIL_1_DELAY = 60 * 60 * 1000;       // 1 hour
const EMAIL_2_DELAY = 24 * 60 * 60 * 1000;   // 24 hours
const EMAIL_3_DELAY = 72 * 60 * 60 * 1000;   // 72 hours

function shouldSendEmail(recovery, emailNumber) {
  const now = Date.now();
  const createdAt = new Date(recovery.createdAt).getTime();
  const elapsed = now - createdAt;

  // Check if this email was already sent
  const alreadySent = recovery.emailsSent.some(e => e.emailNumber === emailNumber);
  if (alreadySent) return false;

  // Check if already recovered or expired
  if (recovery.status !== 'pending') return false;

  let targetDelay;
  switch (emailNumber) {
    case 1: targetDelay = EMAIL_1_DELAY; break;
    case 2: targetDelay = EMAIL_2_DELAY; break;
    case 3: targetDelay = EMAIL_3_DELAY; break;
    default: return false;
  }

  // Send if we're past the target delay
  return elapsed >= targetDelay;
}

async function processRecoveries() {
  const pending = tracker.getPendingRecoveries();
  log(`Processing ${pending.length} pending recoveries...`);

  let sent = 0;
  let errors = 0;
  let skipped = 0;

  for (const recovery of pending) {
    for (const emailNumber of [1, 2, 3]) {
      if (shouldSendEmail(recovery, emailNumber)) {
        try {
          log(`Sending email ${emailNumber} to ${recovery.email} (session: ${recovery.sessionId})`);
          const result = await sendRecoveryEmail(recovery, emailNumber);
          tracker.markEmailSent(recovery.sessionId, emailNumber);
          log(`  -> Sent: "${result.subject}" (messageId: ${result.messageId})`);
          sent++;
        } catch (err) {
          log(`  -> ERROR sending email ${emailNumber} to ${recovery.email}: ${err.message}`);
          errors++;
        }
      } else {
        skipped++;
      }
    }
  }

  log(`Done. Sent: ${sent}, Errors: ${errors}, Skipped: ${skipped}`);
  return { sent, errors, skipped };
}

// Run
processRecoveries()
  .then(result => {
    process.exit(0);
  })
  .catch(err => {
    log(`FATAL: ${err.message}`);
    process.exit(1);
  });
