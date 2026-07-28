# juice-shop-checkout-security

Security-focused test suite (Playwright, API-level) for the checkout/basket flow of [OWASP Juice Shop](https://owasp-juice.shop/) — the official intentionally-vulnerable e-commerce app used to practice this kind of testing, run **locally**, never a shared public target.

## Why Juice Shop, and not a real client's checkout

Security testing on a client's production checkout, or on any third party's site without authorization, isn't something to do casually — and definitely not in a public portfolio repo. Juice Shop exists specifically to be broken: it's OWASP's own reference target for practicing this, self-hosted for the duration of a test run, so there's no third party to worry about — which is also why (unlike [`restful-booker-load-tests`](https://github.com/micaelajara/restful-booker-load-tests)) this suite runs fully automated in CI: the target is a disposable container this job owns, not someone else's production system.

## Findings — verified, not assumed

Every one of these was confirmed by hand against a running local instance before a single test was written (same approach as `restful-booker-api-tests`: real HTTP behavior first, assertions second).

| # | Finding | Endpoint | OWASP mapping |
|---|---|---|---|
| 1 | Any authenticated user can read **another user's basket** — the API checks that the JWT is valid, never that the basket id in the URL belongs to that token | `GET /rest/basket/{id}` | A01:2021 Broken Access Control / API3:2023 BOLA |
| 2 | The same flaw carried through to checkout: an attacker can **complete an order using another user's basket**, confirmed with a real order number | `POST /rest/basket/{id}/checkout` | A01:2021 Broken Access Control |
| 3 | Basket quantity accepts negative values with no server-side validation, and checkout honors the resulting negative line total instead of rejecting it | `POST /api/BasketItems` | Business logic flaw (no direct OWASP Top 10 category — insufficient input validation on a quantity field, not a class break) |

A fourth test (`coupon-validation.spec.ts`) is a **negative control**: a forged/random coupon code is correctly rejected with 404. It's included on purpose — a security suite that only ever reports "found a bug" reads as cherry-picked; this confirms the endpoint actually validates input where it's supposed to.

## Run locally

```
docker run --rm -p 3000:3000 bkimminich/juice-shop
npm install
npx playwright test
npx playwright show-report
```

## CI

Every push/PR to `main` spins up Juice Shop as a GitHub Actions [service container](https://docs.github.com/en/actions/using-containerized-services/about-service-containers) — a fresh, disposable instance scoped to that one job — runs the full suite against it, and uploads the HTML report as an artifact.

## Stack

Playwright (API testing), TypeScript, GitHub Actions.
