export interface CmsComponentContract {
  readonly code: string;
  readonly typeCode: string;
  readonly active: boolean;
  readonly renderer: string;
  readonly rendererContractVersion: number;
  readonly rendererChannels: readonly string[];
  readonly rendererDeprecated: boolean;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly media?: readonly CmsComponentMediaContract[];
  readonly slot: string;
  readonly index: number;
  readonly components: readonly CmsComponentContract[];
}

export interface CmsMediaMetadataContract {
  readonly code?: string;
  readonly mediaCode?: string;
  readonly name?: string;
  readonly description?: string;
  readonly folderCode?: string;
  readonly formatCode?: string;
  readonly mimeType?: string;
  readonly sizeBytes?: number;
  readonly extension?: string;
  readonly access?: string;
  readonly businessPurpose?: string;
  readonly ownerType?: string;
  readonly ownerReference?: string;
  readonly reusable?: boolean;
  readonly status?: string;
  readonly deliveryUrl?: string;
  readonly publicUrl?: string;
}

export interface CmsComponentMediaContract {
  readonly componentMediaCode?: string;
  readonly mediaCode?: string;
  readonly mediaSetCode?: string;
  readonly mediaType?: string;
  readonly role?: string;
  readonly slot?: string;
  readonly localeCode?: string;
  readonly position?: number;
  readonly altText?: string;
  readonly caption?: string;
  readonly deliveryUrl?: string;
  readonly publicUrl?: string;
  readonly media?: CmsMediaMetadataContract;
}

export interface CmsResolvedPageContract {
  readonly contractVersion: number;
  readonly site: string;
  readonly path: string;
  readonly locale: string;
  readonly channel: string;
  readonly page: {
    readonly code: string;
    readonly name?: string;
    readonly renderer: string;
    readonly rendererContractVersion: number;
    readonly rendererChannels: readonly string[];
    readonly rendererDeprecated: boolean;
    readonly templateContract?: {
      readonly code: string;
      readonly renderer: string;
      readonly contractVersion: number;
    };
    readonly components: readonly CmsComponentContract[];
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`CMS response field ${field} must be a string`);
  return value;
}

function integer(value: unknown, field: string, positive = true): number {
  if (!Number.isInteger(value) || Number(value) < (positive ? 1 : 0)) throw new Error(`CMS response field ${field} must be an integer`);
  return Number(value);
}

function optionalInteger(value: unknown, fallback: number, field: string): number {
  if (value === undefined || value === null) return fallback;
  return integer(value, field, false);
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`CMS response field ${field} must be a boolean`);
  return value;
}

function strings(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.length < 1) throw new Error(`CMS response field ${field} must be a non-empty array`);
  return Object.freeze(value.map((item, index) => string(item, `${field}.${index}`)));
}

