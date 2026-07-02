export type ProductPricingFields = {
  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

export function getComputedProductPricing<T extends ProductPricingFields>(
  product: T,
  now = new Date(),
) {
  const basePriceToman = product.priceToman;
  const salePriceToman = product.salePriceToman;

  const hasValidBasePrice = typeof basePriceToman === 'number' && basePriceToman > 0;

  const hasValidSalePrice = typeof salePriceToman === 'number' && salePriceToman > 0;

  const hasStarted = !product.saleStartsAt || product.saleStartsAt <= now;

  const hasNotEnded = !product.saleEndsAt || product.saleEndsAt >= now;

  const isSaleActive =
    hasValidBasePrice &&
    hasValidSalePrice &&
    salePriceToman < basePriceToman &&
    hasStarted &&
    hasNotEnded;

  const effectivePriceToman = hasValidBasePrice
    ? isSaleActive
      ? salePriceToman
      : basePriceToman
    : null;

  const discountAmountToman =
    isSaleActive && effectivePriceToman !== null ? basePriceToman - effectivePriceToman : 0;

  const discountPercent =
    isSaleActive && basePriceToman > 0
      ? Math.round((discountAmountToman / basePriceToman) * 100)
      : 0;

  return {
    ...product,
    effectivePriceToman,
    discountAmountToman,
    discountPercent,
    isSaleActive,
  };
}
