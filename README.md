# Nodics Agora Apparel

`nodics.agora.apparel` is the customer-facing apparel Commerce storefront. It is
a concrete domain app under the Nodics experience layer, not the shared Commerce
UI package and not a backend module.

## Ownership

- Owns apparel storefront presentation, responsive UX, browser state, and tests.
- Owns the renderer contract required by this reusable storefront template.
- Consumes apparel content, product, price, inventory, media, and publishing
  data from Kickoff/Online backend APIs.
- Must not carry Electronics or Telco renderer implementations.
- Must not own Commerce, WCMS, Discovery, Profile, Payment, Fulfillment, Media,
  Process, persistence, tenant policy, or business rules.

## Runtime journey

```text
Home -> collection/search -> product detail -> cart -> checkout ->
payment result -> order confirmation/history -> lifecycle request surfaces
```

Page sections, components, media and product data must be content/API driven.
Local fallback data is allowed only for safe development and tests.

## Verification

```bash
npm run verify
```

Local end-to-end topology and data qualification are orchestrated from
`nodics.kickoff`.