function optionalStrings(value: unknown, fallback: readonly string[], field: string): readonly string[] {
  if (value === undefined || value === null) return Object.freeze([...fallback]);
  return strings(value, field);
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function componentMedia(value: unknown): readonly CmsComponentMediaContract[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return Object.freeze(value.filter(isRecord).map((item) => {
    const media = isRecord(item.media) ? Object.freeze({
      ...(typeof item.media.code === 'string' ? { code: item.media.code } : {}),
      ...(typeof item.media.mediaCode === 'string' ? { mediaCode: item.media.mediaCode } : {}),
      ...(typeof item.media.name === 'string' ? { name: item.media.name } : {}),
      ...(typeof item.media.description === 'string' ? { description: item.media.description } : {}),
      ...(typeof item.media.folderCode === 'string' ? { folderCode: item.media.folderCode } : {}),
      ...(typeof item.media.formatCode === 'string' ? { formatCode: item.media.formatCode } : {}),
      ...(typeof item.media.mimeType === 'string' ? { mimeType: item.media.mimeType } : {}),
      ...(optionalNumber(item.media.sizeBytes) !== undefined ? { sizeBytes: optionalNumber(item.media.sizeBytes) } : {}),
      ...(typeof item.media.extension === 'string' ? { extension: item.media.extension } : {}),
      ...(typeof item.media.access === 'string' ? { access: item.media.access } : {}),
      ...(typeof item.media.businessPurpose === 'string' ? { businessPurpose: item.media.businessPurpose } : {}),
      ...(typeof item.media.ownerType === 'string' ? { ownerType: item.media.ownerType } : {}),
      ...(typeof item.media.ownerReference === 'string' ? { ownerReference: item.media.ownerReference } : {}),
      ...(typeof item.media.reusable === 'boolean' ? { reusable: item.media.reusable } : {}),
      ...(typeof item.media.status === 'string' ? { status: item.media.status } : {}),
      ...(typeof item.media.deliveryUrl === 'string' ? { deliveryUrl: item.media.deliveryUrl } : {}),
      ...(typeof item.media.publicUrl === 'string' ? { publicUrl: item.media.publicUrl } : {}),
    }) : undefined;
    return Object.freeze({
      ...(typeof item.componentMediaCode === 'string' ? { componentMediaCode: item.componentMediaCode } : {}),
      ...(typeof item.mediaCode === 'string' ? { mediaCode: item.mediaCode } : {}),
      ...(typeof item.mediaSetCode === 'string' ? { mediaSetCode: item.mediaSetCode } : {}),
      ...(typeof item.mediaType === 'string' ? { mediaType: item.mediaType } : {}),
      ...(typeof item.role === 'string' ? { role: item.role } : {}),
      ...(typeof item.slot === 'string' ? { slot: item.slot } : {}),
      ...(typeof item.localeCode === 'string' ? { localeCode: item.localeCode } : {}),
      ...(optionalNumber(item.position) !== undefined ? { position: optionalNumber(item.position) } : {}),
      ...(typeof item.altText === 'string' ? { altText: item.altText } : {}),
      ...(typeof item.caption === 'string' ? { caption: item.caption } : {}),
      ...(typeof item.deliveryUrl === 'string' ? { deliveryUrl: item.deliveryUrl } : {}),
      ...(typeof item.publicUrl === 'string' ? { publicUrl: item.publicUrl } : {}),
      ...(media ? { media } : {}),
    });
  }));
}

function components(value: unknown, depth = 0, budget = { count: 0 }): readonly CmsComponentContract[] {
  if (!Array.isArray(value)) throw new Error('CMS response components must be an array');
  if (depth > 10) throw new Error('CMS component graph exceeds the Agora depth limit');
  return Object.freeze(value.map((item, index) => {
    budget.count += 1;
    if (budget.count > 200) throw new Error('CMS component graph exceeds the Agora size limit');
    if (!isRecord(item) || !isRecord(item.properties)) throw new Error(`CMS component ${index} is invalid`);
    return Object.freeze({
      code: string(item.code, `components.${index}.code`),
      typeCode: string(item.typeCode, `components.${index}.typeCode`),
      active: typeof item.active === 'boolean' ? item.active : true,
      renderer: string(item.renderer, `components.${index}.renderer`),
      rendererContractVersion: optionalInteger(item.rendererContractVersion, 0, `components.${index}.rendererContractVersion`),
      rendererChannels: optionalStrings(item.rendererChannels, ['web'], `components.${index}.rendererChannels`),
      rendererDeprecated: typeof item.rendererDeprecated === 'boolean' ? item.rendererDeprecated : false,
      properties: Object.freeze({ ...item.properties }),
      ...(componentMedia(item.media) ? { media: componentMedia(item.media) } : {}),
      slot: string(item.slot, `components.${index}.slot`),
      index: integer(item.index, `components.${index}.index`, false),
      components: components(item.components, depth + 1, budget),
    });
  }));
}

export function parseCmsResolvedPage(value: unknown): CmsResolvedPageContract {
  if (!isRecord(value) || value.contractVersion !== 0 || !isRecord(value.page)) throw new Error('CMS returned an incompatible page contract');
  const page = value.page;
  const templateContract = isRecord(page.templateContract) ? Object.freeze({
    code: string(page.templateContract.code, 'template.code'),
    renderer: string(page.templateContract.renderer, 'template.renderer'),
    contractVersion: integer(page.templateContract.contractVersion, 'template.contractVersion'),
  }) : undefined;
  return Object.freeze({
    contractVersion: 0,
    site: string(value.site, 'site'),
    path: string(value.path, 'path'),
    locale: string(value.locale, 'locale'),
    channel: string(value.channel, 'channel'),
    page: Object.freeze({
      code: string(page.code, 'page.code'),
      ...(typeof page.name === 'string' ? { name: page.name } : {}),
      renderer: string(page.renderer, 'page.renderer'),
      rendererContractVersion: integer(page.rendererContractVersion, 'page.rendererContractVersion'),
      rendererChannels: strings(page.rendererChannels, 'page.rendererChannels'),
      rendererDeprecated: boolean(page.rendererDeprecated, 'page.rendererDeprecated'),
      ...(templateContract ? { templateContract } : {}),
      components: components(page.components),
    }),
  });
}
