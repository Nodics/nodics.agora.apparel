import { CommerceProductCardView } from '../commerce/components/CommerceProductCardView';
import type { ProductCardViewProps } from '../components/ProductCardView';
import type { ProductCard } from '../api/commerceClient';
import { RendererRegistry, type StorefrontDomain } from 'domain.commerce.ui';

export const PRODUCT_CARD_RENDERER = 'commerce.product.card';
export const storefrontRendererRegistry = new RendererRegistry<ProductCardViewProps>()
  .register({ key: PRODUCT_CARD_RENDERER, layer: 'commerce', component: CommerceProductCardView });

export function resolveProductDomain(product: ProductCard): StorefrontDomain {
  if (product.apparel || product.productCode.startsWith('agoraApparel') || product.productCode.startsWith('agora')) return 'apparel';
  return 'apparel';
}
