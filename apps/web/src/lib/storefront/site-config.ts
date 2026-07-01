export type StorefrontFooterLink = {
  label: string;
  href: string;
};

export const storefrontSiteConfig = {
  name: 'پارت‌سنج',
  englishName: 'PartSanj',
  description:
    'مرجع تخصصی جستجو و انتخاب قطعات برقی و الکترونیکی خودرو بر اساس مدل، تیپ و مشخصات فنی خودرو',

  contact: {
    phone: null as string | null,
    mobile: null as string | null,
    email: null as string | null,
    address: null as string | null,
  },
};

export const storefrontPrimaryNavigation: StorefrontFooterLink[] = [
  {
    label: 'صفحه اصلی',
    href: '/',
  },
  {
    label: 'دسته‌بندی قطعات',
    href: '/products',
  },
  {
    label: 'جستجوی خودرو',
    href: '/products#vehicle-selector',
  },
  {
    label: 'برندها',
    href: '/products#catalog-filters',
  },
  {
    label: 'راهنمای انتخاب قطعه',
    href: '#footer-guide',
  },
  {
    label: 'درباره ما',
    href: '#about',
  },
  {
    label: 'تماس با ما',
    href: '#contact',
  },
];

export const storefrontCategoryLinks: StorefrontFooterLink[] = [
  {
    label: 'سوکت خودرو',
    href: '/products',
  },
  {
    label: 'سنسورها',
    href: '/products',
  },
  {
    label: 'قطعات الکترونیکی',
    href: '/products',
  },
  {
    label: 'رله و فیوز',
    href: '/products',
  },
  {
    label: 'سیم‌کشی و کانکتور',
    href: '/products',
  },
  {
    label: 'قطعات برق مصرفی',
    href: '/products',
  },
];

export const storefrontGuideLinks: StorefrontFooterLink[] = [
  {
    label: 'انتخاب قطعه براساس خودرو',
    href: '/products#vehicle-selector',
  },
  {
    label: 'جستجو با کد فنی یا OEM',
    href: '/products',
  },
  {
    label: 'بررسی سازگاری قطعه',
    href: '/products#vehicle-selector',
  },
  {
    label: 'راهنمای کدهای قطعات خودرو',
    href: '#footer-guide',
  },
];
