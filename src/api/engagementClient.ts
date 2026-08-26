import type { AgoraRuntimeConfig } from '../runtime/config';

export interface ReviewAggregate {
  readonly targetType?: string;
  readonly targetCode?: string;
  readonly count?: number;
  readonly average?: number;
  readonly distribution?: Readonly<Record<string, number>>;
  readonly verifiedCount?: number;
}

export interface PublicReview {
  readonly reviewCode?: string;
  readonly targetCode?: string;
  readonly overallRating?: number;
  readonly title?: string;
  readonly body?: string;
  readonly authenticity?: { readonly verified?: boolean; readonly type?: string };
  readonly helpfulCount?: number;
  readonly publishedAt?: string;
}

export interface PublicReviewPage {
  readonly items: readonly PublicReview[];
  readonly total?: number;
}

interface Envelope<T> {
  readonly data?: T;
  readonly result?: T;
  readonly message?: string;
  readonly errors?: readonly { readonly message?: string }[];
}

function engagementUrl(config: AgoraRuntimeConfig, path: string, query?: Readonly<Record<string, string | undefined>>) {
  const target = new URL(path, config.engagementBaseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) target.searchParams.set(key, value);
  });
  return target;
}

function envelopeData<T>(body: Envelope<T>): T {
  return (body.data ?? body.result ?? body) as T;
}

async function request<T>(
  config: AgoraRuntimeConfig,
  path: string,
  query?: Readonly<Record<string, string | undefined>>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(engagementUrl(config, path, query), {
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-enterprise-code': config.enterpriseCode,
        'x-tenant-code': config.tenantCode,
        tenant: config.tenantCode,
      },
    });
    const body = (await response.json()) as Envelope<T>;
    if (!response.ok) {
      throw new Error(body.message ?? body.errors?.[0]?.message ?? `Agora engagement request failed: ${response.status}`);
    }
    return envelopeData(body);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getReviewAggregate(config: AgoraRuntimeConfig, productCode: string) {
  return request<ReviewAggregate>(
    config,
    `/nodics/engagementApi/v0/public/review-aggregates/PRODUCT/${encodeURIComponent(productCode)}`,
    { site: config.storeCode, locale: config.locale },
  );
}

export function listPublishedReviews(config: AgoraRuntimeConfig, productCode: string) {
  return request<PublicReviewPage>(
    config,
    '/nodics/engagementApi/v0/public/reviews',
    {
      targetType: 'PRODUCT',
      targetCode: productCode,
      site: config.storeCode,
      locale: config.locale,
      limit: '3',
      sort: 'RECENT',
    },
  );
}
