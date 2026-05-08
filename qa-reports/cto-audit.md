# PulsoHQ — CTO Audit Report

**Date:** 2026-05-08
**Scope:** index.html, css/style.css, js/main.js, api/contact.js, api/create-checkout.js
**Severity scale:** CRITICAL / HIGH / MEDIUM / LOW

---

## 1. Code Quality Issues

### Q-01: Inline scripts in index.html bloat the HTML and prevent CSP nonces
**Severity:** MEDIUM
**File:** `index.html` lines 58-85 (goToCheckout), 103-118 (closePromo)
Two `<script>` blocks are embedded directly in the HTML. This blocks effective Content-Security-Policy (no `unsafe-inline`), prevents browser caching of the logic separately, and mixes concerns. Move both functions into `js/main.js` and attach event listeners programmatically.

### Q-02: Duplicate inline event handlers (onclick)
**Severity:** MEDIUM
**File:** `index.html` lines 100, 456, 470
`onclick="closePromo()"`, `onclick="goToCheckout('starter')"`, `onclick="goToCheckout('growth')"` mix markup with behavior. Replace with `addEventListener` in main.js and use `data-plan` attributes on the buttons.

### Q-03: Massive SVG duplication in nav and footer
**Severity:** LOW
**File:** `index.html` lines 146-172 (nav logo) and 537-556 (footer logo)
The same ~25-line SVG logo is duplicated with different gradient IDs (`navLogoGrad` vs `footerLogoGrad`). Extract into a single `<symbol>` in an SVG sprite and reference with `<use>`. Saves ~40 lines and ensures consistency.

### Q-04: CSS file is 738 lines with no modularization
**Severity:** LOW
**File:** `css/style.css`
Single monolithic stylesheet. Split into modules (base.css, components.css, sections.css, utilities.css) and use a build step or CSS `@import` for production. Improves maintainability as the site grows.

### Q-05: Loader uses setInterval with no cleanup on page unload
**Severity:** LOW
**File:** `js/main.js` lines 44-55
The `setInterval` at line 44 continues running even if the user navigates away or the loader is hidden early. Store the interval ID and clear it in a `beforeunload` handler or when the interval completes.

### Q-06: Particle canvas resize listener has no debounce
**Severity:** LOW
**File:** `js/main.js` line 116
`window.addEventListener('resize', rc)` fires on every pixel of resize, causing layout thrashing. Debounce with `requestAnimationFrame` or a 150ms throttle.

---

## 2. Security Vulnerabilities

### S-01: CORS allows all origins on API endpoints
**Severity:** CRITICAL
**File:** `api/contact.js` line 61, `api/create-checkout.js` line 25
`Access-Control-Allow-Origin: *` allows any website to call your APIs. An attacker page could mass-submit contact forms or probe the checkout endpoint. Restrict to your origin:
```
res.setHeader('Access-Control-Allow-Origin', 'https://pulsohq-web.vercel.app');
```

### S-02: No CSRF protection on contact or checkout endpoints
**Severity:** HIGH
**File:** `api/contact.js`, `api/create-checkout.js`
Neither endpoint validates a CSRF token or checks the `Origin`/`Referer` header. Combined with the wildcard CORS, any site can forge requests. Add origin validation in the preflight handler and/or implement a CSRF token pattern.

### S-03: Rate limiting is in-memory and resets on every deploy
**Severity:** HIGH
**File:** `api/contact.js` lines 10-30
The `rateLimit` Map is process-local. On Vercel serverless, each invocation may be a fresh process, making rate limiting ineffective. Use Redis, Vercel KV, or an edge middleware with a shared store.

### S-04: Client-side rate limiting is trivially bypassable
**Severity:** MEDIUM
**File:** `js/main.js` lines 261-268
The 30-second client-side rate limit uses `sessionStorage`, which any bot or curl request ignores entirely. This is fine as UX sugar but must not be relied upon for security (see S-03).

### S-05: Error messages leak internal details
**Severity:** MEDIUM
**File:** `api/contact.js` line 130, `api/create-checkout.js` line 77
`res.status(500).json({ error: err.message })` exposes raw error messages (SMTP failures, Stripe errors) to the client. Log server-side and return generic messages: `"Internal server error"`.

### S-06: Email credentials read from file with fallback to env var
**Severity:** MEDIUM
**File:** `api/contact.js` lines 46-57
`getPassword()` reads from `~/.hermes/.env` with a manual parser that doesn't handle comments, multi-line values, or `export` prefixes. Use `process.env.EMAIL_PASSWORD` exclusively (Vercel env vars) and remove the file-reading fallback.

