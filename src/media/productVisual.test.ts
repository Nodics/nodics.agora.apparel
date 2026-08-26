import { describe, expect, it } from 'vitest';
import { productGalleryUrls, productImageUrl, productVisualUrl } from './productVisual';
import type { ProductCard } from '../api/commerceClient';

describe('product media projection', () => {
  it('renders backend-projected media descriptor URLs from the Product media contract', () => {
    const product: ProductCard = {
      productCode: 'agoraLinenWrapDress',
      name: 'Linen Wrap Dress',
      media: {
        primary: {
          mediaCode: 'agora-owned-product-linen-wrap-dress-primary',
          deliveryUrl: 'http://127.0.0.1:4314/nodics/media/v0/content/agora-owned-product-linen-wrap-dress-primary',
          mimeType: 'image/jpeg',
          altText: 'Linen wrap dress'
        },
        gallery: [
          {
            mediaCode: 'agora-owned-product-linen-wrap-dress-primary',
            deliveryUrl: 'http://127.0.0.1:4314/nodics/media/v0/content/agora-owned-product-linen-wrap-dress-primary'
          }
        ]
      }
    };

    expect(productImageUrl(product, 'http://localhost:4314')).toBe('http://127.0.0.1:4314/nodics/media/v0/content/agora-owned-product-linen-wrap-dress-primary');
    expect(productGalleryUrls(product, 'http://localhost:4314')).toEqual(['http://127.0.0.1:4314/nodics/media/v0/content/agora-owned-product-linen-wrap-dress-primary']);
  });

  it('can resolve a declared media code when a backend descriptor has not expanded it yet', () => {
    expect(productVisualUrl('agora-owned-product-satin-midi-dress-primary', 'http://localhost:4314')).toBe('http://localhost:4314/nodics/media/v0/content/agora-owned-product-satin-midi-dress-primary');
  });

  it('does not render product media when the Product media contract is absent', () => {
    const product: ProductCard = {
      productCode: 'withoutMedia',
      name: 'Without media'
    };

    expect(productImageUrl(product, 'http://localhost:4314')).toBeUndefined();
    expect(productGalleryUrls(product, 'http://localhost:4314')).toEqual([]);
  });
});
