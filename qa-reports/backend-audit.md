# PulsoHQ Backend Audit Report

**Date:** 2026-05-08
**Scope:** api/contact.js, api/create-checkout.js, vercel.json
**Severity scale:** [CRITICAL] [HIGH] [MEDIUM] [LOW]

---

## 1) API Design Improvements

**No shared error envelope.**
Both endpoints return ad-hoc JSON: `{ ok: true, ... }`, `{ error: "..." }`, `{ url: ..., sessionId: ... }`. There is no consistent envelope (e.g. `{ success, data, error, statusCode }`). This makes client-side parsing fragile and Stripe responses leak internal IDs to the caller.

**No request-body validation library.**
Validation is done manually with `if` checks. A schema validator (zod, joi, or JSON Schema) would catch edge cases, give structured error messages, and keep handlers thin. Currently, `contact.js` allows `empresa` through with zero validation — it could be a 5000-character string.

**Hardcoded pricing table in source.**
`create-checkout.js` stores Stripe Price IDs inline. If a price is deprecated, the deploy is the only fix. Move to a database or at minimum a remote config / environment mapping so prices can be updated without a redeploy.

**Mixed language in responses.**
Error messages bounce between Spanish ("Plan no válido", "Email no válido") and English ("Method not allowed", internal errors). Pick one locale or negotiate via `Accept-Language`.

**No API versioning.**
Routes are `/api/contact`, `/api/create-checkout` with no `/v1/` prefix. Any future breaking change will force a flag-day cutover.

---

## 2) Error Handling Gaps

**[HIGH] Stripe errors leak to client.**
`create-checkout.js:77` returns `error: err.message` verbatim. Stripe error messages can contain internal details (IDs, JSON snippets). Log the full error server-side; return a generic message to the client.

**No structured error codes.**
Errors are plain strings. The client cannot programmatically distinguish "invalid plan" from "Stripe is down" from "rate limited". Add machine-readable codes (`INVALID_PLAN`, `RATE_LIMITED`, `PAYMENT_PROVIDER_ERROR`).

**No error differentiation in contact.js.**
SMTP failures, JSON parse failures, and missing env all return `"Error al enviar el email: ..."`. The 500 response at line 104 (`"Email no configurado"`) returns status 500 but is really a 503/misconfiguration issue.

**No request body parsing guard.**
Both handlers assume `req.body` is already an object. Vercel Functions need `bodyParser: false` config or explicit middleware. If the client sends malformed JSON, the function may throw an unhandled 500.

