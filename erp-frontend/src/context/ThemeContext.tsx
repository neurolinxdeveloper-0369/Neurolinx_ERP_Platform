import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../api';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isSyncing: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  syncWithServer: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'neurolinx_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check saved preference in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      // 2. Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const applyTheme = (targetTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', targetTheme);
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    document.body.setAttribute('data-theme', targetTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync theme to backend server
  const saveThemeToServer = useCallback(async (targetTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return; // Not logged in; keep local

    setIsSyncing(true);
    try {
      await apiFetch('https://erp-api.neurolinx.in/api/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: targetTheme })
      });
    } catch (err) {
      console.warn('Could not persist theme preference to server:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch theme from backend server
  const syncWithServer = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/settings/theme');
      if (res.ok) {
        const data = await res.json();
        if (data && (data.theme === 'light' || data.theme === 'dark')) {
          setThemeState(data.theme);
          localStorage.setItem(THEME_STORAGE_KEY, data.theme);
          applyTheme(data.theme);
        }
      }
    } catch (err) {
      // Ignore network errors or unauthenticated states
    }
  }, []);

  // On initial mount or when login occurs, sync with server
  useEffect(() => {
    syncWithServer();

    const handleAuthChange = () => {
      syncWithServer();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('neurolinx_login', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('neurolinx_login', handleAuthChange);
    };
  }, [syncWithServer]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyTheme(newTheme);
      window.dispatchEvent(new CustomEvent('theme_changed', { detail: { theme: newTheme } }));
      // Persist to server in background
      saveThemeToServer(newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  const value = useMemo(() => ({
    theme,
    isDark,
    isSyncing,
    setTheme,
    toggleTheme,
    syncWithServer
  }), [theme, isDark, isSyncing, saveThemeToServer, syncWithServer]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
