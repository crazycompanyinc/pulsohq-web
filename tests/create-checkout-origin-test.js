// tests/create-checkout-origin-test.js
// Tests for origin validation fix — S-02 regression tests

const assert = require('assert');

// Mock the handler by extracting just the origin validation logic
// We test the full handler via simulated requests

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

// Load the actual handler
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

  console.log('Origin Validation Tests (S-02 fix):\n');

  // Test 1: Evil origin should get 403
  await test('POST with evil-attacker.com returns 403', async () => {
    const req = createMockReq('POST', 'https://evil-attacker.com', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
    assert.deepStrictEqual(res._getBody(), { error: 'Forbidden' });
  });

  // Test 2: No origin should get 403 (the bypass!)
  await test('POST with no origin header returns 403', async () => {
    const req = { method: 'POST', headers: {}, body: { plan: 'starter_monthly' } };
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 3: Empty origin string should get 403
  await test('POST with empty origin returns 403', async () => {
    const req = createMockReq('POST', '', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 4: Valid origin should NOT get 403 (should proceed past origin check)
  await test('POST with valid origin passes origin check (may fail later on Stripe)', async () => {
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    // Should NOT be 403 — it will likely fail with 500 (no Stripe key) but that's past the origin check
    assert.notStrictEqual(res._getStatus(), 403, 'Valid origin should not get 403');
  });

  // Test 5: OPTIONS with evil origin should get 403
  await test('OPTIONS with evil origin returns 403', async () => {
    const req = createMockReq('OPTIONS', 'https://evil-attacker.com');
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 6: OPTIONS with no origin should get 403
  await test('OPTIONS with no origin returns 403', async () => {
    const req = { method: 'OPTIONS', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 7: CORS headers only set for valid origin
  await test('CORS headers NOT set for evil origin', async () => {
    const req = createMockReq('POST', 'https://evil-attacker.com', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getHeaders()['Access-Control-Allow-Origin'], undefined,
      'CORS headers should not be set for non-matching origin');
  });

  // Test 8: CORS headers ARE set for valid origin
  await test('CORS headers set for valid origin', async () => {
    const req = createMockReq('POST', 'https://pulsohq-web.vercel.app', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getHeaders()['Access-Control-Allow-Origin'], 'https://pulsohq-web.vercel.app',
      'CORS headers should be set for valid origin');
  });

  // Test 9: Subdomain attack should be blocked
  await test('POST with subdomain spoof (evil.pulsohq-web.vercel.app) returns 403', async () => {
    const req = createMockReq('POST', 'https://evil.pulsohq-web.vercel.app', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getStatus(), 403, `Expected 403, got ${res._getStatus()}`);
  });

  // Test 10: Security headers always set even on 403
  await test('Security headers (X-Frame-Options, X-Content-Type-Options) set on 403 response', async () => {
    const req = createMockReq('POST', 'https://evil-attacker.com', { plan: 'starter_monthly' });
    const res = createMockRes();
    await handler(req, res);
    assert.strictEqual(res._getHeaders()['X-Frame-Options'], 'DENY');
    assert.strictEqual(res._getHeaders()['X-Content-Type-Options'], 'nosniff');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
