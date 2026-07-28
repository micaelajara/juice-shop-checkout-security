import { test, expect } from '@playwright/test';
import { createLoggedInUser, getBasket } from '../helpers/api';

/**
 * OWASP: A01:2021 Broken Access Control / API3:2023 Broken Object Property
 * Level Authorization (BOLA). Confirmed manually before writing this test:
 * the /rest/basket/{id} endpoint only checks that the request carries a
 * *valid* JWT — it never checks that the basket id in the URL actually
 * belongs to that token's user.
 */
test.describe('Basket access control', () => {
  test('a user can read their own basket', async ({ request }) => {
    const user = await createLoggedInUser(request);

    const res = await getBasket(request, user.token, user.basketId);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(user.basketId);
  });

  test('VULNERABILITY: a user can read another user\'s basket by guessing its id', async ({
    request,
  }) => {
    const victim = await createLoggedInUser(request);
    const attacker = await createLoggedInUser(request);

    // Attacker uses THEIR OWN valid token, but the VICTIM's basket id.
    const res = await getBasket(request, attacker.token, victim.basketId);

    // This SHOULD be 403 Forbidden. It is not — the API returns 200 and
    // hands over the victim's basket contents to the attacker.
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(victim.basketId);
  });
});
