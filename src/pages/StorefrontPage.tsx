import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, BadgePercent, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Headphones, Heart, RotateCcw, Search, ShieldCheck, ShoppingBag, Truck, UserRound, type LucideIcon } from 'lucide-react';

import {
  addCartEntry,
  addCustomerListEntry,
  applyPromotion,
  calculateCart,
  createCart,
  getProduct,
  listCustomerOrders,
  listProducts,
  listReturnMethods,
  listShippingMethods,
  placeCheckout,
  previewPromotion,
  readCustomerOrder,
  readCustomerList,
  removeCartEntry,
  removeCustomerListEntry,
  updateCartEntry,
  type CartCalculationResponse,
  type CustomerListEntry,
  type CustomerListType,
  type CustomerOrderDetailResponse,
  type CustomerOrderSummary,
  type CheckoutPlacementResponse,
  type ProductCard,
  type ProductDetail,
  type ReturnMethodResponse,
} from '../api/commerceClient';
import { getReviewAggregate, listPublishedReviews, type PublicReview, type ReviewAggregate } from '../api/engagementClient';
import { authenticateCustomer, customerAccessToken } from '../api/profileClient';
import {
  apparelColorOptions as productColorOptions,
  apparelImageUrlForVariant,
  apparelSelectionForVariant,
  apparelSizeOptions as productSizeOptions,
  apparelVariantForSelection as productVariantForSelection,
} from '../accelerators/apparel/apparelOptions';
import { useLocalCart } from '../cart/cartState';
import { maskedPaymentLabel, normalizeShippingOptions, paymentOption, paymentOptions, shippingOption, shippingOptions, shippingPrice, type ShippingOption } from '../checkout/checkoutOptions';
import { paymentResultViewModel, type PaymentResultViewModel } from '../checkout/paymentResult';
import { paymentProviderToken as checkoutPaymentProviderToken, validateCheckoutSnapshot } from '../checkout/checkoutValidation';
import { agoraHomeContent, EMPTY_AGORA_HOME_CONTENT, type AgoraCollectionTile, type AgoraLinkAction, type AgoraMediaItem, type AgoraMegaMenu } from '../cms/agoraHomeContent';
import { resolveCmsPage } from '../cms/cmsClient';
import type { CmsResolvedPageContract } from '../cms/cmsContract';
import { productAvailabilityLabel } from '../commerce/availabilityPresentation';
import { productBrandLabel } from '../commerce/productPresentation';
import { ProductCarousel } from '../components/ProductCarousel';
import { ProductCardView } from '../components/ProductCardView';
import { ProductFilterDrawer, ProductListingToolbar, type ProductFilterKey, type ProductFilterOptionGroup, type ProductFilterState, type ProductListingLayout } from '../components/ProductListingControls';
import { clearAgoraCustomerSession, resolveAgoraCustomerSession, saveAgoraCustomerSession, type CustomerSession } from '../customer/customerSession';
import { ProductMediaPlaceholder, mediaDeliveryUrl, productGalleryImageUrl, productGalleryUrls, productImageUrl } from '../media/productVisual';
import { lifecycleAutomationPlan, lifecycleFormGuidance, lifecycleReasonOptions, lifecycleSummary, lifecycleTimeline, lifecycleTrackingSummary, lifecycleTypes, preferredResolutionOptions, previewLifecycleRequest, refundMethodOptions, submitLifecycleRequest } from '../order/orderLifecycle';
import { runtimeConfig } from '../runtime/config';

type View = 'home' | 'collections' | 'plp' | 'pdp' | 'cart' | 'checkout' | 'payment-result' | 'confirmation' | 'orders';
type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'review';
type ProductSearchContext = 'all' | 'brand' | 'category' | 'collection';
const PRODUCT_LISTING_BATCH_SIZE = 10;
const PRODUCT_LISTING_DEFAULT_HERO_MEDIA_CODE = 'agora-owned-product-listing-wide-hero';
const PRODUCT_LISTING_DEFAULT_HERO_FALLBACK_SRC = '/media/agora-owned-product-listing-wide-hero.jpg';
const isProductListingLayout = function (value: string | undefined): value is ProductListingLayout {
  return value === 'list' || value === 'grid-2' || value === 'grid-3' || value === 'grid-4' || value === 'grid-5';
};
type RouteState = {
  readonly view: View;
  readonly collectionCode: string;
  readonly searchCode: string;
  readonly searchContext: ProductSearchContext;
  readonly query: string;
  readonly checkoutStep?: CheckoutStep;
  readonly productSlug?: string;
};
const orderCode = () => `storefront-order-${Date.now()}`;
const idempotencyKey = () => `storefront-checkout-${Date.now()}`;
const EMPTY_PRODUCT_FILTERS: ProductFilterState = Object.freeze({
  availability: [],
  brands: [],
  categories: [],
  collections: [],
  colors: [],
  priceMax: '',
  priceMin: '',
  saleOnly: false,
  sizes: [],
});
const cmsPathForView = function (view: View): string {
  if (view === 'collections') return '/collections';
  if (view === 'plp') return '/shop';
  return '/';
};

const routeStateFromLocation = function (rootCollectionCode = ''): RouteState {
  if (typeof window === 'undefined') return { view: 'home', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query: '' };
  const path = window.location.pathname.replace(/\/+$/u, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') ?? '';
  const collection = params.get('collection') ?? params.get('collectionCode') ?? '';
  const category = params.get('category') ?? params.get('categoryCode') ?? '';
  const brand = params.get('brand') ?? params.get('brandCode') ?? '';
  if (path === '/cart') return { view: 'cart', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query };
  if (path === '/checkout') return { view: 'checkout', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query, checkoutStep: 'customer' };
  if (path === '/orders') return { view: 'orders', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query };
  if (path === '/collections') return { view: 'collections', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query };
  if (path === '/shop') {
    if (brand) return { view: 'plp', collectionCode: rootCollectionCode, searchCode: brand, searchContext: 'brand', query };
    if (category) return { view: 'plp', collectionCode: category, searchCode: category, searchContext: 'category', query };
    if (collection) return { view: 'plp', collectionCode: collection, searchCode: collection, searchContext: 'collection', query };
    return { view: 'plp', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'all', query };
  }
  if (path.startsWith('/shop/brand/')) return { view: 'plp', collectionCode: rootCollectionCode, searchCode: decodeURIComponent(path.slice('/shop/brand/'.length)), searchContext: 'brand', query };
  if (path.startsWith('/shop/category/')) {
    const code = decodeURIComponent(path.slice('/shop/category/'.length));
    return { view: 'plp', collectionCode: code, searchCode: code, searchContext: 'category', query };
  }
  if (path.startsWith('/shop/collection/')) {
    const code = decodeURIComponent(path.slice('/shop/collection/'.length));
    return { view: 'plp', collectionCode: code, searchCode: code, searchContext: 'collection', query };
  }
  if (path.startsWith('/products/')) return { view: 'pdp', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query: '', productSlug: decodeURIComponent(path.slice('/products/'.length)) };
  return { view: 'home', collectionCode: rootCollectionCode, searchCode: rootCollectionCode, searchContext: 'collection', query };
};
const facetLabel = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const facetValue = value as { readonly code?: unknown; readonly name?: unknown; readonly label?: unknown; readonly count?: unknown };
    const label = [facetValue.label, facetValue.name, facetValue.code].find((candidate) => typeof candidate === 'string');
    const count = typeof facetValue.count === 'number' || typeof facetValue.count === 'string' ? ` (${facetValue.count})` : '';
    if (label) return `${label}${count}`;
  }
  return 'Available';
};

const moneyAmount = function (value: string | number | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
};

const normalizedText = function (value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
};

const humanizeCodeLabel = function (value: string): string {
  return value
    .replace(/^agora/iu, '')
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/[-_]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/\b\w/gu, (letter) => letter.toUpperCase());
};

const uniqueSorted = function (values: readonly (string | undefined)[]): readonly string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())))).sort((left, right) => left.localeCompare(right));
};

const discoveryTotal = function (response: { readonly total?: number; readonly totalCount?: number; readonly productCount?: number; readonly pagination?: { readonly total?: number; readonly totalCount?: number; readonly productCount?: number } }): number | undefined {
  const candidates = [
    response.total,
    response.totalCount,
    response.productCount,
    response.pagination?.total,
    response.pagination?.totalCount,
    response.pagination?.productCount,
  ];
  return candidates.find((candidate): candidate is number => typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0);
};

const includesAny = function (availableValues: readonly string[] | undefined, selectedValues: readonly string[]): boolean {
  if (!selectedValues.length) return true;
  const available = new Set((availableValues ?? []).map(normalizedText));
  return selectedValues.some((value) => available.has(normalizedText(value)));
};

const productCollectionCodes = function (product: ProductCard): readonly string[] {
  return uniqueSorted([...(product.collectionCodes ?? []), ...(product.categoryCodes ?? []).filter((code) => normalizedText(code).includes('sale') || normalizedText(code).includes('arrival'))]);
};

const productColorCodes = function (product: ProductCard): readonly string[] {
  return uniqueSorted(productColorOptions(product).map((option) => option.label));
};

const productSizeCodes = function (product: ProductCard): readonly string[] {
  return uniqueSorted(productSizeOptions(product).map((size) => size));
};

const filterCount = function (filters: ProductFilterState): number {
  return filters.brands.length +
    filters.categories.length +
    filters.collections.length +
    filters.colors.length +
    filters.sizes.length +
    filters.availability.length +
    (filters.priceMin.trim() ? 1 : 0) +
    (filters.priceMax.trim() ? 1 : 0) +
    (filters.saleOnly ? 1 : 0);
};

const toggleFilterValue = function (values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
};
const serviceBadgeIcon = function (label: string): LucideIcon {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('return')) return RotateCcw;
  if (normalizedLabel.includes('shipping') || normalizedLabel.includes('delivery')) return Truck;
  if (normalizedLabel.includes('secure') || normalizedLabel.includes('payment') || normalizedLabel.includes('checkout') || normalizedLabel.includes('token')) return ShieldCheck;
  if (normalizedLabel.includes('help') || normalizedLabel.includes('order') || normalizedLabel.includes('track') || normalizedLabel.includes('lifecycle')) return CircleHelp;
  if (normalizedLabel.includes('support') || normalizedLabel.includes('service')) return Headphones;
  if (normalizedLabel.includes('discount') || normalizedLabel.includes('member') || normalizedLabel.includes('loyal')) return BadgePercent;
  return CircleHelp;
};

function selectedHomeProducts(productCodes: readonly string[] | undefined, sourceProducts: readonly ProductCard[], pageSize: number): readonly ProductCard[] {
  if (!productCodes?.length) return sourceProducts.slice(0, pageSize);
  const productByCode = new Map(sourceProducts.map((product) => [product.productCode, product]));
  const selectedProducts = productCodes.map((productCode) => productByCode.get(productCode)).filter((product): product is ProductCard => Boolean(product));
  if (selectedProducts.length >= pageSize) return selectedProducts.slice(0, pageSize);
  const selectedCodes = new Set(selectedProducts.map((product) => product.productCode));
  const fallbackProducts = sourceProducts.filter((product) => !selectedCodes.has(product.productCode));
  return [...selectedProducts, ...fallbackProducts].slice(0, pageSize);
}
function NodicsBrand({ logoText = 'NODICS', subtitle }: { readonly logoText?: string; readonly subtitle: string }) {
  return (
    <span className="agora-brand-lockup">
      <svg className="agora-brand-mark" aria-hidden="true" viewBox="0 0 64 64">
        <path
          d="M24 6H14l-4 4v14l-6 6v4l6 6v14l4 4h10M40 6h10l4 4v14l6 6v4l-6 6v14l-4 4H40"
          fill="none"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="4"
        />
        <text
          x="32"
          y="48"
          fill="#FFFFFF"
          className="agora-brand-letter"
          fontFamily="Times New Roman, Times, serif"
          fontSize="45"
          fontWeight="400"
          textAnchor="middle"
          transform="translate(32 0) scale(.84 1) translate(-32 0)"
        >
          N
        </text>
      </svg>
      <span className="agora-brand-text">
        <strong>{logoText}</strong>
        <small>{subtitle}</small>
      </span>
    </span>
  );
}

