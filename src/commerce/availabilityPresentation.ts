import type { ProductCard } from '../api/commerceClient';

const availabilityLabels: Readonly<Record<string, string>> = Object.freeze({
  AVAILABLE: 'Available',
  BACKORDER: 'Available soon',
  BACK_ORDER: 'Available soon',
  CHECK_AVAILABILITY: 'Check availability',
  DISCONTINUED: 'Not available',
  IN_STOCK: 'Available',
  LIMITED_STOCK: 'Limited availability',
  LOW_STOCK: 'Limited availability',
  NOT_AVAILABLE: 'Not available',
  OUT_OF_STOCK: 'Not available',
  PREORDER: 'Pre-order',
  PRE_ORDER: 'Pre-order',
  UNAVAILABLE: 'Not available',
});

const normalizeAvailabilityStatus = (status?: string): string | undefined => {
  if (!status) return undefined;
  return status.trim().replaceAll('-', '_').replaceAll(' ', '_').toUpperCase();
};

const humanizeAvailabilityStatus = (status: string): string => status
  .trim()
  .toLowerCase()
  .replaceAll(/[-_]+/g, ' ')
  .replaceAll(/\b\w/g, (character) => character.toUpperCase());

export const productAvailabilityLabel = (product: Pick<ProductCard, 'availability'>): string => {
  const normalizedStatus = normalizeAvailabilityStatus(product.availability?.status);
  if (normalizedStatus && availabilityLabels[normalizedStatus]) return availabilityLabels[normalizedStatus];
  if (product.availability?.available === true) return 'Available';
  if (product.availability?.available === false) return 'Not available';
  return normalizedStatus ? humanizeAvailabilityStatus(normalizedStatus) : 'Check availability';
};
