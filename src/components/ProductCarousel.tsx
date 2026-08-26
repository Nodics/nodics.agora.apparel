import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import { useMemo } from 'react';

import type { ProductCard } from '../api/commerceClient';
import { ProductCardView } from './ProductCardView';

export interface ProductCarouselProps {
  readonly ariaLabel: string;
  readonly compareProductCodes: readonly string[];
  readonly direction?: 'forward' | 'backward';
  readonly onAdd: (product: ProductCard) => void;
  readonly onCompare: (product: ProductCard) => void;
  readonly onOpen: (productCode: string) => void;
  readonly onQuickView: (product: ProductCard) => void;
  readonly onWishlist: (product: ProductCard) => void;
  readonly products: readonly ProductCard[];
  readonly wishlistProductCodes: readonly string[];
}

export function ProductCarousel({
  ariaLabel,
  compareProductCodes,
  direction = 'forward',
  onAdd,
  onCompare,
  onOpen,
  onQuickView,
  onWishlist,
  products,
  wishlistProductCodes,
}: ProductCarouselProps) {
  const canUseEmbla = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  if (!canUseEmbla) {
    return (
      <ProductCarouselStatic
        ariaLabel={ariaLabel}
        compareProductCodes={compareProductCodes}
        onAdd={onAdd}
        onCompare={onCompare}
        onOpen={onOpen}
        onQuickView={onQuickView}
        onWishlist={onWishlist}
        products={products}
        wishlistProductCodes={wishlistProductCodes}
      />
    );
  }
  return (
    <ProductCarouselEmbla
      ariaLabel={ariaLabel}
      compareProductCodes={compareProductCodes}
      direction={direction}
      onAdd={onAdd}
      onCompare={onCompare}
      onOpen={onOpen}
      onQuickView={onQuickView}
      onWishlist={onWishlist}
      products={products}
      wishlistProductCodes={wishlistProductCodes}
    />
  );
}

function ProductCarouselEmbla({
  ariaLabel,
  compareProductCodes,
  direction = 'forward',
  onAdd,
  onCompare,
  onOpen,
  onQuickView,
  onWishlist,
  products,
  wishlistProductCodes,
}: ProductCarouselProps) {
  const plugins = useMemo(() => [
    AutoScroll({
      direction,
      playOnInit: true,
      speed: 0.45,
      startDelay: 900,
      stopOnFocusIn: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ], [direction]);
  const [viewportRef] = useEmblaCarousel({
    align: 'start',
    containScroll: false,
    dragFree: true,
    loop: products.length > 4,
    skipSnaps: true,
  }, plugins);

  return (
    <section className="product-carousel" aria-label={ariaLabel}>
      <div className="product-carousel-viewport" ref={viewportRef}>
        <div className="product-carousel-track">
          {products.map((product) => (
            <div className="product-carousel-slide" key={product.productCode}>
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                onAdd={onAdd}
                onCompare={onCompare}
                onOpen={onOpen}
                onQuickView={onQuickView}
                onWishlist={onWishlist}
                product={product}
                wishlistSelected={wishlistProductCodes.includes(product.productCode)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCarouselStatic({
  ariaLabel,
  compareProductCodes,
  onAdd,
  onCompare,
  onOpen,
  onQuickView,
  onWishlist,
  products,
  wishlistProductCodes,
}: Omit<ProductCarouselProps, 'direction'>) {
  return (
    <section className="product-carousel" aria-label={ariaLabel}>
      <div className="product-carousel-viewport">
        <div className="product-carousel-track">
          {products.map((product) => (
            <div className="product-carousel-slide" key={product.productCode}>
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                onAdd={onAdd}
                onCompare={onCompare}
                onOpen={onOpen}
                onQuickView={onQuickView}
                onWishlist={onWishlist}
                product={product}
                wishlistSelected={wishlistProductCodes.includes(product.productCode)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
