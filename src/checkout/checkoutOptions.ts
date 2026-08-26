export interface ShippingOption {
  readonly code: string;
  readonly label: string;
  readonly price: number;
  readonly currency: string;
  readonly promise: string;
  readonly requiresAddress: boolean;
  readonly returnEligible: boolean;
}

export interface PaymentOption {
  readonly code: string;
  readonly label: string;
  readonly providerTokenHint: string;
  readonly requiresToken: boolean;
}

export const shippingOptions: readonly ShippingOption[] = Object.freeze([
  { code: 'STANDARD', label: 'Standard', price: 0, currency: 'USD', promise: '3-5 business days', requiresAddress: true, returnEligible: true },
  { code: 'EXPRESS', label: 'Express', price: 12, currency: 'USD', promise: '1-2 business days', requiresAddress: true, returnEligible: true },
  { code: 'STORE_PICKUP', label: 'Store Pickup', price: 0, currency: 'USD', promise: 'Ready when fulfilled', requiresAddress: false, returnEligible: true },
]);

export const paymentOptions: readonly PaymentOption[] = Object.freeze([
  { code: 'CARD', label: 'Card', providerTokenHint: 'stripe-sandbox-token', requiresToken: true },
  { code: 'WALLET', label: 'Wallet', providerTokenHint: 'wallet-sandbox-token', requiresToken: true },
  { code: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', providerTokenHint: 'cod-reference-token', requiresToken: false },
]);

export function normalizeShippingOptions(methods?: readonly Partial<ShippingOption>[]) {
  const normalized = (methods ?? []).map((method) => ({
    code: method.code ?? '',
    label: method.label ?? method.code ?? '',
    price: Number(method.price ?? 0),
    currency: method.currency ?? 'USD',
    promise: method.promise ?? 'Delivery promise pending',
    requiresAddress: method.requiresAddress ?? true,
    returnEligible: method.returnEligible ?? true,
  })).filter((method) => method.code && method.label);
  return normalized.length ? normalized : shippingOptions;
}

export function shippingPrice(code: string, options: readonly ShippingOption[] = shippingOptions) {
  return shippingOption(code, options).price;
}

export function shippingOption(code: string, options: readonly ShippingOption[] = shippingOptions) {
  return options.find((option) => option.code === code) ?? options[0] ?? shippingOptions[0];
}

export function paymentOption(code: string) {
  return paymentOptions.find((option) => option.code === code) ?? paymentOptions[0];
}

export function maskedPaymentLabel(methodCode: string, cardLast4: string) {
  const option = paymentOption(methodCode);
  if (!option.requiresToken) return option.label;
  return `${option.label} ending ${cardLast4 || 'pending'}`;
}
