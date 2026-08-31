import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';

import type { AgoraListingExperience, AgoraListingFilterGroup } from '../cms/agoraHomeContent';

export type ProductListingLayout = 'list' | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5';
export type ProductFilterKey = 'brands' | 'categories' | 'collections' | 'colors' | 'sizes' | 'availability';
export type ProductFilterState = {
  readonly brands: readonly string[];
  readonly categories: readonly string[];
  readonly collections: readonly string[];
  readonly colors: readonly string[];
  readonly sizes: readonly string[];
  readonly availability: readonly string[];
  readonly priceMin: string;
  readonly priceMax: string;
  readonly saleOnly: boolean;
};
export type ProductFilterOptionGroup = {
  readonly key: ProductFilterKey;
  readonly label: string;
  readonly options: readonly string[];
};
type ProductFilterDrawerGroup = AgoraListingFilterGroup | { readonly code: ProductFilterKey | 'price'; readonly label: string };

type ProductListingToolbarProps = {
  readonly activeFilterCount: number;
  readonly activeFilterLabels: readonly { readonly key: string; readonly label: string }[];
  readonly configuration?: AgoraListingExperience;
  readonly filters: ProductFilterState;
  readonly layout: ProductListingLayout;
  readonly onClearFilters: () => void;
  readonly onLayoutChange: (layout: ProductListingLayout) => void;
  readonly onSaleOnlyChange: (selected: boolean) => void;
  readonly onSortChange: (sortCode: string) => void;
  readonly onToggleFilters: () => void;
  readonly searchFacetsLabel: string;
  readonly searchFacetsText?: string;
  readonly sortCode: string;
};

type ProductFilterDrawerProps = {
  readonly configuration?: AgoraListingExperience;
  readonly filters: ProductFilterState;
  readonly filterGroups: readonly ProductFilterOptionGroup[];
  readonly isOpen: boolean;
  readonly onApply: () => void;
  readonly onClear: () => void;
  readonly onClose: () => void;
  readonly onFilterToggle: (key: ProductFilterKey, value: string) => void;
  readonly onPriceChange: (key: 'priceMin' | 'priceMax', value: string) => void;
  readonly optionCount: (key: ProductFilterKey, value: string) => number;
  readonly optionLabel: (key: ProductFilterKey, value: string) => string;
};

