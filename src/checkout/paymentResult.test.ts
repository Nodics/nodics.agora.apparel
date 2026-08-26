import { describe, expect, it } from 'vitest';

import { paymentResultViewModel } from './paymentResult';

describe('paymentResultViewModel', () => {
  it('separates success pending and failure outcomes for customer retry/resume UX', () => {
    expect(paymentResultViewModel('PLACED')).toMatchObject({ state: 'SUCCESS', retryAvailable: false });
    expect(paymentResultViewModel('PAYMENT_PENDING')).toMatchObject({ state: 'PENDING', retryAvailable: false });
    expect(paymentResultViewModel('FAILED', 'Card declined')).toMatchObject({
      state: 'FAILURE',
      message: 'Card declined',
      retryAvailable: true,
    });
  });
});
