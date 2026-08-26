import type { AgoraRuntimeConfig } from '../runtime/config';

export interface CustomerSession {
  readonly accessToken?: string;
  readonly mode: 'guest' | 'authenticated' | 'localFallback';
  readonly customerId: string;
  readonly email: string;
}

export const agoraCustomerSessionFallback: CustomerSession = Object.freeze({
  mode: 'localFallback',
  customerId: 'storefront-customer',
  email: 'customer@example.com',
});

const storageKey = 'nodics.storefront.customerSession';

function parseStoredSession(value: string | null): Partial<CustomerSession> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Partial<CustomerSession>;
  } catch {
    return {};
  }
}

export function resolveAgoraCustomerSession(
  config: AgoraRuntimeConfig,
  storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
): CustomerSession {
  const stored = parseStoredSession(storage?.getItem(storageKey) ?? null);
  const accessToken = stored.accessToken || config.customerAccessToken;
  const mode = accessToken ? (stored.mode === 'authenticated' ? 'authenticated' : 'guest') : 'localFallback';
  return {
    accessToken,
    mode,
    customerId: stored.customerId || config.customerId || agoraCustomerSessionFallback.customerId,
    email: stored.email || config.customerEmail || agoraCustomerSessionFallback.email,
  };
}

export function saveAgoraCustomerSession(session: CustomerSession, storage: Pick<Storage, 'setItem'> = window.localStorage) {
  storage.setItem(storageKey, JSON.stringify(session));
}

export function clearAgoraCustomerSession(storage: Pick<Storage, 'removeItem'> = window.localStorage) {
  storage.removeItem(storageKey);
}
