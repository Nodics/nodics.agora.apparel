import { describe, expect, it } from 'vitest';

import { resolveAgoraCustomerSession, saveAgoraCustomerSession } from '../../src/customer/customerSession';
import type { AgoraRuntimeConfig } from '../../src/runtime/config';

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
  locale: 'en',
  requestTimeoutMs: 1000,
};

describe('cart and customer session contract', () => {
  it('uses local fallback when no customer token is configured', () => {
    const session = resolveAgoraCustomerSession(config, { getItem: () => null });

    expect(session.mode).toBe('localFallback');
    expect(session.accessToken).toBeUndefined();
    expect(session.customerId).toBe('storefront-customer');
  });

  it('resolves runtime customer token without hardcoded customer credentials', () => {
    const session = resolveAgoraCustomerSession({
      ...config,
      customerAccessToken: 'runtime-customer-token',
      customerEmail: 'alex@example.com',
      customerId: 'customer-1',
    }, { getItem: () => null });

    expect(session.mode).toBe('guest');
    expect(session.accessToken).toBe('runtime-customer-token');
    expect(session.email).toBe('alex@example.com');
    expect(session.customerId).toBe('customer-1');
  });

  it('allows authenticated customer session storage to override runtime fallback', () => {
    let stored = '';
    const storage = {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    };

    saveAgoraCustomerSession({
      mode: 'authenticated',
      accessToken: 'stored-customer-token',
      customerId: 'stored-customer',
      email: 'stored@example.com',
    }, storage);
    const session = resolveAgoraCustomerSession(config, storage);

    expect(session.mode).toBe('authenticated');
    expect(session.accessToken).toBe('stored-customer-token');
    expect(session.email).toBe('stored@example.com');
  });
});
