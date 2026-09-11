import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLocalCart } from "./cartState";

describe("useLocalCart", () => {
  it("adds PDP quantity as one cart mutation and rolls up repeated Product quantities", () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add(
        {
          productCode: "agoraLinenWrapDress",
          name: "Linen Wrap Dress",
          defaultVariantCode: "agoraLinenWrapDressNaturalS",
          price: { currency: "USD", unitAmount: "129.00" },
        },
        3,
      );
    });

    expect(result.current.quantity).toBe(3);
    expect(result.current.entries[0]).toMatchObject({
      productCode: "agoraLinenWrapDress",
      quantity: 3,
      variantCode: "agoraLinenWrapDressNaturalS",
    });
    expect(result.current.subtotal).toBe(387);

    act(() => {
      result.current.add(
        {
          productCode: "agoraLinenWrapDress",
          name: "Linen Wrap Dress",
          price: { currency: "USD", unitAmount: "129.00" },
        },
        2,
        "agoraLinenWrapDressNaturalS",
      );
    });

    expect(result.current.quantity).toBe(5);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.quantity).toBe(5);
  });

  it("updates and removes customer cart quantities without rebuilding the cart", () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add(
        {
          productCode: "agoraLinenWrapDress",
          name: "Linen Wrap Dress",
          price: { currency: "USD", unitAmount: "129.00" },
        },
        1,
        "agoraLinenWrapDressNaturalM",
      );
    });

    act(() => {
      result.current.update("agoraLinenWrapDress", 4);
    });

    expect(result.current.entries[0]).toMatchObject({
      productCode: "agoraLinenWrapDress",
      quantity: 4,
      variantCode: "agoraLinenWrapDressNaturalM",
    });
    expect(result.current.subtotal).toBe(516);

    act(() => {
      result.current.update("agoraLinenWrapDress", 0);
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it("clears the visible cart after successful backend placement", () => {
    const { result } = renderHook(() => useLocalCart());

    act(() => {
      result.current.add({
        productCode: "agoraLinenWrapDress",
        name: "Linen Wrap Dress",
        price: { currency: "USD", unitAmount: "129.00" },
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

describe("variant identity and browser persistence", () => {
  it("keeps two variants separate, updates only the selected line and restores after reload", () => {
    const key = "qualification.cart.variants";
    window.localStorage.removeItem(key);
    const first = renderHook(() => useLocalCart(key));
    const product = {
      productCode: "dress",
      name: "Dress",
      price: { currency: "USD", unitAmount: "12" },
    };
    act(() => {
      first.result.current.add(product, 1, "small");
      first.result.current.add(product, 2, "medium");
    });
    expect(first.result.current.entries).toHaveLength(2);
    act(() => first.result.current.update("dress:small", 3));
    expect(first.result.current.entries.map((entry) => entry.quantity)).toEqual(
      [3, 2],
    );
    first.unmount();
    const restored = renderHook(() => useLocalCart(key));
    expect(restored.result.current.quantity).toBe(5);
    expect(restored.result.current.subtotal).toBe(60);
    act(() => restored.result.current.remove("dress:medium"));
    expect(
      restored.result.current.entries.map((entry) => entry.variantCode),
    ).toEqual(["small"]);
    act(() => restored.result.current.clear());
    restored.unmount();
    expect(JSON.parse(window.localStorage.getItem(key) ?? "[]")).toEqual([]);
    window.localStorage.removeItem(key);
  });
  it("recovers from corrupt storage without creating a cart line", () => {
    const key = "qualification.cart.invalid";
    window.localStorage.setItem(key, "{broken");
    const hook = renderHook(() => useLocalCart(key));
    expect(hook.result.current.entries).toEqual([]);
    hook.unmount();
    window.localStorage.removeItem(key);
  });
});
