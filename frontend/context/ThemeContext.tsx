'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'fiscalidade-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = preference === 'system' ? systemTheme() : preference;

  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;

  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] =
    useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] =
    useState<ResolvedTheme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initialPreference = isThemePreference(stored) ? stored : 'system';

    setStoredPreference(initialPreference);
    setResolvedTheme(applyTheme(initialPreference));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (preference === 'system') {
        setResolvedTheme(applyTheme('system'));
      }
    };

    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
    setStoredPreference(nextPreference);
    setResolvedTheme(applyTheme(nextPreference));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }

  return context;
}
