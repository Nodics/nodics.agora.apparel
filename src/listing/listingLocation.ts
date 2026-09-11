import type { ProductFilterState } from "../components/ProductListingControls";

const filterKeys = [
  "brands",
  "categories",
  "collections",
  "colors",
  "sizes",
  "availability",
] as const;
const sortCodes = [
  "recommended",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
];

/** Restores browsing preferences only; Product validates all business filters. */
export function readListingLocation(search: string) {
  const params = new URLSearchParams(search);
  const values = Object.fromEntries(
    filterKeys.map((key) => [
      key,
      params.getAll(`filter.${key}`).filter(Boolean).slice(0, 50),
    ]),
  );
  const price = (key: string) => {
    const value = params.get(`filter.${key}`) ?? "";
    return /^\d+(?:\.\d+)?$/.test(value) ? value : "";
  };
  const page = Number(params.get("page") || "1");
  const sort = params.get("sort") || "recommended";
  return {
    page: Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1,
    sortCode: sortCodes.includes(sort) ? sort : "recommended",
    filters: {
      ...values,
      priceMin: price("priceMin"),
      priceMax: price("priceMax"),
      saleOnly: params.get("filter.saleOnly") === "true",
    } as ProductFilterState,
  };
}

/** Keeps the current route scope while saving applied preferences for reload and Back. */
export function listingLocationSearch(
  search: string,
  query: string,
  filters: ProductFilterState,
  sortCode: string,
  page: number,
) {
  const params = new URLSearchParams(search);
  for (const key of [...params.keys()])
    if (key.startsWith("filter.")) params.delete(key);
  for (const [key, value] of Object.entries({
    q: query,
    sort: sortCode === "recommended" ? "" : sortCode,
    page: page > 1 ? String(page) : "",
  })) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  for (const key of filterKeys)
    for (const value of filters[key]) params.append(`filter.${key}`, value);
  if (filters.priceMin) params.set("filter.priceMin", filters.priceMin);
  if (filters.priceMax) params.set("filter.priceMax", filters.priceMax);
  if (filters.saleOnly) params.set("filter.saleOnly", "true");
  return params.size ? `?${params}` : "";
}
