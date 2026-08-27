import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StorefrontPage } from "../src/pages/StorefrontPage";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function cmsComponent(
  code: string,
  renderer: string,
  properties: Record<string, unknown>,
  index: number,
) {
  return {
    code,
    typeCode: `${code}Type`,
    active: true,
    renderer,
    rendererContractVersion: 1,
    rendererChannels: ["web"],
    rendererDeprecated: false,
    properties,
    slot: "main",
    index,
    components: [],
  };
}

function agoraCmsPageResponse() {
  return jsonResponse({
    result: {
      contractVersion: 0,
      site: "agora",
      path: "/",
      locale: "en",
      channel: "web",
      page: {
        code: "agoraHomePage",
        name: "Agora Home",
        renderer: "agora.page",
        rendererContractVersion: 1,
        rendererChannels: ["web"],
        rendererDeprecated: false,
        templateContract: {
          code: "agoraHomeTemplate",
          renderer: "agora.home",
          contractVersion: 1,
        },
        components: [
          cmsComponent(
            "agoraApparelGlobalHeader",
            "agora.header",
            {
              logoText: "NODICS",
              subtitle: "AGORA",
              rootCollectionCode: "agoraWomen",
              searchPlaceholder: "Search dresses, bags, shirts...",
              searchEnabled: true,
              cartPreviewEnabled: true,
              accountPreviewEnabled: true,
              wishlistPreviewEnabled: true,
              utilityLinks: [
                { label: "+1 315-666-6688", path: "tel:+13156666688" },
                { label: "support@nodics.com", path: "mailto:support@nodics.com" },
                { label: "Our Store", collectionCode: "agoraWomen" },
              ],
              preferences: [
                { label: "USD", path: "#currency" },
                { label: "English", path: "#language" },
              ],
              navigationItems: [
                { label: "Home", path: "/" },
                { label: "Shop", collectionCode: "agoraWomen", dropdown: true },
                { label: "New in", collectionCode: "agoraNewArrivals" },
                { label: "Clothing", collectionCode: "agoraWomenTops", dropdown: true },
                {
                  label: "Bags & Accessories",
                  collectionCode: "agoraWomenAccessories",
                },
              ],
            },
            0,
          ),
          cmsComponent(
            "agoraHomeHeroExperience",
            "agora.heroCarousel",
            {
              slides: [
                {
                  eyebrow: "Summer 2026 Collection",
                  title: "Fresh styles just in",
                  mediaCode: "agora-home-hero-summer-edit",
                  primaryAction: {
                    label: "Shop New",
                    collectionCode: "agoraWomen",
                  },
                  secondaryAction: {
                    label: "Explore Collection",
                    collectionCode: "agoraWomenAccessories",
                  },
                },
                {
                  eyebrow: "Find Your Signature Style",
                  title: "Find Your Signature Style",
                  mediaCode: "agora-home-hero-signature-style",
                  primaryAction: {
                    label: "Shop Sale",
                    collectionCode: "agoraWomenSale",
                  },
                  secondaryAction: {
                    label: "Shop New",
                    collectionCode: "agoraWomen",
                  },
                },
                {
                  eyebrow: "Mix & Match Layers",
                  title: "Mix & Match Layers",
                  mediaCode: "agora-home-hero-layered-edit",
                  primaryAction: {
                    label: "Shop New",
                    collectionCode: "agoraWomen",
                  },
                  secondaryAction: {
                    label: "Explore Collection",
                    collectionCode: "agoraWomenAccessories",
                  },
                },
              ],
            },
            1,
          ),
          cmsComponent(
            "agoraHomeServiceTicker",
            "agora.serviceTicker",
            {
              messages: [
                { label: "Free shipping on qualifying orders" },
                { label: "Returns are free within 14 days" },
              ],
            },
            2,
          ),
          cmsComponent(
            "agoraHomeCollectionGrid",
            "agora.collectionGrid",
            {
              eyebrow: "Explore Collections",
              heading: "Shop by Collection",
              actionLabel: "View All Collection",
              items: [
                {
                  collectionCode: "agoraNewArrivals",
                  label: "New in",
                  mediaCode: "agora-collection-new-in",
                },
                {
                  collectionCode: "agoraWomen",
                  label: "Women",
                  mediaCode: "agora-collection-promotion",
                },
                {
                  collectionCode: "agoraWomenTops",
                  label: "Clothing",
                  mediaCode: "agora-collection-clothing",
                },
                {
                  collectionCode: "agoraWomenAccessories",
                  label: "Bags & Accessories",
                  mediaCode: "agora-collection-bags",
                },
              ],
            },
            3,
          ),
          cmsComponent(
            "agoraTopPicksProductRail",
            "agora.productRail",
            {
              eyebrow: "Today's Top Picks",
              heading: "Fresh styles just in",
              pageSize: 4,
            },
            4,
          ),
          cmsComponent(
            "agoraEditorialPromoGrid",
            "agora.promoGrid",
            {
              items: [
                {
                  title: "Capsule Collection",
                  summary: "Up to 40% off selected seasonal outfits.",
                  mediaCode: "agora-promo-capsule",
                  action: {
                    label: "Shop Collection",
                    collectionCode: "agoraWomen",
                  },
                },
              ],
            },
            5,
          ),
          cmsComponent(
            "agoraSpecialOfferSplit",
            "agora.specialOfferSplit",
            {
              eyebrow: "Limited edit",
              heading: "Special Offer This Week Only",
              summary: "Reserved for special occasions",
              leftMediaCode: "agora-promo-texture-edit",
              rightMediaCode: "agora-collection-new-in",
              action: {
                label: "Explore Collection",
                collectionCode: "agoraWomenSale",
              },
            },
            6,
          ),
          cmsComponent(
            "agoraBestSellingProductRail",
            "agora.productRail",
            {
              eyebrow: "Best Selling",
              heading: "Browse our top trending",
              pageSize: 4,
            },
            7,
          ),
          cmsComponent(
            "agoraCustomerServicePromiseGrid",
            "agora.servicePromiseGrid",
            {
              items: [
                {
                  label: "Shipping",
                  text: "Track every order from checkout to delivery.",
                },
              ],
            },
            8,
          ),
          cmsComponent(
            "agoraCustomerTestimonials",
            "agora.testimonialGrid",
            {
              eyebrow: "Customer Say",
              heading: "People adore the edit",
              summary: "Verified reviews from Agora shoppers.",
              items: [
                {
                  name: "Sybil Sharp",
                  quote:
                    "Fantastic shop. Great selection, fair prices, friendly staff, and excellent product quality.",
                  product: "Contrasting sheepskin sweatshirt",
                  mediaCode: "agora-testimonial-sybil",
                  avatarMediaCode: "agora-avatar-sybil",
                },
              ],
            },
            9,
          ),
          cmsComponent(
            "agoraSocialGallery",
            "agora.mediaGallery",
            {
              eyebrow: "Shop Instagram",
              heading: "Elevate your wardrobe with fresh finds today",
              items: [
                {
                  mediaCode: "agora-gallery-1",
                  alt: "Agora social gallery one",
                },
              ],
            },
            10,
          ),
          cmsComponent(
            "agoraGlobalFooterExperience",
            "agora.footer",
            {
              summary:
                "Nodics Agora brings fashion commerce into the Nodics experience layer.",
              contactEmail: "nodics.framework@gmail.com",
              groups: [
                {
                  title: "Commerce",
                  links: ["New in", "Women", "Clothing", "Bags & Accessories"],
                },
              ],
              newsletter: {
                title: "Newsletter",
                text: "Sign up for curated releases.",
                placeholder: "Enter your email",
                buttonLabel: "Subscribe",
              },
              copyright: "© 2026 Nodics. All rights reserved.",
              brandLabel: "Nodics Agora",
              legalLinks: ["Privacy", "Terms", "Cookies"],
            },
            11,
          ),
        ],
      },
    },
  });
}

