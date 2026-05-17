// tests/create-checkout-email-test.js
// Tests for customer_email capture in checkout — email recovery fix

const assert = require('assert');

function createMockReq(method, origin, body) {
  return {
    method,
    headers: { origin: origin },
    body: body || {},
  };
}

function createMockRes() {
  const headers = {};
  let statusCode = null;
  let body = null;
  let ended = false;

  return {
    setHeader(key, value) { headers[key] = value; },
    status(code) { statusCode = code; return this; },
    json(obj) { body = obj; return this; },
    end() { ended = true; return this; },
    _getHeaders() { return headers; },
    _getStatus() { return statusCode; },
    _getBody() { return body; },
    _isEnded() { return ended; },
  };
}

// We need to test the handler logic without actually calling Stripe.
// We'll mock the stripe module before loading the handler.
const mockSessions = [];
let mockStripeInstance = {
  checkout: {
    sessions: {
      create(config) {
        mockSessions.push(config);
        return Promise.resolve({ url: 'https://checkout.stripe.com/test', id: 'cs_test_123' });
      },
    },
  },
  promotionCodes: {
    list() { return Promise.resolve({ data: [] }); },
  },
};

// Mock require('stripe') to return our mock
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  if (request === 'stripe') {
    // Return a dummy module id that we'll handle via require cache
    return 'stripe-mock';
  }
  return originalResolveFilename.call(this, request, parent, ...args);
};
require.cache['stripe-mock'] = {
  id: 'stripe-mock',
  filename: 'stripe-mock',
  loaded: true,
  exports: function() { return mockStripeInstance; },
};

// Set dummy Stripe key so handler doesn't throw
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

// Clear require cache for the handler to get fresh copy
delete require.cache[require.resolve('/root/.hermes/workspace/pulsohq-web/api/create-checkout.js')];
const handler = require('/root/.hermes/workspace/pulsohq-web/api/create-checkout.js');

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`  FAIL: ${name}`);
      console.log(`        ${e.message}`);
      failed++;
    }
  }

  console.log('Customer Email Capture Tests:\n');

  // Test 1: customer_email is accepted and passed to Stripe session config
  await test('customer_email passed to Stripe session config', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
      customer_email: 'test@example.com',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 200, `Expected 200, got ${res._getStatus()}`);
    assert.strictEqual(mockSessions.length, 1, 'Expected one session created');
    assert.strictEqual(mockSessions[0].customer_email, 'test@example.com',
      `Expected customer_email in session config, got: ${JSON.stringify(mockSessions[0])}`);
  });

  // Test 2: customer_creation is set to 'always'
  await test('customer_creation is "always" in session config', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(mockSessions[0].customer_creation, 'always',
      `Expected customer_creation: "always", got: ${mockSessions[0].customer_creation}`);
  });

  // Test 3: No email provided — should still work (email is optional)
  await test('checkout works without customer_email (optional)', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 200, `Expected 200, got ${res._getStatus()}`);
    assert.strictEqual(mockSessions[0].customer_email, undefined,
      'customer_email should not be set when not provided');
  });

  // Test 4: Invalid email returns 400
  await test('invalid email returns 400', async () => {
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
      customer_email: 'not-an-email',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 400, `Expected 400, got ${res._getStatus()}`);
    assert.deepStrictEqual(res._getBody(), { error: 'Invalid email' });
  });

  // Test 5: Empty string email is treated as no email (not invalid)
  await test('empty string email is treated as no email', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
      customer_email: '',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 200, `Expected 200, got ${res._getStatus()}`);
  });

  // Test 6: Email with valid format passes validation
  await test('valid email format passes validation', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'growth_monthly',
      customer_email: 'user+tag@domain.co.uk',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 200, `Expected 200, got ${res._getStatus()}`);
    assert.strictEqual(mockSessions[0].customer_email, 'user+tag@domain.co.uk');
  });

  // Test 7: Email + promo code together work
  await test('customer_email works alongside promo code', async () => {
    mockSessions.length = 0;
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
      promo: 'PULSO50',
      customer_email: 'promo@example.com',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 200, `Expected 200, got ${res._getStatus()}`);
    assert.strictEqual(mockSessions[0].customer_email, 'promo@example.com');
  });

  // Test 8: Evil origin still blocked even with email
  await test('evil origin blocked even with valid email', async () => {
    const req = createMockReq('POST', 'https://evil.com', {
      plan: 'starter_monthly',
      customer_email: 'test@example.com',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 9: Response includes sessionId
  await test('response includes sessionId', async () => {
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', {
      plan: 'starter_monthly',
      customer_email: 'test@example.com',
    });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getBody().sessionId, 'cs_test_123');
    assert.strictEqual(res._getBody().url, 'https://checkout.stripe.com/test');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
