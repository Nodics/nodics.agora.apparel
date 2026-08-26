export interface AgoraRuntimeConfig {
  readonly cmsBaseUrl: string;
  readonly mediaBaseUrl: string;
  readonly profileBaseUrl: string;
  readonly commerceBaseUrl: string;
  readonly engagementBaseUrl: string;
  readonly enterpriseCode: string;
  readonly tenantCode: string;
  readonly siteCode: string;
  readonly channel: string;
  readonly storeCode: string;
  readonly locale: string;
  readonly requestTimeoutMs: number;
  readonly customerAccessToken?: string;
  readonly customerId?: string;
  readonly customerEmail?: string;
}

const localStorefrontOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173';

export const runtimeConfig: AgoraRuntimeConfig = Object.freeze({
  cmsBaseUrl: import.meta.env.VITE_STOREFRONT_CMS_BASE_URL ?? 'http://localhost:4314',
  mediaBaseUrl: import.meta.env.VITE_STOREFRONT_MEDIA_BASE_URL ?? 'http://localhost:4314',
  profileBaseUrl: import.meta.env.VITE_STOREFRONT_PROFILE_BASE_URL ?? 'http://localhost:4300',
  commerceBaseUrl: import.meta.env.VITE_STOREFRONT_COMMERCE_BASE_URL ?? localStorefrontOrigin,
  engagementBaseUrl: import.meta.env.VITE_STOREFRONT_ENGAGEMENT_BASE_URL ?? 'http://localhost:4340',
  enterpriseCode: import.meta.env.VITE_STOREFRONT_ENTERPRISE_CODE ?? 'default',
  tenantCode: import.meta.env.VITE_STOREFRONT_TENANT_CODE ?? 'default',
  siteCode: import.meta.env.VITE_STOREFRONT_SITE_CODE ?? 'agoraApparelSite',
  channel: import.meta.env.VITE_STOREFRONT_CHANNEL ?? 'web',
  storeCode: import.meta.env.VITE_STOREFRONT_STORE_CODE ?? 'agoraMainStore',
  locale: import.meta.env.VITE_STOREFRONT_LOCALE ?? 'en',
  requestTimeoutMs: Number(import.meta.env.VITE_STOREFRONT_REQUEST_TIMEOUT_MS ?? 10000),
  customerAccessToken: import.meta.env.VITE_STOREFRONT_CUSTOMER_ACCESS_TOKEN || undefined,
  customerId: import.meta.env.VITE_STOREFRONT_CUSTOMER_ID || undefined,
  customerEmail: import.meta.env.VITE_STOREFRONT_CUSTOMER_EMAIL || undefined,
});
