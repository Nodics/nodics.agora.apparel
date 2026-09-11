import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductCard } from "../api/commerceClient";

export interface LocalCartEntry {
  readonly productCode: string;
  readonly name?: string;
  readonly variantCode?: string;
  readonly variantLabel?: string;
  readonly quantity: number;
  readonly price?: ProductCard["price"];
}

export const cartEntryKey = (
  entry: Pick<LocalCartEntry, "productCode" | "variantCode">,
) =>
  `${encodeURIComponent(entry.productCode)}:${encodeURIComponent(entry.variantCode ?? "")}`;

function restoreEntries(storageKey?: string): readonly LocalCartEntry[] {
  if (!storageKey || typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "[]",
    );
    if (!Array.isArray(parsed) || parsed.length > 200) return [];
    return parsed.filter(
      (entry): entry is LocalCartEntry =>
        entry &&
        typeof entry.productCode === "string" &&
        entry.productCode.length <= 128 &&
        (entry.variantCode === undefined ||
          typeof entry.variantCode === "string") &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0 &&
        entry.quantity <= 999,
    );
  } catch {
    return [];
  }
}

export function useLocalCart(storageKey?: string) {
  const [entries, setEntries] = useState<readonly LocalCartEntry[]>(() =>
    restoreEntries(storageKey),
  );
  const currentEntries = useRef(entries);
  const replace = (next: readonly LocalCartEntry[]) => {
    currentEntries.current = next;
    setEntries(next);
  };
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      /* Shopping remains available when browser storage is blocked. */
    }
  }, [entries, storageKey]);
  const quantity = useMemo(
    () => entries.reduce((total, entry) => total + entry.quantity, 0),
    [entries],
  );
  const subtotal = useMemo(
    () =>
      entries.reduce(
        (total, entry) =>
          total + Number(entry.price?.unitAmount ?? 0) * entry.quantity,
        0,
      ),
    [entries],
  );
  const matches = (entry: LocalCartEntry, key: string) =>
    cartEntryKey(entry) === key ||
    (entry.productCode === key &&
      currentEntries.current.filter((item) => item.productCode === key)
        .length === 1);
  return {
    entries,
    quantity,
    subtotal,
    replace,
    add(
      product: ProductCard,
      amount = 1,
      variantCode = product.defaultVariantCode ?? product.variantCodes?.[0],
    ) {
      const key = cartEntryKey({
        productCode: product.productCode,
        variantCode,
      });
      const option = product.apparel?.options?.find(
        (item) => item.variantCode === variantCode,
      );
      const variantLabel = option
        ? [option.colourCode ?? option.colorCode, option.sizeCode]
            .filter(Boolean)
            .join(" · ")
        : product.electronics?.specifications?.storage
          ? String(product.electronics.specifications.storage)
          : product.telco?.planType
            ? product.telco.planType.toLowerCase()
            : undefined;
      const current = currentEntries.current;
      const existing = current.find((entry) => cartEntryKey(entry) === key);
      const nextQuantity = Math.min(
        999,
        (existing?.quantity ?? 0) + Math.max(1, Math.floor(amount)),
      );
      replace(
        existing
          ? current.map((entry) =>
              cartEntryKey(entry) === key
                ? { ...entry, quantity: nextQuantity }
                : entry,
            )
          : [
              ...current,
              {
                productCode: product.productCode,
                name: product.name,
                variantCode,
                variantLabel,
                price: product.price,
                quantity: nextQuantity,
              },
            ],
      );
      return nextQuantity;
    },
    remove(key: string) {
      replace(currentEntries.current.filter((entry) => !matches(entry, key)));
    },
    update(key: string, amount: number) {
      const quantity = Math.max(0, Math.min(999, Math.floor(amount)));
      replace(
        quantity <= 0
          ? currentEntries.current.filter((entry) => !matches(entry, key))
          : currentEntries.current.map((entry) =>
              matches(entry, key) ? { ...entry, quantity } : entry,
            ),
      );
    },
    clear() {
      replace([]);
    },
  };
}
