export type StorefrontCartOwnerType = 'GUEST' | 'CUSTOMER';

export type StorefrontCartStatus = 'ACTIVE' | 'MERGED' | 'CHECKED_OUT' | 'ABANDONED';

export type StorefrontCartFitmentStatus =
  | 'NOT_SELECTED'
  | 'CONFIRMED'
  | 'REQUIRES_VERIFICATION'
  | 'NOT_CONFIRMED';

export type StorefrontCartAvailabilityReason =
  | 'PRODUCT_INACTIVE'
  | 'OUT_OF_STOCK'
  | 'PRICE_UNAVAILABLE';

export type StorefrontCartProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type StorefrontCartItem = {
  id: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;

  product: {
    id: string;
    sku: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    brand: {
      id: string;
      name: string;
      slug: string;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    image: StorefrontCartProductImage | null;
  };

  vehicle: {
    id: string;
    name: string;
    slug: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: 'SHAMSI' | 'GREGORIAN';
    notes: string | null;
    model: {
      id: string;
      name: string;
      slug: string;
      make: {
        id: string;
        name: string;
        slug: string;
      };
    };
  } | null;

  fitment: {
    status: StorefrontCartFitmentStatus;
    notes: string | null;
    requiresVerification: boolean;
  };

  availability: {
    canPurchase: boolean;
    reasons: StorefrontCartAvailabilityReason[];
  };

  price: {
    snapshotBasePriceToman: number;
    snapshotEffectivePriceToman: number;
    snapshotAt: string;

    currentBasePriceToman: number | null;
    currentEffectivePriceToman: number | null;
    discountAmountToman: number;
    discountPercent: number;
    isSaleActive: boolean;

    hasPriceChanged: boolean;
  };

  lineTotalToman: number | null;
};

export type StorefrontCart = {
  id: string;
  ownerType: StorefrontCartOwnerType;
  status: StorefrontCartStatus;
  expiresAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;

  items: StorefrontCartItem[];

  summary: {
    itemCount: number;
    purchasableItemCount: number;
    subtotalToman: number;
  };
};

export type AddCartItemInput = {
  productId: string;
  quantity?: number;
  vehicleVariantId?: string;
};

export type UpdateCartItemQuantityInput = {
  quantity: number;
};

export type CartApiResponse<T> = {
  data: T;
};

export type CartMergeApiResponse = {
  data: StorefrontCart;
  meta: {
    merged: boolean;
  };
};
