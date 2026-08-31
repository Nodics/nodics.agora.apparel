import type { ProductCard } from '../api/commerceClient';
import { PRODUCT_CARD_RENDERER, resolveProductDomain, storefrontRendererRegistry } from '../rendering/storefrontRendererRegistry';

export interface ProductCardViewProps {
  readonly product: ProductCard;
  readonly labels?: ProductActionLabels;
  readonly onOpen: (productCode: string) => void;
  readonly onAdd: (product: ProductCard, quantity?: number, variantCode?: string) => void;
  readonly onQuickAdd: (product: ProductCard, variantCode?: string) => void;
  readonly onQuickView: (product: ProductCard) => void;
  readonly onWishlist: (product: ProductCard) => void;
  readonly onCompare: (product: ProductCard) => void;
  readonly wishlistSelected?: boolean;
  readonly compareSelected?: boolean;
}

export interface ProductActionLabels {
  readonly addToCart?: string;
  readonly addToWishlist?: string;
  readonly availableColors?: string;
  readonly availableSizes?: string;
  readonly compare?: string;
  readonly comparing?: string;
  readonly quickAdd?: string;
  readonly quickView?: string;
  readonly removeFromCompare?: string;
  readonly removeFromWishlist?: string;
  readonly selectColorPrefix?: string;
  readonly viewDetailsPrefix?: string;
  readonly wishlist?: string;
  readonly wishlisted?: string;
}

export function ProductCardView({
  labels,
  product,
  compareSelected = false,
  onAdd,
  onCompare,
  onOpen,
  onQuickAdd,
  onQuickView,
  onWishlist,
  wishlistSelected = false,
}: ProductCardViewProps) {
  const Renderer = storefrontRendererRegistry.resolve(PRODUCT_CARD_RENDERER, resolveProductDomain(product));
  return <Renderer labels={labels} product={product} compareSelected={compareSelected} onAdd={onAdd} onCompare={onCompare} onOpen={onOpen} onQuickAdd={onQuickAdd} onQuickView={onQuickView} onWishlist={onWishlist} wishlistSelected={wishlistSelected} />;
}
