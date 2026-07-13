const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

export function toPersianDigits(value: string | number): string {
  return String(value)
    .replace(/[0-9]/g, (digit) => persianDigits[Number(digit)])
    .replace(/[٠-٩]/g, (digit) => {
      const index = arabicDigits.indexOf(digit);
      return persianDigits[index];
    });
}

export function digitsOnly(value: string): string {
  return toLatinDigits(value).replace(/\D/g, '');
}
