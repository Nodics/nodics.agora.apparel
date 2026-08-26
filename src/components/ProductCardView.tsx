import type { ProductCard } from '../api/commerceClient';
import { PRODUCT_CARD_RENDERER, resolveProductDomain, storefrontRendererRegistry } from '../rendering/storefrontRendererRegistry';

export interface ProductCardViewProps {
  readonly product: ProductCard;
  readonly onOpen: (productCode: string) => void;
  readonly onAdd: (product: ProductCard) => void;
  readonly onQuickView: (product: ProductCard) => void;
  readonly onWishlist: (product: ProductCard) => void;
  readonly onCompare: (product: ProductCard) => void;
  readonly wishlistSelected?: boolean;
  readonly compareSelected?: boolean;
}

export function ProductCardView({
  product,
  compareSelected = false,
  onAdd,
  onCompare,
  onOpen,
  onQuickView,
  onWishlist,
  wishlistSelected = false,
}: ProductCardViewProps) {
  const Renderer = storefrontRendererRegistry.resolve(PRODUCT_CARD_RENDERER, resolveProductDomain(product));
  return <Renderer product={product} compareSelected={compareSelected} onAdd={onAdd} onCompare={onCompare} onOpen={onOpen} onQuickView={onQuickView} onWishlist={onWishlist} wishlistSelected={wishlistSelected} />;
}
