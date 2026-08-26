import type { AgoraRuntimeConfig } from '../runtime/config';

export interface CustomerAuthenticationResponse {
  readonly authToken?: string;
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly customerId?: string;
  readonly code?: string;
  readonly loginId?: string;
  readonly email?: string;
}

interface Envelope<T> {
  readonly data?: T;
  readonly result?: T;
  readonly authToken?: string;
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly message?: string;
  readonly errors?: readonly { readonly message?: string }[];
}

export function profileUrl(config: AgoraRuntimeConfig, path: string) {
  return new URL(path, config.profileBaseUrl);
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
    throw new Error(`Agora profile request returned non-JSON response: ${response.status}`);
  }
}

async function request<T>(config: AgoraRuntimeConfig, path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(profileUrl(config, path), {
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
      const message = body.message ?? body.errors?.[0]?.message ?? `Agora profile request failed: ${response.status}`;
      throw new Error(message);
    }
    return envelopeData(body);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function authenticateCustomer(
  config: AgoraRuntimeConfig,
  credentials: { readonly loginId: string; readonly password: string },
) {
  return request<CustomerAuthenticationResponse>(
    config,
    '/nodics/profile/v0/customer/authenticate',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    },
  );
}

export function customerAccessToken(response: CustomerAuthenticationResponse) {
  return response.authToken || response.accessToken;
}
