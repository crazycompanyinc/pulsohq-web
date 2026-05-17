// api/webhook.js
// Stripe webhook handler for checkout abandonment recovery.
// Handles: checkout.session.expired, checkout.session.completed, customer.subscription.created
//
// Setup: Configure in Stripe Dashboard → Webhooks → Add endpoint
//   URL: https://pulsohq-web.vercel.app/api/webhook
//   Events: checkout.session.expired, checkout.session.completed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const tracker = require('../lib/recovery-tracker');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Plan pricing map (EUR cents)
const PLAN_PRICES = {
  starter_monthly: { amount: 2900, display: '€29/mes' },
  starter_yearly:  { amount: 29000, display: '€290/año' },
  growth_monthly:  { amount: 7900, display: '€79/mes' },
  growth_yearly:   { amount: 79000, display: '€790/año' },
};

function getPlanFromSession(session) {
  // Try subscription_data metadata first
  const subData = session.subscription_data || {};
  if (subData.metadata && subData.metadata.plan) {
    return subData.metadata.plan;
  }
  // Fallback: try line_items
  const items = session.line_items?.data;
  if (items && items.length > 0) {
    const priceId = items[0].price?.id;
    const PRICE_TO_PLAN = {
      'price_1TUbrKB37GidxnBvIToijsAT': 'starter_monthly',
      'price_1TUbrLB37GidxnBv6jlQj9hK': 'starter_yearly',
      'price_1TUbrKB37GidxnBvvE7Ia4Y6': 'growth_monthly',
      'price_1TUbrKB37GidxnBvVRuT0kYr': 'growth_yearly',
    };
    if (PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];
  }
  return 'unknown';
}

async function handleCheckoutSessionExpired(session) {
  const sessionId = session.id;
  const email = session.customer_email || session.customer_details?.email;
  const plan = getPlanFromSession(session);
  const planInfo = PLAN_PRICES[plan] || { amount: 0, display: plan };

  console.log(`[webhook] checkout.session.expired: ${sessionId}, email: ${email || 'none'}, plan: ${plan}`);

  // Only track if we have an email — can't recover without it
  if (!email) {
    console.log(`[webhook] No email for session ${sessionId}, skipping recovery tracking`);
    return { tracked: false, reason: 'no_email' };
  }

  // Check if already tracked
  const existing = tracker.getRecovery(sessionId);
  if (existing) {
    console.log(`[webhook] Session ${sessionId} already tracked`);
    return { tracked: false, reason: 'already_tracked' };
  }

  const recovery = tracker.addRecovery(sessionId, email, plan, planInfo.amount, 'eur');
  console.log(`[webhook] Recovery tracked: ${sessionId} -> ${email}`);
  return { tracked: true, recovery };
}

async function handleCheckoutSessionCompleted(session) {
  const sessionId = session.id;
  console.log(`[webhook] checkout.session.completed: ${sessionId}`);

  // Mark as recovered if it was in our tracking
  const existing = tracker.getRecovery(sessionId);
  if (existing) {
    tracker.markRecovered(sessionId);
    console.log(`[webhook] Marked as recovered: ${sessionId}`);
    return { recovered: true };
  }

  return { recovered: false };
}

module.exports = async (req, res) => {
  // Stripe sends POST with raw body for signature verification
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  // If webhook secret is configured, verify signature
  if (STRIPE_WEBHOOK_SECRET && sig) {
    try {
      const event = stripe.webhooks.constructEvent(
        req.body, // raw body — Vercel parses this as string/buffer
        sig,
        STRIPE_WEBHOOK_SECRET
      );
      return processEvent(event, res);
    } catch (err) {
      console.error(`[webhook] Signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }

  // No webhook secret configured — parse JSON directly (dev mode)
  // WARNING: In production, ALWAYS set STRIPE_WEBHOOK_SECRET
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return processEvent(body, res);
  } catch (err) {
    console.error(`[webhook] JSON parse error: ${err.message}`);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
};

async function processEvent(event, res) {
  try {
    switch (event.type) {
      case 'checkout.session.expired': {
        const session = event.data.object;
        const result = await handleCheckoutSessionExpired(session);
        return res.status(200).json({ received: true, ...result });
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const result = await handleCheckoutSessionCompleted(session);
        return res.status(200).json({ received: true, ...result });
      }

      case 'customer.subscription.created': {
        // Could be used to confirm recovery
        console.log(`[webhook] subscription created: ${event.data.object.id}`);
        return res.status(200).json({ received: true });
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
        return res.status(200).json({ received: true, handled: false });
    }
  } catch (err) {
    console.error(`[webhook] Error processing event: ${err.message}`);
    // Return 200 to prevent Stripe retries for non-retryable errors
    return res.status(200).json({ received: true, error: err.message });
  }
};
