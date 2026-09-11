import { describe, expect, it } from "vitest";
import { listingLocationSearch, readListingLocation } from "./listingLocation";

describe("listing route persistence", () => {
  it("round-trips applied filters, sorting and page without losing the route category", () => {
    const filters = {
      ...readListingLocation("").filters,
      colors: ["ivory", "navy"],
      sizes: ["M"],
      priceMax: "120.50",
      saleOnly: true,
    };
    const search = listingLocationSearch(
      "?category=dresses&q=old",
      "linen",
      filters,
      "price-asc",
      3,
    );
    expect(new URLSearchParams(search).get("category")).toBe("dresses");
    expect(new URLSearchParams(search).get("q")).toBe("linen");
    expect(readListingLocation(search)).toEqual({
      filters,
      sortCode: "price-asc",
      page: 3,
    });
    const cleared = listingLocationSearch(
      search,
      "",
      readListingLocation("").filters,
      "recommended",
      1,
    );
    expect(cleared).toBe("?category=dresses");
  });
  it("uses safe defaults for malformed paging, sorting and amounts", () => {
    const result = readListingLocation(
      "?page=-2&sort=unknown&filter.priceMax=Infinity&filter.priceMin=-1",
    );
    expect(result.page).toBe(1);
    expect(result.sortCode).toBe("recommended");
    expect(result.filters.priceMin).toBe("");
    expect(result.filters.priceMax).toBe("");
  });
});
