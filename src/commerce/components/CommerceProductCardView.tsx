import type { CSSProperties, ReactNode } from 'react';
import type { ProductCardViewProps } from '../../components/ProductCardView';
import { ProductMediaPlaceholder, productImageUrl } from '../../media/productVisual';
import { runtimeConfig } from '../../runtime/config';
import { productAvailabilityLabel } from '../availabilityPresentation';
import { productBrandLabel } from '../productPresentation';

const swatchPalette: Readonly<Record<string, string>> = Object.freeze({
  amber: '#c78120',
  black: '#211f1a',
  clay: '#b86642',
  cocoa: '#7a5641',
  cream: '#fff6df',
  ivory: '#f4efe4',
  mist: '#cbd4d5',
  navy: '#202b45',
  oat: '#d8cfbf',
  olive: '#767c59',
  rose: '#d9a6a6',
  sand: '#d8c6a4'
});

const productSwatches = function (product: ProductCardViewProps['product']) {
  const swatches = new Map<string, { readonly code: string; readonly label: string; readonly value: string }>();
  (product.apparel?.options ?? []).forEach((option) => {
    const colourCode = option.colourCode ?? option.colorCode;
    if (!colourCode || swatches.has(colourCode)) return;
    swatches.set(colourCode, {
      code: colourCode,
      label: colourCode.replace(/[-_]+/g, ' '),
      value: swatchPalette[colourCode] ?? '#f6c100'
    });
  });
  return Array.from(swatches.values()).slice(0, 4);
};

export function CommerceProductCardView({ product, compareSelected = false, domainDetails, onAdd, onCompare, onOpen, onQuickView, onWishlist, wishlistSelected = false }: ProductCardViewProps & { readonly domainDetails?: ReactNode }) {
  const image = productImageUrl(product, runtimeConfig.mediaBaseUrl);
  const brand = productBrandLabel(product);
  const swatches = productSwatches(product);
  return <article className="product-card" data-commerce-renderer="product-card">
    <div className="product-card-media">
      <button aria-label={`View details for ${product.name ?? product.productCode}`} className="image-button" onClick={() => onOpen(product.productCode)} type="button">
        {image ? <img alt="" src={image} /> : <ProductMediaPlaceholder product={product} />}
      </button>
      <div className="quick-icon-actions" aria-label={`${product.name ?? product.productCode} quick actions`}>
        <button aria-label={wishlistSelected ? `Remove ${product.name ?? product.productCode} from wishlist` : `Add ${product.name ?? product.productCode} to wishlist`} className={wishlistSelected ? 'is-selected' : undefined} onClick={() => onWishlist(product)} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20.3 4.7 13A4.6 4.6 0 0 1 11 6.3l1 1 1-1A4.6 4.6 0 0 1 19.3 13L12 20.3Z" /></svg>
        </button>
        <button aria-label={compareSelected ? `Remove ${product.name ?? product.productCode} from compare` : `Compare ${product.name ?? product.productCode}`} className={compareSelected ? 'is-selected' : undefined} onClick={() => onCompare(product)} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v12m0 0 3-3m-3 3-3-3m13 7V8m0 0 3 3m-3-3-3 3M5 4h4M15 20h4" /></svg>
        </button>
        <button aria-label={`Quick view ${product.name ?? product.productCode}`} onClick={() => onQuickView(product)} type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" /></svg>
        </button>
      </div>
      <button className="quick-add-button" onClick={() => onAdd(product)} type="button">Quick Add</button>
      {domainDetails}
    </div>
    <h3>{product.name}</h3><p>{product.summary}</p><p className="muted">{brand ?? 'Nodics'}</p>
    {swatches.length ? (
      <div className="color-swatches" aria-label="Available colors">
        {swatches.map((swatch) => <span aria-label={swatch.label} key={swatch.code} style={{ '--swatch-color': swatch.value } as CSSProperties} />)}
      </div>
    ) : null}
    <div className="product-meta"><span>{product.price?.currency} {product.price?.unitAmount}</span><span>{productAvailabilityLabel(product)}</span></div>
    <div className="product-card-actions"><button onClick={() => onAdd(product)} type="button">Add to cart</button><button className="secondary" onClick={() => onWishlist(product)} type="button">{wishlistSelected ? 'Wishlisted' : 'Wishlist'}</button><button className="secondary" onClick={() => onCompare(product)} type="button">{compareSelected ? 'Comparing' : 'Compare'}</button></div>
  </article>;
}
