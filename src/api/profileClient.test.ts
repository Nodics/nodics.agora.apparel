import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticateCustomer, customerAccessToken, profileUrl } from './profileClient';
import type { AgoraRuntimeConfig } from '../runtime/config';

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

describe('profileClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds Platform Profile URLs separately from Commerce Online URLs', () => {
    const target = profileUrl(config, '/nodics/profile/v0/customer/authenticate');

    expect(target.origin).toBe('http://localhost:4300');
    expect(target.pathname).toBe('/nodics/profile/v0/customer/authenticate');
  });

  it('authenticates customers against Profile and extracts authToken', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: {
        authToken: 'customer-access-token',
        loginId: 'alex@example.com',
        email: 'alex@example.com',
      },
    }));

    const response = await authenticateCustomer(config, {
      loginId: 'alex@example.com',
      password: 'customerPassword',
    });
    const request = lastRequest();

    expect(customerAccessToken(response)).toBe('customer-access-token');
    expect(request.target).toBe('http://localhost:4300/nodics/profile/v0/customer/authenticate');
    expect(request.options.method).toBe('POST');
    expect(request.options.headers).toMatchObject({
      'x-enterprise-code': 'default',
      'x-tenant-code': 'default',
      tenant: 'default',
    });
    expect(JSON.parse(String(request.options.body))).toEqual({
      loginId: 'alex@example.com',
      password: 'customerPassword',
    });
  });

  it('supports root-level token response envelopes from Profile', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      authToken: 'root-token',
      loginId: 'customer@example.com',
    }));

    const response = await authenticateCustomer(config, {
      loginId: 'customer@example.com',
      password: 'customerPassword',
    });

    expect(customerAccessToken(response)).toBe('root-token');
  });

  it('surfaces Profile authentication errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ message: 'Invalid customer credentials' }, { status: 401 }));

    await expect(authenticateCustomer(config, {
      loginId: 'bad@example.com',
      password: 'wrong',
    })).rejects.toThrow('Invalid customer credentials');
  });
});
