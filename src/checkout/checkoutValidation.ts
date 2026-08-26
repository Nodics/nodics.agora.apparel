import { paymentOption, shippingOption, type ShippingOption } from './checkoutOptions';

export type CheckoutValidationStep = 'customer' | 'shipping' | 'payment' | 'review';

export interface AgoraCheckoutFormSnapshot {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly line1: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly shippingMethod: string;
  readonly paymentMethod: string;
  readonly cardLast4: string;
}

export interface CheckoutValidationResult {
  readonly step: CheckoutValidationStep;
  readonly message: string;
  readonly retryable: boolean;
}

/**
 * Customer-visible checkout validation that mirrors the backend-owned
 * placement checkpoints without collecting raw payment data in Agora.
 */
export function validateCheckoutSnapshot(
  form: AgoraCheckoutFormSnapshot,
  shippingMethodOptions: readonly ShippingOption[],
): CheckoutValidationResult | undefined {
  const missingCustomer = [
    form.email ? undefined : 'email',
    form.firstName ? undefined : 'first name',
    form.lastName ? undefined : 'last name',
  ].filter(Boolean);
  if (missingCustomer.length) {
    return { step: 'customer', message: `Add customer ${missingCustomer.join(', ')} before checkout.`, retryable: true };
  }

  const selectedShipping = shippingOption(form.shippingMethod, shippingMethodOptions);
  const missingShipping = selectedShipping.requiresAddress ? [
    form.line1 ? undefined : 'address line 1',
    form.city ? undefined : 'city',
    form.postalCode ? undefined : 'postal code',
    form.country ? undefined : 'country',
  ].filter(Boolean) : [];
  if (missingShipping.length) {
    return { step: 'shipping', message: `Add shipping ${missingShipping.join(', ')} before checkout.`, retryable: true };
  }

  const selectedPayment = paymentOption(form.paymentMethod);
  if (selectedPayment.requiresToken && form.cardLast4.length !== 4) {
    return { step: 'payment', message: 'Add a four digit payment token reference before checkout.', retryable: true };
  }

  return undefined;
}

export function paymentProviderToken(paymentMethod: string, cardLast4: string) {
  const selectedPayment = paymentOption(paymentMethod);
  if (!selectedPayment.requiresToken) return selectedPayment.providerTokenHint;
  return `tok_test_storefront_${cardLast4}`;
}
