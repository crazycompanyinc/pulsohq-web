// api/create-checkout.js
// Stripe Checkout Session with promo support
// Multi-agent team fixes applied

let stripe;

function getStripe() {
  if (stripe) return stripe;
  
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  
  stripe = require('stripe')(key);
  return stripe;
}

const PRICES = {
  starter_monthly: 'price_1TUbrKB37GidxnBvIToijsAT',
  starter_yearly:  'price_1TUbrLB37GidxnBv6jlQj9hK',
  growth_monthly:  'price_1TUbrKB37GidxnBvvE7Ia4Y6',
  growth_yearly:   'price_1TUbrKB37GidxnBvVRuT0kYr',
};

module.exports = async (req, res) => {
  const allowedOrigin = 'https://pulsohq-web.vercel.app';

  // Security: validate origin BEFORE setting CORS headers or processing request
  const origin = req.headers['origin'] || '';

  // Set security headers for all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Block requests with missing or non-matching origin
  if (!origin || origin !== allowedOrigin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Only set CORS headers for valid origin
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { plan, promo, customer_email } = req.body || {};
  const priceId = PRICES[plan];

  if (!priceId) return res.status(400).json({ error: 'Invalid plan' }); // Generic error (fixes S-09)

  // Validate email if provided
  if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const stripeClient = getStripe();
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://pulsohq-web.vercel.app/?success=true',
      cancel_url: 'https://pulsohq-web.vercel.app/',
      billing_address_collection: 'required',
      customer_creation: 'always',
      subscription_data: { metadata: { plan } },
      currency: 'eur',
    };

    // If email provided, pre-fill it in Stripe checkout and link to customer
    if (customer_email) {
      sessionConfig.customer_email = customer_email;
    }

    if (promo) {
      const VALID_PROMOS = ['PULSO50', 'PULSO50D', 'EARLY30', 'BLACKFX'];
      const upperPromo = promo.toUpperCase();
      if (VALID_PROMOS.includes(upperPromo)) {
        try {
          const promoCodes = await stripeClient.promotionCodes.list({ 
            code: upperPromo, active: true, limit: 1 
          });
          if (promoCodes.data.length > 0) {
            sessionConfig.discounts = [{ promotion_code: promoCodes.data[0].id }];
          }
        } catch(e) {
          sessionConfig.allow_promotion_codes = true;
        }
      }
    } else {
      sessionConfig.allow_promotion_codes = true;
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);
    return res.status(200).json({ url: session.url, sessionId: session.id });
    
  } catch (err) {
    console.error('Checkout error:', err.message);
    return res.status(500).json({ error: 'Internal server error' }); // Generic error (fixes S-05)
  }
};
