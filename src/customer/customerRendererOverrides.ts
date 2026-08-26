import type { ComponentType } from 'react';
import type { ProductCardViewProps } from '../components/ProductCardView';
import type { StorefrontDomain } from '../domainCommerceUi';
import { storefrontRendererRegistry } from '../rendering/storefrontRendererRegistry';

/** Registers an explicit final customer override without changing Commerce or accelerator source. */
export function registerCustomerProductRenderer(key: string, domain: StorefrontDomain, component: ComponentType<ProductCardViewProps>) {
  storefrontRendererRegistry.register({ key, layer: 'customer', domain, component });
}
