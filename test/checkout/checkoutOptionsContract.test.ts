import { describe, expect, it } from 'vitest';

import { maskedPaymentLabel, normalizeShippingOptions, paymentOption, paymentOptions, shippingOption, shippingOptions, shippingPrice } from '../../src/checkout/checkoutOptions';

describe('checkout options contract', () => {
  it('defines customer-visible shipping and payment methods without raw card capture', () => {
    expect(shippingPrice('EXPRESS')).toBe(12);
    expect(shippingOptions.map((option) => option.code)).toEqual(['STANDARD', 'EXPRESS', 'STORE_PICKUP']);
    expect(paymentOptions.map((option) => option.code)).toEqual(['CARD', 'WALLET', 'CASH_ON_DELIVERY']);
    expect(paymentOptions.every((option) => option.providerTokenHint.includes('token'))).toBe(true);
    expect(shippingOption('STORE_PICKUP').requiresAddress).toBe(false);
    expect(paymentOption('CASH_ON_DELIVERY').requiresToken).toBe(false);
    expect(maskedPaymentLabel('CARD', '4242')).toBe('Card ending 4242');
    expect(maskedPaymentLabel('CASH_ON_DELIVERY', '')).toBe('Cash on Delivery');
    expect(shippingOption('EXPRESS').currency).toBe('USD');
    expect(normalizeShippingOptions([{ code: 'SAME_DAY', label: 'Same Day', price: 20, promise: 'Today', requiresAddress: true, returnEligible: false }])[0]).toMatchObject({
      code: 'SAME_DAY',
      price: 20,
      returnEligible: false,
    });
  });
});
