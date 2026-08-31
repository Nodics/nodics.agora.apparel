import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addCartEntry,
  addCustomerListEntry,
  applyPromotion,
  calculateCart,
  commerceUrl,
  createCart,
  getProduct,
  listCustomerOrders,
  listProducts,
  listReturnMethods,
  listShippingMethods,
  placeCheckout,
  previewPromotion,
  readCustomerOrder,
  readCustomerList,
  removeCustomerListEntry,
  type CheckoutPlacementRequest,
} from './commerceClient';
import { runtimeConfig, type AgoraRuntimeConfig } from '../runtime/config';

const config: AgoraRuntimeConfig = {
  cmsBaseUrl: 'http://localhost:4314',
  mediaBaseUrl: 'http://localhost:4314',
  profileBaseUrl: 'http://localhost:4300',
  commerceBaseUrl: 'http://localhost:4350',
  engagementBaseUrl: 'http://localhost:4340',
  enterpriseCode: 'default',
  tenantCode: 'default',
  siteCode: 'agora',
  channel: 'web',
  storeCode: 'agoraMainStore',
  domainCode: 'apparel',
  locale: 'en',
  requestTimeoutMs: 1000,
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function lastRequest() {
  const fetchMock = vi.mocked(fetch);
  const [target, options] = fetchMock.mock.calls.at(-1) ?? [];
  return { target: String(target), options: options as RequestInit };
}

describe('commerceClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('defaults Agora runtime to the local storefront proxy rather than direct cross-origin Commerce', () => {
    expect(runtimeConfig.commerceBaseUrl).toBe(window.location.origin);
    expect(runtimeConfig.storeCode).toBe('agoraMainStore');
  });

  it('builds customer discovery URLs with Store, locale, category, and query context', () => {
    const target = commerceUrl(config, '/nodics/product/v0/customer/products/discovery', {
      storeCode: config.storeCode,
      locale: config.locale,
      categoryCode: 'agoraWomen',
      domainCode: 'apparel',
      q: 'linen',
      page: '2',
      pageSize: '10',
    });

    expect(target.origin).toBe('http://localhost:4350');
    expect(target.pathname).toBe('/nodics/product/v0/customer/products/discovery');
    expect(target.searchParams.get('storeCode')).toBe('agoraMainStore');
    expect(target.searchParams.get('locale')).toBe('en');
    expect(target.searchParams.get('categoryCode')).toBe('agoraWomen');
    expect(target.searchParams.get('domainCode')).toBe('apparel');
    expect(target.searchParams.get('q')).toBe('linen');
    expect(target.searchParams.get('page')).toBe('2');
  });

  it('lists products through the Commerce Online customer discovery route', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { products: [{ productCode: 'agoraLinenWrapDress' }] } }));

    const response = await listProducts(config, { categoryCode: 'agoraWomen', page: '3', pageSize: '4' });
    const request = lastRequest();

    expect(response.products[0]?.productCode).toBe('agoraLinenWrapDress');
    expect(request.target).toContain('http://localhost:4350/nodics/product/v0/customer/products/discovery');
    expect(request.target).toContain('storeCode=agoraMainStore');
    expect(request.target).toContain('page=3');
    expect(request.target).toContain('pageSize=4');
    expect(request.options.headers).toMatchObject({
      'x-enterprise-code': 'default',
      'x-tenant-code': 'default',
      tenant: 'default',
    });
  });

  it('resolves PDP from a result envelope for compatibility with Nodics response shapes', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ result: { product: { productCode: 'agoraOxfordShirt' } } }));

    const response = await getProduct(config, 'agoraOxfordShirt');

    expect(response.product.productCode).toBe('agoraOxfordShirt');
    expect(lastRequest().target).toContain('/nodics/product/v0/customer/products/agoraOxfordShirt?');
  });

  it('creates and updates customer carts with bearer customer context', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: { cart: { code: 'cart-1', currency: 'USD', status: 'ACTIVE' }, entries: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { cart: { code: 'cart-1', currency: 'USD', status: 'ACTIVE' }, entries: [{ code: 'entry-1', productCode: 'agoraLinenWrapDress', quantity: '3', sku: 'sku-1', status: 'ACTIVE' }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { cart: { code: 'cart-1', currency: 'USD', status: 'CALCULATED' }, entries: [] } }));

    await createCart(config, 'customer-token');
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({
      storeCode: 'agoraMainStore',
      locale: 'en',
      currency: 'USD',
    });

    await addCartEntry(config, 'customer-token', 'cart-1', {
      productCode: 'agoraLinenWrapDress',
      variantCode: 'agoraLinenWrapDressNaturalS',
      quantity: '3',
    });
    expect(lastRequest().target).toContain('/nodics/cart/v0/customer/carts/cart-1/entries');
    expect(lastRequest().options.headers).toMatchObject({ authorization: 'Bearer customer-token' });
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({ quantity: '3' });

    await calculateCart(config, 'customer-token', 'cart-1', '2');
    expect(lastRequest().target).toContain('/nodics/cart/v0/customer/carts/cart-1/calculations');
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({ expectedRevision: '2' });
  });

  it('reads and mutates customer wishlist and compare lists with bearer customer context', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: { list: { code: 'wishlist-1', listType: 'WISHLIST', ownerId: 'customer-1', status: 'ACTIVE' }, entries: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { list: { code: 'wishlist-1', listType: 'WISHLIST', ownerId: 'customer-1', status: 'ACTIVE' }, entries: [{ code: 'entry-1', productCode: 'agoraLinenWrapDress', status: 'ACTIVE' }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { list: { code: 'wishlist-1', listType: 'WISHLIST', ownerId: 'customer-1', status: 'ACTIVE' }, entries: [] } }));

    await readCustomerList(config, 'customer-token', 'WISHLIST');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/customerList/v0/customer/lists/WISHLIST?storeCode=agoraMainStore&locale=en');
    expect(lastRequest().options.headers).toMatchObject({ authorization: 'Bearer customer-token' });

    await addCustomerListEntry(config, 'customer-token', 'WISHLIST', {
      productCode: 'agoraLinenWrapDress',
      variantCode: 'agoraLinenWrapDressNaturalS',
    });
    expect(lastRequest().target).toContain('/nodics/customerList/v0/customer/lists/WISHLIST/entries');
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({
      productCode: 'agoraLinenWrapDress',
      storeCode: 'agoraMainStore',
      locale: 'en',
    });

    await removeCustomerListEntry(config, 'customer-token', 'WISHLIST', 'entry-1');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/customerList/v0/customer/lists/WISHLIST/entries/entry-1?storeCode=agoraMainStore&locale=en');
  });

  it('previews and applies promotions through bearer customer context', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: { mode: 'SIMULATION', mutationPerformed: false, selected: [{ code: 'agoraWelcome10' }], explanation: [], redemptionStateMutation: 'NONE' } }))
      .mockResolvedValueOnce(jsonResponse({ data: { mode: 'SIMULATION', mutationPerformed: false, selected: [{ code: 'agoraWelcome10' }], explanation: [], redemptionStateMutation: 'COMMITTED', applied: true, decisions: [{ promotionCode: 'agoraWelcome10', discountAmount: '10' }], redemption: { code: 'redemption-1', status: 'APPLIED' } } }));

    await previewPromotion(config, 'customer-token', {
      cartCode: 'cart-1',
      subtotal: '129.00',
      productCodes: ['agoraLinenWrapDress'],
      currency: 'USD',
    });
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/promotion/v0/customer/promotions/preview');
    expect(lastRequest().options.headers).toMatchObject({ authorization: 'Bearer customer-token' });

    await applyPromotion(config, 'customer-token', {
      cartCode: 'cart-1',
      subtotal: '129.00',
      productCodes: ['agoraLinenWrapDress'],
      currency: 'USD',
      idempotencyKey: 'promo-idem-1',
    });
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/promotion/v0/customer/promotions/apply');
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({
      idempotencyKey: 'promo-idem-1',
      subtotal: '129.00',
    });
  });

  it('places checkout with idempotency and customer-safe payment token payload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { orderCode: 'order-1', status: 'PLACED' } }));
    const payload: CheckoutPlacementRequest = {
      cartCode: 'cart-1',
      orderCode: 'order-1',
      expectedCartRevision: '2',
      calculationCode: 'calc-cart-1',
      providerToken: 'tok_storefront_4242',
      customer: { email: 'customer@example.com', firstName: 'Storefront', lastName: 'Customer' },
      shippingAddress: { line1: '1 Main', city: 'Crystal Lake', postalCode: '60014', country: 'US' },
      shippingMethod: 'STANDARD',
      paymentMethod: 'CARD',
    };

    const response = await placeCheckout(config, 'customer-token', payload, 'checkout-idem-1');

    expect(response.orderCode).toBe('order-1');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/checkoutCore/v0/customer/checkouts/place');
    expect(lastRequest().options.headers).toMatchObject({
      authorization: 'Bearer customer-token',
      'idempotency-key': 'checkout-idem-1',
    });
    expect(JSON.parse(String(lastRequest().options.body))).toMatchObject({
      providerToken: 'tok_storefront_4242',
      paymentMethod: 'CARD',
    });
  });

  it('reads Fulfillment-owned customer shipping methods from Commerce Online', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { methods: [{ code: 'EXPRESS', label: 'Express', price: '12.00', currency: 'USD', promise: '1-2 business days' }] } }));

    const response = await listShippingMethods(config);

    expect(response.methods[0]?.code).toBe('EXPRESS');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/fulfillmentCore/v0/customer/shipping/methods');
  });

  it('reads Fulfillment-owned customer return methods from Commerce Online', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { methods: [{ code: 'DROP_OFF', label: 'Drop-off', promise: 'Use an approved carrier location' }] } }));

    const response = await listReturnMethods(config);

    expect(response.methods[0]?.code).toBe('DROP_OFF');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/fulfillmentCore/v0/customer/returns/methods');
  });

  it('reads customer-owned order detail with bearer context', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { order: { code: 'order-1', status: 'PLACED', totalAmount: '141.00' }, entries: [], lifecycle: [] } }));

    const response = await readCustomerOrder(config, 'customer-token', 'order-1');

    expect(response.order.code).toBe('order-1');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/order/v0/customer/orders/order-1');
    expect(lastRequest().options.headers).toMatchObject({ authorization: 'Bearer customer-token' });
  });

  it('lists customer-owned order history with bearer context', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [{ code: 'order-1', status: 'PLACED', totalAmount: '141.00' }] }));

    const response = await listCustomerOrders(config, 'customer-token');

    expect(response[0]?.code).toBe('order-1');
    expect(lastRequest().target).toBe('http://localhost:4350/nodics/order/v0/customer/orders');
    expect(lastRequest().options.headers).toMatchObject({ authorization: 'Bearer customer-token' });
  });

  it('surfaces Nodics error messages from failed API responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ message: 'Store is required' }, { status: 400 }));

    await expect(listProducts(config, { pageSize: '4' })).rejects.toThrow('Store is required');
  });
});