function isCmsPageRequest(input: RequestInfo | URL) {
  return String(input).includes("/nodics/cms/v0/delivery/pages/resolve");
}

const linenWrapDressApparel = Object.freeze({
  sizeSystemCode: "ALPHA",
  options: [
    {
      variantCode: "agoraLinenWrapDressIvoryS",
      colourCode: "ivory",
      colourFamily: "neutral",
      sizeCode: "S",
    },
    {
      variantCode: "agoraLinenWrapDressIvoryM",
      colourCode: "ivory",
      colourFamily: "neutral",
      sizeCode: "M",
    },
    {
      variantCode: "agoraLinenWrapDressIvoryL",
      colourCode: "ivory",
      colourFamily: "neutral",
      sizeCode: "L",
    },
    {
      variantCode: "agoraLinenWrapDressIvoryXL",
      colourCode: "ivory",
      colourFamily: "neutral",
      sizeCode: "XL",
    },
    {
      variantCode: "agoraLinenWrapDressBlackS",
      colourCode: "black",
      colourFamily: "black",
      sizeCode: "S",
    },
    {
      variantCode: "agoraLinenWrapDressBlackM",
      colourCode: "black",
      colourFamily: "black",
      sizeCode: "M",
    },
    {
      variantCode: "agoraLinenWrapDressBlackL",
      colourCode: "black",
      colourFamily: "black",
      sizeCode: "L",
    },
    {
      variantCode: "agoraLinenWrapDressBlackXL",
      colourCode: "black",
      colourFamily: "black",
      sizeCode: "XL",
    },
  ],
});

