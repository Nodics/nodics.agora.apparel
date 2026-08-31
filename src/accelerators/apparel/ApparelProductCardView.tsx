import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import type { ProductCardViewProps } from '../../components/ProductCardView';
import { CommerceProductCardView } from '../../commerce/components/CommerceProductCardView';
import { runtimeConfig } from '../../runtime/config';
import {
  apparelColorOptions,
  apparelImageUrlForVariant,
  apparelSelectionForVariant,
  apparelSizeOptions,
  apparelVariantForSelection,
} from './apparelOptions';

const DEFAULT_APPAREL_ACTION_LABELS = Object.freeze({
  availableColors: 'Available colors',
  availableSizes: 'Available sizes',
  selectColorPrefix: 'Select',
});

export function ApparelProductCardView(props: ProductCardViewProps) {
  const labels = { ...DEFAULT_APPAREL_ACTION_LABELS, ...props.labels };
  const [selectedVariantCode, setSelectedVariantCode] = useState(props.product.defaultVariantCode ?? props.product.variantCodes?.[0]);
  const selectedOption = useMemo(() => apparelSelectionForVariant(props.product, selectedVariantCode), [props.product, selectedVariantCode]);
  const colors = useMemo(() => apparelColorOptions(props.product).slice(0, 4), [props.product]);
  const sizes = useMemo(() => apparelSizeOptions(props.product, selectedOption.colourCode), [props.product, selectedOption.colourCode]);
  const selectedImageUrl = apparelImageUrlForVariant(props.product, selectedOption.variantCode, runtimeConfig.mediaBaseUrl);
  const selectColour = function (colourCode: string) {
    setSelectedVariantCode(apparelVariantForSelection(props.product, colourCode, selectedOption.sizeCode));
  };
  const selectSize = function (sizeCode: string) {
    setSelectedVariantCode(apparelVariantForSelection(props.product, selectedOption.colourCode, sizeCode));
  };
  const domainDetails = sizes.length
    ? <div className="sizes" aria-label={labels.availableSizes} data-domain-renderer="apparel">{sizes.map((size) => <button aria-pressed={selectedOption.sizeCode === size} className={selectedOption.sizeCode === size ? 'is-selected' : undefined} key={size} onClick={() => selectSize(size)} type="button">{size}</button>)}</div>
    : undefined;
  const colorControls = colors.length
    ? (
      <div className="color-swatches" aria-label={labels.availableColors}>
        {colors.map((color) => (
          <button
            aria-label={`${labels.selectColorPrefix} ${color.label}`}
            aria-pressed={selectedOption.colourCode === color.code}
            className={selectedOption.colourCode === color.code ? 'is-selected' : undefined}
            key={color.code}
            onClick={() => selectColour(color.code)}
            style={{ '--swatch-color': color.value } as CSSProperties}
            type="button"
          />
        ))}
      </div>
    )
    : undefined;
  const listSizeControls = sizes.length
    ? (
      <div className="apparel-card-size-options" aria-label={labels.availableSizes}>
        {sizes.map((size) => (
          <button
            aria-pressed={selectedOption.sizeCode === size}
            className={selectedOption.sizeCode === size ? 'is-selected' : undefined}
            key={size}
            onClick={() => selectSize(size)}
            type="button"
          >
            {size}
          </button>
        ))}
      </div>
    )
    : undefined;
  const productOptionControls = colorControls || listSizeControls
    ? <div className="apparel-card-options">{colorControls}{listSizeControls}</div>
    : undefined;
  return <CommerceProductCardView {...props} domainDetails={domainDetails} productOptionControls={productOptionControls} selectedImageUrl={selectedImageUrl} selectedVariantCode={selectedOption.variantCode} />;
}
