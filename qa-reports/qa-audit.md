# PulsoHQ QA Audit Report

**Date:** 2026-05-08
**Auditor:** QA Lead — PulsoHQ
**Scope:** index.html, css/style.css, js/main.js
**Severity scale:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)

---

## 1. Cross-Browser Compatibility Issues

### BUG-01 — `-webkit-text-fill-color` gradient text fails in Firefox
**Severity:** P1
**File:** css/style.css:216,292,370
**Detail:** `.gradient-text`, `.nav-logo span`, and `.hero-title .gradient` use `-webkit-background-clip: text` + `-webkit-text-fill-color: transparent`. Firefox supports `background-clip: text` but the `-webkit-text-fill-color: transparent` override can cause invisible text in older Firefox versions that don't fully support the combo.
**Reproduction:**
1. Open page in Firefox < 110 (or any version where `background-clip: text` has partial support).
2. Observe hero title "agentes de IA" and all gradient-text headings — text may appear invisible or fallback to solid color inconsistently.

### BUG-02 — `100dvh` not supported in older Safari
**Severity:** P1
**File:** css/style.css:257
**Detail:** `.hero { min-height: 100dvh }` uses dynamic viewport height. Safari < 15.4 and all iOS Safari versions before 15.4 treat `dvh` as an unknown unit, falling back to `100vh` or ignoring the rule entirely, causing mobile hero to be too tall or too short.
**Reproduction:**
1. Open page on iOS Safari 15.3 or earlier.
2. Hero section height is incorrect — either extends beyond viewport or doesn't fill it.

### BUG-03 — `backdrop-filter` missing standard property in older Safari
**Severity:** P2
**File:** css/style.css:208-209,243-244,424-425
**Detail:** `.nav.scrolled`, `.nav-links`, and `.agente-card` use `-webkit-backdrop-filter` but the standard `backdrop-filter` property is declared on the *same rule* (line 208-209). However, on `.agente-card` (line 424-425) only `-webkit-backdrop-filter` is set — the unprefixed version is missing, so Firefox (which supports the standard property) gets no blur.
**Reproduction:**
1. Open page in Firefox.
2. Scroll down to agent cards — no blur effect behind cards, raw transparency.

### BUG-04 — `::before` pseudo-element on `<input>` toggle fails in some browsers
**Severity:** P2
**File:** css/style.css:537-541
**Detail:** `.toggle-slider::before` creates the toggle knob. The parent `.toggle input { display: none }` hides the native checkbox. While functional, `<input>` inside `<label>` with `display:none` can have inconsistent behavior in older Edge/Safari where the label click doesn't propagate.
**Reproduction:**
1. Open in Edge Legacy (pre-Chromium) or older Safari.
2. Clicking the toggle label may not trigger the checkbox change.

### BUG-05 — `scroll-behavior: smooth` has no fallback
**Severity:** P3
**File:** css/style.css:52
**Detail:** `html { scroll-behavior: smooth }` is set globally. In browsers that don't support it (IE, older Safari), the JS smooth-scroll in main.js:308-313 calls `behavior: 'smooth'` which also silently fails. No feature detection is done.
**Reproduction:**
1. Open in a browser without smooth scroll support.
2. Click any anchor link — jumps instantly with no animation (minor UX issue).

---

## 2. Responsive Design Problems

### BUG-06 — Mobile nav overlay has no focus trap
**Severity:** P1
**File:** js/main.js:100-108, css/style.css:239-251
**Detail:** When the mobile hamburger menu opens (`nav-links.open`), focus is not trapped inside the panel. A keyboard user can Tab out of the menu into the page content behind the overlay. There is no semi-transparent backdrop to indicate the rest of the page is inaccessible.
**Reproduction:**
1. On viewport ≤ 768px, tap the hamburger button.
2. Press Tab repeatedly — focus moves to links behind the open menu, not just within it.
3. Screen reader users cannot distinguish open/closed state beyond `aria-expanded`.

### BUG-07 — `precio-card.featured` scale causes layout overflow on small screens
**Severity:** P1
**File:** css/style.css:565-568
**Detail:** `.precio-card.featured { transform: scale(1.03) }` applies a 3% scale-up. On mobile (≤ 480px) where cards are already near full-width, this causes the featured card to overflow its container or clip against the viewport edge, especially with the `box-shadow` at line 566.
**Reproduction:**
1. Open on a 375px-wide device (iPhone standard).
2. Scroll to pricing section — the "Growth" card overflows horizontally or causes a horizontal scrollbar.

### BUG-08 — Hero stats wrap without proper spacing on mid-size screens
**Severity:** P2
**File:** css/style.css:300-306
**Detail:** `.hero-stats` uses `display: flex; gap: 40px; flex-wrap: wrap` with no `justify-content: center` on the flex container at breakpoints between 480px and 768px. The 4 stats (2847, 156, 42, 98%) wrap unevenly — 3 on first row, 1 on second — with no centering on the second row.
**Reproduction:**
1. Resize browser to ~600px width.
2. Observe hero stats — last stat ("98%") is left-aligned, not centered.

