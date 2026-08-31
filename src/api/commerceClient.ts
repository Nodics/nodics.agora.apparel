import type { AgoraRuntimeConfig } from '../runtime/config';

export interface MediaDescriptor {
  readonly code?: string;
  readonly mediaCode?: string;
  readonly role?: string;
  readonly name?: string;
  readonly description?: string;
  readonly formatCode?: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  readonly extension?: string;
  readonly access?: string;
  readonly businessPurpose?: string;
  readonly ownerType?: string;
  readonly ownerReference?: string;
  readonly deliveryUrl?: string;
  readonly publicUrl?: string;
  readonly url?: string;
  readonly altText?: string;
}

export interface ProductCard {
  readonly productCode: string;
  readonly name?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly brand?: string;
  readonly localizedAttributes?: Readonly<Record<string, unknown>>;
  readonly media?: { readonly primary?: MediaDescriptor; readonly secondary?: MediaDescriptor; readonly gallery?: readonly MediaDescriptor[] };
  readonly categoryCodes?: readonly string[];
  readonly collectionCodes?: readonly string[];
  readonly variantCodes?: readonly string[];
  readonly defaultVariantCode?: string;
  readonly price?: { readonly currency?: string; readonly unitAmount?: string };
  readonly availability?: { readonly available: boolean; readonly status?: string };
  readonly apparel?: {
    readonly sizeSystemCode?: string;
    readonly options?: readonly {
      readonly variantCode?: string;
      readonly sizeCode?: string;
      readonly colourCode?: string;
      readonly colorCode?: string;
      readonly colourFamily?: string;
      readonly colorFamily?: string;
      readonly swatchMediaCode?: string;
      readonly fitCode?: string;
    }[];
  };
  readonly electronics?: { readonly modelNumber?: string; readonly specifications?: Readonly<Record<string, unknown>>; readonly warranty?: { readonly duration?: number; readonly durationUnit?: string } };
  readonly telco?: { readonly planType?: 'PREPAID' | 'POSTPAID'; readonly allowances?: readonly { readonly type?: string; readonly amount?: string; readonly unit?: string }[]; readonly simTypes?: readonly string[] };
}

export interface ProductDetail extends ProductCard {
  readonly description?: string;
  readonly variants?: readonly unknown[];
  readonly relatedProductCodes?: readonly string[];
}

export interface DiscoveryResponse {
  readonly products: readonly ProductCard[];
  readonly facets?: Readonly<Record<string, readonly unknown[]>>;
  readonly total?: number;
  readonly totalCount?: number;
  readonly productCount?: number;
  readonly pagination?: {
    readonly total?: number;
    readonly totalCount?: number;
    readonly productCount?: number;
  };
}

export interface CartEntry {
  readonly code: string;
  readonly productCode: string;
  readonly sku: string;
  readonly quantity: string;
  readonly unitAmount?: string;
  readonly status: string;
}

export interface CartResponse {
  readonly cart: { readonly code: string; readonly currency: string; readonly status: string; readonly revision?: string | number };
  readonly entries: readonly CartEntry[];
  readonly totals?: { readonly subtotal?: string; readonly total?: string };
}

export interface CartCalculationResponse extends CartResponse {
  readonly revision?: string | number;
  readonly subtotal?: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly totalAmount?: string;
  readonly currency?: string;
}

export type CustomerListType = 'WISHLIST' | 'COMPARE';

export interface CustomerListEntry {
  readonly code: string;
  readonly productCode: string;
  readonly variantCode?: string;
  readonly status: string;
}

export interface CustomerListResponse {
  readonly list: {
    readonly code: string;
    readonly listType: CustomerListType;
    readonly ownerId: string;
    readonly status: string;
  };
  readonly entries: readonly CustomerListEntry[];
}

export interface PromotionDecision {
  readonly promotionCode: string;
  readonly discountAmount: string;
  readonly currency?: string;
  readonly reasonCode?: string;
}

