import { useMemo, useState } from 'react';

import type { ProductCard } from '../api/commerceClient';

export interface LocalCartEntry {
  readonly productCode: string;
  readonly name?: string;
  readonly variantCode?: string;
  readonly quantity: number;
  readonly price?: ProductCard['price'];
}

export function useLocalCart() {
  const [entries, setEntries] = useState<readonly LocalCartEntry[]>([]);
  const quantity = useMemo(
    () => entries.reduce((total, entry) => total + entry.quantity, 0),
    [entries],
  );
  const subtotal = useMemo(
    () =>
      entries.reduce((total, entry) => {
        const unitAmount = Number(entry.price?.unitAmount ?? 0);
        return total + unitAmount * entry.quantity;
      }, 0),
    [entries],
  );
  return {
    entries,
    quantity,
    subtotal,
    add(product: ProductCard, quantity = 1, variantCode = product.defaultVariantCode ?? product.variantCodes?.[0]) {
      setEntries((current) => {
        const existing = current.find((entry) => entry.productCode === product.productCode);
        if (existing) {
          return current.map((entry) =>
            entry.productCode === product.productCode
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry,
          );
        }
        return [
          ...current,
          {
            productCode: product.productCode,
            name: product.name,
            variantCode,
            price: product.price,
            quantity,
          },
        ];
      });
    },
    remove(productCode: string) {
      setEntries((current) => current.filter((entry) => entry.productCode !== productCode));
    },
    update(productCode: string, quantity: number) {
      setEntries((current) =>
        quantity <= 0
          ? current.filter((entry) => entry.productCode !== productCode)
          : current.map((entry) =>
              entry.productCode === productCode
                ? { ...entry, quantity }
                : entry,
            ),
      );
    },
    clear() {
      setEntries([]);
    },
  };
}
