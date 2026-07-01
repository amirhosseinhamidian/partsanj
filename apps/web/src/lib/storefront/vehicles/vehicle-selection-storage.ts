import type { StorefrontVehicleSelectionInput } from './vehicle.types';

export const STOREFRONT_VEHICLE_SELECTION_STORAGE_KEY = 'partsanj:storefront:vehicle-selection:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readStorefrontVehicleSelection(): StorefrontVehicleSelectionInput | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STOREFRONT_VEHICLE_SELECTION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (
      !isRecord(parsedValue) ||
      typeof parsedValue.makeSlug !== 'string' ||
      typeof parsedValue.modelSlug !== 'string' ||
      typeof parsedValue.variantId !== 'string'
    ) {
      return null;
    }

    if (
      !parsedValue.makeSlug.trim() ||
      !parsedValue.modelSlug.trim() ||
      !parsedValue.variantId.trim()
    ) {
      return null;
    }

    return {
      makeSlug: parsedValue.makeSlug,
      modelSlug: parsedValue.modelSlug,
      variantId: parsedValue.variantId,
    };
  } catch {
    return null;
  }
}

export function saveStorefrontVehicleSelection(selection: StorefrontVehicleSelectionInput): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STOREFRONT_VEHICLE_SELECTION_STORAGE_KEY, JSON.stringify(selection));
}

export function clearStorefrontVehicleSelection(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STOREFRONT_VEHICLE_SELECTION_STORAGE_KEY);
}
