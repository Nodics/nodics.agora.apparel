import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductCardView } from '../components/ProductCardView';
import '../composition/apparel';
import { RendererRegistry } from '../domainCommerceUi';
import { PRODUCT_CARD_RENDERER, storefrontRendererRegistry } from './storefrontRendererRegistry';

const actions = { onAdd: () => undefined, onCompare: () => undefined, onOpen: () => undefined, onQuickAdd: () => undefined, onQuickView: () => undefined, onWishlist: () => undefined };

describe('hierarchical storefront renderer registry', () => {
  it('resolves customer over domain over commerce', () => {
    const commerce = () => <span>commerce</span>;
    const telco = () => <span>telco</span>; const customer = () => <span>customer</span>;
    const registry = new RendererRegistry<{ value: string }>()
      .register({ key: 'card', layer: 'commerce', component: commerce })
      .register({ key: 'card', layer: 'domain', domain: 'telco', component: telco })
      .register({ key: 'card', layer: 'customer', domain: 'telco', component: customer });
    expect(registry.resolve('card', 'telco')).toBe(customer);
    expect(registry.resolve('card', 'electronics')).toBe(commerce);
  });

  it('registers one Commerce fallback and only the Apparel domain renderer', () => {
    const registrations = storefrontRendererRegistry.registrations().filter(item => item.key === PRODUCT_CARD_RENDERER);
    expect(registrations.map(item => `${item.layer}:${item.domain ?? '*'}`)).toEqual(['commerce:*', 'domain:apparel']);
  });

  it('recovers from unknown renderer keys with structured diagnostics', () => {
    const diagnostics: unknown[] = []; const fallback = () => <span>Unavailable component</span>;
    const registry = new RendererRegistry<{ value: string }>(diagnostic => diagnostics.push(diagnostic));
    expect(registry.resolve('unknown.renderer', 'apparel', fallback)).toBe(fallback);
    expect(diagnostics).toEqual([{ code: 'RENDERER_NOT_FOUND', key: 'unknown.renderer', domain: 'apparel' }]);
  });

  it('renders the Apparel specialization without bundling unrelated domain UI into the selected card', () => {
    const domain = 'apparel';
    const product = { productCode: 'agoraApparelDress', name: 'Dress', apparel: { options: [{ sizeCode: 'S' }] } };
    const { container } = render(<ProductCardView {...actions} product={product} />);
    expect(container.querySelector(`[data-domain-renderer="${domain}"]`)).not.toBeNull();
    expect(container.querySelectorAll('[data-domain-renderer]').length).toBe(1);
    expect(screen.getByRole('heading', { name: product.name })).toBeTruthy();
    expect(screen.getByRole('img', { name: `${product.name} product image unavailable` })).toBeTruthy();
  });

  it('renders customer-facing availability labels instead of backend inventory codes', () => {
    render(<ProductCardView {...actions} product={{ productCode: 'agoraApparelDress', name: 'Dress', availability: { available: true, status: 'IN_STOCK' } }} />);
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByText('IN_STOCK')).toBeNull();
  });
});
