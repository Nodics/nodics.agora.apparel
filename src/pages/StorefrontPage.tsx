import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useLocalCart } from '../cart/cartState';
import { maskedPaymentLabel, normalizeShippingOptions, paymentOption, paymentOptions, shippingOption, shippingOptions, shippingPrice, type ShippingOption } from '../checkout/checkoutOptions';
import { paymentResultViewModel, type PaymentResultViewModel } from '../checkout/paymentResult';
import { paymentProviderToken as checkoutPaymentProviderToken, validateCheckoutSnapshot } from '../checkout/checkoutValidation';
import { agoraHomeContent, EMPTY_AGORA_HOME_CONTENT, type AgoraLinkAction } from '../cms/agoraHomeContent';
import { resolveCmsPage } from '../cms/cmsClient';
import type { CmsResolvedPageContract } from '../cms/cmsContract';
import { productAvailabilityLabel } from '../commerce/availabilityPresentation';
import { productBrandLabel } from '../commerce/productPresentation';
import { ProductCarousel } from '../components/ProductCarousel';
import { ProductCardView } from '../components/ProductCardView';
import { clearAgoraCustomerSession, resolveAgoraCustomerSession, saveAgoraCustomerSession, type CustomerSession } from '../customer/customerSession';
import { ProductMediaPlaceholder, productGalleryImageUrl, productGalleryUrls, productImageUrl } from '../media/productVisual';
import { lifecycleAutomationPlan, lifecycleFormGuidance, lifecycleReasonOptions, lifecycleSummary, lifecycleTimeline, lifecycleTrackingSummary, lifecycleTypes, preferredResolutionOptions, previewLifecycleRequest, refundMethodOptions, submitLifecycleRequest } from '../order/orderLifecycle';
import { runtimeConfig } from '../runtime/config';

