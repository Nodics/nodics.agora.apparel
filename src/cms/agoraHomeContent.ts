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
  readonly summary?: string;
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
  readonly serviceMessages: readonly AgoraServiceMessage[];
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
});

const EMPTY_FOOTER: AgoraFooterContent = Object.freeze({
  groups: Object.freeze([]),
  legalLinks: Object.freeze([]),
});

export const EMPTY_AGORA_HOME_CONTENT: AgoraHomeContent = Object.freeze({
  header: EMPTY_HEADER,
  heroSlides: Object.freeze([]),
  serviceMessages: Object.freeze([]),
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

export function agoraHomeContent(page: CmsResolvedPageContract | undefined, config: AgoraRuntimeConfig): AgoraHomeContent {
  const header = component(page, 'agora.header');
  const hero = component(page, 'agora.heroCarousel');
  const ticker = component(page, 'agora.serviceTicker');
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
    }),
    heroSlides: Object.freeze(records(hero?.properties.slides).map((item) => Object.freeze({
      ...mediaItem(config, hero, item),
      eyebrow: string(item.eyebrow) ?? '',
      title: string(item.title) ?? '',
      ...(action(item.primaryAction) ? { primaryAction: action(item.primaryAction) } : {}),
      ...(action(item.secondaryAction) ? { secondaryAction: action(item.secondaryAction) } : {}),
    })).filter((item) => item.title)),
    serviceMessages: serviceMessages(ticker?.properties.messages),
    collectionHeader: Object.freeze({
      ...(string(collections?.properties.eyebrow) ? { eyebrow: string(collections?.properties.eyebrow) } : {}),
      ...(string(collections?.properties.heading) ? { heading: string(collections?.properties.heading) } : {}),
      ...(string(collections?.properties.actionLabel) ? { actionLabel: string(collections?.properties.actionLabel) } : {}),
    }),
    collections: Object.freeze(records(collections?.properties.items).map((item) => Object.freeze({
      ...mediaItem(config, collections, item),
      code: string(item.collectionCode) ?? string(item.code) ?? '',
      label: string(item.label) ?? '',
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
