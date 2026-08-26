export type PaymentResultState = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface PaymentResultViewModel {
  readonly state: PaymentResultState;
  readonly title: string;
  readonly message: string;
  readonly retryAvailable: boolean;
}

export function paymentResultViewModel(status?: string, errorMessage?: string): PaymentResultViewModel {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized.includes('PENDING') || normalized.includes('REVIEW')) {
    return {
      state: 'PENDING',
      title: 'Payment is pending',
      message: 'Your order is waiting for payment confirmation or provider reconciliation.',
      retryAvailable: false,
    };
  }
  if (normalized.includes('FAIL') || normalized.includes('DECLIN') || errorMessage) {
    return {
      state: 'FAILURE',
      title: 'Payment could not be completed',
      message: errorMessage ?? 'The payment provider declined or failed the authorization.',
      retryAvailable: true,
    };
  }
  return {
    state: 'SUCCESS',
    title: 'Payment confirmed',
    message: 'Payment authorization completed and the order can continue.',
    retryAvailable: false,
  };
}
