import { test, expect } from '@playwright/test';
import { applyCoupon, createLoggedInUser } from '../helpers/api';

/**
 * Control test: not everything on this checkout flow is broken. Coupon
 * codes here are generated server-side from a fixed algorithm — guessing
 * or brute-forcing an arbitrary string correctly fails. Included alongside
 * the vulnerabilities in the other specs on purpose: a security suite that
 * only ever reports "found a bug" reads as cherry-picked. This is the
 * negative-control case confirming the endpoint actually validates input.
 */
test('a forged/random coupon code is rejected', async ({ request }) => {
  const user = await createLoggedInUser(request);

  const res = await applyCoupon(request, user.token, user.basketId, 'AB1XY9Z');

  expect(res.status()).toBe(404);
  const body = await res.text();
  expect(body).toContain('Invalid coupon');
});