type View = 'home' | 'plp' | 'pdp' | 'cart' | 'checkout' | 'payment-result' | 'confirmation' | 'orders';
type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'review';
type RouteState = {
  readonly view: View;
  readonly collectionCode: string;
  readonly query: string;
  readonly checkoutStep?: CheckoutStep;
  readonly productSlug?: string;
};
const orderCode = () => `storefront-order-${Date.now()}`;
const idempotencyKey = () => `storefront-checkout-${Date.now()}`;
const routeStateFromLocation = function (rootCollectionCode = ''): RouteState {
  if (typeof window === 'undefined') return { view: 'home', collectionCode: rootCollectionCode, query: '' };
  const path = window.location.pathname.replace(/\/+$/u, '') || '/';
  if (path === '/cart') return { view: 'cart', collectionCode: rootCollectionCode, query: '' };
  if (path === '/checkout') return { view: 'checkout', collectionCode: rootCollectionCode, query: '', checkoutStep: 'customer' };
  if (path === '/orders') return { view: 'orders', collectionCode: rootCollectionCode, query: '' };
  if (path.startsWith('/products/')) return { view: 'pdp', collectionCode: rootCollectionCode, query: '', productSlug: decodeURIComponent(path.slice('/products/'.length)) };
  return { view: 'home', collectionCode: rootCollectionCode, query: '' };
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

const nonDisplaySizes = Object.freeze(['ONE', 'ONE_SIZE']);
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
const displayLabel = function (value: string | undefined): string {
  return value ? value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
};
const moneyAmount = function (value: string | number | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
};
const productOptionColourCode = function (option: { readonly colourCode?: string; readonly colorCode?: string }): string | undefined {
  return option.colourCode ?? option.colorCode;
};
const productColorOptions = function (product: ProductCard | ProductDetail | undefined) {
  const options = new Map<string, { readonly code: string; readonly label: string; readonly value: string }>();
  (product?.apparel?.options ?? []).forEach((option) => {
    const colourCode = productOptionColourCode(option);
    if (!colourCode || options.has(colourCode)) return;
    options.set(colourCode, { code: colourCode, label: displayLabel(colourCode), value: swatchPalette[colourCode] ?? '#f6c100' });
  });
  return Array.from(options.values());
};
const productSizeOptions = function (product: ProductCard | ProductDetail | undefined, colourCode?: string) {
  const sizes = new Set<string>();
  (product?.apparel?.options ?? []).forEach((option) => {
    if (colourCode && productOptionColourCode(option) !== colourCode) return;
    if (!option.sizeCode || nonDisplaySizes.includes(option.sizeCode)) return;
    sizes.add(option.sizeCode);
  });
  return Array.from(sizes);
};
const productVariantForSelection = function (product: ProductCard | ProductDetail | undefined, colourCode?: string, sizeCode?: string) {
  return (product?.apparel?.options ?? []).find((option) => {
    if (colourCode && productOptionColourCode(option) !== colourCode) return false;
    if (sizeCode && option.sizeCode !== sizeCode) return false;
    return Boolean(option.variantCode);
  })?.variantCode ?? product?.defaultVariantCode ?? product?.variantCodes?.[0];
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
  const [brand, setBrand] = useState('');
  const [sortCode, setSortCode] = useState('recommended');
  const [visiblePageSize, setVisiblePageSize] = useState(12);
  const [products, setProducts] = useState<readonly ProductCard[]>([]);
  const [homeProducts, setHomeProducts] = useState<readonly ProductCard[]>([]);
  const [facets, setFacets] = useState<Readonly<Record<string, readonly unknown[]>>>({});
  const [selected, setSelected] = useState<ProductDetail>();
  const [pendingProductSlug, setPendingProductSlug] = useState<string | undefined>(initialRouteState.productSlug);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>();
  const [quickView, setQuickView] = useState<ProductCard>();
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
  const cart = useLocalCart();
  const collectionCarouselRef = useRef<HTMLElement>(null);
  const homeContent = useMemo(() => cmsPage ? agoraHomeContent(cmsPage, runtimeConfig) : EMPTY_AGORA_HOME_CONTENT, [cmsPage]);
  const headerContent = homeContent.header;
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
      path: '/',
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
  }, []);

  useEffect(() => {
    if (!rootCollectionCode || collectionCode) return;
    setCollectionCode(rootCollectionCode);
  }, [collectionCode, rootCollectionCode]);

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
    if (view !== 'home' || cmsHeroSlides.length < 2) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % cmsHeroSlides.length);
    }, 5200);
    return () => window.clearInterval(intervalId);
  }, [cmsHeroSlides.length, view]);

  useEffect(() => {
    let active = true;
    void listProducts(runtimeConfig, {
      categoryCode: (view === 'home' || view === 'plp') && collectionCode ? collectionCode : undefined,
      q: query || undefined,
      pageSize: String(visiblePageSize),
    })
      .then((response) => {
        if (active) setProducts(response.products);
        if (active) setFacets(response.facets ?? {});
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Product discovery failed');
      });
    return () => {
      active = false;
    };
  }, [collectionCode, query, view, visiblePageSize]);

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
    setQuickView(product);
    void getProduct(runtimeConfig, product.productCode)
      .then((response) => {
        if (response.product) setQuickView(response.product);
      })
      .catch(() => setQuickView(product));
  };

  const openCollection = (code: string) => {
    if (!code) return;
    setCollectionCode(code);
    setView('plp');
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

  const brands = Array.from(new Set(products.map((product) => productBrandLabel(product)).filter(Boolean))) as string[];
  const visibleProducts = [...(brand ? products.filter((product) => productBrandLabel(product) === brand) : products)].sort((left, right) => {
    if (sortCode === 'price-asc') return Number(left.price?.unitAmount ?? 0) - Number(right.price?.unitAmount ?? 0);
    if (sortCode === 'price-desc') return Number(right.price?.unitAmount ?? 0) - Number(left.price?.unitAmount ?? 0);
    if (sortCode === 'name-asc') return String(left.name ?? left.productCode).localeCompare(String(right.name ?? right.productCode));
    return 0;
  });
  const facetEntries = Object.entries(facets).filter(([, values]) => values.length > 0);
  const homeRailProducts = homeProducts.length ? homeProducts : products;
  const featuredProducts = selectedHomeProducts(homeContent.topPicks.productCodes, homeRailProducts, homeContent.topPicks.pageSize ?? 4);
  const bestSelling = selectedHomeProducts(homeContent.bestSelling.productCodes, homeRailProducts, homeContent.bestSelling.pageSize ?? 4);
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
      setQuery(nextRouteState.query);
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
      return;
    }
    if (action.path) window.history.pushState({}, '', action.path);
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

  const selectedColourCode = productOptionColourCode(selected?.apparel?.options?.find((option) => option.variantCode === selectedVariantCode) ?? {}) ?? productOptionColourCode(selected?.apparel?.options?.[0] ?? {});
  const selectedSizeCode = selected?.apparel?.options?.find((option) => option.variantCode === selectedVariantCode)?.sizeCode;
  const selectedColorOptions = productColorOptions(selected);
  const selectedSizeOptions = productSizeOptions(selected, selectedColourCode);
  const useCmsHeroImages = true;
  const headerLogoText = headerContent.logoText ?? 'NODICS';
  const headerSubtitle = headerContent.subtitle ?? 'AGORA';
  const hasFooterContent = Boolean(
    homeContent.footer.summary ||
      homeContent.footer.contactEmail ||
      homeContent.footer.groups.length ||
      homeContent.footer.newsletter ||
      homeContent.footer.legalLinks.length ||
      homeContent.footer.copyright ||
      homeContent.footer.brandLabel,
  );
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
        <button className="agora-brand" onClick={() => setView('home')} type="button" aria-label="Nodics Agora home">
          <NodicsBrand logoText={headerLogoText} subtitle={headerSubtitle} />
        </button>
        <nav className="nav-pills" aria-label="Storefront navigation">
          {headerContent.navigation.map((item) => (
            <button className={collectionCode === item.collectionCode ? '' : 'secondary'} key={item.label} onClick={() => item.collectionCode ? openCollection(item.collectionCode) : openAction(item)} type="button">
              {item.label} {item.dropdown ? <ChevronDown aria-hidden="true" size={15} /> : null}
            </button>
          ))}
        </nav>
        <div className="commerce-actions">
          {headerContent.searchEnabled ? <button className="icon-action" onClick={() => setView('plp')} type="button" aria-label="Search products"><Search aria-hidden="true" size={24} /></button> : null}
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
          <button onClick={() => setView('plp')} type="button">Back to listing</button>
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
                  <strong>Color</strong>
                  <div className="pdp-color-options" aria-label="Choose color">
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
                  <strong>Size</strong>
                  <div className="sizes" aria-label="Choose size">
                    {selectedSizeOptions.map((size) => (
                      <button className={selectedSizeCode === size ? '' : 'secondary'} key={size} onClick={() => setSelectedVariantCode(productVariantForSelection(selected, selectedColourCode, size))} type="button">{size}</button>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="quantity">
                Quantity
                <input
                  aria-label="Quantity"
                  min="1"
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  type="number"
                  value={quantity}
                />
              </label>
              <button onClick={addSelectedToCart} type="button">Add to cart</button>
              <div className="pdp-tabs">
                <details open>
                  <summary>Description</summary>
                  <p>{selected.summary ?? selected.description}</p>
                </details>
                <details>
                  <summary>Shipping & returns</summary>
                  <p>Free shipping threshold and 14-day returns mirror the reference storefront policy.</p>
                </details>
                <details>
                  <summary>Reviews</summary>
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
                  {wishlistProductCodes.includes(selected.productCode) ? 'Remove from wishlist' : 'Add to wishlist'}
                </button>
                <button className="secondary" onClick={() => toggleCompare(selected)} type="button">
                  {compareProductCodes.includes(selected.productCode) ? 'Remove from compare' : 'Compare product'}
                </button>
              </div>
            </article>
          </div>
          <section className="section-header">
            <div>
              <p className="eyebrow">Curated recommendations</p>
              <h2>Related pieces</h2>
              <p className="muted">Recommendations are resolved from Commerce product relationships.</p>
            </div>
          </section>
          <section className="grid" aria-label="Recommended products">
            {recommendedProducts.map((product) => (
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                key={product.productCode}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
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
                {homeContent.collectionHeader?.actionLabel ? <button className="collection-view-all" onClick={() => setView('plp')} type="button">{homeContent.collectionHeader.actionLabel}</button> : null}
              </section>
              <div className="collection-carousel-shell">
                <button className="collection-carousel-control collection-carousel-control-previous" onClick={() => scrollCollectionCarousel('previous')} type="button" aria-label="Previous collections">
                  <ChevronLeft aria-hidden="true" size={28} />
                </button>
                <div className="collection-carousel-viewport">
                  <section className="collection-grid collection-grid-photo" ref={collectionCarouselRef} aria-label="Shop by collection">
                    {homeContent.collections.map((collection) => (
                      <button key={collection.label} onClick={() => openCollection(collection.code)} type="button">
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
                ariaLabel="Featured products"
                compareProductCodes={compareProductCodes}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
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
                ariaLabel="Best selling products"
                compareProductCodes={compareProductCodes}
                direction="backward"
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
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
          {hasFooterContent ? <footer className="storefront-footer">
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
            {homeContent.footer.newsletter ? <section className="storefront-footer-newsletter">
              {homeContent.footer.newsletter.title ? <h3>{homeContent.footer.newsletter.title}</h3> : null}
              {homeContent.footer.newsletter.text ? <p>{homeContent.footer.newsletter.text}</p> : null}
              <form onSubmit={(event) => event.preventDefault()}>
                <input aria-label="Newsletter email" placeholder={homeContent.footer.newsletter?.placeholder} />
                <button type="submit">{homeContent.footer.newsletter?.buttonLabel}</button>
              </form>
            </section> : null}
            <section className="storefront-footer-legal">
              {homeContent.footer.copyright ? <span>{homeContent.footer.copyright}</span> : null}
              {homeContent.footer.brandLabel ? <span>{homeContent.footer.brandLabel}</span> : null}
              {homeContent.footer.legalLinks.map((link) => <span key={link}>{link}</span>)}
            </section>
          </footer> : null}
        </>
      ) : (
        <>
          <section className="plp-toolbar">
            <div>
              <p className="eyebrow">Product Listing</p>
              <h2>{collections.find((collection) => collection.code === collectionCode)?.label ?? 'Collection'}</h2>
            </div>
            <div className="chip-row" aria-label="Collection filters">
              {collections.map((collection) => (
                <button className={collection.code === collectionCode ? '' : 'secondary'} key={collection.code} onClick={() => setCollectionCode(collection.code)} type="button">{collection.label}</button>
              ))}
            </div>
            <div className="chip-row" aria-label="Brand filters">
              <button className={brand ? 'secondary' : ''} onClick={() => setBrand('')} type="button">All brands</button>
              {brands.map((nextBrand) => (
                <button className={brand === nextBrand ? '' : 'secondary'} key={nextBrand} onClick={() => setBrand(nextBrand)} type="button">{nextBrand}</button>
              ))}
            </div>
            {facetEntries.length ? (
              <div className="facet-panel" aria-label="Search facets">
                {facetEntries.map(([facetCode, values]) => (
                  <article key={facetCode}>
                    <h3>{facetCode}</h3>
                    <p>{values.map((value) => facetLabel(value)).join(', ')}</p>
                  </article>
                ))}
              </div>
            ) : null}
            <label>
              Sort products
              <select aria-label="Sort products" onChange={(event) => setSortCode(event.target.value)} value={sortCode}>
                <option value="recommended">Recommended</option>
                <option value="name-asc">Name A-Z</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
              </select>
            </label>
          </section>
          <section className="grid" aria-label="Product listing">
            {visibleProducts.map((product) => (
              <ProductCardView
                compareSelected={compareProductCodes.includes(product.productCode)}
                key={product.productCode}
                onAdd={addToCart}
                onCompare={toggleCompare}
                onOpen={openProduct}
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
            <div className="load-more">
              <button className="secondary" onClick={() => setVisiblePageSize((current) => current + 12)} type="button">Load more products</button>
            </div>
          )}
        </>
      )}
      {quickView ? (
        <dialog className="quick-view" open>
          <article>
            <button className="secondary close" onClick={() => setQuickView(undefined)} type="button">Close</button>
            <p className="eyebrow">Quick View</p>
            <h2>{quickView.name}</h2>
            <p>{quickView.summary}</p>
            <p className="price">{quickView.price?.currency} {quickView.price?.unitAmount}</p>
            <div className="quick-view-actions">
              <button onClick={() => addToCart(quickView)} type="button">Quick Add</button>
              <button className="secondary" onClick={() => toggleWishlist(quickView)} type="button">
                {wishlistProductCodes.includes(quickView.productCode) ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button className="secondary" onClick={() => toggleCompare(quickView)} type="button">
                {compareProductCodes.includes(quickView.productCode) ? 'Comparing' : 'Compare'}
              </button>
              <button className="secondary" onClick={() => openProduct(quickView.productCode)} type="button">View full details</button>
            </div>
          </article>
        </dialog>
      ) : null}
    </main>
  );
}
