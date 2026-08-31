import type { CmsComponentContract, CmsComponentMediaContract, CmsResolvedPageContract } from './cmsContract';
import type { AgoraRuntimeConfig } from '../runtime/config';

export interface AgoraLinkAction {
  readonly label: string;
  readonly collectionCode?: string;
  readonly path?: string;
}

export interface AgoraHeaderNavigationItem extends AgoraLinkAction {
  readonly dropdown?: boolean;
}

export interface AgoraMegaMenuLink extends AgoraLinkAction {
  readonly summary?: string;
  readonly badge?: string;
  readonly mediaCode?: string;
  readonly image?: string;
  readonly alt?: string;
}

export interface AgoraMegaMenuGroup {
  readonly title: string;
  readonly summary?: string;
  readonly links: readonly AgoraMegaMenuLink[];
}

export interface AgoraMegaMenuTile extends AgoraMediaItem {
  readonly title: string;
  readonly summary?: string;
  readonly badge?: string;
  readonly action?: AgoraLinkAction;
}

export interface AgoraMegaMenuPromo extends AgoraLinkAction {
  readonly eyebrow?: string;
  readonly text?: string;
  readonly badge?: string;
}

export interface AgoraMegaMenu {
  readonly code: string;
  readonly label: string;
  readonly eyebrow?: string;
  readonly summary?: string;
  readonly path?: string;
  readonly collectionCode?: string;
  readonly badge?: string;
  readonly groups: readonly AgoraMegaMenuGroup[];
  readonly featureTiles: readonly AgoraMegaMenuTile[];
  readonly promoStripe: readonly AgoraMegaMenuPromo[];
}

export interface AgoraHeaderContent {
  readonly logoText?: string;
  readonly subtitle?: string;
  readonly rootCollectionCode?: string;
  readonly searchPlaceholder?: string;
  readonly searchEnabled: boolean;
  readonly cartPreviewEnabled: boolean;
  readonly accountPreviewEnabled: boolean;
  readonly wishlistPreviewEnabled: boolean;
  readonly utilityLinks: readonly AgoraLinkAction[];
  readonly preferences: readonly AgoraLinkAction[];
  readonly navigation: readonly AgoraHeaderNavigationItem[];
  readonly megaMenus: readonly AgoraMegaMenu[];
}

export interface AgoraStorefrontLabels {
  readonly addToCart?: string;
  readonly addToWishlist?: string;
  readonly availableColors?: string;
  readonly availableSizes?: string;
  readonly backToListing?: string;
  readonly bestSellingProductsAriaLabel?: string;
  readonly buyNow?: string;
  readonly closeQuickAdd?: string;
  readonly closeQuickView?: string;
  readonly color?: string;
  readonly colors?: string;
  readonly compare?: string;
  readonly comparing?: string;
  readonly decreaseQuantity?: string;
  readonly description?: string;
  readonly featuredProductsAriaLabel?: string;
  readonly increaseQuantity?: string;
  readonly quickViewTitle?: string;
  readonly quickAdd?: string;
  readonly quickView?: string;
  readonly quantity?: string;
  readonly recommendationsEyebrow?: string;
  readonly recommendationsHeading?: string;
  readonly recommendationsSummary?: string;
  readonly removeFromCompare?: string;
  readonly removeFromWishlist?: string;
  readonly reviews?: string;
  readonly selectColorPrefix?: string;
  readonly shippingReturns?: string;
  readonly shippingReturnsText?: string;
  readonly size?: string;
  readonly viewDetailsPrefix?: string;
  readonly viewFullDetails?: string;
  readonly wishlist?: string;
  readonly wishlisted?: string;
}

export interface AgoraMediaItem {
  readonly image?: string;
  readonly mediaCode?: string;
  readonly media?: CmsComponentMediaContract;
  readonly alt?: string;
}

export interface AgoraHeroSlide extends AgoraMediaItem {
  readonly eyebrow: string;
  readonly title: string;
  readonly primaryAction?: AgoraLinkAction;
  readonly secondaryAction?: AgoraLinkAction;
}

export interface AgoraCollectionTile extends AgoraMediaItem {
  readonly code: string;
  readonly label: string;
  readonly itemCount?: string;
  readonly path?: string;
  readonly summary?: string;
}

export interface AgoraListingChoice {
  readonly code: string;
  readonly label: string;
}

export interface AgoraListingFilterGroup extends AgoraListingChoice {
  readonly enabled?: boolean;
}

export interface AgoraListingToolbarConfiguration {
  readonly ariaLabel?: string;
  readonly filterLabel?: string;
  readonly saleOnlyLabel?: string;
  readonly sortLabel?: string;
  readonly sortAriaLabel?: string;
  readonly layoutAriaLabel?: string;
  readonly activeFiltersAriaLabel?: string;
  readonly clearAllLabel?: string;
  readonly defaultLayout?: string;
  readonly layoutOptions?: readonly AgoraListingChoice[];
  readonly sortOptions?: readonly AgoraListingChoice[];
}

