import { test, expect } from '@playwright/test';
import { addToBasket, checkout, createLoggedInUser, getBasket, getFirstProduct } from '../helpers/api';

/**
 * Business-logic flaw, not a broken-access-control one: the same endpoint
 * that accepts quantity: 1 also accepts quantity: -5 with no server-side
 * range validation. A negative line-item quantity means a negative
 * line-item total, and checkout doesn't recompute or reject that — it
 * confirms the order as-is. In a real payment flow this is the "get paid
 * to buy things" bug class (negative quantity / negative total abuse).
 */
test('VULNERABILITY: negative basket quantity is accepted and honored at checkout', async ({
  request,
}) => {
  const user = await createLoggedInUser(request);
  const product = await getFirstProduct(request);
  const negativeQuantity = -5;

  const addRes = await addToBasket(request, user.token, user.basketId, product.id, negativeQuantity);
  expect(addRes.status()).toBe(200); // should have been rejected with 400

  const basketRes = await getBasket(request, user.token, user.basketId);
  const basket = await basketRes.json();
  const line = basket.data.Products.find((p: { id: number }) => p.id === product.id);
  expect(line.BasketItem.quantity).toBe(negativeQuantity); // persisted as-is, unclamped

  // The negative line item is still allowed through to a completed order.
  const checkoutRes = await checkout(request, user.token, user.basketId);
  expect(checkoutRes.status()).toBe(200);
  const order = await checkoutRes.json();
  expect(order.orderConfirmation).toBeTruthy();
});
