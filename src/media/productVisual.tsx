import type { MediaDescriptor, ProductCard } from '../api/commerceClient';

export function mediaDeliveryUrl(mediaBaseUrl: string, mediaCode: string): string {
  const baseUrl = mediaBaseUrl.endsWith('/') ? mediaBaseUrl.slice(0, -1) : mediaBaseUrl;
  return `${baseUrl}/nodics/media/v0/content/${encodeURIComponent(mediaCode)}`;
}

export function productVisualUrl(candidate: unknown, mediaBaseUrl?: string): string | undefined {
  if (typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)) {
    const media = candidate as MediaDescriptor;
    const deliveredUrl = media.deliveryUrl ?? media.publicUrl ?? media.url;
    if (deliveredUrl) return deliveredUrl;
    const mediaCode = media.mediaCode ?? media.code;
    if (mediaBaseUrl && mediaCode) return mediaDeliveryUrl(mediaBaseUrl, mediaCode);
    return undefined;
  }
  if (typeof candidate !== 'string') return undefined;
  if (/^https?:\/\//u.test(candidate)) return candidate;
  if (/^data:image\//u.test(candidate)) return candidate;
  if (candidate.startsWith('/')) return candidate;
  if (mediaBaseUrl && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(candidate)) return mediaDeliveryUrl(mediaBaseUrl, candidate);
  return undefined;
}

export function productImageUrl(product: ProductCard, mediaBaseUrl?: string): string | undefined {
  return productVisualUrl(product.media?.primary, mediaBaseUrl);
}

export function productHoverImageUrl(product: ProductCard, primaryImageUrl?: string, mediaBaseUrl?: string): string | undefined {
  const secondaryImage = productVisualUrl(product.media?.secondary, mediaBaseUrl);
  if (secondaryImage && secondaryImage !== primaryImageUrl) return secondaryImage;
  return productGalleryUrls(product, mediaBaseUrl).find((candidate) => candidate !== primaryImageUrl);
}

export function productGalleryUrls(product: ProductCard, mediaBaseUrl?: string): readonly string[] {
  const declaredGallery = (product.media?.gallery ?? [])
    .map((item) => productVisualUrl(item, mediaBaseUrl))
    .filter((item): item is string => Boolean(item));
  if (declaredGallery.length > 0) return declaredGallery;
  const primaryImage = productImageUrl(product, mediaBaseUrl);
  return primaryImage ? [primaryImage] : [];
}

export function productGalleryImageUrl(product: ProductCard, candidate: unknown, mediaBaseUrl?: string): string | undefined {
  return productVisualUrl(candidate, mediaBaseUrl) ?? productImageUrl(product, mediaBaseUrl);
}

export function ProductMediaPlaceholder({
  label,
  product,
}: {
  readonly label?: string;
  readonly product: Pick<ProductCard, 'name' | 'productCode'>;
}) {
  const displayLabel = label ?? product.name ?? product.productCode;
  return (
    <div aria-label={`${displayLabel} product image unavailable`} className="product-media-placeholder" role="img" />
  );
}