export interface PromotionPreviewResponse {
  readonly mode: 'SIMULATION';
  readonly mutationPerformed: boolean;
  readonly selected: readonly { readonly code: string; readonly name?: string; readonly actions?: { readonly discountAmount?: string; readonly message?: string } }[];
  readonly explanation: readonly { readonly promotionCode: string; readonly eligible: boolean; readonly reason: string; readonly priority?: number }[];
  readonly redemptionStateMutation: 'NONE' | 'COMMITTED';
  readonly decisions?: readonly PromotionDecision[];
  readonly redemption?: { readonly code: string; readonly status: string };
  readonly applied?: boolean;
}

export interface ShippingMethodResponse {
  readonly methods: readonly {
    readonly code: string;
    readonly label: string;
    readonly price?: string;
    readonly currency?: string;
    readonly promise: string;
    readonly requiresAddress?: boolean;
    readonly returnEligible?: boolean;
  }[];
}

export interface ReturnMethodResponse {
  readonly methods: readonly {
    readonly code: string;
    readonly label: string;
    readonly promise?: string;
    readonly requiresAddress?: boolean;
  }[];
}

export type OrderLifecycleRequestType = 'CANCELLATION' | 'RETURN' | 'REFUND' | 'EXCHANGE' | 'REPLACEMENT' | 'APPEAL';

export interface OrderLifecyclePayload {
  readonly code: string;
  readonly requestType: OrderLifecycleRequestType;
  readonly reasonCode: string;
  readonly policyVersion?: string;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface OrderLifecycleResponse {
  readonly code?: string;
  readonly orderCode: string;
  readonly requestType: OrderLifecycleRequestType;
  readonly status: string;
  readonly requiresApproval?: boolean;
  readonly eligible?: boolean;
  readonly policyVersion?: string;
  readonly reasonCodes?: readonly string[];
  readonly returnMethods?: readonly string[];
  readonly refundMethods?: readonly string[];
  readonly replacementSelectionRequired?: boolean;
  readonly appealEvidenceRequired?: boolean;
  readonly inspectionRequired?: boolean;
  readonly rmaCode?: string;
  readonly refundPreview?: {
    readonly currency?: string;
    readonly amount?: string;
    readonly method?: string;
    readonly status?: string;
    readonly reconciliationRequired?: boolean;
  };
  readonly downstreamOwners?: readonly string[];
  readonly automationPlan?: readonly {
    readonly step: string;
    readonly owner: string;
    readonly trigger?: string;
    readonly customerVisibleState?: string;
  }[];
  readonly rejectionAppealSupported?: boolean;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface CheckoutPlacementRequest {
  readonly cartCode: string;
  readonly orderCode: string;
  readonly expectedCartRevision?: string;
  readonly calculationCode?: string;
  readonly providerToken: string;
  readonly customer: {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone?: string;
  };
  readonly shippingAddress: {
    readonly line1: string;
    readonly line2?: string;
    readonly city: string;
    readonly region?: string;
    readonly postalCode: string;
    readonly country: string;
  };
  readonly shippingMethod: string;
  readonly paymentMethod: string;
}

export interface CheckoutPlacementResponse {
  readonly code?: string;
  readonly orderCode?: string;
  readonly cartCode?: string;
  readonly status?: string;
  readonly evidence?: {
    readonly orderCode?: string;
    readonly completed?: readonly string[];
  };
}

export interface CustomerOrderSummary {
  readonly code: string;
  readonly cartCode?: string;
  readonly status: string;
  readonly currency?: string;
  readonly totalAmount?: string;
  readonly created?: string;
  readonly occurredAt?: string;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface CustomerOrderDetailResponse {
  readonly order: CustomerOrderSummary;
  readonly entries?: readonly CartEntry[];
  readonly lifecycle?: readonly OrderLifecycleResponse[];
}

interface Envelope<T> {
  readonly data?: T;
  readonly result?: T;
  readonly message?: string;
  readonly errors?: readonly { readonly message?: string }[];
}

export function commerceUrl(config: AgoraRuntimeConfig, path: string, query?: Readonly<Record<string, string | undefined>>) {
  const target = new URL(path, config.commerceBaseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) target.searchParams.set(key, value);
  });
  return target;
}

function envelopeData<T>(body: Envelope<T>): T {
  return (body.data ?? body.result ?? body) as T;
}

async function parseBody<T>(response: Response): Promise<Envelope<T>> {
  const text = await response.text();
  if (!text) return {} as Envelope<T>;
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    throw new Error(`Agora commerce request returned non-JSON response: ${response.status}`);
  }
}

