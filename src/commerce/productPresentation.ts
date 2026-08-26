import type { ProductCard } from '../api/commerceClient';

const stringAttribute = function (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export const productBrandLabel = function (product: Pick<ProductCard, 'brand' | 'localizedAttributes'>): string | undefined {
  return product.brand ?? stringAttribute(product.localizedAttributes?.brand);
};

