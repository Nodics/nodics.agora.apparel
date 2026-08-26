import type { ProductCardViewProps } from '../../components/ProductCardView';
import { CommerceProductCardView } from '../../commerce/components/CommerceProductCardView';

const nonDisplaySizes = Object.freeze(['ONE', 'ONE_SIZE']);
const displaySize = function (size: string | undefined): size is string {
  return Boolean(size) && !nonDisplaySizes.includes(size as string);
};

export function ApparelProductCardView(props: ProductCardViewProps) {
  const sizes = [...new Set((props.product.apparel?.options ?? []).map((option) => option.sizeCode).filter(displaySize))];
  const domainDetails = sizes.length
    ? <div className="sizes" aria-label="Available sizes" data-domain-renderer="apparel">{sizes.map((size) => <span key={size}>{size}</span>)}</div>
    : undefined;
  return <CommerceProductCardView {...props} domainDetails={domainDetails} />;
}