export interface AgoraListingFilterDrawerConfiguration {
  readonly ariaLabel?: string;
  readonly title?: string;
  readonly closeLabel?: string;
  readonly resetLabel?: string;
  readonly applyLabel?: string;
  readonly priceLabel?: string;
  readonly minPriceLabel?: string;
  readonly maxPriceLabel?: string;
  readonly minPricePlaceholder?: string;
  readonly maxPricePlaceholder?: string;
  readonly groups?: readonly AgoraListingFilterGroup[];
}

export interface AgoraProductRailContent {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly summary?: string;
  readonly ariaLabel?: string;
  readonly pageSize?: number;
  readonly productCodes?: readonly string[];
  readonly direction?: 'forward' | 'backward';
}

export interface AgoraCollectionIndexHighlight {
  readonly label?: string;
  readonly title: string;
  readonly text?: string;
}

export interface AgoraListingExperience {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly summary?: string;
  readonly primaryAction?: AgoraLinkAction;
  readonly secondaryAction?: AgoraLinkAction;
  readonly heroMedia?: AgoraMediaItem;
  readonly heroSupportingMedia?: readonly AgoraMediaItem[];
  readonly projectedProducts?: AgoraProductRailContent;
  readonly filterLabel?: string;
  readonly saleOnlyLabel?: string;
  readonly sortLabel?: string;
  readonly resultLabel?: string;
  readonly loadMoreLabel?: string;
  readonly completeStatusLabel?: string;
  readonly toolbar?: AgoraListingToolbarConfiguration;
  readonly filterDrawer?: AgoraListingFilterDrawerConfiguration;
  readonly highlights?: readonly AgoraCollectionIndexHighlight[];
  readonly footerNote?: string;
}

export interface AgoraPromoTile extends AgoraMediaItem {
  readonly title: string;
  readonly summary?: string;
  readonly action?: AgoraLinkAction;
  readonly variant?: string;
}

export interface AgoraSpecialOfferSplit {
  readonly eyebrow?: string;
  readonly heading: string;
  readonly summary?: string;
  readonly action?: AgoraLinkAction;
  readonly leftMedia: AgoraMediaItem;
  readonly rightMedia: AgoraMediaItem;
}

export interface AgoraServiceMessage {
  readonly label: string;
  readonly text?: string;
}

export interface AgoraTestimonial extends AgoraMediaItem {
  readonly avatar?: string;
  readonly avatarMediaCode?: string;
  readonly name: string;
  readonly quote: string;
  readonly product?: string;
}

export interface AgoraFooterGroup {
  readonly title: string;
  readonly links: readonly string[];
}

export interface AgoraFooterContent {
  readonly summary?: string;
  readonly contactEmail?: string;
  readonly groups: readonly AgoraFooterGroup[];
  readonly newsletter?: {
    readonly title?: string;
    readonly text?: string;
    readonly placeholder?: string;
    readonly buttonLabel?: string;
  };
  readonly copyright?: string;
  readonly brandLabel?: string;
  readonly legalLinks: readonly string[];
}

export interface AgoraHomeContent {
  readonly header: AgoraHeaderContent;
  readonly heroSlides: readonly AgoraHeroSlide[];
  readonly storefrontLabels: AgoraStorefrontLabels;
  readonly serviceMessages: readonly AgoraServiceMessage[];
  readonly collectionIndex?: AgoraListingExperience;
  readonly productListing?: AgoraListingExperience;
  readonly collectionHeader?: { readonly eyebrow?: string; readonly heading?: string; readonly actionLabel?: string };
  readonly collections: readonly AgoraCollectionTile[];
  readonly topPicks: { readonly eyebrow?: string; readonly heading?: string; readonly pageSize?: number; readonly productCodes?: readonly string[] };
  readonly promotions: readonly AgoraPromoTile[];
  readonly specialOffer?: AgoraSpecialOfferSplit;
  readonly bestSelling: { readonly eyebrow?: string; readonly heading?: string; readonly pageSize?: number; readonly productCodes?: readonly string[] };
  readonly serviceBadges: readonly AgoraServiceMessage[];
  readonly testimonialHeader?: { readonly eyebrow?: string; readonly heading?: string; readonly summary?: string };
  readonly testimonials: readonly AgoraTestimonial[];
  readonly galleryHeader?: { readonly eyebrow?: string; readonly heading?: string };
  readonly gallery: readonly AgoraMediaItem[];
  readonly footer: AgoraFooterContent;
}

const EMPTY_HEADER: AgoraHeaderContent = Object.freeze({
  searchEnabled: false,
  cartPreviewEnabled: false,
  accountPreviewEnabled: false,
  wishlistPreviewEnabled: false,
  utilityLinks: Object.freeze([]),
  preferences: Object.freeze([]),
  navigation: Object.freeze([]),
  megaMenus: Object.freeze([]),
});

