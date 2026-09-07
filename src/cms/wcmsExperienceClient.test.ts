import { describe, expect, it, vi } from 'vitest';

import { parseWcmsExperienceResolveResult, resolveWcmsExperience, wcmsExperienceToCmsPage } from './wcmsExperienceClient';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('wcmsExperienceClient', () => {
  it('calls public delivery without preview mode and preserves storefront context', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({
      result: {
        site: 'agoraApparelSite',
        pageType: 'PRODUCT_LISTING',
        slots: {
          hero: [
            {
              placementCode: 'hero-placement',
              componentCode: 'listing-experience',
              rendererKey: 'agora.productListing',
              contractVersion: 1,
              properties: { heading: 'Fresh styles just in' },
              media: [],
            },
          ],
        },
      },
    }));

    const result = await resolveWcmsExperience({
      baseUrl: 'http://localhost:4314',
      enterpriseCode: 'default',
      site: 'agoraApparelSite',
      pageType: 'PRODUCT_LISTING',
      targetType: 'COLLECTION',
      targetCode: 'agoraNewArrivals',
      locale: 'en',
      channel: 'web',
      device: 'desktop',
      timeoutMs: 1000,
    }, fetchMock);

    const [target, options] = fetchMock.mock.calls[0] ?? [];
    expect(String(target)).toBe('http://localhost:4314/nodics/wcmsExperience/v0/delivery/resolve');
    expect(options?.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-enterprise-code': 'default',
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      site: 'agoraApparelSite',
      pageType: 'PRODUCT_LISTING',
      targetType: 'COLLECTION',
      targetCode: 'agoraNewArrivals',
      locale: 'en',
      channel: 'web',
      device: 'desktop',
    });
    expect(result.slots.hero?.[0]?.properties.heading).toBe('Fresh styles just in');
  });

  it('normalizes a featured carousel slot into the existing product listing content model', () => {
    const result = parseWcmsExperienceResolveResult({
      site: 'agoraApparelSite',
      pageType: 'PRODUCT_LISTING',
      slots: {
        hero: [
          {
            placementCode: 'hero-placement',
            componentCode: 'listing-experience',
            rendererKey: 'agora.productListing',
            contractVersion: 1,
            properties: { heading: 'Apparel selected for now' },
            media: [],
          },
        ],
        featuredCarousel: [
          {
            placementCode: 'featured-placement',
            componentCode: 'listing-featured-products',
            rendererKey: 'agora.productListing.featuredCarousel',
            contractVersion: 1,
            properties: {
              heading: 'Pieces to project this week',
              productCodes: ['agoraDoubleButtonTrench', 'agoraRamiePocketShirt'],
              pageSize: 8,
            },
            media: [],
          },
        ],
      },
    });

    const page = wcmsExperienceToCmsPage(result, {
      siteCode: 'agoraApparelSite',
      locale: 'en',
      channel: 'web',
    }, '/shop');

    expect(page.page.components).toHaveLength(1);
    expect(page.page.components[0]).toMatchObject({
      renderer: 'agora.productListing',
      properties: {
        heading: 'Apparel selected for now',
        projectedProducts: {
          heading: 'Pieces to project this week',
          productCodes: ['agoraDoubleButtonTrench', 'agoraRamiePocketShirt'],
          pageSize: 8,
        },
      },
    });
  });
});