async function request<T>(
  config: AgoraRuntimeConfig,
  path: string,
  options: RequestInit = {},
  query?: Readonly<Record<string, string | undefined>>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(commerceUrl(config, path, query), {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-enterprise-code': config.enterpriseCode,
        'x-tenant-code': config.tenantCode,
        tenant: config.tenantCode,
        ...options.headers,
      },
    });
    const body = await parseBody<T>(response);
    if (!response.ok) {
      const message = body.message ?? body.errors?.[0]?.message ?? `Agora commerce request failed: ${response.status}`;
      throw new Error(message);
    }
    return envelopeData(body);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function listProducts(
  config: AgoraRuntimeConfig,
  input: {
    readonly brandCode?: string;
    readonly categoryCode?: string;
    readonly collectionCode?: string;
    readonly domainCode?: string;
    readonly q?: string;
    readonly sortCode?: string;
    readonly page?: string;
    readonly pageSize?: string;
  },
) {
  return request<DiscoveryResponse>(
    config,
    '/nodics/product/v0/customer/products/discovery',
    {},
    {
      storeCode: config.storeCode,
      locale: config.locale,
      brandCode: input.brandCode,
      categoryCode: input.categoryCode,
      collectionCode: input.collectionCode,
      domainCode: input.domainCode,
      q: input.q,
      sortCode: input.sortCode,
      page: input.page,
      pageSize: input.pageSize ?? '10',
    },
  );
}

export function getProduct(config: AgoraRuntimeConfig, productCode: string) {
  return request<{ readonly product: ProductDetail; readonly relatedProducts?: readonly ProductCard[] }>(
    config,
    `/nodics/product/v0/customer/products/${encodeURIComponent(productCode)}`,
    {},
    { storeCode: config.storeCode, locale: config.locale },
  );
}

export function createCart(config: AgoraRuntimeConfig, accessToken: string) {
  return request<CartResponse>(
    config,
    '/nodics/cart/v0/customer/carts',
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ storeCode: config.storeCode, locale: config.locale, currency: 'USD' }),
    },
  );
}

export function readCart(config: AgoraRuntimeConfig, accessToken: string, cartCode: string) {
  return request<CartResponse>(
    config,
    `/nodics/cart/v0/customer/carts/${encodeURIComponent(cartCode)}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
}

export function addCartEntry(
  config: AgoraRuntimeConfig,
  accessToken: string,
  cartCode: string,
  entry: { readonly productCode: string; readonly variantCode?: string; readonly sku?: string; readonly quantity: string },
) {
  return request<CartResponse>(
    config,
    `/nodics/cart/v0/customer/carts/${encodeURIComponent(cartCode)}/entries`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(entry),
    },
  );
}

export function updateCartEntry(
  config: AgoraRuntimeConfig,
  accessToken: string,
  cartCode: string,
  entryCode: string,
  quantity: string,
) {
  return request<CartResponse>(
    config,
    `/nodics/cart/v0/customer/carts/${encodeURIComponent(cartCode)}/entries/${encodeURIComponent(entryCode)}`,
    {
      method: 'PATCH',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ quantity }),
    },
  );
}

export function removeCartEntry(
  config: AgoraRuntimeConfig,
  accessToken: string,
  cartCode: string,
  entryCode: string,
) {
  return request<CartResponse>(
    config,
    `/nodics/cart/v0/customer/carts/${encodeURIComponent(cartCode)}/entries/${encodeURIComponent(entryCode)}`,
    {
      method: 'DELETE',
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
}

export function calculateCart(config: AgoraRuntimeConfig, accessToken: string, cartCode: string, expectedRevision?: string) {
  return request<CartCalculationResponse>(
    config,
    `/nodics/cart/v0/customer/carts/${encodeURIComponent(cartCode)}/calculations`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ expectedRevision }),
    },
  );
}

export function readCustomerList(config: AgoraRuntimeConfig, accessToken: string, listType: CustomerListType) {
  return request<CustomerListResponse>(
    config,
    `/nodics/customerList/v0/customer/lists/${encodeURIComponent(listType)}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
    { storeCode: config.storeCode, locale: config.locale },
  );
}