const EMPTY_FOOTER: AgoraFooterContent = Object.freeze({
  groups: Object.freeze([]),
  legalLinks: Object.freeze([]),
});

export const EMPTY_AGORA_HOME_CONTENT: AgoraHomeContent = Object.freeze({
  header: EMPTY_HEADER,
  heroSlides: Object.freeze([]),
  storefrontLabels: Object.freeze({}),
  serviceMessages: Object.freeze([]),
  collectionIndex: Object.freeze({}),
  productListing: Object.freeze({}),
  collections: Object.freeze([]),
  topPicks: Object.freeze({}),
  promotions: Object.freeze([]),
  bestSelling: Object.freeze({}),
  serviceBadges: Object.freeze([]),
  testimonials: Object.freeze([]),
  gallery: Object.freeze([]),
  footer: EMPTY_FOOTER,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function records(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : Object.freeze([]);
}

function strings(value: unknown): readonly string[] {
  return Object.freeze(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []);
}

function choices(value: unknown): readonly AgoraListingChoice[] {
  return Object.freeze(records(value).map((item) => Object.freeze({
    code: string(item.code) ?? '',
    label: string(item.label) ?? '',
  })).filter((item) => item.code && item.label));
}

function listingToolbarConfiguration(value: unknown): AgoraListingToolbarConfiguration | undefined {
  if (!isRecord(value)) return undefined;
  const layoutOptions = choices(value.layoutOptions);
  const sortOptions = choices(value.sortOptions);
  return Object.freeze({
    ...(string(value.ariaLabel) ? { ariaLabel: string(value.ariaLabel) } : {}),
    ...(string(value.filterLabel) ? { filterLabel: string(value.filterLabel) } : {}),
    ...(string(value.saleOnlyLabel) ? { saleOnlyLabel: string(value.saleOnlyLabel) } : {}),
    ...(string(value.sortLabel) ? { sortLabel: string(value.sortLabel) } : {}),
    ...(string(value.sortAriaLabel) ? { sortAriaLabel: string(value.sortAriaLabel) } : {}),
    ...(string(value.layoutAriaLabel) ? { layoutAriaLabel: string(value.layoutAriaLabel) } : {}),
    ...(string(value.activeFiltersAriaLabel) ? { activeFiltersAriaLabel: string(value.activeFiltersAriaLabel) } : {}),
    ...(string(value.clearAllLabel) ? { clearAllLabel: string(value.clearAllLabel) } : {}),
    ...(string(value.defaultLayout) ? { defaultLayout: string(value.defaultLayout) } : {}),
    ...(layoutOptions.length ? { layoutOptions } : {}),
    ...(sortOptions.length ? { sortOptions } : {}),
  });
}

function listingFilterDrawerConfiguration(value: unknown): AgoraListingFilterDrawerConfiguration | undefined {
  if (!isRecord(value)) return undefined;
  const groups = Object.freeze(records(value.groups).map((item) => Object.freeze({
    code: string(item.code) ?? '',
    label: string(item.label) ?? '',
    ...(typeof item.enabled === 'boolean' ? { enabled: item.enabled } : {}),
  })).filter((item) => item.code && item.label && item.enabled !== false));
  return Object.freeze({
    ...(string(value.ariaLabel) ? { ariaLabel: string(value.ariaLabel) } : {}),
    ...(string(value.title) ? { title: string(value.title) } : {}),
    ...(string(value.closeLabel) ? { closeLabel: string(value.closeLabel) } : {}),
    ...(string(value.resetLabel) ? { resetLabel: string(value.resetLabel) } : {}),
    ...(string(value.applyLabel) ? { applyLabel: string(value.applyLabel) } : {}),
    ...(string(value.priceLabel) ? { priceLabel: string(value.priceLabel) } : {}),
    ...(string(value.minPriceLabel) ? { minPriceLabel: string(value.minPriceLabel) } : {}),
    ...(string(value.maxPriceLabel) ? { maxPriceLabel: string(value.maxPriceLabel) } : {}),
    ...(string(value.minPricePlaceholder) ? { minPricePlaceholder: string(value.minPricePlaceholder) } : {}),
    ...(string(value.maxPricePlaceholder) ? { maxPricePlaceholder: string(value.maxPricePlaceholder) } : {}),
    ...(groups.length ? { groups } : {}),
  });
}

function storefrontLabels(value: unknown): AgoraStorefrontLabels {
  if (!isRecord(value)) return Object.freeze({});
  return Object.freeze({
    ...(string(value.addToCart) ? { addToCart: string(value.addToCart) } : {}),
    ...(string(value.addToWishlist) ? { addToWishlist: string(value.addToWishlist) } : {}),
    ...(string(value.availableColors) ? { availableColors: string(value.availableColors) } : {}),
    ...(string(value.availableSizes) ? { availableSizes: string(value.availableSizes) } : {}),
    ...(string(value.backToListing) ? { backToListing: string(value.backToListing) } : {}),
    ...(string(value.bestSellingProductsAriaLabel) ? { bestSellingProductsAriaLabel: string(value.bestSellingProductsAriaLabel) } : {}),
    ...(string(value.buyNow) ? { buyNow: string(value.buyNow) } : {}),
    ...(string(value.closeQuickAdd) ? { closeQuickAdd: string(value.closeQuickAdd) } : {}),
    ...(string(value.closeQuickView) ? { closeQuickView: string(value.closeQuickView) } : {}),
    ...(string(value.color) ? { color: string(value.color) } : {}),
    ...(string(value.colors) ? { colors: string(value.colors) } : {}),
    ...(string(value.compare) ? { compare: string(value.compare) } : {}),
    ...(string(value.comparing) ? { comparing: string(value.comparing) } : {}),
    ...(string(value.decreaseQuantity) ? { decreaseQuantity: string(value.decreaseQuantity) } : {}),
    ...(string(value.description) ? { description: string(value.description) } : {}),
    ...(string(value.featuredProductsAriaLabel) ? { featuredProductsAriaLabel: string(value.featuredProductsAriaLabel) } : {}),
    ...(string(value.increaseQuantity) ? { increaseQuantity: string(value.increaseQuantity) } : {}),
    ...(string(value.quickAdd) ? { quickAdd: string(value.quickAdd) } : {}),
    ...(string(value.quickView) ? { quickView: string(value.quickView) } : {}),
    ...(string(value.quickViewTitle) ? { quickViewTitle: string(value.quickViewTitle) } : {}),
    ...(string(value.quantity) ? { quantity: string(value.quantity) } : {}),
    ...(string(value.recommendationsEyebrow) ? { recommendationsEyebrow: string(value.recommendationsEyebrow) } : {}),
    ...(string(value.recommendationsHeading) ? { recommendationsHeading: string(value.recommendationsHeading) } : {}),
    ...(string(value.recommendationsSummary) ? { recommendationsSummary: string(value.recommendationsSummary) } : {}),
    ...(string(value.removeFromCompare) ? { removeFromCompare: string(value.removeFromCompare) } : {}),
    ...(string(value.removeFromWishlist) ? { removeFromWishlist: string(value.removeFromWishlist) } : {}),
    ...(string(value.reviews) ? { reviews: string(value.reviews) } : {}),
    ...(string(value.selectColorPrefix) ? { selectColorPrefix: string(value.selectColorPrefix) } : {}),
    ...(string(value.shippingReturns) ? { shippingReturns: string(value.shippingReturns) } : {}),
    ...(string(value.shippingReturnsText) ? { shippingReturnsText: string(value.shippingReturnsText) } : {}),
    ...(string(value.size) ? { size: string(value.size) } : {}),
    ...(string(value.viewDetailsPrefix) ? { viewDetailsPrefix: string(value.viewDetailsPrefix) } : {}),
    ...(string(value.viewFullDetails) ? { viewFullDetails: string(value.viewFullDetails) } : {}),
    ...(string(value.wishlist) ? { wishlist: string(value.wishlist) } : {}),
    ...(string(value.wishlisted) ? { wishlisted: string(value.wishlisted) } : {}),
  });
}

function mediaDeliveryUrl(config: AgoraRuntimeConfig, mediaCode?: string): string | undefined {
  if (!mediaCode) return undefined;
  const baseUrl = config.mediaBaseUrl.endsWith('/') ? config.mediaBaseUrl.slice(0, -1) : config.mediaBaseUrl;
  return `${baseUrl}/nodics/media/v0/content/${encodeURIComponent(mediaCode)}`;
}

function mediaUrl(config: AgoraRuntimeConfig, mediaCode?: string, directUrl?: string, media?: CmsComponentMediaContract): string | undefined {
  if (directUrl && (/^https?:\/\//u.test(directUrl) || directUrl.startsWith('/'))) return directUrl;
  const deliveredUrl = media?.deliveryUrl ?? media?.publicUrl ?? media?.media?.deliveryUrl ?? media?.media?.publicUrl;
  if (deliveredUrl) return deliveredUrl;
  return mediaDeliveryUrl(config, mediaCode);
}

function action(value: unknown): AgoraLinkAction | undefined {
  if (!isRecord(value)) return undefined;
  const label = string(value.label);
  if (!label) return undefined;
  return Object.freeze({
    label,
    ...(string(value.collectionCode) ? { collectionCode: string(value.collectionCode) } : {}),
    ...(string(value.path) ? { path: string(value.path) } : {}),
  });
}

function headerNavigationItem(value: unknown): AgoraHeaderNavigationItem | undefined {
  const item = action(value);
  if (!item || (!item.collectionCode && !item.path)) return undefined;
  return Object.freeze({
    ...item,
    ...(isRecord(value) && typeof value.dropdown === 'boolean' ? { dropdown: value.dropdown } : {}),
  });
}

function headerAction(value: unknown): AgoraLinkAction | undefined {
  const item = action(value);
  if (!item || (!item.collectionCode && !item.path)) return undefined;
  return item;
}

function megaMenuLink(value: unknown): AgoraMegaMenuLink | undefined {
  const item = action(value);
  if (!item || (!item.collectionCode && !item.path)) return undefined;
  if (!isRecord(value)) return item;
  return Object.freeze({
    ...item,
    ...(string(value.summary) ? { summary: string(value.summary) } : {}),
    ...(string(value.badge) ? { badge: string(value.badge) } : {}),
    ...(string(value.mediaCode) ? { mediaCode: string(value.mediaCode) } : {}),
    ...(string(value.image) ? { image: string(value.image) } : {}),
    ...(string(value.alt) ? { alt: string(value.alt) } : {}),
  });
}

function megaMenuPromo(value: unknown): AgoraMegaMenuPromo | undefined {
  const item = action(value);
  if (!item || (!item.collectionCode && !item.path)) return undefined;
  if (!isRecord(value)) return item;
  return Object.freeze({
    ...item,
    ...(string(value.eyebrow) ? { eyebrow: string(value.eyebrow) } : {}),
    ...(string(value.text) ? { text: string(value.text) } : {}),
    ...(string(value.badge) ? { badge: string(value.badge) } : {}),
  });
}

function component(page: CmsResolvedPageContract | undefined, renderer: string, code?: string): CmsComponentContract | undefined {
  return page?.page.components.find((item) => item.active && item.renderer === renderer && (!code || item.code === code || item.code.endsWith(code)));
}

function mediaReference(componentValue: CmsComponentContract | undefined, value: Record<string, unknown>): CmsComponentMediaContract | undefined {
  const mediaCode = string(value.mediaCode);
  const position = number(value.position);
  return componentValue?.media?.find((item) => {
    if (mediaCode && item.mediaCode === mediaCode) return true;
    return position !== undefined && item.position === position;
  });
}

function mediaItem(config: AgoraRuntimeConfig, componentValue: CmsComponentContract | undefined, value: Record<string, unknown>): AgoraMediaItem {
  const mediaCode = string(value.mediaCode);
  const media = mediaReference(componentValue, value);
  const alt = string(value.alt) ?? media?.altText;
  return Object.freeze({
    image: mediaUrl(config, mediaCode, string(value.image), media),
    ...(mediaCode ? { mediaCode } : {}),
    ...(media ? { media } : {}),
    ...(alt ? { alt } : {}),
  });
}

function serviceMessages(value: unknown): readonly AgoraServiceMessage[] {
  return Object.freeze(records(value).map((item) => Object.freeze({
    label: string(item.label) ?? '',
    ...(string(item.text) ? { text: string(item.text) } : {}),
  })).filter((item) => item.label));
}

function productRailContent(value: unknown): AgoraProductRailContent | undefined {
  if (!isRecord(value)) return undefined;
  const productCodes = strings(value.productCodes);
  const direction = string(value.direction);
  const normalizedDirection = direction === 'backward' ? 'backward' : direction === 'forward' ? 'forward' : undefined;
  return Object.freeze({
    ...(string(value.eyebrow) ? { eyebrow: string(value.eyebrow) } : {}),
    ...(string(value.heading) ? { heading: string(value.heading) } : {}),
    ...(string(value.summary) ? { summary: string(value.summary) } : {}),
    ...(string(value.ariaLabel) ? { ariaLabel: string(value.ariaLabel) } : {}),
    ...(number(value.pageSize) ? { pageSize: number(value.pageSize) } : {}),
    ...(productCodes.length ? { productCodes } : {}),
    ...(normalizedDirection ? { direction: normalizedDirection } : {}),
  });
}

function collectionIndexHighlights(value: unknown): readonly AgoraCollectionIndexHighlight[] {
  return Object.freeze(records(value).map((item) => Object.freeze({
    ...(string(item.label) ? { label: string(item.label) } : {}),
    title: string(item.title) ?? '',
    ...(string(item.text) ? { text: string(item.text) } : {}),
  })).filter((item) => item.title));
}

function mediaItems(config: AgoraRuntimeConfig, componentValue: CmsComponentContract | undefined, value: unknown): readonly AgoraMediaItem[] {
  return Object.freeze(records(value).map((item, index) => mediaItem(config, componentValue, {
    ...item,
    position: number(item.position) ?? ((index + 2) * 10),
  })).filter((item) => item.image));
}

function megaMenus(config: AgoraRuntimeConfig, componentValue: CmsComponentContract | undefined): readonly AgoraMegaMenu[] {
  return Object.freeze(records(componentValue?.properties.megaMenus).map((item) => {
    const code = string(item.code) ?? '';
    const label = string(item.label) ?? '';
    const groups = Object.freeze(records(item.groups).map((group) => {
      const links = Object.freeze(records(group.links).map(megaMenuLink).filter((link): link is AgoraMegaMenuLink => Boolean(link)));
      return Object.freeze({
        title: string(group.title) ?? '',
        ...(string(group.summary) ? { summary: string(group.summary) } : {}),
        links,
      });
    }).filter((group) => group.title && group.links.length));
    const featureTiles = Object.freeze(records(item.featureTiles).map((tile, index) => Object.freeze({
      ...mediaItem(config, componentValue, {
        ...tile,
        position: number(tile.position) ?? (1000 + index * 10),
      }),
      title: string(tile.title) ?? '',
      ...(string(tile.summary) ? { summary: string(tile.summary) } : {}),
      ...(string(tile.badge) ? { badge: string(tile.badge) } : {}),
      ...(action(tile.action) ? { action: action(tile.action) } : {}),
    })).filter((tile) => tile.title));
    const promoStripe = Object.freeze(records(item.promoStripe).map(megaMenuPromo).filter((promo): promo is AgoraMegaMenuPromo => Boolean(promo)));
    return Object.freeze({
      code,
      label,
      ...(string(item.eyebrow) ? { eyebrow: string(item.eyebrow) } : {}),
      ...(string(item.summary) ? { summary: string(item.summary) } : {}),
      ...(string(item.path) ? { path: string(item.path) } : {}),
      ...(string(item.collectionCode) ? { collectionCode: string(item.collectionCode) } : {}),
      ...(string(item.badge) ? { badge: string(item.badge) } : {}),
      groups,
      featureTiles,
      promoStripe,
    });
  }).filter((item) => item.code && item.label && (item.path || item.collectionCode || item.groups.length || item.featureTiles.length)));
}

function listingExperience(config: AgoraRuntimeConfig, componentValue: CmsComponentContract | undefined): AgoraListingExperience | undefined {
  if (!componentValue) return undefined;
  const toolbar = listingToolbarConfiguration(componentValue.properties.toolbar);
  const filterDrawer = listingFilterDrawerConfiguration(componentValue.properties.filterDrawer);
  const projectedProducts = productRailContent(componentValue.properties.projectedProducts);
  const heroSupportingMedia = mediaItems(config, componentValue, componentValue.properties.heroSupportingMedia);
  const highlights = collectionIndexHighlights(componentValue.properties.highlights);
  return Object.freeze({
    ...(string(componentValue.properties.eyebrow) ? { eyebrow: string(componentValue.properties.eyebrow) } : {}),
    ...(string(componentValue.properties.heading) ? { heading: string(componentValue.properties.heading) } : {}),
    ...(string(componentValue.properties.summary) ? { summary: string(componentValue.properties.summary) } : {}),
    ...(action(componentValue.properties.primaryAction) ? { primaryAction: action(componentValue.properties.primaryAction) } : {}),
    ...(action(componentValue.properties.secondaryAction) ? { secondaryAction: action(componentValue.properties.secondaryAction) } : {}),
    ...(projectedProducts ? { projectedProducts } : {}),
    ...(string(componentValue.properties.filterLabel) ? { filterLabel: string(componentValue.properties.filterLabel) } : {}),
    ...(string(componentValue.properties.saleOnlyLabel) ? { saleOnlyLabel: string(componentValue.properties.saleOnlyLabel) } : {}),
    ...(string(componentValue.properties.sortLabel) ? { sortLabel: string(componentValue.properties.sortLabel) } : {}),
    ...(string(componentValue.properties.resultLabel) ? { resultLabel: string(componentValue.properties.resultLabel) } : {}),
    ...(string(componentValue.properties.loadMoreLabel) ? { loadMoreLabel: string(componentValue.properties.loadMoreLabel) } : {}),
    ...(string(componentValue.properties.completeStatusLabel) ? { completeStatusLabel: string(componentValue.properties.completeStatusLabel) } : {}),
    ...(heroSupportingMedia.length ? { heroSupportingMedia } : {}),
    ...(toolbar ? { toolbar } : {}),
    ...(filterDrawer ? { filterDrawer } : {}),
    ...(highlights.length ? { highlights } : {}),
    ...(string(componentValue.properties.footerNote) ? { footerNote: string(componentValue.properties.footerNote) } : {}),
    ...(string(componentValue.properties.heroMediaCode) ? {
      heroMedia: mediaItem(config, componentValue, { mediaCode: string(componentValue.properties.heroMediaCode) ?? '', position: 10 }),
    } : {}),
  });
}

export function agoraHomeContent(page: CmsResolvedPageContract | undefined, config: AgoraRuntimeConfig): AgoraHomeContent {
  const header = component(page, 'agora.header');
  const hero = component(page, 'agora.heroCarousel');
  const ticker = component(page, 'agora.serviceTicker');
  const collectionIndex = component(page, 'agora.collectionIndex');
  const productListing = component(page, 'agora.productListing');
  const collections = component(page, 'agora.collectionGrid');
  const topPicks = component(page, 'agora.productRail', 'TopPicksProductRail');
  const promotions = component(page, 'agora.promoGrid');
  const specialOffer = component(page, 'agora.specialOfferSplit');
  const bestSelling = component(page, 'agora.productRail', 'BestSellingProductRail');
  const services = component(page, 'agora.servicePromiseGrid');
  const testimonials = component(page, 'agora.testimonialGrid');
  const gallery = component(page, 'agora.mediaGallery');
  const footer = component(page, 'agora.footer');

  return Object.freeze({
    header: Object.freeze({
      ...(string(header?.properties.logoText) ? { logoText: string(header?.properties.logoText) } : {}),
      ...(string(header?.properties.subtitle) ? { subtitle: string(header?.properties.subtitle) } : {}),
      ...(string(header?.properties.rootCollectionCode) ? { rootCollectionCode: string(header?.properties.rootCollectionCode) } : {}),
      ...(string(header?.properties.searchPlaceholder) ? { searchPlaceholder: string(header?.properties.searchPlaceholder) } : {}),
      searchEnabled: Boolean(header) && header?.properties.searchEnabled !== false,
      cartPreviewEnabled: Boolean(header) && header?.properties.cartPreviewEnabled !== false,
      accountPreviewEnabled: Boolean(header) && header?.properties.accountPreviewEnabled !== false,
      wishlistPreviewEnabled: Boolean(header) && header?.properties.wishlistPreviewEnabled === true,
      utilityLinks: Object.freeze(records(header?.properties.utilityLinks).map(headerAction).filter((item): item is AgoraLinkAction => Boolean(item))),
      preferences: Object.freeze(records(header?.properties.preferences).map(headerAction).filter((item): item is AgoraLinkAction => Boolean(item))),
      navigation: Object.freeze(records(header?.properties.navigationItems).map(headerNavigationItem).filter((item): item is AgoraHeaderNavigationItem => Boolean(item))),
      megaMenus: megaMenus(config, header),
    }),
    heroSlides: Object.freeze(records(hero?.properties.slides).map((item) => Object.freeze({
      ...mediaItem(config, hero, item),
      eyebrow: string(item.eyebrow) ?? '',
      title: string(item.title) ?? '',
      ...(action(item.primaryAction) ? { primaryAction: action(item.primaryAction) } : {}),
      ...(action(item.secondaryAction) ? { secondaryAction: action(item.secondaryAction) } : {}),
    })).filter((item) => item.title)),
    storefrontLabels: storefrontLabels(header?.properties.storefrontLabels),
    serviceMessages: serviceMessages(ticker?.properties.messages),
    ...(listingExperience(config, collectionIndex) ? { collectionIndex: listingExperience(config, collectionIndex) } : {}),
    ...(listingExperience(config, productListing) ? { productListing: listingExperience(config, productListing) } : {}),
    collectionHeader: Object.freeze({
      ...(string(collections?.properties.eyebrow) ? { eyebrow: string(collections?.properties.eyebrow) } : {}),
      ...(string(collections?.properties.heading) ? { heading: string(collections?.properties.heading) } : {}),
      ...(string(collections?.properties.actionLabel) ? { actionLabel: string(collections?.properties.actionLabel) } : {}),
    }),
    collections: Object.freeze(records(collections?.properties.items).map((item) => Object.freeze({
      ...mediaItem(config, collections, item),
      code: string(item.collectionCode) ?? string(item.code) ?? '',
      label: string(item.label) ?? '',
      ...(string(item.itemCount) ? { itemCount: string(item.itemCount) } : {}),
      ...(string(item.path) ? { path: string(item.path) } : {}),
      ...(string(item.summary) ? { summary: string(item.summary) } : {}),
    })).filter((item) => item.code && item.label)),
    topPicks: Object.freeze({
      ...(string(topPicks?.properties.eyebrow) ? { eyebrow: string(topPicks?.properties.eyebrow) } : {}),
      ...(string(topPicks?.properties.heading) ? { heading: string(topPicks?.properties.heading) } : {}),
      ...(strings(topPicks?.properties.productCodes).length ? { productCodes: strings(topPicks?.properties.productCodes) } : {}),
      ...(number(topPicks?.properties.pageSize) ? { pageSize: number(topPicks?.properties.pageSize) } : {}),
    }),
    promotions: Object.freeze(records(promotions?.properties.items).map((item) => Object.freeze({
      ...mediaItem(config, promotions, item),
      title: string(item.title) ?? '',
      ...(string(item.summary) ? { summary: string(item.summary) } : {}),
      ...(string(item.variant) ? { variant: string(item.variant) } : {}),
      ...(action(item.action) ? { action: action(item.action) } : {}),
    })).filter((item) => item.title)),
    ...(string(specialOffer?.properties.heading) ? { specialOffer: Object.freeze({
      ...(string(specialOffer?.properties.eyebrow) ? { eyebrow: string(specialOffer?.properties.eyebrow) } : {}),
      heading: string(specialOffer?.properties.heading) ?? '',
      ...(string(specialOffer?.properties.summary) ? { summary: string(specialOffer?.properties.summary) } : {}),
      ...(action(specialOffer?.properties.action) ? { action: action(specialOffer?.properties.action) } : {}),
      leftMedia: mediaItem(config, specialOffer, { mediaCode: string(specialOffer?.properties.leftMediaCode) ?? '', position: 10 }),
      rightMedia: mediaItem(config, specialOffer, { mediaCode: string(specialOffer?.properties.rightMediaCode) ?? '', position: 20 }),
    }) } : {}),
    bestSelling: Object.freeze({
      ...(string(bestSelling?.properties.eyebrow) ? { eyebrow: string(bestSelling?.properties.eyebrow) } : {}),
      ...(string(bestSelling?.properties.heading) ? { heading: string(bestSelling?.properties.heading) } : {}),
      ...(strings(bestSelling?.properties.productCodes).length ? { productCodes: strings(bestSelling?.properties.productCodes) } : {}),
      ...(number(bestSelling?.properties.pageSize) ? { pageSize: number(bestSelling?.properties.pageSize) } : {}),
    }),
    serviceBadges: serviceMessages(services?.properties.items),
    testimonialHeader: Object.freeze({
      ...(string(testimonials?.properties.eyebrow) ? { eyebrow: string(testimonials?.properties.eyebrow) } : {}),
      ...(string(testimonials?.properties.heading) ? { heading: string(testimonials?.properties.heading) } : {}),
      ...(string(testimonials?.properties.summary) ? { summary: string(testimonials?.properties.summary) } : {}),
    }),
    testimonials: Object.freeze(records(testimonials?.properties.items).map((item) => {
      const avatarMediaCode = string(item.avatarMediaCode);
      const avatarMedia = mediaReference(testimonials, { mediaCode: avatarMediaCode });
      const avatarUrl = mediaUrl(config, avatarMediaCode, string(item.avatar), avatarMedia);
      return Object.freeze({
        ...mediaItem(config, testimonials, item),
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        ...(avatarMediaCode ? { avatarMediaCode } : {}),
        name: string(item.name) ?? '',
        quote: string(item.quote) ?? '',
        ...(string(item.product) ? { product: string(item.product) } : {}),
      });
    }).filter((item) => item.name && item.quote)),
    galleryHeader: Object.freeze({
      ...(string(gallery?.properties.eyebrow) ? { eyebrow: string(gallery?.properties.eyebrow) } : {}),
      ...(string(gallery?.properties.heading) ? { heading: string(gallery?.properties.heading) } : {}),
    }),
    gallery: Object.freeze(records(gallery?.properties.items).map((item) => mediaItem(config, gallery, item)).filter((item) => item.image)),
    footer: Object.freeze({
      ...(string(footer?.properties.summary) ? { summary: string(footer?.properties.summary) } : {}),
      ...(string(footer?.properties.contactEmail) ? { contactEmail: string(footer?.properties.contactEmail) } : {}),
      groups: Object.freeze(records(footer?.properties.groups).map((item) => Object.freeze({
        title: string(item.title) ?? '',
        links: Object.freeze(Array.isArray(item.links) ? item.links.filter((link): link is string => typeof link === 'string' && Boolean(link.trim())) : []),
      })).filter((item) => item.title)),
      newsletter: isRecord(footer?.properties.newsletter) ? Object.freeze({
        ...(string(footer?.properties.newsletter.title) ? { title: string(footer?.properties.newsletter.title) } : {}),
        ...(string(footer?.properties.newsletter.text) ? { text: string(footer?.properties.newsletter.text) } : {}),
        ...(string(footer?.properties.newsletter.placeholder) ? { placeholder: string(footer?.properties.newsletter.placeholder) } : {}),
        ...(string(footer?.properties.newsletter.buttonLabel) ? { buttonLabel: string(footer?.properties.newsletter.buttonLabel) } : {}),
      }) : undefined,
      ...(string(footer?.properties.copyright) ? { copyright: string(footer?.properties.copyright) } : {}),
      ...(string(footer?.properties.brandLabel) ? { brandLabel: string(footer?.properties.brandLabel) } : {}),
      legalLinks: Object.freeze(Array.isArray(footer?.properties.legalLinks) ? footer.properties.legalLinks.filter((link): link is string => typeof link === 'string' && Boolean(link.trim())) : []),
    }),
  });
}
