import type { CmsComponentContract, CmsResolvedPageContract } from './cmsContract';
import type { AgoraRuntimeConfig } from '../runtime/config';

export type WcmsExperienceTargetType = 'DEFAULT' | 'BRAND' | 'CATEGORY' | 'COLLECTION';

export interface ResolveWcmsExperienceInput {
  readonly baseUrl: string;
  readonly enterpriseCode: string;
  readonly site: string;
  readonly pageType: string;
  readonly targetType: WcmsExperienceTargetType;
  readonly targetCode: string;
  readonly locale: string;
  readonly channel: string;
  readonly device: string;
  readonly region?: string;
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
}

export interface WcmsExperienceResolvedComponent {
  readonly placementCode: string;
  readonly componentCode: string;
  readonly rendererKey: string;
  readonly contractVersion: number;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly media: readonly Readonly<Record<string, unknown>>[];
}

export interface WcmsExperienceResolveResult {
  readonly site: string;
  readonly pageType: string;
  readonly release?: string;
  readonly indexVersion?: string;
  readonly slots: Readonly<Record<string, readonly WcmsExperienceResolvedComponent[]>>;
}

export class WcmsExperienceDeliveryError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WcmsExperienceDeliveryError';
    this.status = status;
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is invalid`);
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function envelopeResult(value: unknown): unknown {
  const envelope = asRecord(value, 'WCMS Experience response envelope');
  if ('result' in envelope) return envelope.result;
  if ('data' in envelope) return envelope.data;
  throw new Error('WCMS Experience response does not contain result data');
}

function parseResolvedComponent(value: unknown): WcmsExperienceResolvedComponent {
  const source = asRecord(value, 'WCMS Experience resolved component');
  const placementCode = optionalString(source.placementCode);
  const componentCode = optionalString(source.componentCode);
  const rendererKey = optionalString(source.rendererKey);
  if (!placementCode || !componentCode || !rendererKey) throw new Error('WCMS Experience component is missing renderer identity');
  return Object.freeze({
    placementCode,
    componentCode,
    rendererKey,
    contractVersion: optionalNumber(source.contractVersion) ?? 1,
    properties: source.properties && typeof source.properties === 'object' && !Array.isArray(source.properties)
      ? Object.freeze({ ...(source.properties as Record<string, unknown>) })
      : Object.freeze({}),
    media: Array.isArray(source.media)
      ? Object.freeze(source.media.flatMap((item): readonly Readonly<Record<string, unknown>>[] => (
        item && typeof item === 'object' && !Array.isArray(item) ? [Object.freeze({ ...(item as Record<string, unknown>) })] : []
      )))
      : Object.freeze([]),
  });
}

export function parseWcmsExperienceResolveResult(value: unknown): WcmsExperienceResolveResult {
  const source = asRecord(value, 'WCMS Experience resolve result');
  const rawSlots = source.slots && typeof source.slots === 'object' && !Array.isArray(source.slots)
    ? source.slots as Record<string, unknown>
    : {};
  const slots = Object.fromEntries(Object.entries(rawSlots).map(([slot, components]) => [
    slot,
    Array.isArray(components) ? Object.freeze(components.map(parseResolvedComponent)) : Object.freeze([]),
  ]));
  return Object.freeze({
    site: optionalString(source.site) ?? '',
    pageType: optionalString(source.pageType) ?? '',
    release: optionalString(source.release),
    indexVersion: optionalString(source.indexVersion),
    slots: Object.freeze(slots),
  });
}

function endpoint(baseUrl: string): URL {
  const origin = new URL(baseUrl);
  if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('WCMS Experience endpoint is invalid');
  return new URL(`${origin.toString().replace(/\/$/u, '')}/nodics/wcmsExperience/v0/delivery/resolve`);
}

export async function resolveWcmsExperience(
  input: ResolveWcmsExperienceInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<WcmsExperienceResolveResult> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), input.timeoutMs);
  const abort = () => controller.abort();
  input.signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetchImplementation(endpoint(input.baseUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-enterprise-code': input.enterpriseCode,
      },
      body: JSON.stringify({
        site: input.site,
        pageType: input.pageType,
        targetType: input.targetType,
        targetCode: input.targetCode,
        locale: input.locale,
        channel: input.channel,
        device: input.device,
        ...(input.region ? { region: input.region } : {}),
      }),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) throw new WcmsExperienceDeliveryError(`WCMS Experience delivery returned HTTP ${response.status}`, response.status);
    return parseWcmsExperienceResolveResult(envelopeResult(await response.json()));
  } catch (error) {
    if (controller.signal.aborted) throw new WcmsExperienceDeliveryError('WCMS Experience delivery timed out');
    if (error instanceof WcmsExperienceDeliveryError) throw error;
    throw error instanceof Error ? new WcmsExperienceDeliveryError(error.message) : new WcmsExperienceDeliveryError('WCMS Experience delivery failed');
  } finally {
    globalThis.clearTimeout(timeout);
    input.signal?.removeEventListener('abort', abort);
  }
}

function normalizedRenderer(component: WcmsExperienceResolvedComponent): string {
  if (component.rendererKey === 'agora.productListing.featuredCarousel') return 'agora.productListing';
  return component.rendererKey;
}

function normalizedProperties(slot: string, component: WcmsExperienceResolvedComponent): Readonly<Record<string, unknown>> {
  if (component.rendererKey === 'agora.productListing.featuredCarousel' || slot === 'featuredCarousel') {
    return Object.freeze({ projectedProducts: component.properties });
  }
  return component.properties;
}

function cmsMedia(item: Readonly<Record<string, unknown>>, index: number) {
  const mediaCode = optionalString(item.mediaCode) ?? optionalString(item.code);
  return Object.freeze({
    ...(mediaCode ? { mediaCode } : {}),
    ...(optionalString(item.role) ? { role: optionalString(item.role) } : {}),
    ...(optionalString(item.url) ? { deliveryUrl: optionalString(item.url) } : {}),
    ...(optionalString(item.deliveryUrl) ? { deliveryUrl: optionalString(item.deliveryUrl) } : {}),
    ...(optionalString(item.publicUrl) ? { publicUrl: optionalString(item.publicUrl) } : {}),
    ...(optionalString(item.alt) ? { altText: optionalString(item.alt) } : {}),
    ...(optionalString(item.altText) ? { altText: optionalString(item.altText) } : {}),
    position: optionalNumber(item.position) ?? index,
  });
}

export function wcmsExperienceToCmsPage(
  result: WcmsExperienceResolveResult,
  config: Pick<AgoraRuntimeConfig, 'siteCode' | 'locale' | 'channel'>,
  path: string,
): CmsResolvedPageContract {
  const byRenderer = new Map<string, CmsComponentContract>();
  Object.entries(result.slots).forEach(([slot, components]) => {
    components.forEach((component, index) => {
      const renderer = normalizedRenderer(component);
      const current = byRenderer.get(renderer);
      const properties = normalizedProperties(slot, component);
      const nextProperties = Object.freeze({
        ...(current?.properties ?? {}),
        ...properties,
      });
      const media = Object.freeze([
        ...(current?.media ?? []),
        ...component.media.map(cmsMedia),
      ]);
      byRenderer.set(renderer, Object.freeze({
        code: current?.code ?? component.componentCode,
        typeCode: current?.typeCode ?? `${renderer.replace(/[^A-Za-z0-9]/gu, '')}Type`,
        active: true,
        renderer,
        rendererContractVersion: component.contractVersion,
        rendererChannels: Object.freeze([config.channel]),
        rendererDeprecated: false,
        properties: nextProperties,
        ...(media.length ? { media } : {}),
        slot: current?.slot ?? slot,
        index: current?.index ?? index,
        components: Object.freeze([]),
      }));
    });
  });
  return Object.freeze({
    contractVersion: 0,
    site: result.site || config.siteCode,
    path,
    locale: config.locale,
    channel: config.channel,
    page: Object.freeze({
      code: `wcmsExperience:${result.pageType}`,
      name: result.pageType,
      renderer: 'agora.experience',
      rendererContractVersion: 0,
      rendererChannels: Object.freeze([config.channel]),
      rendererDeprecated: false,
      components: Object.freeze([...byRenderer.values()]),
    }),
  });
}