### BUG-09 — Footer grid breaks awkwardly at 480-768px
**Severity:** P2
**File:** css/style.css:693-698
**Detail:** `.footer-grid` goes from 4 columns to 2 columns at 768px, then to 1 column at 480px. In the 481-767px range, the 2-column grid places the brand description in one column and a single link list in the other, creating a very unbalanced layout.
**Reproduction:**
1. Resize browser to 600px.
2. Footer shows brand text in left column, one link list in right column — large empty space.

### BUG-10 — Contact form grid doesn't account for promo bar offset
**Severity:** P2
**File:** css/style.css:637-641
**Detail:** `.contacto-inner` uses `grid-template-columns: 1fr 1fr` with a single breakpoint at 768px. The promo bar (~42px) pushes content down but the scroll offset calculation in JS (main.js:311) uses a fixed 80px offset that doesn't account for the promo bar height, causing the contact section heading to be hidden behind the nav on mobile.
**Reproduction:**
1. On mobile with promo bar visible, click "Empezar gratis" nav link.
2. Scrolls to #contacto but the section title is partially hidden behind the fixed nav + promo bar.

---

## 3. Form Validation Gaps

### BUG-11 — No `maxlength` or field-length validation
**Severity:** P1
**File:** index.html:520-523
**Detail:** The contact form inputs (`name`, `email`, `empresa`, `mensaje`) have no `maxlength` attribute. The JS sanitization (main.js:240-244) escapes HTML but doesn't enforce length limits. A user could submit a 10,000-character string in any field.
**Reproduction:**
1. Open contact form.
2. Paste 5000 characters into the "Nombre" field.
3. Submit — no client-side rejection, data is sent to `/api/contact`.

