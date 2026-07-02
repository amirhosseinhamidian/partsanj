export function formatPrice(priceToman: number | null): string {
  if (!priceToman) {
    return 'بدون قیمت';
  }

  return `${priceToman.toLocaleString('fa-IR')} تومان`;
}