**No timeout on SMTP.**
`contact.js:107-115` creates a transporter with no `connectionTimeout` or `greetingTimeout`. A hanging SMTP connection will block the Lambda until Vercel kills it (10s max, but that's a bad UX). Set explicit timeouts (5s connect, 5s send).

---

## 3) Security Hardening

**[CRITICAL] Secret read from filesystem is fragile & insecure.**
`contact.js:46-57` reads `EMAIL_PASSWORD` from `~/.hermes/.env` using `path.join(process.env.HOME || '/root', ...)`. This:
- Hardcodes `/root` as a fallback — reveals server path in source.
- Will fail silently (the `catch` swallows the error).
- Should use `process.env.EMAIL_PASSWORD` exclusively; Vercel environment variables are the correct mechanism.

**[CRITICAL] CORS allows all origins.**
Both endpoints set `Access-Control-Allow-Origin: *`. The checkout endpoint is a payment flow — it must be locked to `https://pulsohq-web.vercel.app`. Wildcard CORS lets any malicious site initiate Stripe sessions.

**[HIGH] XSS in contact.js email HTML.**
Line 124 interpolates `${name}` and `${message}.replace(/\n/g, '<br>')` into an HTML email body. Even though `sanitize()` strips `<>` and `javascript:`, the regex-based approach is incomplete. An attacker can craft payloads via attribute injection or unicode bypass. Use a proper HTML-escape function (e.g. `he` or manual `& < > " '` encoding) before injecting into the email template.

**[HIGH] Rate limiting is reset on every deploy.**
The `Map()` in `contact.js:10` lives in-process. Vercel serverless functions are stateless — each invocation may get a fresh process. The rate limiter provides near-zero protection in production. Use Redis, Vercel KV, or a middleware like `express-rate-limit` backed by an external store.

**[MEDIUM] No CSRF / origin validation on POST.**
Neither endpoint validates `Origin` or `Referer`. The contact form should check that the request originates from the PulsoHQ domain.

**[MEDIUM] Email regex is too permissive.**
`isValidEmail()` accepts `a@b.c` — technically valid but a common spam pattern. Consider a library like `validator.isEmail()` or add length/domain checks.

**[LOW] Client IP logged in email body.**
Line 123 includes `IP: ${clientIP}` in the plaintext email. This leaks internal infra info to the recipient if the email is forwarded. It's useful for abuse investigation but should be metadata-only, not in the body.

---

## 4) Performance Optimizations

**Transporter created on every request.**
`contact.js:107` creates a new `nodemailer` transporter per invocation. In a serverless context this is unavoidable without a persistent worker, but you can at minimum lazily initialize and cache it across warm invocations (module-level singleton).

**Stripe client singleton is good but incomplete.**
`create-checkout.js:6-14` correctly caches the Stripe instance. However, if `STRIPE_SECRET_KEY` changes (key rotation), the cached instance persists with the old key. Consider a TTL or env-check on each call.

**No response caching headers.**
Static assets served by the SPA catch-all (`vercel.json:7`) have no `Cache-Control` headers. Add long-term caching with hashed filenames and short-term `no-cache` for `index.html`.

**create-checkout has no maxDuration config.**
`vercel.json:9-13` only configures `contact.js` with `maxDuration: 10`. `create-checkout.js` has no function config, so it defaults to Vercel's plan limit. Explicitly set it (5-10s is enough for Stripe API + redirect).

**Promo code lookup adds latency.**
Lines 58-63 call `stripe.promotionCodes.list()` synchronously before creating the session. If promo validation fails, the fallback (`allow_promotion_codes: true`) is correct, but you can skip the lookup entirely if you trust Stripe's built-in code handling and always use `allow_promotion_codes: true`.

---

## 5) Missing Features

**No logging framework.**
Both files use `console.error()`. There is no structured logging (no request IDs, no correlation IDs, no severity levels). Vercel functions need structured JSON logs to be searchable. Add `pino`, `winston`, or a lightweight JSON logger.

**No observability / monitoring.**
- No health check endpoint (`/api/health`).
- No metrics (request count, error rate, latency percentiles).
- No alerting on Stripe or SMTP failures.
- Consider Vercel Analytics, Sentry, or a simple uptime ping.

**No Stripe webhook handler.**
There is no endpoint for `checkout.session.completed`, `invoice.paid`, or `customer.subscription.deleted`. Without webhooks, you cannot:
- Provision accounts after payment.
- Handle failed renewals.
- Send confirmation emails.

This is the single most critical missing piece for a paid product.**

**No request ID / correlation ID.**
Every request should get a UUID that flows through logs, error responses, and third-party calls. Currently, debugging a specific failed checkout requires grep and luck.

**No input length limits on plan/promo.**
`create-checkout.js:34` destructures `plan` and `promo` from `req.body` with no length cap. A 10MB `plan` string would be passed through before the `PRICES[plan]` lookup fails. Add early validation.

**No idempotency on checkout.**
If the client retries a failed `/api/create-checkout` call, a new Stripe session is created each time. Use Stripe's `idempotency_key` header to prevent duplicate sessions.

**No graceful shutdown / connection cleanup.**
Neither function cleans up resources. Under normal Vercel execution this is fine, but adding a `handler.finally()` pattern for transporter close and Stripe client cleanup is good hygiene.

---

## Quick-Win Checklist

| Priority | Fix | File |
|----------|-----|------|
| P0 | Lock CORS to pulsohq domain | both |
| P0 | Remove filesystem secret read, use Vercel env only | contact.js |
| P0 | Add Stripe webhook handler | new file |
| P1 | Add structured logging + request IDs | both |
| P1 | Use proper HTML-escape for email template | contact.js |
| P1 | Leak-safe error messages from Stripe | create-checkout.js |
| P2 | Externalize rate limiter to Redis/KV | contact.js |
| P2 | Add `/api/health` endpoint | new file |
| P2 | Add Origin/Referer validation | both |
| P3 | Add `maxDuration` to create-checkout config | vercel.json |
| P3 | Add API versioning prefix | vercel.json |

---

*Report generated by OWL — Backend Engineer audit of PulsoHQ serverless functions.*