### BUG-12 — Email regex rejects valid international emails
**Severity:** P1
**File:** js/main.js:252
**Detail:** The regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` rejects valid emails with:
- Plus addressing: `user+tag@domain.com` (the `+` is allowed by `[^\s@]` but the regex is overly simplistic)
- New TLDs with unicode: `user@domain.technology` works, but `user@sub.domain.co.uk` may fail depending on interpretation
- IP address domains: `user@[192.168.1.1]`
**Reproduction:**
1. Enter `nombre+empresa@midominio.com` in the email field.
2. Submit — validation may pass but the regex is fragile and could reject edge-case valid emails in different JS engines.

### BUG-13 — No validation for empty/whitespace-only fields
**Severity:** P2
**File:** js/main.js:246-249
**Detail:** The form uses `required` attributes but the JS handler (line 228-304) calls `.trim()` on values but doesn't check if the trimmed result is empty before sending. If a user enters only spaces in the name field, `nameVal` becomes `""` and the fetch proceeds with empty data.
**Reproduction:**
1. Enter three spaces in "Nombre", a valid email, and a message.
2. Submit — the request is sent with an empty name to `/api/contact`.

### BUG-14 — Honeypot field is accessible to screen readers
**Severity:** P2
**File:** index.html:519
**Detail:** The honeypot `<div>` has `aria-hidden="true"` but the inner `<input>` has `tabindex="-1"` — it's not fully hidden from assistive technology. Some screen readers may still announce the "website" input field.
**Reproduction:**
1. Navigate the page with a screen reader (NVDA/VoiceOver).
2. The hidden "website" input may still be announced in form context.

### BUG-15 — `novalidate` attribute disables all native validation
**Severity:** P2
**File:** index.html:517
**Detail:** The form has `novalidate`, which disables the browser's built-in `type="email"` validation. This means the custom JS regex is the only email validation — if JS fails to load or throws, there is no fallback validation at all.
**Reproduction:**
1. Block JS execution (disable in DevTools).
2. Enter an invalid email like "not-an-email" and submit.
3. Form submits with no validation whatsoever.

---

## 4. Animation / Transition Issues

### BUG-16 — Loader interval never cleared on page error
**Severity:** P0
**File:** js/main.js:44-55
**Detail:** The loader uses `setInterval` at 100ms. If the page encounters a JS error before the loader completes, the interval keeps running indefinitely. The `clearInterval(li)` only fires when `progress >= 100`. The loader overlay (z-index: 100000) would block the entire page.
**Reproduction:**
1. Open page.
2. Before loader finishes, trigger a JS error in console: `throw new Error('test')`.
3. The loader bar freezes mid-animation and the page remains blocked — the `hidden` class is never applied.

### BUG-17 — Particle canvas resize doesn't debounce
**Severity:** P1
**File:** js/main.js:115-116
**Detail:** `window.addEventListener('resize', rc)` calls `rc()` which sets `canvas.width` and `canvas.height` to `window.innerWidth/innerHeight`. On every resize event (fired dozens of times during a drag resize), the canvas is reset, clearing all particles and recalculating. This causes jank and memory churn.
**Reproduction:**
1. Open page.
2. Resize the browser window by dragging.
3. Observe stuttering/lag in the hero particle animation.

### BUG-18 — Stagger animation sets inline styles that override CSS
**Severity:** P1
**File:** js/main.js:158-183
**Detail:** The stagger observer sets `style.opacity = '0'` and `style.transform = 'translateY(24px)'` as inline styles on children. These inline styles have higher specificity than CSS classes. If the IntersectionObserver doesn't fire (e.g., in a browser without support, though there is a fallback at line 153-155), elements remain permanently invisible because the inline `opacity: 0` is never removed.
**Reproduction:**
1. The fallback at line 153-155 adds `reveal-visible` to `[data-reveal]` but does NOT handle `[data-stagger]` children.
2. In a browser without IntersectionObserver, stagger children stay at `opacity: 0` inline — invisible content.

### BUG-19 — Cursor animation runs even when not visible
**Severity:** P2
**File:** js/main.js:77-83
**Detail:** The `requestAnimationFrame` loop for the custom cursor runs continuously even on touch devices where `display: none` hides the cursor elements. The matchMedia check at line 70 only runs once on load — if the window is resized below 768px, the rAF loop continues consuming CPU.
**Reproduction:**
1. Load page on desktop (cursor active).
2. Resize browser to mobile width.
3. The rAF loop continues running (check Performance tab) despite cursor being hidden.

### BUG-20 — Parallax hero transform causes layout shift
**Severity:** P2
**File:** js/main.js:321-330
**Detail:** The parallax effect applies `translateY` and `opacity` to `.hero-inner` on every scroll event. This causes the hero content to shift, which can trigger Cumulative Layout Shift (CLS) in Core Web Vitals. No `will-change` or `contain` property is set.
**Reproduction:**
1. Open page.
2. Scroll down slowly — observe the hero content jumping slightly as the transform is applied per scroll event (no throttle/debounce).

---

## 5. Error Handling Gaps

### BUG-21 — Checkout fetch has no timeout
**Severity:** P0
**File:** index.html:69-83
**Detail:** `goToCheckout()` calls `fetch('/api/create-checkout')` with no `AbortController` timeout. If the server hangs, the button stays in "Cargando..." state indefinitely with no recovery mechanism. The user cannot retry without refreshing.
**Reproduction:**
1. Click "Empezar ahora" on any plan.
2. Simulate a hanging server (DevTools Network → Throttle to "Slow 3G" or block the request).
3. Button remains "Cargando..." forever — no timeout, no error message, no retry.

### BUG-22 — `goToCheckout` button text hardcodes recovery
**Severity:** P1
**File:** index.html:82
**Detail:** On error, the button text is restored to `"Empezar ahora"` (line 82). But the original button HTML may differ — e.g., the Growth plan button has different styling/structure. The hardcoded restore doesn't match the original innerHTML.
**Reproduction:**
1. Click "Empezar ahora" on the Growth plan (which has `btn-primary` class).
2. Trigger a checkout error.
3. Button text is restored but may lose its original SVG icon or structure.

### BUG-23 — `sessionStorage` access not wrapped in try-catch everywhere
**Severity:** P1
**File:** js/main.js:261-262, 287
**Detail:** The promo bar close handler wraps `sessionStorage` in try-catch (line 108), but the rate-limiting logic at line 261-262 and line 287 does not. In Safari private browsing, `sessionStorage` access throws `QuotaExceededError`, which would crash the form submission handler.
**Reproduction:**
1. Open page in Safari Private Browsing mode.
2. Fill and submit the contact form.
3. JS throws uncaught error on `sessionStorage.getItem('lastContactSubmit')` — form submission fails silently.

### BUG-24 — `URLSearchParams` success toast has no error handling
**Severity:** P2
**File:** js/main.js:333-335
**Detail:** The URL param check at line 333-335 calls `showToast()` and then `window.history.replaceState()`. If `window.history` is unavailable (e.g., in certain iframe contexts), the replaceState call throws and the toast is never shown.
**Reproduction:**
1. Open page with `?success=1` in an iframe that restricts history API.
2. Page throws on `replaceState` — no toast displayed.

### BUG-25 — Counter animation doesn't handle `data-count="0"` or missing attribute
**Severity:** P2
**File:** js/main.js:186-198
**Detail:** The counter animation reads `data-count` and passes it to `parseInt`. If `data-count` is missing or `"0"`, `parseInt` returns `0` or `NaN`. The easing function `1 - Math.pow(2, -10 * p)` multiplied by `NaN` produces `NaN`, and `Math.floor(NaN)` is `NaN`, so the element displays "NaN".
**Reproduction:**
1. Add `<span class="stat-number" data-count="">0</span>` to any stat.
2. When the counter animates, the displayed text becomes "NaN".

---

## Summary

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|-----|-------|
| Cross-Browser | 0 | 2 | 2 | 1 | 5 |
| Responsive | 0 | 2 | 3 | 0 | 5 |
| Form Validation | 0 | 2 | 3 | 0 | 5 |
| Animation/Transition | 1 | 2 | 2 | 0 | 5 |
| Error Handling | 2 | 2 | 1 | 0 | 5 |
| **Total** | **3** | **10** | **11** | **1** | **25** |

**Top 3 priorities:**
1. **BUG-016** — Loader interval leak can permanently block the page (P0)
2. **BUG-21** — Checkout fetch has no timeout, button stuck forever (P0)
3. **BUG-23** — sessionStorage crash in Safari Private breaks form submit (P1)
