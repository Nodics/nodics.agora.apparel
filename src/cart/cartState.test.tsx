import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLocalCart } from './cartState';

describe('useLocalCart', () => {
  it('adds PDP quantity as one cart mutation and rolls up repeated Product quantities', () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add({
        productCode: 'agoraLinenWrapDress',
        name: 'Linen Wrap Dress',
        defaultVariantCode: 'agoraLinenWrapDressNaturalS',
        price: { currency: 'USD', unitAmount: '129.00' },
      }, 3);
    });

    expect(result.current.quantity).toBe(3);
    expect(result.current.entries[0]).toMatchObject({
      productCode: 'agoraLinenWrapDress',
      quantity: 3,
      variantCode: 'agoraLinenWrapDressNaturalS',
    });
    expect(result.current.subtotal).toBe(387);

    act(() => {
      result.current.add({
        productCode: 'agoraLinenWrapDress',
        name: 'Linen Wrap Dress',
        price: { currency: 'USD', unitAmount: '129.00' },
      }, 2);
    });

    expect(result.current.quantity).toBe(5);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.quantity).toBe(5);
  });

  it('updates and removes customer cart quantities without rebuilding the cart', () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add({
        productCode: 'agoraLinenWrapDress',
        name: 'Linen Wrap Dress',
        price: { currency: 'USD', unitAmount: '129.00' },
      }, 1, 'agoraLinenWrapDressNaturalM');
    });

    act(() => {
      result.current.update('agoraLinenWrapDress', 4);
    });

    expect(result.current.entries[0]).toMatchObject({
      productCode: 'agoraLinenWrapDress',
      quantity: 4,
      variantCode: 'agoraLinenWrapDressNaturalM',
    });
    expect(result.current.subtotal).toBe(516);

    act(() => {
      result.current.update('agoraLinenWrapDress', 0);
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it('clears the visible cart after successful backend placement', () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add({
        productCode: 'agoraLinenWrapDress',
        name: 'Linen Wrap Dress',
        price: { currency: 'USD', unitAmount: '129.00' },
      });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.entries).toHaveLength(0);
    expect(result.current.quantity).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });
});
