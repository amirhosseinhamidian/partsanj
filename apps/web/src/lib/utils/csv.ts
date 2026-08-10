export type CsvValue = string | number | boolean | null | undefined;

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  // همه مقادیر را quote می‌کنیم تا comma، newline و quote مشکلی ایجاد نکند.
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
  const content = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\r\n');

  // BOM باعث می‌شود فارسی در Excel درست نمایش داده شود.
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export function getCsvDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesNo(value: boolean): string {
  return value ? 'بله' : 'خیر';
}