### S-07: No Content-Security-Policy header
**Severity:** MEDIUM
**File:** `index.html` (missing), `api/contact.js`, `api/create-checkout.js`
There is no CSP meta tag or header. With inline scripts and styles, you need at minimum:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://buy.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://buy.stripe.com
```
Ideally eliminate `unsafe-inline` by externalizing the inline scripts (see Q-01, Q-02).

### S-08: Honeypot field name "website" is easily fingerprinted
**Severity:** LOW
**File:** `index.html` line 519
The honeypot field `name="website"` is a common pattern that sophisticated bots know to skip. Use a less obvious name like `name="company_url"` or `name="form_comment"`.

### S-09: Stripe price IDs are hardcoded and exposed in client bundle
**Severity:** LOW
**File:** `api/create-checkout.js` lines 17-22
Price IDs are server-side only (good), but the `validPlans` array is returned in the error response at line 37, leaking internal plan identifiers. Return a generic "Invalid plan" message instead.

---

## 3. Performance Optimization Opportunities

### P-01: Hero background image is loaded but may not be visible
**Severity:** HIGH
**File:** `css/style.css` line 266 — `background-image: url('/assets/img/hero-bg.jpg')`
A full-size background image with `cover` sizing is loaded unconditionally. Use `<picture>` with WebP/AVIF, add `loading="lazy"` (via an `<img>` element with `object-fit: cover`), or use `fetchpriority="high"` if it's LCP-critical. Also verify the file exists and is optimized.

### P-02: No image preloading or resource hints for critical assets
**Severity:** MEDIUM
**File:** `index.html`
Only `css/style.css` and the Google Fonts CSS are preloaded (lines 21-22). Add:
- `<link rel="preload" href="/assets/img/hero-bg.jpg" as="image">` if the hero image is critical
- `<link rel="dns-prefetch" href="https://pulsohq-web.vercel.app">` for API calls

### P-03: Particle animation runs continuously even when off-screen
**Severity:** MEDIUM
**File:** `js/main.js` lines 119-135
The `requestAnimationFrame` loop for particles runs forever, consuming GPU/CPU even when the hero section is scrolled out of view. Pause the loop when the canvas is not visible using `IntersectionObserver`.

### P-04: Cursor animation loop runs unconditionally on desktop
**Severity:** LOW
**File:** `js/main.js` lines 77-83
The cursor `requestAnimationFrame` loop runs even when the mouse hasn't moved. Add an idle detection (e.g., stop after 3 seconds of no mousemove) to save CPU.

### P-05: No lazy loading for below-the-fold sections
**Severity:** LOW
**File:** `index.html`
All content is rendered in a single HTML payload (~40KB). Consider lazy-loading non-critical sections or splitting the CSS to avoid render-blocking the full stylesheet for content the user hasn't scrolled to yet.

### P-06: Google Fonts loaded via render-blocking chain
**Severity:** LOW
**File:** `index.html` lines 22-23
The font CSS uses `onload="this.onload=null;this.rel='stylesheet'"` which is good, but the `preconnect` to `fonts.gstatic.com` (line 19) is the only optimization. Consider self-hosting Inter and JetBrains Mono to eliminate the third-party render-blocking dependency entirely.

---

## 4. Architecture Improvements

### A-01: No build step or asset pipeline
**Severity:** HIGH
**Impact:** All files
The project ships raw HTML/CSS/JS with no bundler, minifier, or asset optimizer. Set up a minimal build pipeline (Vite, esbuild, or even a Makefile) to:
- Minify CSS and JS
- Optimize SVGs (svgo)
- Generate image variants (WebP/AVIF)
- Hash filenames for cache busting

### A-02: No environment configuration management
**Severity:** HIGH
**File:** `api/contact.js` lines 46-57, `api/create-checkout.js` lines 10-11
Secrets are read from a mix of env vars and a hand-parsed `.env` file. Standardize on Vercel environment variables and add a `.env.example` documenting required vars: `STRIPE_SECRET_KEY`, `EMAIL_PASSWORD`.

### A-03: No error tracking or logging infrastructure
**Severity:** MEDIUM
**File:** `api/contact.js` line 129, `api/create-checkout.js` line 76
All errors are `console.error`'d. In serverless, these logs are ephemeral. Integrate a logging service (Sentry, Logtail, or Vercel's built-in logging) with request context.

### A-04: No API input validation library
**Severity:** MEDIUM
**File:** `api/contact.js`, `api/create-checkout.js`
Validation is done manually with regex and length checks. Use a schema validator (Zod, Joi, or Yup) for all API inputs. This reduces boilerplate, provides better error messages, and makes the contract explicit.

### A-05: No tests whatsoever
**Severity:** MEDIUM
**Impact:** All files
Zero test coverage for frontend logic or API handlers. Add:
- Unit tests for `sanitize`, `checkRateLimit`, `isValidEmail` (contact.js)
- Integration tests for the checkout flow (mock Stripe)
- A simple E2E smoke test (Playwright or Cypress) for the contact form

### A-06: No TypeScript
**Severity:** LOW
**Impact:** All JS files
Plain JavaScript with no type safety. Migrating to TypeScript (or at minimum JSDoc with `// @ts-check`) would catch bugs like the `var` scoping issues and incorrect DOM API usage at compile time.

### A-07: No PWA or offline support
**Severity:** LOW
**File:** `index.html`
No service worker, no manifest. For a marketing site, at minimum add a manifest and a simple service worker that caches static assets for repeat visitors.

---

## Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 1 | S-01 — Wildcard CORS |
| HIGH | 5 | S-02 CSRF, S-03 rate limit, P-01 hero image, A-01 no build, A-02 env mgmt |
| MEDIUM | 7 | S-04/S-05/S-06/S-07, Q-01/Q-02, A-03/A-04/A-05 |
| LOW | 8 | Q-03-Q-06, S-08/S-09, P-03-P-06, A-06/A-07 |

**Top 3 priorities:**
1. Fix CORS wildcard and add CSRF/origin validation (S-01, S-02)
2. Move inline scripts to external JS to enable proper CSP (Q-01, Q-02, S-07)
3. Set up a build pipeline with minification and image optimization (A-01, P-01)
