import type { MouseEvent, ReactNode } from 'react';
import type { ProductCardViewProps } from '../../components/ProductCardView';
import { ProductMediaPlaceholder, productHoverImageUrl, productImageUrl } from '../../media/productVisual';
import { runtimeConfig } from '../../runtime/config';
import { productAvailabilityLabel } from '../availabilityPresentation';
import { productBrandLabel } from '../productPresentation';

const DEFAULT_PRODUCT_ACTION_LABELS = Object.freeze({
  addToCart: 'Add to cart',
  addToWishlist: 'Add to wishlist',
  compare: 'Compare',
  comparing: 'Comparing',
  quickAdd: 'Quick Add',
  quickView: 'Quick view',
  removeFromCompare: 'Remove from compare',
  removeFromWishlist: 'Remove from wishlist',
  viewDetailsPrefix: 'View details for',
  wishlist: 'Wishlist',
  wishlisted: 'Wishlisted',
});

export function CommerceProductCardView({
  labels,
  product,
  compareSelected = false,
  domainDetails,
  onAdd,
  onCompare,
  onOpen,
  onQuickAdd,
  onQuickView,
  onWishlist,
  productOptionControls,
  selectedImageUrl,
  selectedVariantCode,
  wishlistSelected = false
}: ProductCardViewProps & {
  readonly domainDetails?: ReactNode;
  readonly productOptionControls?: ReactNode;
  readonly selectedImageUrl?: string;
  readonly selectedVariantCode?: string;
}) {
  const effectiveLabels = { ...DEFAULT_PRODUCT_ACTION_LABELS, ...labels };
  const image = selectedImageUrl ?? productImageUrl(product, runtimeConfig.mediaBaseUrl);
  const hoverImage = productHoverImageUrl(product, image, runtimeConfig.mediaBaseUrl);
  const brand = productBrandLabel(product);
  const handleAction = function (event: MouseEvent<HTMLButtonElement>, action: () => void) {
    event.preventDefault();
    event.stopPropagation();
    action();
  };
  return <article className={hoverImage ? 'product-card has-hover-image' : 'product-card'} data-commerce-renderer="product-card">
    <div className="product-card-media">
      <button aria-label={`${effectiveLabels.viewDetailsPrefix} ${product.name ?? product.productCode}`} className="image-button" onClick={() => onOpen(product.productCode)} type="button">
        {image ? (
          <>
            <img alt="" className="product-card-primary-image" src={image} />
            {hoverImage ? <img alt="" className="product-card-hover-image" src={hoverImage} /> : null}
          </>
        ) : <ProductMediaPlaceholder product={product} />}
      </button>
      <div className="quick-icon-actions" aria-label={`${product.name ?? product.productCode} quick actions`}>
        <button aria-label={wishlistSelected ? `${effectiveLabels.removeFromWishlist} ${product.name ?? product.productCode}` : `${effectiveLabels.addToWishlist} ${product.name ?? product.productCode}`} className={wishlistSelected ? 'is-selected' : undefined} onClick={(event) => handleAction(event, () => onWishlist(product))} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20.3 4.7 13A4.6 4.6 0 0 1 11 6.3l1 1 1-1A4.6 4.6 0 0 1 19.3 13L12 20.3Z" /></svg>
        </button>
        <button aria-label={compareSelected ? `${effectiveLabels.removeFromCompare} ${product.name ?? product.productCode}` : `${effectiveLabels.compare} ${product.name ?? product.productCode}`} className={compareSelected ? 'is-selected' : undefined} onClick={(event) => handleAction(event, () => onCompare(product))} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v12m0 0 3-3m-3 3-3-3m13 7V8m0 0 3 3m-3-3-3 3M5 4h4M15 20h4" /></svg>
        </button>
        <button aria-label={`${effectiveLabels.quickView} ${product.name ?? product.productCode}`} onClick={(event) => handleAction(event, () => onQuickView(product))} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" /></svg>
        </button>
      </div>
      <button aria-label={`${effectiveLabels.quickAdd} ${product.name ?? product.productCode}`} className="quick-add-button" onClick={(event) => handleAction(event, () => onQuickAdd(product, selectedVariantCode))} type="button">{effectiveLabels.quickAdd}</button>
      {domainDetails}
    </div>
    <div className="product-card-content">
      <p className="muted product-card-brand">{brand ?? 'Nodics'}</p>
      <h3>{product.name}</h3>
      <div className="product-meta"><span>{product.price?.currency} {product.price?.unitAmount}</span><span>{productAvailabilityLabel(product)}</span></div>
      <p>{product.summary}</p>
      {productOptionControls}
      <div className="product-card-actions"><button onClick={(event) => handleAction(event, () => onAdd(product, 1, selectedVariantCode))} type="button">{effectiveLabels.addToCart}</button><button className="secondary" onClick={(event) => handleAction(event, () => onWishlist(product))} type="button">{wishlistSelected ? effectiveLabels.wishlisted : effectiveLabels.wishlist}</button><button className="secondary" onClick={(event) => handleAction(event, () => onCompare(product))} type="button">{compareSelected ? effectiveLabels.comparing : effectiveLabels.compare}</button></div>
    </div>
  </article>;
}