export function StorefrontPage() {
  const initialCustomerSession = useMemo(() => resolveAgoraCustomerSession(runtimeConfig), []);
  const initialRouteState = useMemo(() => routeStateFromLocation(), []);
  const [customerSession, setCustomerSession] = useState<CustomerSession>(initialCustomerSession);
  const [view, setView] = useState<View>(initialRouteState.view);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [query, setQuery] = useState(initialRouteState.query);
  const [collectionCode, setCollectionCode] = useState(initialRouteState.collectionCode);
  const [searchCode, setSearchCode] = useState(initialRouteState.searchCode);
  const [searchContext, setSearchContext] = useState<ProductSearchContext>(initialRouteState.searchContext);
  const [brand, setBrand] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listingLayout, setListingLayout] = useState<ProductListingLayout>('grid-4');
  const [selectedFilters, setSelectedFilters] = useState<ProductFilterState>(EMPTY_PRODUCT_FILTERS);
  const [sortCode, setSortCode] = useState('recommended');
  const [listingPage, setListingPage] = useState(1);
  const [listingHasNextPage, setListingHasNextPage] = useState(false);
  const [products, setProducts] = useState<readonly ProductCard[]>([]);
  const [productTotalCount, setProductTotalCount] = useState<number>();
  const [homeProducts, setHomeProducts] = useState<readonly ProductCard[]>([]);
  const [facets, setFacets] = useState<Readonly<Record<string, readonly unknown[]>>>({});
  const [selected, setSelected] = useState<ProductDetail>();
  const [pendingProductSlug, setPendingProductSlug] = useState<string | undefined>(initialRouteState.productSlug);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>();
  const [quickView, setQuickView] = useState<ProductCard>();
  const [quickViewVariantCode, setQuickViewVariantCode] = useState<string>();
  const [quickAdd, setQuickAdd] = useState<ProductCard>();
  const [quickAddVariantCode, setQuickAddVariantCode] = useState<string>();
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(initialRouteState.checkoutStep ?? 'customer');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<CheckoutPlacementResponse>();
  const [paymentResult, setPaymentResult] = useState<PaymentResultViewModel>();
  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetailResponse>();
  const [orderHistory, setOrderHistory] = useState<readonly CustomerOrderSummary[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string>();
  const [orderHistoryStatus, setOrderHistoryStatus] = useState<string>();
  const [shippingMethodOptions, setShippingMethodOptions] = useState<readonly ShippingOption[]>(shippingOptions);
  const [returnMethodOptions, setReturnMethodOptions] = useState<ReturnMethodResponse['methods']>([
    { code: 'PICKUP', label: 'Pickup', promise: 'Carrier pickup after approval' },
    { code: 'DROP_OFF', label: 'Drop-off', promise: 'Drop at approved carrier location' },
    { code: 'STORE_RETURN', label: 'Store return', promise: 'Bring the item to store' },
  ]);
  const [backendCartCode, setBackendCartCode] = useState<string>();
  const [backendCartRevision, setBackendCartRevision] = useState('0');
  const [backendEntryCodes, setBackendEntryCodes] = useState<Readonly<Record<string, string>>>({});
  const [syncStatus, setSyncStatus] = useState('Local cart');
  const [backendCartCalculation, setBackendCartCalculation] = useState<CartCalculationResponse>();
  const [wishlistProductCodes, setWishlistProductCodes] = useState<readonly string[]>([]);
  const [compareProductCodes, setCompareProductCodes] = useState<readonly string[]>([]);
  const [backendListEntryCodes, setBackendListEntryCodes] = useState<Readonly<Record<CustomerListType, Readonly<Record<string, string>>>>>({ WISHLIST: {}, COMPARE: {} });
  const [listStatus, setListStatus] = useState<string>();
  const [promotionStatus, setPromotionStatus] = useState<string>();
  const [backendPromotionDiscount, setBackendPromotionDiscount] = useState<number>();
  const [reviewAggregate, setReviewAggregate] = useState<ReviewAggregate>();
  const [publicReviews, setPublicReviews] = useState<readonly PublicReview[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string>();
  const [lifecycleStatus, setLifecycleStatus] = useState<string>();
  const [lifecyclePreview, setLifecyclePreview] = useState<Readonly<Record<string, unknown>>>();
  const [selectedLifecycleType, setSelectedLifecycleType] = useState<(typeof lifecycleTypes)[number]>('CANCELLATION');
  const [authStatus, setAuthStatus] = useState<string>();
  const [authForm, setAuthForm] = useState({ loginId: initialCustomerSession.email, password: '' });
  const [checkoutForm, setCheckoutForm] = useState({
    email: customerSession.email,
    firstName: 'Storefront',
    lastName: 'Customer',
    phone: '+1 555 0100',
    line1: '549 Oak St',
    line2: '',
    city: 'Crystal Lake',
    region: 'IL',
    postalCode: '60014',
    country: 'US',
    shippingMethod: 'STANDARD',
    paymentMethod: 'CARD',
    cardName: 'Storefront Customer',
    cardLast4: '4242',
  });
  const [lifecycleForm, setLifecycleForm] = useState({
    reasonCode: 'CUSTOMER_CHANGED_MIND',
    quantity: '1',
    returnMethod: 'PICKUP',
    refundMethod: 'ORIGINAL_PAYMENT',
    replacementProductCode: '',
    preferredResolution: 'SHIP_REPLACEMENT',
    appealReferenceCode: '',
    appealReason: '',
    comment: '',
  });
  const [error, setError] = useState<string>();
  const [cmsPage, setCmsPage] = useState<CmsResolvedPageContract>();
  const [cmsStatus, setCmsStatus] = useState<string>();
  const [activeMegaMenuCode, setActiveMegaMenuCode] = useState<string>();
  const cart = useLocalCart();
  const collectionCarouselRef = useRef<HTMLElement>(null);
  const homeContent = useMemo(() => cmsPage ? agoraHomeContent(cmsPage, runtimeConfig) : EMPTY_AGORA_HOME_CONTENT, [cmsPage]);
  const productListingContent = homeContent.productListing;
  const cmsPath = cmsPathForView(view);
  const headerContent = homeContent.header;
  const activeMegaMenu = useMemo(
    () => headerContent.megaMenus.find((menu) => menu.code === activeMegaMenuCode),
    [activeMegaMenuCode, headerContent.megaMenus],
  );
  const rootCollectionCode = headerContent.rootCollectionCode ?? homeContent.collections[0]?.code ?? '';
  const cmsHeroSlides = homeContent.heroSlides;
  const activeHeroSlide = cmsHeroSlides[activeHeroIndex] ?? cmsHeroSlides[0];
  const nextHeroSlide = cmsHeroSlides[(activeHeroIndex + 1) % Math.max(cmsHeroSlides.length, 1)] ?? cmsHeroSlides[0];

  useEffect(() => {
    const controller = new AbortController();
    setCmsStatus('Loading published experience…');
    void resolveCmsPage({
      cmsBaseUrl: runtimeConfig.cmsBaseUrl,
      enterpriseCode: runtimeConfig.enterpriseCode,
      site: runtimeConfig.siteCode,
      path: cmsPath,
      locale: runtimeConfig.locale,
      channel: runtimeConfig.channel,
      timeoutMs: runtimeConfig.requestTimeoutMs,
      signal: controller.signal,
    })
      .then((page) => {
        setCmsPage(page);
        setCmsStatus(undefined);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCmsStatus('Published Agora experience is not available yet.');
      });
    return () => controller.abort();
  }, [cmsPath]);

  useEffect(() => {
    if (!rootCollectionCode || collectionCode) return;
    setCollectionCode(rootCollectionCode);
    setSearchCode((current) => current || rootCollectionCode);
  }, [collectionCode, rootCollectionCode]);

  useEffect(() => {
    const defaultLayout = productListingContent?.toolbar?.defaultLayout;
    if (!isProductListingLayout(defaultLayout)) return;
    setListingLayout(defaultLayout);
  }, [productListingContent?.toolbar?.defaultLayout]);

  useEffect(() => {
    if (activeHeroIndex < cmsHeroSlides.length) return;
    setActiveHeroIndex(0);
  }, [activeHeroIndex, cmsHeroSlides.length]);

  useEffect(() => {
    const updateHeaderState = () => setHeaderScrolled(window.scrollY > 64);
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    return () => window.removeEventListener('scroll', updateHeaderState);
  }, []);

  useEffect(() => {
    if (!quickAdd) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuickAdd(undefined);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [quickAdd]);

  useEffect(() => {
    if (!quickView) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuickView(undefined);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [quickView]);

  useEffect(() => {
    if (view !== 'home' || cmsHeroSlides.length < 2) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % cmsHeroSlides.length);
    }, 5200);
    return () => window.clearInterval(intervalId);
  }, [cmsHeroSlides.length, view]);

  useEffect(() => {
    if (view !== 'home' && view !== 'plp') return undefined;
    let active = true;
    const productDiscoveryInput = {
      brandCode: searchContext === 'brand' ? searchCode : undefined,
      categoryCode: searchContext === 'category' ? searchCode || collectionCode : undefined,
      collectionCode: searchContext === 'collection' ? searchCode || collectionCode : undefined,
      domainCode: runtimeConfig.domainCode,
      q: query || undefined,
      sortCode,
      page: String(listingPage),
      pageSize: String(PRODUCT_LISTING_BATCH_SIZE),
    };
    setListingHasNextPage(false);
    void listProducts(runtimeConfig, {
      ...(view === 'home' || view === 'plp' ? productDiscoveryInput : {}),
    })
      .then(async (response) => {
        const responseProducts = response.products;
        const nextTotalCount = discoveryTotal(response);
        if (active && listingPage > 1 && responseProducts.length === 0) {
          setListingPage((current) => Math.max(1, current - 1));
          return;
        }
        if (active) setProducts(responseProducts);
        if (active) setFacets(response.facets ?? {});
        if (active) setProductTotalCount(nextTotalCount);
        if (!active || nextTotalCount !== undefined || responseProducts.length < PRODUCT_LISTING_BATCH_SIZE) return;
        const nextPageResponse = await listProducts(runtimeConfig, {
          ...productDiscoveryInput,
          page: String(listingPage + 1),
        });
        if (active) setListingHasNextPage(nextPageResponse.products.length > 0);
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Product discovery failed');
      });
    return () => {
      active = false;
    };
  }, [collectionCode, listingPage, query, searchCode, searchContext, sortCode, view]);

  useEffect(() => {
    let active = true;
    void listProducts(runtimeConfig, { categoryCode: rootCollectionCode || undefined, pageSize: '32' })
      .then((response) => {
        if (active) setHomeProducts(response.products);
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Product discovery failed');
      });
    return () => {
      active = false;
    };
  }, [rootCollectionCode]);

  useEffect(() => {
    if (!pendingProductSlug || selected?.slug === pendingProductSlug) return;
    const candidate = [...products, ...homeProducts].find((product) => product.slug === pendingProductSlug);
    if (!candidate) return;
    setPendingProductSlug(undefined);
    openProduct(candidate.productCode);
  }, [homeProducts, pendingProductSlug, products, selected?.slug]);

  useEffect(() => {
    let active = true;
    void listShippingMethods(runtimeConfig)
      .then((response) => {
        if (active) setShippingMethodOptions(normalizeShippingOptions(response.methods as readonly Partial<ShippingOption>[]));
      })
      .catch(() => {
        if (active) setShippingMethodOptions(shippingOptions);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void listReturnMethods(runtimeConfig)
      .then((response) => {
        if (active && response.methods.length) setReturnMethodOptions(response.methods);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const openProduct = (productCode: string) => {
    setError(undefined);
    void getProduct(runtimeConfig, productCode)
      .then((response) => {
        setSelected(response.product);
        setSelectedVariantCode(response.product.defaultVariantCode ?? response.product.variantCodes?.[0]);
        setQuantity(1);
        setView('pdp');
        if (typeof window !== 'undefined' && response.product.slug) {
          window.history.pushState({}, '', `/products/${encodeURIComponent(response.product.slug)}`);
        }
        void loadProductReviews(response.product.productCode);
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : 'Product detail failed');
      });
  };

  const openQuickView = (product: ProductCard) => {
    const initialVariantCode = product.defaultVariantCode ?? product.variantCodes?.[0];
    setQuickView(product);
    setQuickViewVariantCode(initialVariantCode);
    void getProduct(runtimeConfig, product.productCode)
      .then((response) => {
        if (!response.product) return;
        setQuickView({
          ...product,
          ...response.product,
          availability: response.product.availability ?? product.availability,
          media: response.product.media ?? product.media,
          name: response.product.name ?? product.name,
          price: response.product.price ?? product.price,
          summary: response.product.summary ?? product.summary,
        });
        setQuickViewVariantCode(response.product.defaultVariantCode ?? response.product.variantCodes?.[0] ?? initialVariantCode);
      })
      .catch(() => setQuickView(product));
  };

  const openQuickAdd = (product: ProductCard, variantCode?: string) => {
    const initialVariantCode = variantCode ?? product.defaultVariantCode ?? product.variantCodes?.[0];
    setQuickAdd(product);
    setQuickAddVariantCode(initialVariantCode);
    setQuickAddQuantity(1);
    void getProduct(runtimeConfig, product.productCode)
      .then((response) => {
        if (!response.product) return;
        setQuickAdd({
          ...product,
          ...response.product,
          availability: response.product.availability ?? product.availability,
          media: response.product.media ?? product.media,
          name: response.product.name ?? product.name,
          price: response.product.price ?? product.price,
          summary: response.product.summary ?? product.summary,
        });
        setQuickAddVariantCode(variantCode ?? response.product.defaultVariantCode ?? response.product.variantCodes?.[0] ?? initialVariantCode);
      })
      .catch(() => setQuickAdd(product));
  };

  const selectQuickAddColour = function (colourCode: string) {
    setQuickAddVariantCode(productVariantForSelection(quickAdd, colourCode, quickAddSizeCode));
  };

  const selectQuickAddSize = function (sizeCode: string) {
    setQuickAddVariantCode(productVariantForSelection(quickAdd, quickAddColourCode, sizeCode));
  };

  const selectQuickViewColour = function (colourCode: string) {
    setQuickViewVariantCode(productVariantForSelection(quickView, colourCode, quickViewSizeCode));
  };

  const selectQuickViewSize = function (sizeCode: string) {
    setQuickViewVariantCode(productVariantForSelection(quickView, quickViewColourCode, sizeCode));
  };

  const addQuickAddToCart = function (buyNow = false) {
    if (!quickAdd) return;
    addToCart(quickAdd, quickAddQuantity, quickAddSelection.variantCode);
    setQuickAdd(undefined);
    if (buyNow) {
      setCheckoutStep('customer');
      setView('checkout');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/checkout');
    }
  };

  const openCollectionsIndex = function () {
    setView('collections');
    if (typeof window !== 'undefined') window.history.pushState({}, '', '/collections');
  };

  const updateProductFilter = function (key: keyof ProductFilterState, value: string | boolean | readonly string[]) {
    setListingPage(1);
    setSelectedFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleProductFilter = function (key: ProductFilterKey, value: string) {
    setListingPage(1);
    setSelectedFilters((current) => ({ ...current, [key]: toggleFilterValue(current[key], value) }));
  };

  const clearProductFilters = function () {
    setBrand('');
    setListingPage(1);
    setSelectedFilters(EMPTY_PRODUCT_FILTERS);
  };

  const openProductListing = function (context: ProductSearchContext = 'all', code = '') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (context === 'brand' && code) params.set('brand', code);
    if (context === 'category' && code) params.set('category', code);
    if (context === 'collection' && code) params.set('collection', code);
    setSearchContext(context);
    setSearchCode(code);
    if (context === 'category' || context === 'collection') setCollectionCode(code);
    setBrand('');
    setSelectedFilters(EMPTY_PRODUCT_FILTERS);
    setListingPage(1);
    setView('plp');
    if (typeof window !== 'undefined') {
      const nextPath = params.toString() ? `/shop?${params.toString()}` : '/shop';
      window.history.pushState({}, '', nextPath);
    }
  };

  const openCollection = (code: string) => {
    if (!code) return;
    openProductListing('collection', code);
  };

  const openCollectionTile = function (collection: AgoraCollectionTile) {
    if (collection.path) {
      openAction({ label: collection.label, path: collection.path });
      return;
    }
    openCollection(collection.code);
  };
  const scrollCollectionCarousel = function (direction: 'previous' | 'next') {
    const collectionRail = collectionCarouselRef.current;
    if (!collectionRail) return;
    const scrollDistance = Math.max(collectionRail.clientWidth * 0.72, 280);
    collectionRail.scrollBy({
      behavior: 'smooth',
      left: direction === 'next' ? scrollDistance : -scrollDistance,
    });
  };

  const ensureBackendCart = async (session = customerSession) => {
    if (backendCartCode) return backendCartCode;
    if (!session.accessToken) {
      setSyncStatus('Local cart fallback; customer session unavailable');
      return undefined;
    }
    const response = await createCart(runtimeConfig, session.accessToken);
    setBackendCartCode(response.cart.code);
    setBackendCartRevision(String(response.cart.revision ?? '0'));
    setSyncStatus(`Backend cart ${response.cart.code}`);
    return response.cart.code;
  };

  const addToCart = (product: ProductCard, quantityToAdd = 1, variantCode = product.defaultVariantCode ?? product.variantCodes?.[0]) => {
    cart.add(product, quantityToAdd, variantCode);
    setBackendCartCalculation(undefined);
    void ensureBackendCart()
      .then((cartCode) => cartCode && customerSession.accessToken ? addCartEntry(runtimeConfig, customerSession.accessToken, cartCode, {
        productCode: product.productCode,
        variantCode,
        quantity: String(quantityToAdd),
      }) : undefined)
      .then((response) => {
        if (!response) return;
        setBackendCartCode(response.cart.code);
        setBackendCartRevision(String(response.cart.revision ?? backendCartRevision));
        const entry = response.entries.find((item) => item.productCode === product.productCode);
        if (entry) setBackendEntryCodes((current) => ({ ...current, [product.productCode]: entry.code }));
        setSyncStatus(`Backend cart ${response.cart.code} synced`);
      })
      .catch(() => setSyncStatus('Local cart fallback; backend cart unavailable'));
  };

  const mergeCustomerList = (listType: CustomerListType, entries: readonly CustomerListEntry[]) => {
    const productCodes = entries.map((entry) => entry.productCode);
    const entryCodes = entries.reduce<Record<string, string>>((result, entry) => {
      result[entry.productCode] = entry.code;
      return result;
    }, {});
    if (listType === 'WISHLIST') setWishlistProductCodes(productCodes);
    else setCompareProductCodes(productCodes.slice(0, 4));
    setBackendListEntryCodes((current) => ({ ...current, [listType]: { ...current[listType], ...entryCodes } }));
  };

  const syncCustomerListsFromBackend = async (session: CustomerSession) => {
    if (!session.accessToken) return;
    try {
      const [wishlist, compare] = await Promise.all([
        readCustomerList(runtimeConfig, session.accessToken, 'WISHLIST'),
        readCustomerList(runtimeConfig, session.accessToken, 'COMPARE'),
      ]);
      mergeCustomerList('WISHLIST', wishlist.entries);
      mergeCustomerList('COMPARE', compare.entries);
      setListStatus(`Backend wishlist and compare synced for ${session.email}`);
    } catch {
      setListStatus('Local wishlist and compare fallback; backend lists unavailable');
    }
  };

  const toggleCustomerList = (listType: CustomerListType, product: ProductCard, updateLocal: (current: readonly string[], exists: boolean) => readonly string[], label: string) => {
    const currentCodes = listType === 'WISHLIST' ? wishlistProductCodes : compareProductCodes;
    const exists = currentCodes.includes(product.productCode);
    const nextCodes = updateLocal(currentCodes, exists);
    if (listType === 'WISHLIST') setWishlistProductCodes(nextCodes);
    else setCompareProductCodes(nextCodes);

    const localMessage = `${product.name ?? product.productCode} ${exists ? 'removed from' : 'added to'} local ${label}`;
    if (!customerSession.accessToken) {
      setListStatus(localMessage);
      return;
    }

    const backendEntryCode = backendListEntryCodes[listType][product.productCode];
    const backendAction = exists && backendEntryCode
      ? removeCustomerListEntry(runtimeConfig, customerSession.accessToken, listType, backendEntryCode)
      : !exists
        ? addCustomerListEntry(runtimeConfig, customerSession.accessToken, listType, { productCode: product.productCode, variantCode: product.defaultVariantCode ?? product.variantCodes?.[0] })
        : Promise.resolve(undefined);

    void backendAction
      .then((response) => {
        if (response) mergeCustomerList(listType, response.entries);
        setListStatus(`${product.name ?? product.productCode} ${exists ? 'removed from' : 'added to'} backend ${label}`);
      })
      .catch(() => setListStatus(localMessage));
  };

  const toggleWishlist = (product: ProductCard) => {
    toggleCustomerList('WISHLIST', product, (current, exists) => {
      return exists ? current.filter((code) => code !== product.productCode) : [product.productCode, ...current];
    }, 'wishlist');
  };

  const toggleCompare = (product: ProductCard) => {
    toggleCustomerList('COMPARE', product, (current, exists) => {
      return exists ? current.filter((code) => code !== product.productCode) : [product.productCode, ...current].slice(0, 4);
    }, 'compare');
  };

  const syncLocalCartToBackend = async (session: CustomerSession) => {
    if (!session.accessToken || cart.entries.length === 0) return;
    const cartCode = await ensureBackendCart(session);
    if (!cartCode) return;
    let latestRevision = backendCartRevision;
    const nextEntryCodes: Record<string, string> = {};
    for (const entry of cart.entries) {
      const response = await addCartEntry(runtimeConfig, session.accessToken, cartCode, {
        productCode: entry.productCode,
        variantCode: entry.variantCode,
        quantity: String(entry.quantity),
      });
      latestRevision = String(response.cart.revision ?? latestRevision);
      const backendEntry = response.entries.find((item) => item.productCode === entry.productCode);
      if (backendEntry) nextEntryCodes[entry.productCode] = backendEntry.code;
    }
    setBackendCartRevision(latestRevision);
    setBackendEntryCodes((current) => ({ ...current, ...nextEntryCodes }));
    setSyncStatus(`Backend cart ${cartCode} synced from local cart`);
  };

  const signIn = async () => {
    setAuthStatus('Signing in…');
    setError(undefined);
    try {
      const response = await authenticateCustomer(runtimeConfig, authForm);
      const accessToken = customerAccessToken(response);
      if (!accessToken) throw new Error('Customer authentication returned no access token');
      const nextSession: CustomerSession = {
        accessToken,
        mode: 'authenticated',
        customerId: response.customerId || response.code || response.loginId || authForm.loginId,
        email: response.email || authForm.loginId,
      };
      saveAgoraCustomerSession(nextSession);
      setCustomerSession(nextSession);
      setCheckoutForm((current) => ({ ...current, email: nextSession.email }));
      setAuthStatus(`Signed in as ${nextSession.email}`);
      await syncLocalCartToBackend(nextSession);
      await syncCustomerListsFromBackend(nextSession);
    } catch (nextError) {
      setAuthStatus(undefined);
      setError(nextError instanceof Error ? nextError.message : 'Customer sign-in failed');
    }
  };

  const signOut = () => {
    clearAgoraCustomerSession();
    const nextSession = resolveAgoraCustomerSession({ ...runtimeConfig, customerAccessToken: undefined });
    setCustomerSession(nextSession);
    setBackendCartCode(undefined);
    setBackendCartRevision('0');
    setBackendEntryCodes({});
    setBackendCartCalculation(undefined);
    setBackendListEntryCodes({ WISHLIST: {}, COMPARE: {} });
    setSyncStatus('Local cart fallback; signed out');
    setAuthStatus('Signed out');
  };

  const removeFromCart = (productCode: string) => {
    cart.remove(productCode);
    setBackendCartCalculation(undefined);
    const entryCode = backendEntryCodes[productCode];
    if (!backendCartCode || !entryCode || !customerSession.accessToken) return;
    void removeCartEntry(runtimeConfig, customerSession.accessToken, backendCartCode, entryCode)
      .then((response) => {
        setBackendCartRevision(String(response.cart.revision ?? backendCartRevision));
        setSyncStatus(`Backend cart ${response.cart.code} synced`);
      })
      .catch(() => setSyncStatus('Local remove applied; backend cart unavailable'));
  };

  const addSelectedToCart = () => {
    if (!selected) return;
    addToCart(selected, quantity, selectedVariantCode);
  };

  const loadProductReviews = async (productCode: string) => {
    setReviewStatus('Loading reviews…');
    try {
      const [aggregate, page] = await Promise.all([
        getReviewAggregate(runtimeConfig, productCode),
        listPublishedReviews(runtimeConfig, productCode),
      ]);
      setReviewAggregate(aggregate);
      setPublicReviews(page.items);
      setReviewStatus(page.items.length ? `${page.items.length} review(s) loaded` : 'No published reviews yet.');
    } catch {
      setReviewAggregate(undefined);
      setPublicReviews([]);
      setReviewStatus('Reviews unavailable; Engagement API is optional for local storefront preview.');
    }
  };

  const updateCartQuantity = (productCode: string, nextQuantity: number) => {
    const safeQuantity = Math.max(0, nextQuantity);
    cart.update(productCode, safeQuantity);
    setBackendCartCalculation(undefined);
    const entryCode = backendEntryCodes[productCode];
    if (!backendCartCode || !entryCode || !customerSession.accessToken) return;
    if (safeQuantity <= 0) {
      removeFromCart(productCode);
      return;
    }
    void updateCartEntry(runtimeConfig, customerSession.accessToken, backendCartCode, entryCode, String(safeQuantity))
      .then((response) => {
        setBackendCartRevision(String(response.cart.revision ?? backendCartRevision));
        setSyncStatus(`Backend cart ${response.cart.code} synced`);
      })
      .catch(() => setSyncStatus('Local quantity update applied; backend cart unavailable'));
  };

  const updateCheckout = (field: keyof typeof checkoutForm, value: string) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
  };

  const promotionPayload = (cartCode?: string) => ({
    cartCode,
    subtotal: cart.subtotal.toFixed(2),
    productCodes: cart.entries.map((entry) => entry.productCode),
    currency: 'USD',
  });

  const refreshBackendCartCalculation = async (
    cartCode = backendCartCode,
    revision = backendCartRevision,
    session = customerSession,
  ) => {
    if (!cartCode || !session.accessToken || cart.entries.length === 0) {
      setBackendCartCalculation(undefined);
      return undefined;
    }
    const calculation = await calculateCart(runtimeConfig, session.accessToken, cartCode, revision);
    setBackendCartRevision(String(calculation.cart?.revision ?? calculation.revision ?? revision));
    setBackendCartCalculation(calculation);
    return calculation;
  };

  const refreshPromotionPreview = async (session = customerSession) => {
    if (!session.accessToken || cart.entries.length === 0) {
      setBackendPromotionDiscount(undefined);
      return;
    }
    try {
      const response = await previewPromotion(runtimeConfig, session.accessToken, promotionPayload(backendCartCode));
      const amount = Number(response.decisions?.[0]?.discountAmount ?? response.selected[0]?.actions?.discountAmount ?? 0);
      setBackendPromotionDiscount(Number.isFinite(amount) && amount > 0 ? amount : undefined);
      setPromotionStatus(response.selected[0]?.code ? `Backend promotion preview ${response.selected[0].code}` : 'No backend promotion available');
    } catch {
      setBackendPromotionDiscount(undefined);
      setPromotionStatus('Local promotion estimate; backend preview unavailable');
    }
  };

  useEffect(() => {
    void refreshPromotionPreview();
  }, [customerSession.accessToken, backendCartCode, cart.subtotal, cart.entries.length]);

  const checkoutValidation = () => {
    return validateCheckoutSnapshot(checkoutForm, shippingMethodOptions);
  };

  const paymentProviderToken = () => {
    return checkoutPaymentProviderToken(checkoutForm.paymentMethod, checkoutForm.cardLast4);
  };

  const placeOrder = async () => {
    const validation = checkoutValidation();
    if (validation) {
      setCheckoutStep(validation.step);
      setError(validation.message);
      return;
    }
    if (!customerSession.accessToken) {
      setCheckoutStep('customer');
      setError('Sign in before placing a live order.');
      return;
    }
    setCheckoutBusy(true);
    setError(undefined);
    const nextOrderCode = orderCode();
    const cartCode = backendCartCode ?? `local-${cart.entries.map((entry) => entry.productCode).join('-') || 'empty'}`;
    if (backendCartCode && customerSession.accessToken) {
      try {
        await refreshBackendCartCalculation(backendCartCode, backendCartRevision, customerSession);
      } catch {
        setSyncStatus('Backend calculation unavailable; using visible cart total');
      }
    }
    try {
      const checkoutIdempotencyKey = idempotencyKey();
      if (customerSession.accessToken && cart.entries.length) {
        try {
          const promotion = await applyPromotion(runtimeConfig, customerSession.accessToken, {
            ...promotionPayload(cartCode),
            idempotencyKey: `promotion-${checkoutIdempotencyKey}`,
          });
          const amount = Number(promotion.decisions?.[0]?.discountAmount ?? 0);
          if (Number.isFinite(amount) && amount > 0) setBackendPromotionDiscount(amount);
          setPromotionStatus(promotion.redemption?.code ? `Promotion applied ${promotion.redemption.code}` : 'Promotion eligibility checked');
        } catch {
          setPromotionStatus('Promotion apply unavailable; order uses current visible estimate');
        }
      }
      const response = await placeCheckout(
        runtimeConfig,
        customerSession.accessToken,
        {
          cartCode,
          orderCode: nextOrderCode,
          calculationCode: `calc-${cartCode}`,
          expectedCartRevision: backendCartRevision,
          providerToken: paymentProviderToken(),
          customer: {
            email: checkoutForm.email,
            firstName: checkoutForm.firstName,
            lastName: checkoutForm.lastName,
            phone: checkoutForm.phone,
          },
          shippingAddress: {
            line1: checkoutForm.line1,
            line2: checkoutForm.line2,
            city: checkoutForm.city,
            region: checkoutForm.region,
            postalCode: checkoutForm.postalCode,
            country: checkoutForm.country,
          },
          shippingMethod: checkoutForm.shippingMethod,
          paymentMethod: checkoutForm.paymentMethod,
        },
        checkoutIdempotencyKey,
      );
      setConfirmation(response);
      setPaymentResult(paymentResultViewModel(response.status));
      const liveOrderCode = response.orderCode ?? response.code ?? response.evidence?.orderCode ?? nextOrderCode;
      setSelectedOrderCode(liveOrderCode);
      cart.clear();
      setBackendCartCode(undefined);
      setBackendCartRevision('0');
      setBackendEntryCodes({});
      setBackendCartCalculation(undefined);
      setSyncStatus('Order placed; cart cleared');
      try {
        const detail = await readCustomerOrder(runtimeConfig, customerSession.accessToken, liveOrderCode);
        setOrderDetail(detail);
      } catch {
        setOrderDetail(undefined);
      }
      setView('payment-result');
    } catch (nextError) {
      setOrderDetail(undefined);
      const message = nextError instanceof Error ? nextError.message : 'Live checkout placement failed';
      setPaymentResult(paymentResultViewModel('FAILED', message));
      setView('payment-result');
      setError(message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const brands = uniqueSorted(products.map((product) => productBrandLabel(product)));
  const categoryOptions = uniqueSorted(products.flatMap((product) => product.categoryCodes ?? []));
  const collectionOptions = uniqueSorted(products.flatMap((product) => productCollectionCodes(product)));
  const colorOptions = uniqueSorted(products.flatMap((product) => productColorCodes(product)));
  const sizeOptions = uniqueSorted(products.flatMap((product) => productSizeCodes(product)));
  const availabilityOptions = uniqueSorted(products.map((product) => productAvailabilityLabel(product)));
  const activeBrandFilters = uniqueSorted([brand, ...selectedFilters.brands]);
  const selectedPriceMin = moneyAmount(selectedFilters.priceMin);
  const selectedPriceMax = moneyAmount(selectedFilters.priceMax);
  const activeFilterCount = filterCount(selectedFilters) + (brand ? 1 : 0);
  const visibleProducts = products.filter((product) => {
    const productPrice = moneyAmount(product.price?.unitAmount);
    if (!includesAny(productBrandLabel(product) ? [productBrandLabel(product) as string] : [], activeBrandFilters)) return false;
    if (!includesAny(product.categoryCodes, selectedFilters.categories)) return false;
    if (!includesAny(productCollectionCodes(product), selectedFilters.collections)) return false;
    if (!includesAny(productColorCodes(product), selectedFilters.colors)) return false;
    if (!includesAny(productSizeCodes(product), selectedFilters.sizes)) return false;
    if (!includesAny([productAvailabilityLabel(product)], selectedFilters.availability)) return false;
    if (selectedFilters.saleOnly && !productCollectionCodes(product).some((code) => normalizedText(code).includes('sale'))) return false;
    if (productPrice === undefined && (selectedPriceMin !== undefined || selectedPriceMax !== undefined)) return false;
    if (selectedPriceMin !== undefined && productPrice !== undefined && productPrice < selectedPriceMin) return false;
    if (selectedPriceMax !== undefined && productPrice !== undefined && productPrice > selectedPriceMax) return false;
    return true;
  }).sort((left, right) => {
    if (sortCode === 'price-asc') return (moneyAmount(left.price?.unitAmount) ?? 0) - (moneyAmount(right.price?.unitAmount) ?? 0);
    if (sortCode === 'price-desc') return (moneyAmount(right.price?.unitAmount) ?? 0) - (moneyAmount(left.price?.unitAmount) ?? 0);
    if (sortCode === 'name-asc') return String(left.name ?? left.productCode).localeCompare(String(right.name ?? right.productCode));
    return 0;
  });
  const facetEntries = Object.entries(facets).filter(([, values]) => values.length > 0);
  const homeRailProducts = homeProducts.length ? homeProducts : products;
  const featuredProducts = selectedHomeProducts(homeContent.topPicks.productCodes, homeRailProducts, homeContent.topPicks.pageSize ?? 4);
  const bestSelling = selectedHomeProducts(homeContent.bestSelling.productCodes, homeRailProducts, homeContent.bestSelling.pageSize ?? 4);
  const projectedListingProducts = selectedHomeProducts(
    productListingContent?.projectedProducts?.productCodes,
    homeRailProducts,
    productListingContent?.projectedProducts?.pageSize ?? 8,
  );
  const collections = homeContent.collections;
  const selectedShippingOption = shippingOption(checkoutForm.shippingMethod, shippingMethodOptions);
  const selectedPaymentOption = paymentOption(checkoutForm.paymentMethod);
  const shippingAmount = shippingPrice(checkoutForm.shippingMethod, shippingMethodOptions);
  const promotionDiscount = backendPromotionDiscount ?? 0;
  const taxAmount = moneyAmount(backendCartCalculation?.taxAmount) ?? 0;
  const backendTotalAmount = moneyAmount(backendCartCalculation?.totalAmount ?? backendCartCalculation?.totals?.total);
  const totalAmount = backendTotalAmount !== undefined ? Math.max(0, backendTotalAmount + shippingAmount) : Math.max(0, cart.subtotal - promotionDiscount + shippingAmount);
  const confirmedOrderCode = orderDetail?.order.code ?? confirmation?.orderCode ?? confirmation?.code ?? confirmation?.evidence?.orderCode;
  const confirmedStatus = orderDetail?.order.status ?? confirmation?.status ?? 'PLACED';
  const confirmedTotal = orderDetail?.order.totalAmount ? Number(orderDetail.order.totalAmount) : totalAmount;
  const completedConfirmationSteps = confirmation?.evidence?.completed ?? [];
  const reasonOptions = lifecycleReasonOptions[selectedLifecycleType];
  const lifecycleRecords = orderDetail?.lifecycle ?? [];
  const activeOrderCode = selectedOrderCode ?? confirmedOrderCode ?? orderHistory[0]?.code;
  const wishlistProducts = products.filter((product) => wishlistProductCodes.includes(product.productCode));
  const compareProducts = products.filter((product) => compareProductCodes.includes(product.productCode));
  const recommendedProductCodes = selected?.relatedProductCodes?.length ? selected.relatedProductCodes : [];
  const recommendedProducts = products.filter((product) => recommendedProductCodes.includes(product.productCode) && product.productCode !== selected?.productCode).slice(0, 3);
  const selectedCollection = searchContext === 'all'
    ? undefined
    : collections.find((collection) => collection.code === collectionCode || collection.code === searchCode);
  const collectionLabelByCode = new Map(collections.map((collection) => [collection.code, collection.label]));
  const filterOptionLabel = function (key: ProductFilterKey, value: string): string {
    if (key === 'categories' || key === 'collections') return collectionLabelByCode.get(value) ?? humanizeCodeLabel(value);
    return value;
  };
  const collectionIndexContent = homeContent.collectionIndex;
  const listingEyebrow = searchContext === 'brand'
    ? 'Brand edit'
    : searchContext === 'category'
      ? 'Category edit'
      : searchContext === 'collection'
        ? 'Collection edit'
        : 'Product Listing';
  const listingHeading = selectedCollection?.label ?? productListingContent?.heading ?? 'Shop products';
  const listingSummary = selectedCollection?.summary ?? productListingContent?.summary ?? 'Explore the latest apparel pieces resolved from Commerce discovery.';
  const listingResultLabel = productListingContent?.resultLabel ?? 'products';
  const completeStatusLabel = productListingContent?.completeStatusLabel ?? `All matching ${listingResultLabel} are visible`;
  const displayedProductCount = visibleProducts.length;
  const listingTotalCount = productTotalCount !== undefined ? Math.max(productTotalCount, displayedProductCount) : undefined;
  const listingPageStart = displayedProductCount ? ((listingPage - 1) * PRODUCT_LISTING_BATCH_SIZE) + 1 : 0;
  const listingPageEnd = displayedProductCount ? listingPageStart + displayedProductCount - 1 : 0;
  const listingTotalPages = listingTotalCount !== undefined ? Math.max(1, Math.ceil(listingTotalCount / PRODUCT_LISTING_BATCH_SIZE)) : undefined;
  const listingCountText = listingTotalCount !== undefined
    ? `Showing ${listingPageStart}-${listingPageEnd} of ${listingTotalCount} ${listingResultLabel}`
    : `Showing ${listingPageStart}-${listingPageEnd} ${listingResultLabel}`;
  const canShowNextListingPage = listingTotalPages !== undefined
    ? listingPage < listingTotalPages
    : listingHasNextPage;
  const canShowPreviousListingPage = listingPage > 1;
  const listingPaginationPages = listingTotalPages !== undefined
    ? Array.from({ length: listingTotalPages }, (_, index) => index + 1).filter((pageNumber) => (
      pageNumber === 1 ||
      pageNumber === listingTotalPages ||
      Math.abs(pageNumber - listingPage) <= 1
    ))
    : Array.from(new Set([
      1,
      ...(listingPage > 2 ? [listingPage - 1] : []),
      ...(listingPage > 1 ? [listingPage] : []),
      ...(canShowNextListingPage ? [listingPage + 1] : []),
    ])).sort((left, right) => left - right);
  const productListingHeroFallbackMedia = visibleProducts
    .map((product): AgoraMediaItem | undefined => {
      const image = productImageUrl(product, runtimeConfig.mediaBaseUrl);
      if (!image) return undefined;
      return {
        alt: product.name ?? product.productCode,
        image,
        mediaCode: product.productCode,
      };
    })
    .filter((item): item is AgoraMediaItem => Boolean(item))
    .slice(0, 4);
  const productListingDefaultHeroMedia: AgoraMediaItem = {
    alt: 'Agora apparel product listing editorial banner',
    image: mediaDeliveryUrl(runtimeConfig.mediaBaseUrl, PRODUCT_LISTING_DEFAULT_HERO_MEDIA_CODE),
    mediaCode: PRODUCT_LISTING_DEFAULT_HERO_MEDIA_CODE,
  };
  const productListingHeroMedia = productListingContent?.heroMedia?.image
    ? productListingContent.heroMedia
    : productListingDefaultHeroMedia;
  const productListingHeroSupportingMedia = productListingContent?.heroSupportingMedia?.length
    ? productListingContent.heroSupportingMedia
    : productListingHeroMedia.mediaCode === productListingDefaultHeroMedia.mediaCode
      ? []
      : productListingHeroFallbackMedia.slice(1);
  const productListingHeroHasMedia = Boolean(productListingHeroMedia?.image);
  const activeFilterLabels = [
    ...activeBrandFilters.map((value) => ({ key: `brand:${value}`, label: `Brand: ${value}` })),
    ...selectedFilters.categories.map((value) => ({ key: `category:${value}`, label: `Category: ${filterOptionLabel('categories', value)}` })),
    ...selectedFilters.collections.map((value) => ({ key: `collection:${value}`, label: `Collection: ${filterOptionLabel('collections', value)}` })),
    ...selectedFilters.colors.map((value) => ({ key: `color:${value}`, label: `Color: ${value}` })),
    ...selectedFilters.sizes.map((value) => ({ key: `size:${value}`, label: `Size: ${value}` })),
    ...selectedFilters.availability.map((value) => ({ key: `availability:${value}`, label: value })),
    ...(selectedFilters.saleOnly ? [{ key: 'saleOnly', label: 'Sale only' }] : []),
    ...(selectedFilters.priceMin ? [{ key: 'priceMin', label: `Min ${selectedFilters.priceMin}` }] : []),
    ...(selectedFilters.priceMax ? [{ key: 'priceMax', label: `Max ${selectedFilters.priceMax}` }] : []),
  ];
  const filterOptionCount = function (key: ProductFilterKey, value: string): number {
    return products.filter((product) => {
      if (key === 'brands') return productBrandLabel(product) === value;
      if (key === 'categories') return (product.categoryCodes ?? []).includes(value);
      if (key === 'collections') return productCollectionCodes(product).includes(value);
      if (key === 'colors') return productColorCodes(product).includes(value);
      if (key === 'sizes') return productSizeCodes(product).includes(value);
      return productAvailabilityLabel(product) === value;
    }).length;
  };
  const effectiveSelectedFilters: ProductFilterState = Object.freeze({ ...selectedFilters, brands: activeBrandFilters });
  const listingFilterGroups: readonly ProductFilterOptionGroup[] = Object.freeze([
    { key: 'categories', label: 'Product Categories', options: categoryOptions },
    { key: 'sizes', label: 'Size', options: sizeOptions },
    { key: 'colors', label: 'Color', options: colorOptions },
    { key: 'brands', label: 'Brand', options: brands },
    { key: 'collections', label: 'Collection', options: collectionOptions },
    { key: 'availability', label: 'Availability', options: availabilityOptions },
  ]);
  const searchFacetsText = facetEntries.length
    ? facetEntries.map(([facetCode, values]) => `${facetCode}: ${values.map((value) => facetLabel(value)).join(', ')}`).join(' · ')
    : undefined;

  const lifecycleEvidenceLabel = (record: { readonly evidence?: Readonly<Record<string, unknown>> }, key: string) => {
    const value = record.evidence?.[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined;
  };

  const loadOrderDetail = async (orderCodeToLoad: string, session = customerSession) => {
    if (!session.accessToken) {
      setOrderHistoryStatus('Sign in to view order history.');
      return undefined;
    }
    const detail = await readCustomerOrder(runtimeConfig, session.accessToken, orderCodeToLoad);
    setOrderDetail(detail);
    setSelectedOrderCode(detail.order.code);
    return detail;
  };

  const loadOrderHistory = async (session = customerSession, preferredOrderCode = selectedOrderCode ?? confirmedOrderCode) => {
    if (!session.accessToken) {
      setOrderHistoryStatus('Sign in to view order history.');
      return;
    }
    setOrderHistoryStatus('Loading order history…');
    try {
      const orders = await listCustomerOrders(runtimeConfig, session.accessToken);
      setOrderHistory(orders);
      const nextOrderCode = preferredOrderCode ?? orders[0]?.code;
      if (nextOrderCode) await loadOrderDetail(nextOrderCode, session);
      setOrderHistoryStatus(orders.length ? `${orders.length} order(s) loaded` : 'No orders yet.');
    } catch (nextError) {
      setOrderHistoryStatus(nextError instanceof Error ? nextError.message : 'Order history unavailable');
    }
  };

  useEffect(() => {
    const applyRouteState = () => {
      const nextRouteState = routeStateFromLocation(rootCollectionCode);
      setView(nextRouteState.view);
      setCollectionCode(nextRouteState.collectionCode);
      setSearchCode(nextRouteState.searchCode);
      setSearchContext(nextRouteState.searchContext);
      setQuery(nextRouteState.query);
      setListingPage(1);
      setPendingProductSlug(nextRouteState.productSlug);
      if (nextRouteState.view !== 'pdp') setSelected(undefined);
      if (nextRouteState.checkoutStep) setCheckoutStep(nextRouteState.checkoutStep);
      if (nextRouteState.view === 'orders') void loadOrderHistory(customerSession);
    };
    window.addEventListener('popstate', applyRouteState);
    return () => window.removeEventListener('popstate', applyRouteState);
  }, [customerSession, rootCollectionCode]);

  const openAction = (action: AgoraLinkAction | undefined) => {
    if (!action) return;
    if (action.collectionCode) {
      openCollection(action.collectionCode);
      return;
    }
    if (action.path?.startsWith('http')) {
      window.open(action.path, '_blank', 'noreferrer');
      return;
    }
    if (action.path === '/' || action.path === '#home') {
      setView('home');
      if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
      return;
    }
    if (action.path === '/collections') {
      openCollectionsIndex();
      return;
    }
    if (action.path === '/shop') {
      openProductListing('all');
      return;
    }
    if (action.path) {
      window.history.pushState({}, '', action.path);
      const nextRouteState = routeStateFromLocation(rootCollectionCode);
      setView(nextRouteState.view);
      setCollectionCode(nextRouteState.collectionCode);
      setSearchCode(nextRouteState.searchCode);
      setSearchContext(nextRouteState.searchContext);
      setQuery(nextRouteState.query);
    }
  };

  const lifecycleInput = () => ({
    reasonCode: lifecycleForm.reasonCode,
    quantity: lifecycleForm.quantity,
    returnMethod: lifecycleForm.returnMethod,
    refundMethod: lifecycleForm.refundMethod,
    replacementProductCode: lifecycleForm.replacementProductCode,
    preferredResolution: lifecycleForm.preferredResolution,
    appealReferenceCode: lifecycleForm.appealReferenceCode,
    appealReason: lifecycleForm.appealReason,
    comment: lifecycleForm.comment,
    productCodes: cart.entries.map((entry) => entry.productCode),
  });

  const previewLifecycle = (requestType: (typeof lifecycleTypes)[number]) => {
    const orderCodeForLifecycle = activeOrderCode ?? confirmedOrderCode;
    if (!orderCodeForLifecycle) return;
    if (!customerSession.accessToken) {
      setLifecycleStatus(`${requestType} local fallback preview captured for ${orderCodeForLifecycle}`);
      return;
    }
    setLifecycleStatus(`Previewing ${requestType} eligibility…`);
    void previewLifecycleRequest(runtimeConfig, customerSession.accessToken, orderCodeForLifecycle, requestType, lifecycleInput())
      .then((preview) => {
        setLifecyclePreview(preview as unknown as Readonly<Record<string, unknown>>);
        setLifecycleStatus(`${requestType} preview ${lifecycleSummary(preview)} · eligible ${preview.eligible === false ? 'no' : 'yes'}`);
      })
      .catch(() => setLifecycleStatus(`${requestType} local fallback preview captured for ${orderCodeForLifecycle}`));
  };

  const requestLifecycle = (requestType: (typeof lifecycleTypes)[number]) => {
    const orderCodeForLifecycle = activeOrderCode ?? confirmedOrderCode;
    if (!orderCodeForLifecycle) return;
    if (!customerSession.accessToken) {
      setLifecycleStatus(`${requestType} local fallback request captured for ${orderCodeForLifecycle}`);
      return;
    }
    void submitLifecycleRequest(runtimeConfig, customerSession.accessToken, orderCodeForLifecycle, requestType, lifecycleInput())
      .then((response) => {
        const policyReasons = response.preview.reasonCodes?.join(', ');
        setLifecycleStatus(`${requestType} ${lifecycleSummary(response.preview, response.created)}${policyReasons ? ` · reasons: ${policyReasons}` : ''}`);
        setLifecyclePreview(response.preview as unknown as Readonly<Record<string, unknown>>);
        if (customerSession.accessToken) void loadOrderDetail(orderCodeForLifecycle, customerSession);
      })
      .catch(() => setLifecycleStatus(`${requestType} local fallback request captured for ${orderCodeForLifecycle}`));
  };

  const selectedSelection = apparelSelectionForVariant(selected, selectedVariantCode);
  const selectedColourCode = selectedSelection.colourCode;
  const selectedSizeCode = selectedSelection.sizeCode;
  const selectedColorOptions = productColorOptions(selected);
  const selectedSizeOptions = productSizeOptions(selected, selectedColourCode);
  const quickAddSelection = apparelSelectionForVariant(quickAdd, quickAddVariantCode);
  const quickAddColourCode = quickAddSelection.colourCode;
  const quickAddSizeCode = quickAddSelection.sizeCode;
  const quickAddColorOptions = productColorOptions(quickAdd);
  const quickAddSizeOptions = productSizeOptions(quickAdd, quickAddColourCode);
  const quickAddImage = quickAdd ? apparelImageUrlForVariant(quickAdd, quickAddSelection.variantCode, runtimeConfig.mediaBaseUrl) : undefined;
  const quickAddPrice = `${quickAdd?.price?.currency ?? 'USD'} ${quickAdd?.price?.unitAmount ?? '0.00'}`;
  const quickViewSelection = apparelSelectionForVariant(quickView, quickViewVariantCode);
  const quickViewColourCode = quickViewSelection.colourCode;
  const quickViewSizeCode = quickViewSelection.sizeCode;
  const quickViewColorOptions = productColorOptions(quickView);
  const quickViewSizeOptions = productSizeOptions(quickView, quickViewColourCode);
  const quickViewImage = quickView ? apparelImageUrlForVariant(quickView, quickViewSelection.variantCode, runtimeConfig.mediaBaseUrl) : undefined;
  const quickViewPrice = `${quickView?.price?.currency ?? 'USD'} ${quickView?.price?.unitAmount ?? '0.00'}`;
  const useCmsHeroImages = true;
  const headerLogoText = headerContent.logoText ?? 'NODICS';
  const headerSubtitle = headerContent.subtitle ?? 'AGORA';
  const storefrontLabels = homeContent.storefrontLabels;
  const addToCartLabel = storefrontLabels.addToCart ?? 'Add to cart';
  const availableColorsLabel = storefrontLabels.availableColors ?? 'Available colors';
  const availableSizesLabel = storefrontLabels.availableSizes ?? 'Available sizes';
  const backToListingLabel = storefrontLabels.backToListing ?? 'Back to listing';
  const buyNowLabel = storefrontLabels.buyNow ?? 'Buy it now';
  const closeQuickAddLabel = storefrontLabels.closeQuickAdd ?? 'Close quick add';
  const closeQuickViewLabel = storefrontLabels.closeQuickView ?? 'Close';
  const colorLabel = storefrontLabels.color ?? 'Color';
  const colorsLabel = storefrontLabels.colors ?? 'Colors';
  const compareLabel = storefrontLabels.compare ?? 'Compare';
  const decreaseQuantityLabel = storefrontLabels.decreaseQuantity ?? 'Decrease quantity';
  const descriptionLabel = storefrontLabels.description ?? 'Description';
  const featuredProductsAriaLabel = storefrontLabels.featuredProductsAriaLabel ?? 'Featured products';
  const increaseQuantityLabel = storefrontLabels.increaseQuantity ?? 'Increase quantity';
  const quantityLabel = storefrontLabels.quantity ?? 'Quantity';
  const quickAddLabel = storefrontLabels.quickAdd ?? 'Quick Add';
  const quickViewTitleLabel = storefrontLabels.quickViewTitle ?? 'Quick View';
  const recommendationsEyebrowLabel = storefrontLabels.recommendationsEyebrow ?? 'Curated recommendations';
  const recommendationsHeadingLabel = storefrontLabels.recommendationsHeading ?? 'Related pieces';
  const recommendationsSummaryLabel = storefrontLabels.recommendationsSummary ?? 'Recommendations are resolved from Commerce product relationships.';
  const removeFromCompareLabel = storefrontLabels.removeFromCompare ?? 'Remove from compare';
  const removeFromWishlistLabel = storefrontLabels.removeFromWishlist ?? 'Remove from wishlist';
  const reviewsLabel = storefrontLabels.reviews ?? 'Reviews';
  const selectColorPrefix = storefrontLabels.selectColorPrefix ?? 'Select';
  const shippingReturnsLabel = storefrontLabels.shippingReturns ?? 'Shipping & returns';
  const shippingReturnsText = storefrontLabels.shippingReturnsText ?? 'Free shipping threshold and 14-day returns are resolved from backend policy.';
  const sizeLabel = storefrontLabels.size ?? 'Size';
  const addToWishlistLabel = storefrontLabels.addToWishlist ?? 'Add to wishlist';
  const bestSellingProductsAriaLabel = storefrontLabels.bestSellingProductsAriaLabel ?? 'Best selling products';
  const hasFooterContent = Boolean(
    homeContent.footer.summary ||
      homeContent.footer.contactEmail ||
      homeContent.footer.groups.length ||
      homeContent.footer.newsletter ||
      homeContent.footer.legalLinks.length ||
      homeContent.footer.copyright ||
      homeContent.footer.brandLabel,
  );
  const renderStorefrontFooter = function () {
    if (!hasFooterContent) return null;
    return (
      <footer className="storefront-footer">
        <section className="storefront-footer-brand">
          <NodicsBrand logoText={headerLogoText} subtitle={headerSubtitle} />
          {homeContent.footer.summary ? <p>{homeContent.footer.summary}</p> : null}
          {homeContent.footer.contactEmail ? <a href={`mailto:${homeContent.footer.contactEmail}`}>{homeContent.footer.contactEmail}</a> : null}
        </section>
        {homeContent.footer.groups.map((group) => (
          <section className="storefront-footer-links" key={group.title}>
            <h3>{group.title}</h3>
            {group.links.map((link) => <span className="footer-link" key={link}>{link}</span>)}
          </section>
        ))}
        {homeContent.footer.newsletter ? (
          <section className="storefront-footer-newsletter">
            {homeContent.footer.newsletter.title ? <h3>{homeContent.footer.newsletter.title}</h3> : null}
            {homeContent.footer.newsletter.text ? <p>{homeContent.footer.newsletter.text}</p> : null}
            <form onSubmit={(event) => event.preventDefault()}>
              <input aria-label="Newsletter email" placeholder={homeContent.footer.newsletter?.placeholder} />
              <button type="submit">{homeContent.footer.newsletter?.buttonLabel}</button>
            </form>
          </section>
        ) : null}
        <section className="storefront-footer-legal">
          {homeContent.footer.copyright ? <span>{homeContent.footer.copyright}</span> : null}
          {homeContent.footer.brandLabel ? <span>{homeContent.footer.brandLabel}</span> : null}
          {homeContent.footer.legalLinks.map((link) => <span key={link}>{link}</span>)}
        </section>
      </footer>
    );
  };
  const renderHeaderAction = (action: AgoraLinkAction, className?: string) => {
    if (action.collectionCode) {
      return (
        <button className={className} key={`${action.label}-${action.collectionCode}`} onClick={() => openCollection(action.collectionCode ?? '')} type="button">
          {action.label}
        </button>
      );
    }
    return (
      <a className={className} href={action.path} key={`${action.label}-${action.path}`}>
        {action.label}
      </a>
    );
  };
  const renderActionButton = function (action: AgoraLinkAction | undefined) {
    if (!action) return null;
    return (
      <button className="secondary" onClick={() => openAction(action)} type="button">
        {action.label}
      </button>
    );
  };
  const megaMenuPrimaryAction = function (menu: AgoraMegaMenu): AgoraLinkAction {
    return {
      label: menu.label,
      ...(menu.collectionCode ? { collectionCode: menu.collectionCode } : {}),
      ...(menu.path ? { path: menu.path } : {}),
    };
  };
  const openMegaMenuAction = function (menu: AgoraMegaMenu) {
    setActiveMegaMenuCode(undefined);
    openAction(megaMenuPrimaryAction(menu));
  };
  const renderMegaMenuPanel = function () {
    if (!activeMegaMenu) return null;
    return (
      <section
        aria-label={`${activeMegaMenu.label} menu`}
        className="agora-mega-menu"
        onMouseEnter={() => setActiveMegaMenuCode(activeMegaMenu.code)}
        onMouseLeave={() => setActiveMegaMenuCode(undefined)}
      >
        <div className="agora-mega-menu-intro">
          {activeMegaMenu.eyebrow ? <span>{activeMegaMenu.eyebrow}</span> : null}
          <h2>{activeMegaMenu.label}</h2>
          {activeMegaMenu.summary ? <p>{activeMegaMenu.summary}</p> : null}
          <button onClick={() => openMegaMenuAction(activeMegaMenu)} type="button">
            Explore {activeMegaMenu.label} <ArrowUpRight aria-hidden="true" size={16} />
          </button>
        </div>
        <div className="agora-mega-menu-groups">
          {activeMegaMenu.groups.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              {group.summary ? <p>{group.summary}</p> : null}
              <ul>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <button onClick={() => {
                      setActiveMegaMenuCode(undefined);
                      openAction(link);
                    }} type="button">
                      <span>
                        {link.label}
                        {link.summary ? <small>{link.summary}</small> : null}
                      </span>
                      {link.badge ? <em>{link.badge}</em> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {activeMegaMenu.featureTiles.length ? (
          <div className="agora-mega-menu-feature-grid">
            {activeMegaMenu.featureTiles.map((tile) => (
              <button key={tile.title} onClick={() => {
                setActiveMegaMenuCode(undefined);
                openAction(tile.action ?? { label: tile.title, collectionCode: activeMegaMenu.collectionCode, path: activeMegaMenu.path });
              }} type="button">
                {tile.image ? <img alt={tile.alt ?? tile.title} src={tile.image} /> : <span className="agora-mega-menu-image-placeholder" aria-label={`${tile.title} image unavailable`} role="img" />}
                {tile.badge ? <span>{tile.badge}</span> : null}
                <strong>{tile.title}</strong>
                {tile.summary ? <small>{tile.summary}</small> : null}
              </button>
            ))}
          </div>
        ) : null}
        {activeMegaMenu.promoStripe.length ? (
          <div className="agora-mega-menu-promo-strip">
            {activeMegaMenu.promoStripe.map((promo) => (
              <button key={promo.label} onClick={() => {
                setActiveMegaMenuCode(undefined);
                openAction(promo);
              }} type="button">
                {promo.eyebrow ? <small>{promo.eyebrow}</small> : null}
                <span>{promo.label}</span>
                {promo.text ? <em>{promo.text}</em> : null}
                {promo.badge ? <strong>{promo.badge}</strong> : null}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    );
  };

  if (!cmsPage) {
    const loading = cmsStatus?.toLowerCase().includes('loading');
    return (
      <main className="agora-shell agora-unpublished-shell">
        <section className="storefront-unpublished-state" aria-live="polite" role={loading ? 'status' : 'alert'}>
          <NodicsBrand logoText="NODICS" subtitle="AGORA" />
          <p className="eyebrow">{loading ? 'Preparing your experience' : 'Storefront maintenance'}</p>
          <h1>{loading ? 'Opening the storefront.' : 'We are getting the storefront ready.'}</h1>
          <p>
            {loading
              ? 'Thanks for your patience while the latest shopping experience is being prepared.'
              : 'The store is not available right now while we complete a content update. Please check back shortly.'}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="agora-shell">
      <aside className="storefront-utility-bar" aria-label="Storefront service links">
        <div className="utility-links">
          {headerContent.utilityLinks.map((item) => renderHeaderAction(item))}
        </div>
        {headerContent.preferences.length ? (
          <div className="utility-preferences" aria-label="Storefront preferences">
            {headerContent.preferences.map((item) => (
              <button key={item.label} onClick={() => openAction(item)} type="button">
                {item.label} <ChevronDown aria-hidden="true" size={16} />
              </button>
            ))}
          </div>
        ) : null}
      </aside>
      <header className={`storefront-header${headerScrolled ? ' is-scrolled' : ''}`}>
        <button className="agora-brand" onClick={() => openAction({ label: 'Home', path: '/' })} type="button" aria-label="Nodics Agora home">
          <NodicsBrand logoText={headerLogoText} subtitle={headerSubtitle} />
        </button>
        <nav className="nav-pills" aria-label="Storefront navigation">
          {headerContent.megaMenus.length ? headerContent.megaMenus.map((menu) => {
            const hasPanel = menu.groups.length || menu.featureTiles.length || menu.promoStripe.length;
            const active = activeMegaMenuCode === menu.code || collectionCode === menu.collectionCode;
            return (
              <button
                aria-expanded={hasPanel ? activeMegaMenuCode === menu.code : undefined}
                className={active ? '' : 'secondary'}
                key={menu.code}
                onClick={() => hasPanel ? setActiveMegaMenuCode(menu.code) : openMegaMenuAction(menu)}
                onFocus={() => hasPanel ? setActiveMegaMenuCode(menu.code) : undefined}
                onMouseEnter={() => hasPanel ? setActiveMegaMenuCode(menu.code) : undefined}
                type="button"
              >
                {menu.label}
                {menu.badge ? <span className="nav-badge">{menu.badge}</span> : null}
                {hasPanel ? <ChevronDown aria-hidden="true" size={15} /> : null}
              </button>
            );
          }) : headerContent.navigation.map((item) => (
            <button className={collectionCode === item.collectionCode ? '' : 'secondary'} key={item.label} onClick={() => item.collectionCode ? openCollection(item.collectionCode) : openAction(item)} type="button">
              {item.label} {item.dropdown ? <ChevronDown aria-hidden="true" size={15} /> : null}
            </button>
          ))}
        </nav>
        <div className="commerce-actions">
          {headerContent.searchEnabled ? <button className="icon-action" onClick={() => openProductListing('all')} type="button" aria-label="Search products"><Search aria-hidden="true" size={24} /></button> : null}
          {headerContent.accountPreviewEnabled ? (
            <button className="icon-action" onClick={() => setAccountPanelOpen((current) => !current)} type="button" aria-label={customerSession.accessToken ? customerSession.email : 'Account'}>
              <UserRound aria-hidden="true" size={24} />
            </button>
          ) : null}
          {headerContent.wishlistPreviewEnabled ? (
            <button className="icon-action" onClick={() => setView('plp')} type="button" aria-label={`Wishlist with ${wishlistProductCodes.length} items`}>
              <Heart aria-hidden="true" size={25} />
            </button>
          ) : null}
          {headerContent.cartPreviewEnabled ? (
            <button className="icon-action cart-icon-action" onClick={() => setView('cart')} type="button" aria-label={`Cart (${cart.quantity})`}>
              <ShoppingBag aria-hidden="true" size={25} />
              {cart.quantity ? <span>{cart.quantity}</span> : null}
            </button>
          ) : null}
        </div>
      </header>
      {renderMegaMenuPanel()}
      {accountPanelOpen ? (
        <section className="account-drawer" aria-label="Customer session">
          {customerSession.accessToken ? (
            <>
              <div>
                <p className="eyebrow">Customer account</p>
                <h2>Signed in as {customerSession.email}</h2>
                <p>Wishlist, compare, cart, and order self-service are synchronized with Commerce APIs.</p>
              </div>
              <button className="secondary" onClick={signOut} type="button">Sign out</button>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void signIn();
              }}
            >
              <label>
                Customer email
                <input aria-label="Customer email" onChange={(event) => setAuthForm((current) => ({ ...current, loginId: event.target.value }))} value={authForm.loginId} />
              </label>
              <label>
                Password
                <input aria-label="Customer password" onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} type="password" value={authForm.password} />
              </label>
              <button type="submit">Sign in</button>
            </form>
          )}
          {authStatus ? <p role="status">{authStatus}</p> : null}
        </section>
      ) : null}
      {view === 'home' ? (
        <>
          {cmsHeroSlides.length ? (
          <header className={`hero hero-fashion${useCmsHeroImages ? '' : ' hero-domain'}`}>
            <div className="hero-banner-slider" aria-label="Featured Agora banner slides">
              {cmsHeroSlides.map((slide, index) => (
                <div
                  aria-hidden={index !== activeHeroIndex}
                  className={`hero-banner-panel${index === activeHeroIndex ? ' is-active' : ''}`}
                  key={slide.title}
                >
                  {useCmsHeroImages && slide.image ? <img alt={slide.alt ?? ''} src={slide.image} /> : null}
                </div>
              ))}
            </div>
            <section className="hero-copy-card">
              <p>{activeHeroSlide?.eyebrow}</p>
              <h1>{activeHeroSlide?.title}</h1>
              <form
                className="hero-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setView('plp');
                }}
              >
                <input
                  aria-label="Search products"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={headerContent.searchPlaceholder ?? 'Search products'}
                  value={query}
                />
                <button type="submit">Search</button>
              </form>
              <div className="hero-actions">
                {activeHeroSlide?.primaryAction ? <button onClick={() => openAction(activeHeroSlide.primaryAction)} type="button">{activeHeroSlide.primaryAction.label}</button> : null}
                {nextHeroSlide?.secondaryAction ?? nextHeroSlide?.primaryAction ? <button className="secondary" onClick={() => openAction(nextHeroSlide?.secondaryAction ?? nextHeroSlide?.primaryAction)} type="button">{(nextHeroSlide?.secondaryAction ?? nextHeroSlide?.primaryAction)?.label}</button> : null}
              </div>
            </section>
            <nav className="hero-slide-nav" aria-label="Featured Agora edits">
              {cmsHeroSlides.map((slide, index) => (
                <button
                  aria-current={index === activeHeroIndex ? 'true' : undefined}
                  className={index === activeHeroIndex ? 'is-active' : undefined}
                  key={slide.title}
                  onClick={() => setActiveHeroIndex(index)}
                  type="button"
                >
                  <span>{`0${(index + 1).toString()}`}</span>
                  <strong>{slide.eyebrow}</strong>
                  <small>{slide.primaryAction?.label}</small>
                </button>
              ))}
            </nav>
          </header>
          ) : null}
          {homeContent.serviceMessages.length ? (
            <section className="service-marquee" aria-label="Storefront service promise">
              <div className="service-marquee-track">
                {Array.from({ length: 2 }).flatMap((_, groupIndex) => homeContent.serviceMessages.map((message, messageIndex) => (
                  <span key={`service-promise-${groupIndex.toString()}-${messageIndex.toString()}`}>
                    <strong>{message.label}</strong>
                    {message.text}
                  </span>
                )))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      {cmsStatus && view === 'home' ? <p role="status">{cmsStatus}</p> : null}
      {listStatus ? <p role="status">{listStatus}</p> : null}
      {(wishlistProducts.length || compareProducts.length) ? (
        <section className="list-summary" aria-label="Wishlist and compare summary">
          {wishlistProducts.length ? (
            <article>
              <h2>Wishlist</h2>
              <p>{wishlistProducts.map((product) => product.name ?? product.productCode).join(', ')}</p>
            </article>
          ) : null}
          {compareProducts.length ? (
            <article>
              <h2>Compare</h2>
              <p>{compareProducts.map((product) => product.name ?? product.productCode).join(' vs ')}</p>
            </article>
          ) : null}
        </section>
      ) : null}
      {view === 'pdp' && selected ? (
        <section className="pdp">
          <button onClick={() => setView('plp')} type="button">{backToListingLabel}</button>
          <div className="pdp-layout">
              <div className="pdp-gallery">
              {(productGalleryUrls(selected, runtimeConfig.mediaBaseUrl).length ? productGalleryUrls(selected, runtimeConfig.mediaBaseUrl) : [undefined]).slice(0, 4).map((item, index) => {
                const image = productGalleryImageUrl(selected, item, runtimeConfig.mediaBaseUrl);
                return (
                  <div key={`${selected.productCode}-gallery-${index.toString()}`}>
                    {image ? <img alt={`${selected.name ?? selected.productCode} ${index + 1}`} src={image} /> : <ProductMediaPlaceholder label={index === 0 ? selected.name : undefined} product={selected} />}
                  </div>
                );
              })}
            </div>
            <article>
              <p className="muted">{selected.brand ?? 'Nodics Atelier'}</p>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <p className="price">
                {selected.price?.currency} {selected.price?.unitAmount}
              </p>
              <p>{productAvailabilityLabel(selected)}</p>
              {selectedColorOptions.length ? (
                <div className="pdp-option-group">
                  <strong>{colorLabel}</strong>
                  <div className="pdp-color-options" aria-label={availableColorsLabel}>
                    {selectedColorOptions.map((option) => (
                      <button
                        aria-label={option.label}
                        aria-pressed={selectedColourCode === option.code}
                        className={selectedColourCode === option.code ? 'is-active' : undefined}
                        key={option.code}
                        onClick={() => setSelectedVariantCode(productVariantForSelection(selected, option.code, selectedSizeCode))}
                        style={{ '--swatch-color': option.value } as CSSProperties}
                        type="button"
                      >
                        <span />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {selectedSizeOptions.length ? (
                <div className="pdp-option-group">
                  <strong>{sizeLabel}</strong>
                  <div className="sizes" aria-label={availableSizesLabel}>
                    {selectedSizeOptions.map((size) => (
                      <button className={selectedSizeCode === size ? '' : 'secondary'} key={size} onClick={() => setSelectedVariantCode(productVariantForSelection(selected, selectedColourCode, size))} type="button">{size}</button>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="quantity">
                {quantityLabel}
                <input
                  aria-label={quantityLabel}
                  min="1"
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  type="number"
                  value={quantity}
                />
              </label>
              <button onClick={addSelectedToCart} type="button">{addToCartLabel}</button>
              <div className="pdp-tabs">
                <details open>
                  <summary>{descriptionLabel}</summary>
                  <p>{selected.summary ?? selected.description}</p>
                </details>
                <details>
                  <summary>{shippingReturnsLabel}</summary>
                  <p>{shippingReturnsText}</p>
                </details>
                <details>
                  <summary>{reviewsLabel}</summary>
                  {reviewAggregate?.count ? (
                    <p>
                      Average rating {reviewAggregate.average?.toFixed(1)} from {reviewAggregate.count} review(s)
                      {reviewAggregate.verifiedCount ? ` · ${reviewAggregate.verifiedCount} verified` : ''}
                    </p>
                  ) : <p>{reviewStatus ?? 'Loading reviews…'}</p>}
                  {publicReviews.length ? (
                    <div className="review-list" aria-label="Published reviews">
                      {publicReviews.map((review) => (
                        <article key={review.reviewCode ?? review.title}>
                          <h4>{review.title ?? `${review.overallRating ?? 0} star review`}</h4>
                          <p>{review.body}</p>
                          <p className="muted">
                            {review.overallRating ? `${review.overallRating}/5` : 'Rating pending'}
                            {review.authenticity?.verified ? ' · Verified purchase' : ''}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </details>
              </div>
              <div className="quick-view-actions">
                <button className="secondary" onClick={() => toggleWishlist(selected)} type="button">
                  {wishlistProductCodes.includes(selected.productCode) ? removeFromWishlistLabel : addToWishlistLabel}
                </button>
                <button className="secondary" onClick={() => toggleCompare(selected)} type="button">
                  {compareProductCodes.includes(selected.productCode) ? removeFromCompareLabel : compareLabel}
                </button>
              </div>
            </article>
          </div>
          <section className="section-header">
            <div>
              <p className="eyebrow">{recommendationsEyebrowLabel}</p>
              <h2>{recommendationsHeadingLabel}</h2>
              <p className="muted">{recommendationsSummaryLabel}</p>
            </div>
          </section>
          <section className="grid" aria-label="Recommended products">
            {recommendedProducts.map((product) => (
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                key={product.productCode}
                labels={storefrontLabels}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
                onQuickAdd={openQuickAdd}
                onQuickView={openQuickView}
                onWishlist={toggleWishlist}
                product={product}
                wishlistSelected={wishlistProductCodes.includes(product.productCode)}
              />
            ))}
          </section>
        </section>
      ) : view === 'cart' ? (
        <section className="cart">
          <h2>Shopping cart</h2>
          {cart.entries.length ? (
            <>
              {cart.entries.map((entry) => (
                <article key={entry.productCode}>
                  <h3>{entry.name}</h3>
                  {entry.variantCode ? <p className="muted">Variant: {entry.variantCode}</p> : null}
                  <p>Quantity: {entry.quantity}</p>
                  <label className="quantity">
                    Update quantity
                    <input
                      aria-label={`Quantity for ${entry.name ?? entry.productCode}`}
                      min="0"
                      onChange={(event) => updateCartQuantity(entry.productCode, Number(event.target.value) || 0)}
                      type="number"
                      value={entry.quantity}
                    />
                  </label>
                  <p>{entry.price?.currency} {entry.price?.unitAmount}</p>
                  <button className="secondary" onClick={() => removeFromCart(entry.productCode)} type="button">Remove</button>
                </article>
              ))}
              <aside className="cart-summary">
                <h3>Order summary</h3>
                <p>Subtotal: USD {cart.subtotal.toFixed(2)}</p>
                {promotionDiscount > 0 ? <p>Promotion discount: -USD {promotionDiscount.toFixed(2)}</p> : <p className="muted">Promotion eligibility is calculated by Commerce.</p>}
                {taxAmount > 0 ? <p>Estimated tax: USD {taxAmount.toFixed(2)}</p> : null}
                {promotionStatus ? <p className="muted">{promotionStatus}</p> : null}
                <p>{syncStatus}</p>
                <button onClick={() => { void refreshBackendCartCalculation(); setCheckoutStep('customer'); setView('checkout'); }} type="button">Proceed to checkout</button>
              </aside>
            </>
          ) : (
            <p>Your cart is empty.</p>
          )}
        </section>
      ) : view === 'checkout' ? (
        <section className="checkout">
          <div className="checkout-header">
            <div>
              <p className="eyebrow">Secure Checkout</p>
              <h2>Customer, shipping and payment</h2>
            </div>
            <button className="secondary" onClick={() => setView('cart')} type="button">Back to cart</button>
          </div>
          <ol className="checkout-steps" aria-label="Checkout steps">
            {(['customer', 'shipping', 'payment', 'review'] as const).map((step) => (
              <li className={checkoutStep === step ? 'active' : ''} key={step}>
                <button onClick={() => setCheckoutStep(step)} type="button">{step}</button>
              </li>
            ))}
          </ol>
          <div className="checkout-layout">
            <form className="checkout-card" onSubmit={(event) => event.preventDefault()}>
              {checkoutStep === 'customer' ? (
                <>
                  <h3>Customer details</h3>
                  <p className="muted">{customerSession.accessToken ? `Continue as ${customerSession.mode} customer.` : 'Sign in to place a live Commerce order.'}</p>
                  <label>Email<input aria-label="Email" onChange={(event) => updateCheckout('email', event.target.value)} value={checkoutForm.email} /></label>
                  <label>First name<input aria-label="First name" onChange={(event) => updateCheckout('firstName', event.target.value)} value={checkoutForm.firstName} /></label>
                  <label>Last name<input aria-label="Last name" onChange={(event) => updateCheckout('lastName', event.target.value)} value={checkoutForm.lastName} /></label>
                  <label>Phone<input aria-label="Phone" onChange={(event) => updateCheckout('phone', event.target.value)} value={checkoutForm.phone} /></label>
                  <button onClick={() => setCheckoutStep('shipping')} type="button">Continue to shipping</button>
                </>
              ) : null}
              {checkoutStep === 'shipping' ? (
                <>
                  <h3>Shipping information</h3>
                  <label>Address line 1<input aria-label="Address line 1" onChange={(event) => updateCheckout('line1', event.target.value)} value={checkoutForm.line1} /></label>
                  <label>Address line 2<input aria-label="Address line 2" onChange={(event) => updateCheckout('line2', event.target.value)} value={checkoutForm.line2} /></label>
                  <label>City<input aria-label="City" onChange={(event) => updateCheckout('city', event.target.value)} value={checkoutForm.city} /></label>
                  <label>Region<input aria-label="Region" onChange={(event) => updateCheckout('region', event.target.value)} value={checkoutForm.region} /></label>
                  <label>Postal code<input aria-label="Postal code" onChange={(event) => updateCheckout('postalCode', event.target.value)} value={checkoutForm.postalCode} /></label>
                  <label>Country<input aria-label="Country" onChange={(event) => updateCheckout('country', event.target.value)} value={checkoutForm.country} /></label>
                  <div className="shipping-methods" aria-label="Shipping methods">
                    {shippingMethodOptions.map((option) => (
                      <button className={checkoutForm.shippingMethod === option.code ? '' : 'secondary'} key={option.code} onClick={() => updateCheckout('shippingMethod', option.code)} type="button">{option.label} · {option.currency} {option.price.toFixed(2)} · {option.promise}</button>
                    ))}
                  </div>
                  <button onClick={() => setCheckoutStep('payment')} type="button">Continue to payment</button>
                </>
              ) : null}
              {checkoutStep === 'payment' ? (
                <>
                  <h3>Payment</h3>
                  <p className="muted">Payment token only. Raw card numbers are not collected in Agora.</p>
                  <div className="shipping-methods" aria-label="Payment methods">
                    {paymentOptions.map((option) => (
                      <button className={checkoutForm.paymentMethod === option.code ? '' : 'secondary'} key={option.code} onClick={() => updateCheckout('paymentMethod', option.code)} type="button">{option.label}</button>
                    ))}
                  </div>
                  <label>Name on card<input aria-label="Name on card" onChange={(event) => updateCheckout('cardName', event.target.value)} value={checkoutForm.cardName} /></label>
                  <label>Card ending<input aria-label="Card ending" maxLength={4} onChange={(event) => updateCheckout('cardLast4', event.target.value.replace(/\D/gu, '').slice(0, 4))} value={checkoutForm.cardLast4} /></label>
                  <button onClick={() => { void refreshBackendCartCalculation(); setCheckoutStep('review'); }} type="button">Review order</button>
                </>
              ) : null}
              {checkoutStep === 'review' ? (
                <>
                  <h3>Review and place order</h3>
                  <p>{checkoutForm.firstName} {checkoutForm.lastName} · {checkoutForm.email}</p>
                  <p>{checkoutForm.line1}, {checkoutForm.city}, {checkoutForm.region} {checkoutForm.postalCode}</p>
                  <p>Shipping: {selectedShippingOption.label} · {selectedShippingOption.promise}</p>
                  <p>Payment: {maskedPaymentLabel(checkoutForm.paymentMethod, checkoutForm.cardLast4)}</p>
                  <button disabled={checkoutBusy || cart.entries.length === 0} onClick={placeOrder} type="button">
                    {checkoutBusy ? 'Placing order…' : 'Place order'}
                  </button>
                </>
              ) : null}
            </form>
            <aside className="cart-summary">
              <h3>Order summary</h3>
              {cart.entries.map((entry) => (
                <p key={entry.productCode}>{entry.name} × {entry.quantity}</p>
              ))}
              <p>{syncStatus}</p>
              <p>Shipping: {selectedShippingOption.label} · USD {shippingAmount.toFixed(2)}</p>
              <p className="muted">{selectedShippingOption.promise}</p>
              <p>Payment: {selectedPaymentOption.label}</p>
              <p>Subtotal: USD {cart.subtotal.toFixed(2)}</p>
              {promotionDiscount > 0 ? <p>Promotion: -USD {promotionDiscount.toFixed(2)}</p> : null}
              {taxAmount > 0 ? <p>Tax: USD {taxAmount.toFixed(2)}</p> : null}
              {promotionStatus ? <p className="muted">{promotionStatus}</p> : null}
              <p className="price">Total: USD {totalAmount.toFixed(2)}</p>
            </aside>
          </div>
        </section>
      ) : view === 'payment-result' && paymentResult ? (
        <section className="confirmation">
          <p className="eyebrow">Payment Result</p>
          <h2>{paymentResult.title}</h2>
          <p>{paymentResult.message}</p>
          {confirmation?.orderCode || confirmation?.code ? <p>Order reference: {confirmation.orderCode ?? confirmation.code}</p> : null}
          {paymentResult.state === 'SUCCESS' ? (
            <button onClick={() => setView('confirmation')} type="button">Continue to order confirmation</button>
          ) : null}
          {paymentResult.state === 'PENDING' ? (
            <button onClick={() => { setSelectedOrderCode(confirmedOrderCode); setView('orders'); void loadOrderHistory(customerSession, confirmedOrderCode); }} type="button">Track payment status</button>
          ) : null}
          {paymentResult.retryAvailable ? (
            <button onClick={() => { setCheckoutStep('payment'); setView('checkout'); }} type="button">Retry payment</button>
          ) : null}
        </section>
      ) : view === 'confirmation' && confirmation ? (
        <section className="confirmation">
          <p className="eyebrow">Order Confirmation</p>
          <h2>Thank you, {checkoutForm.firstName}</h2>
          <p>Your order has been placed for processing.</p>
          <article>
            <h3>Order {confirmedOrderCode}</h3>
            <p>Status: {confirmedStatus}</p>
            <p>Confirmation sent to {checkoutForm.email}</p>
            <p>Shipping: {selectedShippingOption.label} · {selectedShippingOption.promise}</p>
            <p>Ship to: {checkoutForm.line1}, {checkoutForm.city}, {checkoutForm.region} {checkoutForm.postalCode}</p>
            <p>Payment: {maskedPaymentLabel(checkoutForm.paymentMethod, checkoutForm.cardLast4)}</p>
            <p>Total: USD {confirmedTotal.toFixed(2)}</p>
            {orderDetail?.entries?.length ? <p>Backend order entries: {orderDetail.entries.length}</p> : null}
            {completedConfirmationSteps.length ? (
              <ul className="confirmation-steps" aria-label="Completed checkout steps">
                {completedConfirmationSteps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            ) : null}
          </article>
          <div className="quick-view-actions">
            <button onClick={() => { setSelectedOrderCode(confirmedOrderCode); setView('orders'); void loadOrderHistory(customerSession, confirmedOrderCode); }} type="button">View order</button>
            <button className="secondary" onClick={() => requestLifecycle('CANCELLATION')} type="button">Request cancellation</button>
            <button className="secondary" onClick={() => requestLifecycle('RETURN')} type="button">Request return</button>
            <button className="secondary" onClick={() => requestLifecycle('REFUND')} type="button">Request refund status</button>
            <button className="secondary" onClick={() => requestLifecycle('EXCHANGE')} type="button">Request exchange</button>
            <button className="secondary" onClick={() => requestLifecycle('REPLACEMENT')} type="button">Request replacement</button>
            <button className="secondary" onClick={() => requestLifecycle('APPEAL')} type="button">Appeal lifecycle decision</button>
          </div>
          {lifecycleStatus ? <p role="status">{lifecycleStatus}</p> : null}
          <button onClick={() => setView('home')} type="button">Continue shopping</button>
        </section>
      ) : view === 'orders' ? (
        <section className="confirmation">
          <p className="eyebrow">Order History</p>
          <h2>My Orders</h2>
          <button className="secondary" onClick={() => void loadOrderHistory()} type="button">Refresh orders</button>
          {orderHistoryStatus ? <p role="status">{orderHistoryStatus}</p> : null}
          {!customerSession.accessToken ? <p>Sign in to view order history.</p> : null}
          {orderHistory.length ? (
            <section aria-label="Order history list" className="checkout-card">
              {orderHistory.map((order) => (
                <button className={activeOrderCode === order.code ? '' : 'secondary'} key={order.code} onClick={() => void loadOrderDetail(order.code)} type="button">
                  {order.code} · {order.status}{order.totalAmount ? ` · ${order.currency ?? 'USD'} ${order.totalAmount}` : ''}
                </button>
              ))}
            </section>
          ) : null}
          {activeOrderCode ? (
            <article>
              <h3>Order {activeOrderCode}</h3>
              <p>Status: {confirmedStatus}</p>
              <p>Total: USD {confirmedTotal.toFixed(2)}</p>
              <p>Shipping: {selectedShippingOption.label} · {selectedShippingOption.promise}</p>
              <p>Payment: {maskedPaymentLabel(checkoutForm.paymentMethod, checkoutForm.cardLast4)}</p>
              <p>Cart: {orderDetail?.order.cartCode ?? confirmation?.cartCode ?? 'local checkout'}</p>
              {orderDetail?.entries?.length ? <p>Backend order entries: {orderDetail.entries.length}</p> : null}
            <p>Lifecycle records: {lifecycleRecords.length}</p>
            {lifecycleRecords.length ? (
              <ul aria-label="Lifecycle request status">
                {lifecycleRecords.map((record) => (
                    <li key={record.code ?? `${record.orderCode}:${record.requestType}`}>
                      {record.requestType} · {record.status}
                      {record.rmaCode ? ` · RMA ${record.rmaCode}` : ''}
                      {record.refundPreview?.status ? ` · refund ${record.refundPreview.status}` : ''}
                      {record.replacementSelectionRequired ? ' · replacement selection required' : ''}
                      {record.appealEvidenceRequired ? ' · appeal evidence required' : ''}
                      {lifecycleEvidenceLabel(record, 'disposition') ? ` · disposition ${lifecycleEvidenceLabel(record, 'disposition')}` : ''}
                      {lifecycleTrackingSummary(record) ? ` · ${lifecycleTrackingSummary(record)}` : ''}
                      <ol aria-label={`${record.requestType} timeline`}>
                        {lifecycleTimeline(record).map((step) => <li key={step}>{step}</li>)}
                      </ol>
                      {lifecycleAutomationPlan(record).length ? (
                        <ol aria-label={`${record.requestType} automation plan`}>
                          {lifecycleAutomationPlan(record).map((step) => <li key={step}>{step}</li>)}
                        </ol>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ) : null}
          <form className="checkout-card" onSubmit={(event) => event.preventDefault()}>
            <h3>Lifecycle request details</h3>
            <p className="muted">Select a request type, then provide only the fields relevant to that customer intent.</p>
            <div className="chip-row" aria-label="Lifecycle request type">
              {lifecycleTypes.map((requestType) => (
                <button className={selectedLifecycleType === requestType ? '' : 'secondary'} key={requestType} onClick={() => {
                  setSelectedLifecycleType(requestType);
                  setLifecycleForm((current) => ({ ...current, reasonCode: lifecycleReasonOptions[requestType][0] }));
                }} type="button">{requestType}</button>
              ))}
            </div>
            <p className="muted">{lifecycleFormGuidance[selectedLifecycleType]}</p>
            <label>
              Reason code
              <select aria-label="Lifecycle reason code" onChange={(event) => setLifecycleForm((current) => ({ ...current, reasonCode: event.target.value }))} value={lifecycleForm.reasonCode}>
                {reasonOptions.map((reasonCode) => <option key={reasonCode} value={reasonCode}>{reasonCode}</option>)}
              </select>
            </label>
            <label>Item quantity<input aria-label="Lifecycle quantity" onChange={(event) => setLifecycleForm((current) => ({ ...current, quantity: event.target.value.replace(/\D/gu, '') || '1' }))} value={lifecycleForm.quantity} /></label>
            {selectedLifecycleType === 'EXCHANGE' || selectedLifecycleType === 'REPLACEMENT' ? (
              <>
                <label>Replacement product code<input aria-label="Replacement product code" onChange={(event) => setLifecycleForm((current) => ({ ...current, replacementProductCode: event.target.value }))} placeholder="Optional replacement SKU/product" value={lifecycleForm.replacementProductCode} /></label>
                <label>
                  Preferred resolution
                  <select aria-label="Preferred resolution" onChange={(event) => setLifecycleForm((current) => ({ ...current, preferredResolution: event.target.value }))} value={lifecycleForm.preferredResolution}>
                    {preferredResolutionOptions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            {selectedLifecycleType === 'APPEAL' ? (
              <>
                <label>Appeal reference code<input aria-label="Appeal reference code" onChange={(event) => setLifecycleForm((current) => ({ ...current, appealReferenceCode: event.target.value }))} placeholder="Rejected request or refund reference" value={lifecycleForm.appealReferenceCode} /></label>
                <label>Appeal reason<input aria-label="Appeal reason" onChange={(event) => setLifecycleForm((current) => ({ ...current, appealReason: event.target.value }))} placeholder="Why should the decision be reviewed?" value={lifecycleForm.appealReason} /></label>
              </>
            ) : null}
            <label>
              Return method
              <select aria-label="Return method" onChange={(event) => setLifecycleForm((current) => ({ ...current, returnMethod: event.target.value }))} value={lifecycleForm.returnMethod}>
                {returnMethodOptions.map((method) => <option key={method.code} value={method.code}>{method.label} · {method.promise ?? method.code}</option>)}
              </select>
            </label>
            <label>
              Refund method
              <select aria-label="Refund method" onChange={(event) => setLifecycleForm((current) => ({ ...current, refundMethod: event.target.value }))} value={lifecycleForm.refundMethod}>
                {refundMethodOptions.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </label>
            <label>Comment<input aria-label="Lifecycle comment" onChange={(event) => setLifecycleForm((current) => ({ ...current, comment: event.target.value }))} value={lifecycleForm.comment} /></label>
            {cart.entries.length ? <p className="muted">Selected products: {cart.entries.map((entry) => `${entry.name} × ${entry.quantity}`).join(', ')}</p> : null}
            {lifecyclePreview ? (
              <aside className="cart-summary" aria-label="Lifecycle eligibility preview">
                <h4>Eligibility preview</h4>
                <p>Status: {String(lifecyclePreview.status ?? 'PREVIEWED')}</p>
                <p>Eligible: {String(lifecyclePreview.eligible ?? true)}</p>
                {typeof lifecyclePreview.rmaCode === 'string' ? <p>RMA: {lifecyclePreview.rmaCode}</p> : null}
                {Array.isArray(lifecyclePreview.reasonCodes) ? <p>Reasons: {lifecyclePreview.reasonCodes.join(', ')}</p> : null}
                {Array.isArray(lifecyclePreview.automationPlan) ? (
                  <ul aria-label="Lifecycle automation plan">
                    {lifecyclePreview.automationPlan.map((step) => {
                      const plan = step as { readonly step?: string; readonly owner?: string; readonly customerVisibleState?: string; readonly trigger?: string };
                      return <li key={`${plan.owner ?? 'owner'}:${plan.step ?? 'step'}`}>{[plan.owner, plan.step, plan.customerVisibleState, plan.trigger ? `trigger ${plan.trigger}` : undefined].filter(Boolean).join(' · ')}</li>;
                    })}
                  </ul>
                ) : null}
              </aside>
            ) : null}
          </form>
          <div className="quick-view-actions">
            <button className="secondary" onClick={() => previewLifecycle(selectedLifecycleType)} type="button">Preview {selectedLifecycleType}</button>
            <button className="secondary" onClick={() => requestLifecycle(selectedLifecycleType)} type="button">Submit {selectedLifecycleType}</button>
          </div>
          {lifecycleStatus ? <p role="status">{lifecycleStatus}</p> : null}
        </section>
      ) : view === 'home' ? (
        <>
          {homeContent.collections.length ? (
            <>
              <section className="section-header collection-section-header">
                <div>
                  {homeContent.collectionHeader?.eyebrow ? <p className="eyebrow">{homeContent.collectionHeader.eyebrow}</p> : null}
                  {homeContent.collectionHeader?.heading ? <h2>{homeContent.collectionHeader.heading}</h2> : null}
                </div>
                {homeContent.collectionHeader?.actionLabel ? <button className="collection-view-all" onClick={openCollectionsIndex} type="button">{homeContent.collectionHeader.actionLabel}</button> : null}
              </section>
              <div className="collection-carousel-shell">
                <button className="collection-carousel-control collection-carousel-control-previous" onClick={() => scrollCollectionCarousel('previous')} type="button" aria-label="Previous collections">
                  <ChevronLeft aria-hidden="true" size={28} />
                </button>
                <div className="collection-carousel-viewport">
                  <section className="collection-grid collection-grid-photo" ref={collectionCarouselRef} aria-label="Shop by collection">
                    {homeContent.collections.map((collection) => (
                      <button key={collection.label} onClick={() => openCollectionTile(collection)} type="button">
                        <div className="collection-card-media">
                          {collection.image ? <img alt={collection.alt ?? ''} src={collection.image} /> : null}
                        </div>
                        <span className="collection-card-label">{collection.label}</span>
                        <small className="collection-card-summary">{collection.summary}</small>
                      </button>
                    ))}
                  </section>
                </div>
                <button className="collection-carousel-control collection-carousel-control-next" onClick={() => scrollCollectionCarousel('next')} type="button" aria-label="Next collections">
                  <ChevronRight aria-hidden="true" size={28} />
                </button>
              </div>
            </>
          ) : null}
          {homeContent.specialOffer ? (
            <section className="special-offer-split" aria-label={homeContent.specialOffer.heading}>
              <article className="special-offer-media special-offer-media-left">
                {homeContent.specialOffer.leftMedia.image ? <img alt={homeContent.specialOffer.leftMedia.alt ?? ''} src={homeContent.specialOffer.leftMedia.image} /> : null}
              </article>
              <article className="special-offer-card">
                {homeContent.specialOffer.eyebrow ? <p className="eyebrow">{homeContent.specialOffer.eyebrow}</p> : null}
                <h2>{homeContent.specialOffer.heading}</h2>
                {homeContent.specialOffer.summary ? <p>{homeContent.specialOffer.summary}</p> : null}
                {homeContent.specialOffer.action ? (
                  <button className="special-offer-action" onClick={() => openAction(homeContent.specialOffer?.action)} type="button">
                    {homeContent.specialOffer.action.label}
                    <ArrowUpRight aria-hidden="true" size={22} />
                  </button>
                ) : null}
              </article>
              <article className="special-offer-media special-offer-media-right">
                {homeContent.specialOffer.rightMedia.image ? <img alt={homeContent.specialOffer.rightMedia.alt ?? ''} src={homeContent.specialOffer.rightMedia.image} /> : null}
              </article>
            </section>
          ) : null}
          {homeContent.topPicks.heading ? (
            <>
              <section className="section-header">
                <div>
                  {homeContent.topPicks.eyebrow ? <p className="eyebrow">{homeContent.topPicks.eyebrow}</p> : null}
                  <h2>{homeContent.topPicks.heading}</h2>
                </div>
              </section>
              <ProductCarousel
                ariaLabel={featuredProductsAriaLabel}
                compareProductCodes={compareProductCodes}
                labels={storefrontLabels}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
                onQuickAdd={openQuickAdd}
                onQuickView={openQuickView}
                onWishlist={toggleWishlist}
                products={featuredProducts}
                wishlistProductCodes={wishlistProductCodes}
              />
            </>
          ) : null}
          <section className="promo-grid">
            {homeContent.promotions.map((promotion) => (
              <article className={`image-promo image-promo-${promotion.variant}`} key={promotion.title}>
                {promotion.image ? <img alt={promotion.alt ?? ''} src={promotion.image} /> : null}
                {promotion.variant === 'visual' ? (
                  <button
                    aria-label={`Shop ${promotion.title}`}
                    className="image-promo-hotspot"
                    onClick={() => openAction(promotion.action)}
                    type="button"
                  >
                    <span aria-hidden="true" />
                  </button>
                ) : (
                    <div className="image-promo-content">
                      <h3>{promotion.title}</h3>
                      <p>{promotion.summary}</p>
                    {promotion.action ? <button className="image-promo-link" onClick={() => openAction(promotion.action)} type="button">{promotion.action.label}</button> : null}
                  </div>
                )}
              </article>
            ))}
          </section>
          {homeContent.bestSelling.heading ? (
            <>
              <section className="section-header">
                <div>
                  {homeContent.bestSelling.eyebrow ? <p className="eyebrow">{homeContent.bestSelling.eyebrow}</p> : null}
                  <h2>{homeContent.bestSelling.heading}</h2>
                </div>
              </section>
              <ProductCarousel
                ariaLabel={bestSellingProductsAriaLabel}
                compareProductCodes={compareProductCodes}
                direction="backward"
                labels={storefrontLabels}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
                onQuickAdd={openQuickAdd}
                onQuickView={openQuickView}
                onWishlist={toggleWishlist}
                products={bestSelling}
                wishlistProductCodes={wishlistProductCodes}
              />
            </>
          ) : null}
          <section className="service-grid">
            {homeContent.serviceBadges.map((item) => {
              const ServiceIcon = serviceBadgeIcon(item.label);
              return (
                <article key={item.label}>
                  <span className="service-badge-icon" aria-hidden="true">
                    <ServiceIcon size={34} strokeWidth={1.9} />
                  </span>
                  <h3>{item.label}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </section>
          {homeContent.testimonials.length ? (
            <>
              <section className="section-header">
                <div>
                  {homeContent.testimonialHeader?.eyebrow ? <p className="eyebrow">{homeContent.testimonialHeader.eyebrow}</p> : null}
                  {homeContent.testimonialHeader?.heading ? <h2>{homeContent.testimonialHeader.heading}</h2> : null}
                  {homeContent.testimonialHeader?.summary ? <p className="muted">{homeContent.testimonialHeader.summary}</p> : null}
                </div>
              </section>
              <section className="testimonial-grid" aria-label="Customer testimonials">
                {homeContent.testimonials.map((quote) => (
                  <article key={quote.name}>
                    {quote.image ? <img alt={quote.alt ?? ''} className="testimonial-image" src={quote.image} /> : null}
                    <blockquote>{quote.quote}</blockquote>
                    <footer>
                      {quote.avatar ? <img alt="" src={quote.avatar} /> : null}
                      <span>
                        <strong>{quote.name}</strong>
                        <small>{quote.product}</small>
                      </span>
                    </footer>
                  </article>
                ))}
              </section>
            </>
          ) : null}
          {homeContent.gallery.length ? (
            <>
              <section className="section-header">
                <div>
                  {homeContent.galleryHeader?.eyebrow ? <p className="eyebrow">{homeContent.galleryHeader.eyebrow}</p> : null}
                  {homeContent.galleryHeader?.heading ? <h2>{homeContent.galleryHeader.heading}</h2> : null}
                </div>
              </section>
              <section className="instagram-grid" aria-label="Agora social gallery">
                {homeContent.gallery.map((item) => (
                  <button key={item.mediaCode ?? item.image} onClick={() => openCollection(collections[0]?.code ?? collectionCode)} type="button">
                    {item.image ? <img alt={item.alt ?? ''} src={item.image} /> : null}
                    <span>View Product</span>
                  </button>
                ))}
              </section>
            </>
          ) : null}
          {renderStorefrontFooter()}
        </>
      ) : view === 'collections' ? (
        <>
          <section className="collection-index-hero">
            <div className="collection-index-copy">
              {collectionIndexContent?.eyebrow ? <p className="eyebrow">{collectionIndexContent.eyebrow}</p> : null}
              <h1>{collectionIndexContent?.heading ?? homeContent.collectionHeader?.heading ?? 'Shop by collection'}</h1>
              <p>{collectionIndexContent?.summary ?? 'Explore curated category, brand, and seasonal edits. Each collection opens a Commerce-powered product listing with live filters, sort options, prices, media, and availability.'}</p>
              <div className="collection-index-actions" aria-label="Collection page actions">
                {renderActionButton(collectionIndexContent?.primaryAction)}
                {renderActionButton(collectionIndexContent?.secondaryAction)}
              </div>
            </div>
            {collectionIndexContent?.heroMedia?.image ? (
              <div className="collection-index-hero-media">
                <img alt={collectionIndexContent.heroMedia.alt ?? ''} src={collectionIndexContent.heroMedia.image} />
                <span>{collections.length} curated paths</span>
              </div>
            ) : null}
          </section>
          {collectionIndexContent?.highlights?.length ? (
            <section className="collection-index-highlights" aria-label="Collection shopping benefits">
              {collectionIndexContent.highlights.map((highlight) => (
                <article key={`${highlight.label ?? ''}-${highlight.title}`}>
                  {highlight.label ? <span>{highlight.label}</span> : null}
                  <strong>{highlight.title}</strong>
                  {highlight.text ? <p>{highlight.text}</p> : null}
                </article>
              ))}
            </section>
          ) : null}
          <section className="collection-index-grid" aria-label="Available collections">
            {collections.map((collection) => (
              <button key={collection.code} onClick={() => openCollectionTile(collection)} type="button">
                <span className="collection-index-media">
                  {collection.image ? <img alt={collection.alt ?? ''} src={collection.image} /> : null}
                </span>
                <span className="collection-index-meta">
                  {collection.itemCount ? <small>{collection.itemCount}</small> : null}
                  <strong>{collection.label}</strong>
                  {collection.summary ? <em>{collection.summary}</em> : null}
                  <span className="collection-index-card-link">
                    Explore edit
                    <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2.4} />
                  </span>
                </span>
              </button>
            ))}
          </section>
          {collectionIndexContent?.footerNote ? (
            <section className="collection-index-note" aria-label="Collection search note">
              <p>{collectionIndexContent.footerNote}</p>
            </section>
          ) : null}
          {renderStorefrontFooter()}
        </>
      ) : view === 'plp' ? (
        <>
          <section className={productListingHeroHasMedia ? 'plp-hero has-media' : 'plp-hero'}>
            <div className="plp-hero-copy">
              <p className="eyebrow">{productListingContent?.eyebrow ?? listingEyebrow}</p>
              <h1>{listingHeading}</h1>
              <p>{listingSummary}</p>
              {(productListingContent?.primaryAction || productListingContent?.secondaryAction) ? (
                <div className="plp-hero-actions">
                  {productListingContent.primaryAction ? (
                    <button className="primary" onClick={() => openAction(productListingContent.primaryAction)} type="button">
                      {productListingContent.primaryAction.label}
                    </button>
                  ) : null}
                  {renderActionButton(productListingContent?.secondaryAction)}
                </div>
              ) : null}
            </div>
            {productListingHeroMedia?.image ? (
              <div className="plp-hero-media">
                <img
                  alt={productListingHeroMedia.alt ?? ''}
                  data-fallback-src={productListingHeroMedia.mediaCode === PRODUCT_LISTING_DEFAULT_HERO_MEDIA_CODE ? PRODUCT_LISTING_DEFAULT_HERO_FALLBACK_SRC : undefined}
                  onError={(event) => {
                    const fallbackSrc = event.currentTarget.dataset.fallbackSrc;
                    if (fallbackSrc && !event.currentTarget.src.endsWith(fallbackSrc)) event.currentTarget.src = fallbackSrc;
                  }}
                  src={productListingHeroMedia.image}
                />
                {productListingHeroSupportingMedia.length ? (
                  <div className="plp-hero-supporting-media" aria-hidden="true">
                    {productListingHeroSupportingMedia.slice(0, 3).map((item) => (
                      <span key={item.mediaCode ?? item.image} className="plp-hero-supporting-image">
                        <img alt="" src={item.image} />
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
          {projectedListingProducts.length && productListingContent?.projectedProducts?.heading ? (
            <section className="plp-projected-products" aria-label={productListingContent.projectedProducts.ariaLabel ?? productListingContent.projectedProducts.heading}>
              <div className="plp-projected-header">
                <div>
                  {productListingContent.projectedProducts.eyebrow ? <p className="eyebrow">{productListingContent.projectedProducts.eyebrow}</p> : null}
                  <h2>{productListingContent.projectedProducts.heading}</h2>
                  {productListingContent.projectedProducts.summary ? <p>{productListingContent.projectedProducts.summary}</p> : null}
                </div>
              </div>
              <ProductCarousel
                ariaLabel={productListingContent.projectedProducts.ariaLabel ?? productListingContent.projectedProducts.heading}
                compareProductCodes={compareProductCodes}
                direction={productListingContent.projectedProducts.direction}
                labels={storefrontLabels}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
                onQuickAdd={openQuickAdd}
                onQuickView={openQuickView}
                onWishlist={toggleWishlist}
                products={projectedListingProducts}
                wishlistProductCodes={wishlistProductCodes}
              />
            </section>
          ) : null}
          <ProductListingToolbar
            activeFilterCount={activeFilterCount}
            activeFilterLabels={activeFilterLabels}
            configuration={productListingContent}
            filters={selectedFilters}
            layout={listingLayout}
            onClearFilters={clearProductFilters}
            onLayoutChange={setListingLayout}
            onSaleOnlyChange={(selectedValue) => updateProductFilter('saleOnly', selectedValue)}
            onSortChange={(nextSortCode) => {
              setListingPage(1);
              setSortCode(nextSortCode);
            }}
            onToggleFilters={() => setFiltersOpen((current) => !current)}
            searchFacetsLabel="Search facets"
            searchFacetsText={searchFacetsText}
            sortCode={sortCode}
          />
          <ProductFilterDrawer
            configuration={productListingContent}
            filterGroups={listingFilterGroups}
            filters={effectiveSelectedFilters}
            isOpen={filtersOpen}
            onApply={() => setFiltersOpen(false)}
            onClear={clearProductFilters}
            onClose={() => setFiltersOpen(false)}
            onFilterToggle={(key, value) => {
              if (key === 'brands') setBrand('');
              toggleProductFilter(key, value);
            }}
            onPriceChange={(key, value) => updateProductFilter(key, value)}
            optionCount={filterOptionCount}
            optionLabel={filterOptionLabel}
          />
          <section className={listingLayout === 'list' ? 'grid product-listing-grid is-list-view' : 'grid product-listing-grid'} data-layout={listingLayout} aria-label="Product listing">
            {visibleProducts.map((product) => (
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                key={product.productCode}
                labels={storefrontLabels}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
                onQuickAdd={openQuickAdd}
                onQuickView={openQuickView}
                onWishlist={toggleWishlist}
                product={product}
                wishlistSelected={wishlistProductCodes.includes(product.productCode)}
              />
            ))}
          </section>
          {!visibleProducts.length ? (
            <section className="cart-summary" aria-label="No products found">
              <h3>No products match this storefront route yet.</h3>
              <p>
                The page is available, but the current Commerce discovery contract did not return sellable products for this
                collection and search context. Try another collection or publish matching products to the active Agora store.
              </p>
              <button onClick={() => openCollection(rootCollectionCode)} type="button">Browse available products</button>
            </section>
          ) : (
            <nav className="plp-pagination" aria-label="Product listing pagination">
              <p>{canShowNextListingPage || canShowPreviousListingPage ? listingCountText : completeStatusLabel}</p>
              <div className="plp-pagination-controls">
                <button
                  className="plp-pagination-step"
                  disabled={!canShowPreviousListingPage}
                  onClick={() => setListingPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  Previous
                </button>
                {listingPaginationPages.map((pageNumber, index) => (
                  <span className="plp-pagination-page-wrap" key={pageNumber}>
                    {index > 0 && pageNumber - (listingPaginationPages[index - 1] ?? pageNumber) > 1 ? (
                      <span className="plp-pagination-ellipsis" aria-hidden="true">…</span>
                    ) : null}
                    <button
                      aria-current={pageNumber === listingPage ? 'page' : undefined}
                      className={pageNumber === listingPage ? 'plp-pagination-page is-active' : 'plp-pagination-page'}
                      onClick={() => setListingPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  </span>
                ))}
                <button
                  className="plp-pagination-step"
                  disabled={!canShowNextListingPage}
                  onClick={() => setListingPage((current) => current + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
          {renderStorefrontFooter()}
        </>
      ) : null}
      {quickAdd ? createPortal(
        <div
          className="quick-add-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuickAdd(undefined);
          }}
          role="presentation"
        >
          <section aria-label={`${quickAddLabel} ${quickAdd.name ?? quickAdd.productCode}`} aria-modal="true" className="quick-add-modal" role="dialog">
            <button aria-label={closeQuickAddLabel} className="quick-add-close" onClick={() => setQuickAdd(undefined)} type="button">×</button>
            <div className="quick-add-summary">
              <div className="quick-add-thumb">
                {quickAddImage ? <img alt={quickAdd.name ?? quickAdd.productCode} src={quickAddImage} /> : <ProductMediaPlaceholder product={quickAdd} />}
              </div>
              <div>
                <h2>{quickAdd.name}</h2>
                <p className="quick-add-price">{quickAddPrice}</p>
              </div>
            </div>
            {quickAddColorOptions.length ? (
              <section className="quick-add-option-group">
                <p>{colorsLabel}: <strong>{quickAddColorOptions.find((option) => option.code === quickAddColourCode)?.label ?? quickAddColorOptions[0]?.label}</strong></p>
                <div className="quick-add-color-options" aria-label={availableColorsLabel}>
                  {quickAddColorOptions.map((option) => (
                    <button
                      aria-label={`${selectColorPrefix} ${option.label}`}
                      aria-pressed={quickAddColourCode === option.code}
                      className={quickAddColourCode === option.code ? 'is-selected' : undefined}
                      key={option.code}
                      onClick={() => selectQuickAddColour(option.code)}
                      style={{ '--swatch-color': option.value } as CSSProperties}
                      type="button"
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {quickAddSizeOptions.length ? (
              <section className="quick-add-option-group">
                <p>{sizeLabel}: <strong>{quickAddSizeCode ?? quickAddSizeOptions[0]}</strong></p>
                <div className="quick-add-size-options" aria-label={availableSizesLabel}>
                  {quickAddSizeOptions.map((size) => (
                    <button aria-pressed={quickAddSizeCode === size} className={quickAddSizeCode === size ? 'is-selected' : undefined} key={size} onClick={() => selectQuickAddSize(size)} type="button">{size}</button>
                  ))}
                </div>
              </section>
            ) : null}
            <section className="quick-add-option-group">
              <p>{quantityLabel}:</p>
              <div className="quick-add-quantity" aria-label={quantityLabel}>
                <button aria-label={decreaseQuantityLabel} onClick={() => setQuickAddQuantity((current) => Math.max(1, current - 1))} type="button">−</button>
                <span>{quickAddQuantity}</span>
                <button aria-label={increaseQuantityLabel} onClick={() => setQuickAddQuantity((current) => current + 1)} type="button">+</button>
              </div>
            </section>
            <div className="quick-add-actions">
              <button className="quick-add-cart" onClick={() => addQuickAddToCart(false)} type="button">{addToCartLabel} - {quickAddPrice}</button>
              <button aria-label={compareProductCodes.includes(quickAdd.productCode) ? removeFromCompareLabel : compareLabel} className={compareProductCodes.includes(quickAdd.productCode) ? 'quick-add-icon is-selected' : 'quick-add-icon'} onClick={() => toggleCompare(quickAdd)} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v12m0 0 3-3m-3 3-3-3m13 7V8m0 0 3 3m-3-3-3 3M5 4h4M15 20h4" /></svg>
              </button>
              <button aria-label={wishlistProductCodes.includes(quickAdd.productCode) ? removeFromWishlistLabel : addToWishlistLabel} className={wishlistProductCodes.includes(quickAdd.productCode) ? 'quick-add-icon is-selected' : 'quick-add-icon'} onClick={() => toggleWishlist(quickAdd)} type="button">
                <Heart aria-hidden="true" size={26} strokeWidth={1.8} />
              </button>
            </div>
            <button className="quick-add-buy" onClick={() => addQuickAddToCart(true)} type="button">{buyNowLabel}</button>
          </section>
        </div>,
        document.body,
      ) : null}
      {quickView ? createPortal(
        <div
          className="quick-view-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuickView(undefined);
          }}
          role="presentation"
        >
          <section aria-label={`${quickViewTitleLabel} ${quickView.name ?? quickView.productCode}`} aria-modal="true" className="quick-view-modal" role="dialog">
            <button aria-label={closeQuickViewLabel} className="quick-add-close" onClick={() => setQuickView(undefined)} type="button">×</button>
            <div className="quick-view-media">
              {quickViewImage ? <img alt={quickView.name ?? quickView.productCode} src={quickViewImage} /> : <ProductMediaPlaceholder product={quickView} />}
            </div>
            <div className="quick-view-content">
              <p className="eyebrow">{quickViewTitleLabel}</p>
              <h2>{quickView.name}</h2>
              <p>{quickView.summary}</p>
              <p className="quick-add-price">{quickViewPrice}</p>
              {quickViewColorOptions.length ? (
                <section className="quick-add-option-group">
                  <p>{colorsLabel}: <strong>{quickViewColorOptions.find((option) => option.code === quickViewColourCode)?.label ?? quickViewColorOptions[0]?.label}</strong></p>
                  <div className="quick-add-color-options" aria-label={availableColorsLabel}>
                    {quickViewColorOptions.map((option) => (
                      <button
                        aria-label={`${selectColorPrefix} ${option.label}`}
                        aria-pressed={quickViewColourCode === option.code}
                        className={quickViewColourCode === option.code ? 'is-selected' : undefined}
                        key={option.code}
                        onClick={() => selectQuickViewColour(option.code)}
                        style={{ '--swatch-color': option.value } as CSSProperties}
                        type="button"
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {quickViewSizeOptions.length ? (
                <section className="quick-add-option-group">
                  <p>{sizeLabel}: <strong>{quickViewSizeCode ?? quickViewSizeOptions[0]}</strong></p>
                  <div className="quick-add-size-options" aria-label={availableSizesLabel}>
                    {quickViewSizeOptions.map((size) => (
                      <button aria-pressed={quickViewSizeCode === size} className={quickViewSizeCode === size ? 'is-selected' : undefined} key={size} onClick={() => selectQuickViewSize(size)} type="button">{size}</button>
                    ))}
                  </div>
                </section>
              ) : null}
              <div className="quick-view-actions">
                <button className="quick-add-cart" onClick={() => addToCart(quickView, 1, quickViewSelection.variantCode)} type="button">{addToCartLabel} - {quickViewPrice}</button>
                <button aria-label={compareProductCodes.includes(quickView.productCode) ? removeFromCompareLabel : compareLabel} className={compareProductCodes.includes(quickView.productCode) ? 'quick-add-icon is-selected' : 'quick-add-icon'} onClick={() => toggleCompare(quickView)} type="button">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4v12m0 0 3-3m-3 3-3-3m13 7V8m0 0 3 3m-3-3-3 3M5 4h4M15 20h4" /></svg>
                </button>
                <button aria-label={wishlistProductCodes.includes(quickView.productCode) ? removeFromWishlistLabel : addToWishlistLabel} className={wishlistProductCodes.includes(quickView.productCode) ? 'quick-add-icon is-selected' : 'quick-add-icon'} onClick={() => toggleWishlist(quickView)} type="button">
                  <Heart aria-hidden="true" size={26} strokeWidth={1.8} />
                </button>
              </div>
              <button className="secondary quick-view-details" onClick={() => openProduct(quickView.productCode)} type="button">{storefrontLabels.viewFullDetails ?? 'View full details'}</button>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}
