import type { ComponentType } from 'react';

export type StorefrontDomain = 'apparel' | 'electronics' | 'telco';
export type RendererLayer = 'commerce' | 'domain' | 'customer';

export interface RendererRegistration<Props> {
  readonly key: string;
  readonly layer: RendererLayer;
  readonly domain?: StorefrontDomain;
  readonly component: ComponentType<Props>;
}

export interface RendererDiagnostic {
  readonly code: 'RENDERER_NOT_FOUND';
  readonly key: string;
  readonly domain: StorefrontDomain;
}

const priorities: Readonly<Record<RendererLayer, number>> = {
  commerce: 100,
  domain: 200,
  customer: 300,
};

export class RendererRegistry<Props> {
  private readonly entries: RendererRegistration<Props>[] = [];

  constructor(
    private readonly onDiagnostic: (diagnostic: RendererDiagnostic) => void = (diagnostic) =>
      console.error('[AgoraRenderer]', diagnostic)
  ) {}

  register(entry: RendererRegistration<Props>) {
    this.entries.push(entry);
    return this;
  }

  resolve(key: string, domain: StorefrontDomain, fallback?: ComponentType<Props>): ComponentType<Props> {
    const candidates = this.entries.filter((entry) => entry.key === key && (!entry.domain || entry.domain === domain));
    const selected = candidates.sort((left, right) => priorities[right.layer] - priorities[left.layer])[0];
    if (!selected) {
      this.onDiagnostic({ code: 'RENDERER_NOT_FOUND', key, domain });
      if (fallback) return fallback;
      throw new Error(`No storefront renderer registered for ${key}:${domain}`);
    }
    return selected.component;
  }

  registrations() {
    return [...this.entries];
  }
}
