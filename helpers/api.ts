import { APIRequestContext } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  token: string;
  basketId: number;
}

let userCounter = 0;

/** Registers a fresh user and logs in, returning their auth token and basket id. */
export async function createLoggedInUser(request: APIRequestContext): Promise<TestUser> {
  userCounter += 1;
  const email = `security-test-${Date.now()}-${userCounter}@test.com`;
  const password = 'Password123!';

  const registerRes = await request.post('/api/Users', {
    data: { email, password, passwordRepeat: password },
  });
  if (!registerRes.ok()) {
    throw new Error(`Failed to register ${email}: ${registerRes.status()} ${await registerRes.text()}`);
  }

  const loginRes = await request.post('/rest/user/login', { data: { email, password } });
  if (!loginRes.ok()) {
    throw new Error(`Failed to log in ${email}: ${loginRes.status()} ${await loginRes.text()}`);
  }
  const body = await loginRes.json();

  return {
    email,
    password,
    token: body.authentication.token,
    basketId: body.authentication.bid,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function addToBasket(
  request: APIRequestContext,
  token: string,
  basketId: number,
  productId: number,
  quantity: number
) {
  return request.post('/api/BasketItems', {
    headers: authHeader(token),
    data: { ProductId: productId, BasketId: basketId, quantity },
  });
}

export async function getBasket(request: APIRequestContext, token: string, basketId: number) {
  return request.get(`/rest/basket/${basketId}`, { headers: authHeader(token) });
}

export async function checkout(request: APIRequestContext, token: string, basketId: number) {
  return request.post(`/rest/basket/${basketId}/checkout`, { headers: authHeader(token) });
}

export async function applyCoupon(
  request: APIRequestContext,
  token: string,
  basketId: number,
  coupon: string
) {
  return request.put(`/rest/basket/${basketId}/coupon/${coupon}`, { headers: authHeader(token) });
}

export async function getFirstProduct(request: APIRequestContext) {
  const res = await request.get('/api/Products');
  const body = await res.json();
  return body.data[0] as { id: number; price: number };
}
