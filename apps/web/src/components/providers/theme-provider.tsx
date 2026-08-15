'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = 'partsanj-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  // پیش‌فرض قطعی سایت: روشن
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);

    // فقط light و dark معتبر هستند.
    if (savedTheme === 'dark') {
      setThemeState('dark');
      applyTheme('dark');
      return;
    }

    if (savedTheme === 'light') {
      setThemeState('light');
      applyTheme('light');
      return;
    }

    /*
     * migration:
     * اگر از نسخه قدیمی مقدار system یا هر مقدار نامعتبر دیگری
     * باقی مانده باشد، آن را حذف و سایت را light می‌کنیم.
     */
    window.localStorage.removeItem(STORAGE_KEY);

    setThemeState('light');
    applyTheme('light');
  }, []);

  function setTheme(nextTheme: Theme) {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);

    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
