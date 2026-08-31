import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getReviewAggregate, listPublishedReviews } from './engagementClient';
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

describe('engagementClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads public product review aggregates from Engagement API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { targetCode: 'agoraLinenWrapDress', count: 4, average: 4.5 } }));

    const response = await getReviewAggregate(config, 'agoraLinenWrapDress');

    expect(response.average).toBe(4.5);
    expect(lastRequest().target).toContain('http://localhost:4340/nodics/engagementApi/v0/public/review-aggregates/PRODUCT/agoraLinenWrapDress');
    expect(lastRequest().target).toContain('site=agoraMainStore');
    expect(lastRequest().options.headers).toMatchObject({
      'x-enterprise-code': 'default',
      'x-tenant-code': 'default',
      tenant: 'default',
    });
  });

  it('lists sanitized public review projections for PDP display', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { items: [{ reviewCode: 'review-1', overallRating: 5 }], total: 1 } }));

    const response = await listPublishedReviews(config, 'agoraLinenWrapDress');

    expect(response.items[0]?.reviewCode).toBe('review-1');
    expect(lastRequest().target).toContain('/nodics/engagementApi/v0/public/reviews');
    expect(lastRequest().target).toContain('targetType=PRODUCT');
    expect(lastRequest().target).toContain('targetCode=agoraLinenWrapDress');
  });
});
