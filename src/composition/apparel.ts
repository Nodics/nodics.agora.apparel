import { ApparelProductCardView } from '../accelerators/apparel/ApparelProductCardView';
import { PRODUCT_CARD_RENDERER, storefrontRendererRegistry } from '../rendering/storefrontRendererRegistry';
import { storefrontPageRendererRegistry } from '../rendering/storefrontPageRendererRegistry';
import { StorefrontPage } from '../pages/StorefrontPage';
storefrontRendererRegistry.register({ key: PRODUCT_CARD_RENDERER, layer: 'domain', domain: 'apparel', component: ApparelProductCardView });
storefrontRendererRegistry.register({ key: 'agora.apparel.product-card', layer: 'domain', domain: 'apparel', component: ApparelProductCardView });
storefrontPageRendererRegistry.register({ key: 'agora.apparel.page.home', layer: 'domain', domain: 'apparel', component: StorefrontPage });
export const activeDomains = ['apparel'] as const;