describe("Agora storefront journey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("renders Home to PLP to PDP to authenticated checkout against backend API contracts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const target = String(input);
        if (isCmsPageRequest(input)) return agoraCmsPageResponse();
        if (target.includes("/customer/authenticate")) {
          return new Response(
            JSON.stringify({
              data: {
                authToken: "signed-in-customer-token",
                loginId: "alex@example.com",
                email: "alex@example.com",
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (target.includes("/customer/products/agoraLinenWrapDress")) {
          return new Response(
            JSON.stringify({
              data: {
                product: {
                  productCode: "agoraLinenWrapDress",
                  name: "Linen Wrap Dress",
                  description: "Linen dress",
                  gallery: [
                    "https://cdn.example.test/agora-linen-wrap-dress.jpg",
                  ],
                  variantCodes: linenWrapDressApparel.options.map(
                    (option) => option.variantCode,
                  ),
                  defaultVariantCode: "agoraLinenWrapDressIvoryS",
                  price: { currency: "USD", unitAmount: "129" },
                  availability: { available: true, status: "IN_STOCK" },
                  apparel: linenWrapDressApparel,
                  relatedProductCodes: ["agoraLeatherTote"],
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (
          target.includes(
            "/public/review-aggregates/PRODUCT/agoraLinenWrapDress",
          )
        ) {
          return new Response(
            JSON.stringify({
              data: {
                targetType: "PRODUCT",
                targetCode: "agoraLinenWrapDress",
                count: 2,
                average: 4.5,
                verifiedCount: 1,
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (target.includes("/public/reviews")) {
          return new Response(
            JSON.stringify({
              data: {
                items: [
                  {
                    reviewCode: "review-1",
                    targetCode: "agoraLinenWrapDress",
                    overallRating: 5,
                    title: "Beautiful fabric",
                    body: "Soft linen and easy fit.",
                    authenticity: { verified: true },
                  },
                ],
                total: 1,
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (target.includes("/customer/checkouts/place")) {
          return new Response(
            JSON.stringify({
              data: {
                code: "storefront-order-confirmed",
                orderCode: "storefront-order-confirmed",
                cartCode: "agora-cart-1",
                status: "PLACED",
                evidence: {
                  completed: [
                    "CALCULATED",
                    "RESERVED",
                    "AUTHORIZED",
                    "ORDERED",
                    "RELEASED",
                  ],
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (
          target.includes("/customer/carts") &&
          target.includes("/calculations")
        ) {
          return new Response(
            JSON.stringify({
              data: {
                cart: {
                  code: "agora-cart-1",
                  currency: "USD",
                  status: "CALCULATED",
                  revision: 2,
                },
                entries: [
                  {
                    code: "entry-1",
                    productCode: "agoraLinenWrapDress",
                    sku: "agoraLinenWrapDress-default",
                    quantity: "1",
                    status: "ACTIVE",
                  },
                ],
                subtotal: "129.00",
                discountAmount: "0",
                taxAmount: "6.45",
                totalAmount: "135.45",
                currency: "USD",
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (target.includes("/customer/carts")) {
          return new Response(
            JSON.stringify({
              data: {
                cart: {
                  code: "agora-cart-1",
                  currency: "USD",
                  status: "ACTIVE",
                  revision: 1,
                },
                entries: [
                  {
                    code: "entry-1",
                    productCode: "agoraLinenWrapDress",
                    sku: "agoraLinenWrapDress-default",
                    quantity: "1",
                    status: "ACTIVE",
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (target.endsWith("/nodics/order/v0/customer/orders")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  code: "storefront-order-confirmed",
                  cartCode: "agora-cart-1",
                  status: "PLACED",
                  currency: "USD",
                  totalAmount: "147.45",
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (
          target.includes("/customer/orders/storefront-order-confirmed") &&
          !target.includes("/lifecycle")
        ) {
          return new Response(
            JSON.stringify({
              data: {
                order: {
                  code: "storefront-order-confirmed",
                  cartCode: "agora-cart-1",
                  status: "PLACED",
                  totalAmount: "147.45",
                },
                entries: [
                  {
                    code: "entry-1",
                    productCode: "agoraLinenWrapDress",
                    quantity: "1",
                    status: "ACTIVE",
                  },
                ],
                lifecycle: [
                  {
                    code: "storefront-order-confirmed:return",
                    orderCode: "storefront-order-confirmed",
                    requestType: "RETURN",
                    status: "SUBMITTED",
                    rmaCode: "RMA-storefront-order-confirmed-1",
                    refundPreview: {
                      status: "REQUIRES_BACKOFFICE_CALCULATION",
                      reconciliationRequired: true,
                    },
                    automationPlan: [
                      {
                        step: "return-logistics",
                        owner: "fulfillment",
                        trigger: "DROP_OFF",
                        customerVisibleState: "Return method selected",
                      },
                      {
                        step: "refund-reconciliation",
                        owner: "payment",
                        trigger: "ORIGINAL_PAYMENT",
                        customerVisibleState: "Refund review in progress",
                      },
                    ],
                    evidence: {
                      returnTrackingStatus: "IN_TRANSIT",
                      disposition: "PENDING",
                    },
                  },
                  {
                    code: "storefront-order-confirmed:exchange",
                    orderCode: "storefront-order-confirmed",
                    requestType: "EXCHANGE",
                    status: "SUBMITTED",
                    rmaCode: "RMA-storefront-order-confirmed-2",
                    replacementSelectionRequired: true,
                    automationPlan: [
                      {
                        step: "replacement-reservation",
                        owner: "inventory",
                        trigger: "REPLACEMENT_SELECTION_REQUIRED",
                        customerVisibleState: "Replacement selection received",
                      },
                      {
                        step: "exchange-shipment",
                        owner: "fulfillment",
                        trigger: "replacement stock reserved",
                        customerVisibleState:
                          "Replacement shipment preparation",
                      },
                    ],
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (
          target.includes(
            "/customer/orders/storefront-order-confirmed/lifecycle",
          )
        ) {
          return new Response(
            JSON.stringify({
              data: {
                code: "storefront-order-confirmed:cancellation",
                orderCode: "storefront-order-confirmed",
                requestType: "CANCELLATION",
                status: "SUBMITTED",
                automationPlan: [
                  {
                    step: "reservation-release",
                    owner: "inventory",
                    trigger: "before fulfillment release",
                    customerVisibleState: "Cancellation requested",
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            data: {
              products: [
                {
                  productCode: "agoraLinenWrapDress",
                  name: "Linen Wrap Dress",
                  summary: "Linen dress",
                  brand: "Nodics Atelier",
                  price: { currency: "USD", unitAmount: "129" },
                  availability: { available: true, status: "IN_STOCK" },
                  variantCodes: linenWrapDressApparel.options.map(
                    (option) => option.variantCode,
                  ),
                  defaultVariantCode: "agoraLinenWrapDressIvoryS",
                  apparel: linenWrapDressApparel,
                },
                {
                  productCode: "agoraLeatherTote",
                  name: "Leather Tote",
                  summary: "Structured everyday tote",
                  brand: "Agora Studio",
                  price: { currency: "USD", unitAmount: "159" },
                  availability: { available: true, status: "IN_STOCK" },
                },
              ],
              facets: {
                brand: ["Nodics Atelier", "Agora Studio"],
                collection: ["agoraWomen", "agoraWomenAccessories"],
              },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    render(<StorefrontPage />);
    await waitFor(() =>
      expect(
        screen.getAllByRole("heading", { name: /Fresh styles just in/i })
          .length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByText(/Find Your Signature Style/i)).toBeTruthy();
    expect(screen.getByText(/Mix & Match Layers/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Shop by Collection/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Today's Top Picks/i)).toBeTruthy();
    expect(screen.getByText(/Best Selling/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Special Offer This Week Only/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Customer Say/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /People adore the edit/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Shop Instagram/i)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0),
    );
    const storefrontNavigation = within(
      screen.getByRole("navigation", { name: "Storefront navigation" }),
    );
    const domainCategoryButton = storefrontNavigation.queryByRole("button", {
      name: "Bags & Accessories",
    });
    expect(domainCategoryButton).toBeTruthy();
    const domainCategoryLabel = domainCategoryButton?.textContent?.trim() ?? "";
    await user.click(domainCategoryButton as HTMLElement);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: new RegExp(`^(${domainCategoryLabel}|Collection)$`, "u"),
        }),
      ).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: "Agora Studio" }));
    expect(screen.getAllByText("Leather Tote").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Search facets")).toBeTruthy();
    await user.selectOptions(
      screen.getByLabelText("Sort products"),
      "price-desc",
    );
    await user.click(
      screen.getByRole("button", { name: "Load more products" }),
    );
    await user.click(screen.getAllByRole("button", { name: /Quick view/i })[0]);
    expect(
      screen.getAllByRole("heading", { name: "Leather Tote" }).length,
    ).toBeGreaterThan(1);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: /Nodics Atelier/i }));
    await user.click(
      screen.getByRole("button", { name: "View details for Linen Wrap Dress" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Linen Wrap Dress" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Shipping & returns")).toBeTruthy();
    expect(
      await screen.findByText(/Average rating 4.5 from 2 review/),
    ).toBeTruthy();
    expect(screen.getByText("Beautiful fabric")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Related pieces" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Recommendations are resolved from Commerce product relationships/,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ivory" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Black" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "M" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "M" }));
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.clear(screen.getByLabelText("Customer email"));
    await user.type(
      screen.getByLabelText("Customer email"),
      "alex@example.com",
    );
    await user.type(
      screen.getByLabelText("Customer password"),
      "customerPassword",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("status")
          .some((status) =>
            status.textContent?.includes("Signed in as alex@example.com"),
          ),
      ).toBe(true),
    );
    await user.click(screen.getByRole("button", { name: /Cart \(1\)/ }));
    expect(screen.getByRole("heading", { name: "Shopping cart" })).toBeTruthy();
    expect(screen.getByText("Quantity: 1")).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          "Quantity for Linen Wrap Dress",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");
    expect(screen.getByText(/Subtotal: USD 129.00/)).toBeTruthy();
    expect(
      screen.getByText(/Promotion eligibility is calculated by Commerce/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Local promotion estimate; backend preview unavailable/),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Proceed to checkout" }),
    );
    expect(
      screen.getByRole("heading", { name: "Customer, shipping and payment" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Customer details" }),
    ).toBeTruthy();
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.click(
      screen.getByRole("button", { name: "Continue to shipping" }),
    );
    expect(
      screen.getByRole("heading", { name: "Shipping information" }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: /Express · USD 12.00/i }),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );
    expect(screen.getByRole("heading", { name: "Payment" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Review order" }));
    expect(
      screen.getByRole("heading", { name: "Review and place order" }),
    ).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/Tax: USD 6.45/)).toBeTruthy());
    expect(screen.getByText(/Total: USD 147.45/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Place order" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Payment confirmed" }),
      ).toBeTruthy(),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to order confirmation" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Thank you/i })).toBeTruthy(),
    );
    expect(screen.getByText(/Order storefront-order-confirmed/)).toBeTruthy();
    expect(screen.getByText(/Status: PLACED/)).toBeTruthy();
    expect(
      screen.getByText(/Shipping: Express · 1-2 business days/),
    ).toBeTruthy();
    expect(screen.getByText(/Payment: Card ending 4242/)).toBeTruthy();
    expect(screen.getByText(/Total: USD 147.45/)).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "Completed checkout steps" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "View order" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "My Orders" })).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", {
        name: /storefront-order-confirmed · PLACED · USD 147.45/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Order storefront-order-confirmed/ }),
    ).toBeTruthy();
    expect(screen.getByText(/Cart: agora-cart-1/)).toBeTruthy();
    expect(screen.getByText(/Lifecycle records: 2/)).toBeTruthy();
    expect(
      screen.getByText(
        /payment · refund-reconciliation · Refund review in progress/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /RETURN · SUBMITTED · RMA RMA-storefront-order-confirmed-1 · refund REQUIRES_BACKOFFICE_CALCULATION/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Tracking IN_TRANSIT/)).toBeTruthy();
    expect(
      screen.getByText(
        /Delayed refund or reconciliation may require operator review/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /EXCHANGE · SUBMITTED · RMA RMA-storefront-order-confirmed-2 · replacement selection required/,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("list", { name: "RETURN timeline" })).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "EXCHANGE timeline" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "RETURN automation plan" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /fulfillment · return-logistics · Return method selected/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "EXCHANGE automation plan" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /inventory · replacement-reservation · Replacement selection received/,
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("Submitted").length).toBeGreaterThan(0);
    expect(screen.getByText("Replacement selection")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "EXCHANGE" }));
    expect(screen.getByLabelText("Replacement product code")).toBeTruthy();
    expect(screen.getByLabelText("Preferred resolution")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Preview EXCHANGE" }));
    await waitFor(() =>
      expect(
        screen.getByRole("complementary", {
          name: "Lifecycle eligibility preview",
        }),
      ).toBeTruthy(),
    );
    expect(screen.getByText(/Eligible:/)).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "Lifecycle automation plan" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "CANCELLATION" }));
    await user.click(
      screen.getByRole("button", { name: "Submit CANCELLATION" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/CANCELLATION SUBMITTED/)).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: "EXCHANGE" }));
    await user.click(screen.getByRole("button", { name: "Submit EXCHANGE" }));
    await waitFor(() =>
      expect(screen.getByText(/EXCHANGE SUBMITTED/)).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: "APPEAL" }));
    expect(screen.getByLabelText("Appeal reference code")).toBeTruthy();
    expect(screen.getByLabelText("Appeal reason")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Submit APPEAL" }));
    await waitFor(() =>
      expect(screen.getByText(/APPEAL SUBMITTED/)).toBeTruthy(),
    );
  });

  it("blocks unauthenticated checkout after valid customer, shipping, and payment details", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (isCmsPageRequest(input)) return agoraCmsPageResponse();
      return jsonResponse({
        data: {
          products: [
            {
              productCode: "agoraLinenWrapDress",
              name: "Linen Wrap Dress",
              summary: "Linen dress",
              brand: "Nodics Atelier",
              price: { currency: "USD", unitAmount: "129" },
              availability: { available: true, status: "IN_STOCK" },
            },
          ],
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontPage />);

    await waitFor(() =>
      expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    await user.click(screen.getByRole("button", { name: /Cart \(1\)/ }));
    await user.click(
      screen.getByRole("button", { name: "Proceed to checkout" }),
    );
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.click(
      screen.getByRole("button", { name: "Continue to shipping" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );
    await user.click(screen.getByRole("button", { name: "Review order" }));
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Sign in before placing a live order.",
    );
    expect(
      screen.getByRole("heading", { name: "Customer details" }),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(([target]) =>
        String(target).includes("/customer/checkouts/place"),
      ),
    ).toBe(false);
  });

  it("authenticates customer and syncs local cart to Commerce after sign-in", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, options?: RequestInit) => {
        const target = String(input);
        if (isCmsPageRequest(input)) return agoraCmsPageResponse();
        if (target.includes("/customer/authenticate")) {
          return jsonResponse({
            data: {
              authToken: "signed-in-customer-token",
              loginId: "alex@example.com",
              email: "alex@example.com",
            },
          });
        }
        if (target.endsWith("/nodics/cart/v0/customer/carts")) {
          return jsonResponse({
            data: {
              cart: {
                code: "agora-cart-live-1",
                currency: "USD",
                status: "ACTIVE",
                revision: 1,
              },
              entries: [],
            },
          });
        }
        if (
          target.includes(
            "/nodics/cart/v0/customer/carts/agora-cart-live-1/entries",
          )
        ) {
          return jsonResponse({
            data: {
              cart: {
                code: "agora-cart-live-1",
                currency: "USD",
                status: "ACTIVE",
                revision: 2,
              },
              entries: [
                {
                  code: "entry-1",
                  productCode: "agoraLinenWrapDress",
                  sku: "sku-1",
                  quantity: "1",
                  status: "ACTIVE",
                },
              ],
            },
          });
        }
        if (
          target.includes("/nodics/customerList/v0/customer/lists/WISHLIST")
        ) {
          return jsonResponse({
            data: {
              list: {
                code: "wishlist-live-1",
                listType: "WISHLIST",
                ownerId: "alex@example.com",
                status: "ACTIVE",
              },
              entries: [
                {
                  code: "wishlist-entry-1",
                  productCode: "agoraLinenWrapDress",
                  status: "ACTIVE",
                },
              ],
            },
          });
        }
        if (target.includes("/nodics/customerList/v0/customer/lists/COMPARE")) {
          return jsonResponse({
            data: {
              list: {
                code: "compare-live-1",
                listType: "COMPARE",
                ownerId: "alex@example.com",
                status: "ACTIVE",
              },
              entries: [],
            },
          });
        }
        return jsonResponse({
          data: {
            products: [
              {
                productCode: "agoraLinenWrapDress",
                name: "Linen Wrap Dress",
                summary: "Linen dress",
                brand: "Nodics Atelier",
                variantCodes: linenWrapDressApparel.options.map(
                  (option) => option.variantCode,
                ),
                defaultVariantCode: "agoraLinenWrapDressIvoryS",
                apparel: linenWrapDressApparel,
                price: { currency: "USD", unitAmount: "129" },
                availability: { available: true, status: "IN_STOCK" },
              },
            ],
          },
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontPage />);

    await waitFor(() =>
      expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.clear(screen.getByLabelText("Customer email"));
    await user.type(
      screen.getByLabelText("Customer email"),
      "alex@example.com",
    );
    await user.type(
      screen.getByLabelText("Customer password"),
      "customerPassword",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(
        screen
          .getAllByRole("status")
          .some((status) =>
            status.textContent?.includes("Signed in as alex@example.com"),
          ),
      ).toBe(true),
    );
    await user.click(screen.getByRole("button", { name: /Cart \(1\)/ }));
    expect(
      screen.getByText(/Backend cart agora-cart-live-1 synced from local cart/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Backend wishlist and compare synced for alex@example.com/,
      ),
    ).toBeTruthy();

    const calls = fetchMock.mock.calls.map(([target, options]) => ({
      target: String(target),
      options: options ?? {},
    }));
    expect(
      calls.some(
        (call) =>
          call.target ===
          "http://localhost:4300/nodics/profile/v0/customer/authenticate",
      ),
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.target.includes("/nodics/cart/v0/customer/carts") &&
          !call.target.includes("/entries"),
      ),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.target.includes("/nodics/customerList/v0/customer/lists/WISHLIST"),
      ),
    ).toBe(true);
    expect(
      calls.some((call) =>
        call.target.includes("/nodics/customerList/v0/customer/lists/COMPARE"),
      ),
    ).toBe(true);
    const addEntryCall = calls.find((call) =>
      call.target.includes(
        "/nodics/cart/v0/customer/carts/agora-cart-live-1/entries",
      ),
    );
    expect(addEntryCall?.options.headers).toMatchObject({
      authorization: "Bearer signed-in-customer-token",
    });
    expect(JSON.parse(String(addEntryCall?.options.body))).toMatchObject({
      productCode: "agoraLinenWrapDress",
      variantCode: "agoraLinenWrapDressIvoryS",
      quantity: "1",
    });
  });

  it("supports local wishlist and compare selections until a customer signs in", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (isCmsPageRequest(input)) return agoraCmsPageResponse();
        return jsonResponse({
          data: {
            products: [
              {
                productCode: "agoraLinenWrapDress",
                name: "Linen Wrap Dress",
                summary: "Linen dress",
                brand: "Nodics Atelier",
                price: { currency: "USD", unitAmount: "129" },
                availability: { available: true, status: "IN_STOCK" },
              },
              {
                productCode: "agoraLeatherTote",
                name: "Leather Tote",
                summary: "Structured everyday tote",
                brand: "Agora Studio",
                price: { currency: "USD", unitAmount: "159" },
                availability: { available: true, status: "IN_STOCK" },
              },
            ],
          },
        });
      }),
    );

    render(<StorefrontPage />);

    await waitFor(() =>
      expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByRole("button", { name: "Wishlist" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Compare" })[1]);

    expect(
      screen
        .getAllByRole("status")
        .some((status) =>
          status.textContent?.includes("added to local compare"),
        ),
    ).toBe(true);
    expect(screen.getByRole("heading", { name: "Wishlist" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Compare" })).toBeTruthy();
    expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leather Tote").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Wishlisted" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Comparing" }).length,
    ).toBeGreaterThan(0);
  });

  it("blocks checkout placement until shipping and payment requirements are valid", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (isCmsPageRequest(input)) return agoraCmsPageResponse();
      return jsonResponse({
        data: {
          products: [
            {
              productCode: "agoraLinenWrapDress",
              name: "Linen Wrap Dress",
              summary: "Linen dress",
              brand: "Nodics Atelier",
              price: { currency: "USD", unitAmount: "129" },
              availability: { available: true, status: "IN_STOCK" },
            },
          ],
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<StorefrontPage />);

    await waitFor(() =>
      expect(screen.getAllByText("Linen Wrap Dress").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
    await user.click(screen.getByRole("button", { name: /Cart \(1\)/ }));
    await user.click(
      screen.getByRole("button", { name: "Proceed to checkout" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to shipping" }),
    );
    await user.clear(screen.getByLabelText("Address line 1"));
    await user.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );
    await user.click(screen.getByRole("button", { name: "Review order" }));
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Add shipping address line 1 before checkout.",
    );
    expect(
      screen.getByRole("heading", { name: "Shipping information" }),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(([target]) =>
        String(target).includes("/customer/checkouts/place"),
      ),
    ).toBe(false);
  });

  it("shows an unpublished state instead of a local storefront when Online CMS has no page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (isCmsPageRequest(input))
          return new Response(
            JSON.stringify({
              message: "CMS publication pointer was not found: content was not found",
            }),
            { status: 404, headers: { "content-type": "application/json" } },
          );
        return jsonResponse({ data: { products: [] } });
      }),
    );

    render(<StorefrontPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "We are getting the storefront ready.",
        }),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("link", { name: "Open Axis publishing" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Storefront navigation" })).toBeNull();
    expect(screen.queryByRole("heading", { name: /Fresh styles just in/i })).toBeNull();
  });
});