const defaultLayoutOptions = Object.freeze([
  { code: 'list', label: 'List view', dots: [1, 2, 3, 4, 5, 6] },
  { code: 'grid-2', label: 'Two products per row', dots: [1, 2, 3, 4] },
  { code: 'grid-3', label: 'Three products per row', dots: [1, 2, 3, 4, 5, 6] },
  { code: 'grid-4', label: 'Four products per row', dots: [1, 2, 3, 4, 5, 6, 7, 8] },
  { code: 'grid-5', label: 'Five products per row', dots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
] as const);

const defaultSortOptions = Object.freeze([
  { code: 'recommended', label: 'Best selling' },
  { code: 'name-asc', label: 'Name A-Z' },
  { code: 'price-asc', label: 'Price low to high' },
  { code: 'price-desc', label: 'Price high to low' },
]);

const isProductListingLayout = function (value: string): value is ProductListingLayout {
  return value === 'list' || value === 'grid-2' || value === 'grid-3' || value === 'grid-4' || value === 'grid-5';
};

const visibleLayoutOptions = function (configuration?: AgoraListingExperience) {
  const configured = configuration?.toolbar?.layoutOptions
    ?.filter((option) => isProductListingLayout(option.code))
    .map((option) => {
      const fallback = defaultLayoutOptions.find((item) => item.code === option.code);
      return { code: option.code as ProductListingLayout, label: option.label || fallback?.label || option.code, dots: fallback?.dots ?? [4, 4, 4, 4] };
    });
  return configured?.length ? configured : defaultLayoutOptions;
};

const visibleSortOptions = function (configuration?: AgoraListingExperience) {
  const configured = configuration?.toolbar?.sortOptions?.filter((option) => option.code && option.label);
  return configured?.length ? configured : defaultSortOptions;
};

const fallbackDrawerGroups = function (filterGroups: readonly ProductFilterOptionGroup[]): readonly ProductFilterDrawerGroup[] {
  const groups = filterGroups.map((group) => ({ code: group.key, label: group.label }));
  const categoryIndex = groups.findIndex((group) => group.code === 'categories');
  const priceGroup = { code: 'price' as const, label: 'Price' };
  if (categoryIndex < 0) return [priceGroup, ...groups];
  return [...groups.slice(0, categoryIndex + 1), priceGroup, ...groups.slice(categoryIndex + 1)];
};

export function ProductListingToolbar({
  activeFilterCount,
  activeFilterLabels,
  configuration,
  filters,
  layout,
  onClearFilters,
  onLayoutChange,
  onSaleOnlyChange,
  onSortChange,
  onToggleFilters,
  searchFacetsLabel,
  searchFacetsText,
  sortCode,
}: ProductListingToolbarProps) {
  return (
    <section className="plp-toolbar" aria-label={configuration?.toolbar?.ariaLabel ?? 'Product listing controls'}>
      <div className="plp-primary-controls">
        <button className="plp-filter-toggle" onClick={onToggleFilters} type="button">
          <SlidersHorizontal aria-hidden="true" size={18} />
          {configuration?.toolbar?.filterLabel ?? configuration?.filterLabel ?? 'Filters'}{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
        <label className="plp-sale-inline">
          <input checked={filters.saleOnly} onChange={(event) => onSaleOnlyChange(event.target.checked)} type="checkbox" />
          <span aria-hidden="true">{filters.saleOnly ? '✓' : ''}</span>
          {configuration?.toolbar?.saleOnlyLabel ?? configuration?.saleOnlyLabel ?? 'Shop sale items only'}
        </label>
        <div className="plp-layout-toggle" aria-label={configuration?.toolbar?.layoutAriaLabel ?? 'Product layout'}>
          {visibleLayoutOptions(configuration).map((option) => (
            <button
              aria-label={option.label}
              aria-pressed={layout === option.code}
              className={layout === option.code ? 'is-selected' : undefined}
              key={option.code}
              onClick={() => onLayoutChange(option.code)}
              type="button"
            >
              <span className={`plp-density-icon plp-density-icon-${option.code}`} aria-hidden="true">
                {option.dots.map((dot, index) => <i key={`${option.code}-${dot}-${index}`} />)}
              </span>
            </button>
          ))}
        </div>
        <label>
          <span>{configuration?.toolbar?.sortLabel ?? 'Sort By:'}</span>
          <select aria-label={configuration?.toolbar?.sortAriaLabel ?? 'Sort products'} onChange={(event) => onSortChange(event.target.value)} value={sortCode}>
            {visibleSortOptions(configuration).map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
          </select>
        </label>
      </div>
      {activeFilterLabels.length ? (
        <div className="plp-active-filters" aria-label={configuration?.toolbar?.activeFiltersAriaLabel ?? 'Active filters'}>
          {activeFilterLabels.map((item) => <span key={item.key}>{item.label}</span>)}
          <button onClick={onClearFilters} type="button">{configuration?.toolbar?.clearAllLabel ?? 'Clear all'}</button>
        </div>
      ) : null}
      {searchFacetsText ? <p className="visually-hidden" aria-label={searchFacetsLabel}>{searchFacetsText}</p> : null}
    </section>
  );
}

export function ProductFilterDrawer({
  configuration,
  filters,
  filterGroups,
  isOpen,
  onApply,
  onClear,
  onClose,
  onFilterToggle,
  onPriceChange,
  optionCount,
  optionLabel,
}: ProductFilterDrawerProps) {
  if (!isOpen) return null;
  const drawer = configuration?.filterDrawer;
  const configuredGroups: readonly ProductFilterDrawerGroup[] = drawer?.groups?.length ? drawer.groups : fallbackDrawerGroups(filterGroups);
  const groupByKey = new Map(filterGroups.map((group) => [group.key, group]));
  return createPortal(
    <div
      className="plp-filter-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <aside className="plp-filter-drawer" aria-label={drawer?.ariaLabel ?? 'Product filters'} aria-modal="true" role="dialog">
        <div className="plp-filter-drawer-header">
          <div><h3>{drawer?.title ?? 'Filters'}</h3></div>
          <button aria-label={drawer?.closeLabel ?? 'Close filters'} onClick={onClose} type="button"><X aria-hidden="true" size={20} /></button>
        </div>
        <div className="plp-filter-drawer-body">
          {configuredGroups.map((configuredGroup) => {
            if (configuredGroup.code === 'price') {
              return (
                <fieldset className="plp-filter-group" key="price">
                  <legend>{configuredGroup.label || drawer?.priceLabel || 'Price'}</legend>
                  <div className="plp-price-rail" aria-hidden="true"><span /><span /></div>
                  <div className="plp-price-inputs">
                    <label>{drawer?.minPriceLabel ?? 'Min'} <input inputMode="decimal" onChange={(event) => onPriceChange('priceMin', event.target.value)} placeholder={drawer?.minPricePlaceholder ?? '0'} type="text" value={filters.priceMin} /></label>
                    <label>{drawer?.maxPriceLabel ?? 'Max'} <input inputMode="decimal" onChange={(event) => onPriceChange('priceMax', event.target.value)} placeholder={drawer?.maxPricePlaceholder ?? '250'} type="text" value={filters.priceMax} /></label>
                  </div>
                </fieldset>
              );
            }
            const group = groupByKey.get(configuredGroup.code as ProductFilterKey);
            if (!group?.options.length) return null;
            const selectedValues = filters[group.key];
            return (
              <fieldset className="plp-filter-group" key={group.key}>
                <legend>{configuredGroup.label || group.label}</legend>
                <div className="plp-filter-options">
                  {group.options.map((option) => (
                    <button
                      aria-label={optionLabel(group.key, option)}
                      aria-pressed={selectedValues.includes(option)}
                      className={selectedValues.includes(option) ? 'is-selected' : undefined}
                      key={option}
                      onClick={() => onFilterToggle(group.key, option)}
                      type="button"
                    >
                      <span>{optionLabel(group.key, option)}</span>
                      <small>{optionCount(group.key, option)}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
        <div className="plp-filter-actions">
          <button className="secondary" onClick={onClear} type="button">{drawer?.resetLabel ?? 'Reset filters'}</button>
          <button onClick={onApply} type="button">{drawer?.applyLabel ?? 'Apply filters'}</button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
