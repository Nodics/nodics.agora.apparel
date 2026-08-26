# Agora Test Structure

Agora keeps tests grouped by customer journey capability:

- `test/content`: content-catalog and page-section contracts.
- `test/discovery`: browse, search, PLP, PDP, facet, quick-view contracts.
- `test/cart`: customer cart persistence and local fallback contracts.
- `test/checkout`: checkout, shipping, payment-result, placement, and confirmation contracts.
- `test/order`: order history plus cancellation, return, refund, exchange, replacement, appeal, and delayed-refund lifecycle contracts.

Cross-journey smoke tests may remain at `test/*JourneyContract.test.tsx` when they intentionally verify the complete customer path.

Implementation rule:

- Keep capability-near unit/contract tests beside implementation folders first
  (`src/api`, `src/cart`, `src/checkout`, `src/order`) so ownership remains
  obvious while the journey is still evolving.
- Move only stabilized end-to-end journey contracts under `test/` and keep
  folders aligned with the customer journey sequence: content, discovery, cart,
  checkout, order.
- Do not create provider-certification tests in Agora; real payment, carrier,
  warehouse, and POS certification belongs to backend/operator acceptance.
