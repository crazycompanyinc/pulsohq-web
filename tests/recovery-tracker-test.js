// tests/recovery-tracker-test.js
// Tests for the recovery tracking store

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use a temp directory for tests
const TEST_DIR = '/tmp/recovery-test-' + Date.now();
process.env.RECOVERY_DATA_DIR = TEST_DIR;

const tracker = require('../lib/recovery-tracker');

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

  console.log('Recovery Tracker Tests:\n');

  // Test 1: Add a recovery
  await test('addRecovery creates a new recovery entry', () => {
    const r = tracker.addRecovery('cs_test_123', 'test@example.com', 'starter_monthly', 2900, 'eur');
    assert.strictEqual(r.sessionId, 'cs_test_123');
    assert.strictEqual(r.email, 'test@example.com');
    assert.strictEqual(r.plan, 'starter_monthly');
    assert.strictEqual(r.amount, 2900);
    assert.strictEqual(r.currency, 'eur');
    assert.strictEqual(r.status, 'pending');
    assert.deepStrictEqual(r.emailsSent, []);
    assert.ok(r.createdAt);
  });

  // Test 2: Get recovery
  await test('getRecovery retrieves an existing recovery', () => {
    const r = tracker.getRecovery('cs_test_123');
    assert.ok(r, 'Recovery should exist');
    assert.strictEqual(r.email, 'test@example.com');
  });

  // Test 3: Get non-existent recovery
  await test('getRecovery returns null for non-existent session', () => {
    const r = tracker.getRecovery('cs_nonexistent');
    assert.strictEqual(r, null);
  });

  // Test 4: Mark email sent
  await test('markEmailSent records email sent', () => {
    const r = tracker.markEmailSent('cs_test_123', 1);
    assert.ok(r, 'Recovery should exist');
    assert.strictEqual(r.emailsSent.length, 1);
    assert.strictEqual(r.emailsSent[0].emailNumber, 1);
    assert.ok(r.emailsSent[0].sentAt);
  });

  // Test 5: Mark recovered
  await test('markRecovered updates status', () => {
    const r = tracker.markRecovered('cs_test_123');
    assert.strictEqual(r.status, 'recovered');
    assert.ok(r.recoveredAt);
  });

  // Test 6: Get pending recoveries (should exclude recovered)
  await test('getPendingRecoveries excludes recovered entries', () => {
    tracker.addRecovery('cs_test_456', 'test2@example.com', 'growth_monthly', 7900, 'eur');
    const pending = tracker.getPendingRecoveries();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].sessionId, 'cs_test_456');
  });

  // Test 7: Mark expired
  await test('markExpired updates status', () => {
    const r = tracker.markExpired('cs_test_456');
    assert.strictEqual(r.status, 'expired');
  });

  // Test 8: Remove recovery
  await test('removeRecovery deletes entry', () => {
    tracker.removeRecovery('cs_test_123');
    assert.strictEqual(tracker.getRecovery('cs_test_123'), null);
  });

  // Test 9: Duplicate add overwrites
  await test('addRecovery overwrites existing entry', () => {
    tracker.addRecovery('cs_dup', 'a@example.com', 'starter_monthly', 2900, 'eur');
    tracker.addRecovery('cs_dup', 'b@example.com', 'growth_monthly', 7900, 'eur');
    const r = tracker.getRecovery('cs_dup');
    assert.strictEqual(r.email, 'b@example.com');
    assert.strictEqual(r.plan, 'growth_monthly');
    tracker.removeRecovery('cs_dup');
  });

  // Test 10: Load/save roundtrip
  await test('data persists via save/load roundtrip', () => {
    tracker.addRecovery('cs_roundtrip', 'round@example.com', 'starter_yearly', 29000, 'eur');
    const data = tracker.loadRecoveries();
    assert.ok(data.cs_roundtrip);
    assert.strictEqual(data.cs_roundtrip.email, 'round@example.com');
    tracker.removeRecovery('cs_roundtrip');
  });

  // Cleanup
  try { fs.rmSync(TEST_DIR, { recursive: true }); } catch (e) {}

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
