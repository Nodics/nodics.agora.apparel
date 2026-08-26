import { describe, expect, it } from 'vitest';

import { shippingOptions } from './checkoutOptions';
import { paymentProviderToken, validateCheckoutSnapshot } from './checkoutValidation';

const validSnapshot = {
  email: 'customer@example.com',
  firstName: 'Storefront',
  lastName: 'Customer',
  line1: '549 Oak St',
  city: 'Crystal Lake',
  postalCode: '60014',
  country: 'US',
  shippingMethod: 'STANDARD',
  paymentMethod: 'CARD',
  cardLast4: '4242',
} as const;

describe('validateCheckoutSnapshot', () => {
  it('routes missing customer, shipping and payment inputs to the correct step', () => {
    expect(validateCheckoutSnapshot({ ...validSnapshot, email: '' }, shippingOptions)).toMatchObject({
      step: 'customer',
      retryable: true,
    });
    expect(validateCheckoutSnapshot({ ...validSnapshot, line1: '', city: '' }, shippingOptions)).toMatchObject({
      step: 'shipping',
      message: 'Add shipping address line 1, city before checkout.',
    });
    expect(validateCheckoutSnapshot({ ...validSnapshot, cardLast4: '42' }, shippingOptions)).toMatchObject({
      step: 'payment',
      message: 'Add a four digit payment token reference before checkout.',
    });
  });

  it('keeps payment token derivation provider-token only', () => {
    expect(validateCheckoutSnapshot(validSnapshot, shippingOptions)).toBeUndefined();
    expect(paymentProviderToken('CARD', '4242')).toBe('tok_test_storefront_4242');
    expect(paymentProviderToken('CASH_ON_DELIVERY', '')).toBe('cod-reference-token');
  });
});
