export function MissingRendererView({ rendererKey }: { readonly rendererKey: string }) {
  return <section aria-live="polite" data-renderer-recovery="missing"><h2>Content unavailable</h2><p>The component <code>{rendererKey}</code> is not available in this storefront composition.</p></section>;
}
