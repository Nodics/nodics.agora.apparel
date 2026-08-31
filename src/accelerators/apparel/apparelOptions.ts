import type { ProductCard, ProductDetail } from '../../api/commerceClient';
import { productImageUrl, productVisualUrl } from '../../media/productVisual';

type ApparelProduct = ProductCard | ProductDetail | undefined;
type ApparelOption = NonNullable<NonNullable<ProductCard['apparel']>['options']>[number];

const nonDisplaySizes = Object.freeze(['ONE', 'ONE_SIZE']);

export const apparelSwatchPalette: Readonly<Record<string, string>> = Object.freeze({
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

export const apparelDisplayLabel = function (value: string | undefined): string {
  return value ? value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
};

export const apparelOptionColourCode = function (option: Pick<ApparelOption, 'colourCode' | 'colorCode'>): string | undefined {
  return option.colourCode ?? option.colorCode;
};

export const apparelColorOptions = function (product: ApparelProduct) {
  const options = new Map<string, { readonly code: string; readonly label: string; readonly value: string }>();
  (product?.apparel?.options ?? []).forEach((option) => {
    const colourCode = apparelOptionColourCode(option);
    if (!colourCode || options.has(colourCode)) return;
    options.set(colourCode, {
      code: colourCode,
      label: apparelDisplayLabel(colourCode),
      value: apparelSwatchPalette[colourCode] ?? '#f6c100'
    });
  });
  return Array.from(options.values());
};

export const apparelSizeOptions = function (product: ApparelProduct, colourCode?: string) {
  const sizes = new Set<string>();
  (product?.apparel?.options ?? []).forEach((option) => {
    if (colourCode && apparelOptionColourCode(option) !== colourCode) return;
    if (!option.sizeCode || nonDisplaySizes.includes(option.sizeCode)) return;
    sizes.add(option.sizeCode);
  });
  return Array.from(sizes);
};

export const apparelInitialVariantCode = function (product: ApparelProduct): string | undefined {
  return product?.defaultVariantCode ?? product?.variantCodes?.[0] ?? product?.apparel?.options?.find((option) => option.variantCode)?.variantCode;
};

export const apparelOptionForVariant = function (product: ApparelProduct, variantCode?: string): ApparelOption | undefined {
  const options = product?.apparel?.options ?? [];
  if (!options.length) return undefined;
  return options.find((option) => option.variantCode === variantCode) ?? options.find((option) => option.variantCode === apparelInitialVariantCode(product)) ?? options[0];
};

export const apparelSelectionForVariant = function (product: ApparelProduct, variantCode?: string) {
  const option = apparelOptionForVariant(product, variantCode);
  return {
    colourCode: option ? apparelOptionColourCode(option) : undefined,
    sizeCode: option?.sizeCode,
    variantCode: option?.variantCode ?? apparelInitialVariantCode(product)
  };
};

export const apparelVariantForSelection = function (product: ApparelProduct, colourCode?: string, sizeCode?: string): string | undefined {
  return (product?.apparel?.options ?? []).find((option) => {
    if (colourCode && apparelOptionColourCode(option) !== colourCode) return false;
    if (sizeCode && option.sizeCode !== sizeCode) return false;
    return Boolean(option.variantCode);
  })?.variantCode ?? apparelInitialVariantCode(product);
};

export const apparelImageUrlForVariant = function (product: ProductCard, variantCode: string | undefined, mediaBaseUrl?: string): string | undefined {
  const selection = apparelSelectionForVariant(product, variantCode);
  const colourCode = selection.colourCode?.toLowerCase();
  const galleryMatch = (product.media?.gallery ?? []).find((media) => {
    const searchable = [media.code, media.mediaCode, media.name, media.description, media.altText].filter(Boolean).join(' ').toLowerCase();
    return Boolean(colourCode && searchable.includes(colourCode));
  });
  return productVisualUrl(galleryMatch, mediaBaseUrl) ?? productImageUrl(product, mediaBaseUrl);
};