export function addCustomerListEntry(
  config: AgoraRuntimeConfig,
  accessToken: string,
  listType: CustomerListType,
  entry: { readonly productCode: string; readonly variantCode?: string },
) {
  return request<CustomerListResponse>(
    config,
    `/nodics/customerList/v0/customer/lists/${encodeURIComponent(listType)}/entries`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ ...entry, storeCode: config.storeCode, locale: config.locale }),
    },
  );
}

export function removeCustomerListEntry(
  config: AgoraRuntimeConfig,
  accessToken: string,
  listType: CustomerListType,
  entryCode: string,
) {
  return request<CustomerListResponse>(
    config,
    `/nodics/customerList/v0/customer/lists/${encodeURIComponent(listType)}/entries/${encodeURIComponent(entryCode)}`,
    {
      method: 'DELETE',
      headers: { authorization: `Bearer ${accessToken}` },
    },
    { storeCode: config.storeCode, locale: config.locale },
  );
}

export function previewPromotion(
  config: AgoraRuntimeConfig,
  accessToken: string,
  payload: {
    readonly cartCode?: string;
    readonly subtotal: string;
    readonly productCodes: readonly string[];
    readonly currency: string;
    readonly couponCode?: string;
  },
) {
  return request<PromotionPreviewResponse>(
    config,
    '/nodics/promotion/v0/customer/promotions/preview',
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    },
  );
}

export function applyPromotion(
  config: AgoraRuntimeConfig,
  accessToken: string,
  payload: {
    readonly cartCode?: string;
    readonly subtotal: string;
    readonly productCodes: readonly string[];
    readonly currency: string;
    readonly couponCode?: string;
    readonly idempotencyKey: string;
  },
) {
  return request<PromotionPreviewResponse>(
    config,
    '/nodics/promotion/v0/customer/promotions/apply',
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    },
  );
}

export function listShippingMethods(config: AgoraRuntimeConfig) {
  return request<ShippingMethodResponse>(config, '/nodics/fulfillmentCore/v0/customer/shipping/methods');
}

export function listReturnMethods(config: AgoraRuntimeConfig) {
  return request<ReturnMethodResponse>(config, '/nodics/fulfillmentCore/v0/customer/returns/methods');
}

export function placeCheckout(
  config: AgoraRuntimeConfig,
  accessToken: string,
  payload: CheckoutPlacementRequest,
  idempotencyKey: string,
) {
  return request<CheckoutPlacementResponse>(
    config,
    '/nodics/checkoutCore/v0/customer/checkouts/place',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
  );
}

export function readCustomerOrder(config: AgoraRuntimeConfig, accessToken: string, orderCode: string) {
  return request<CustomerOrderDetailResponse>(
    config,
    `/nodics/order/v0/customer/orders/${encodeURIComponent(orderCode)}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
}

export function listCustomerOrders(config: AgoraRuntimeConfig, accessToken: string) {
  return request<readonly CustomerOrderSummary[]>(
    config,
    '/nodics/order/v0/customer/orders',
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
}

export function previewOrderLifecycleRequest(
  config: AgoraRuntimeConfig,
  accessToken: string,
  orderCode: string,
  payload: OrderLifecyclePayload,
) {
  return request<OrderLifecycleResponse>(
    config,
    `/nodics/order/v0/customer/orders/${encodeURIComponent(orderCode)}/lifecycle/preview`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    },
  );
}

export function createOrderLifecycleRequest(
  config: AgoraRuntimeConfig,
  accessToken: string,
  orderCode: string,
  payload: OrderLifecyclePayload,
  idempotencyKey: string,
) {
  return request<OrderLifecycleResponse>(
    config,
    `/nodics/order/v0/customer/orders/${encodeURIComponent(orderCode)}/lifecycle`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    },
  );
}

export function listOrderLifecycleRequests(config: AgoraRuntimeConfig, accessToken: string, orderCode: string) {
  return request<readonly OrderLifecycleResponse[]>(
    config,
    `/nodics/order/v0/customer/orders/${encodeURIComponent(orderCode)}/lifecycle`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
}
