import localFont from 'next/font/local';

export const vazirmatn = localFont({
  src: [
    {
      path: '../app/assets/fonts/Vazirmatn[wght].ttf',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
});
