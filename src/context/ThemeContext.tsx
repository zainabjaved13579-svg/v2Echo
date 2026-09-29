import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'moon' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  colors: {
    chatAreaBg: string;
    sidebarBg: string;
    sidebarBorder: string;
    bottomBarBg: string;
    bottomBarBorder: string;
    cardBg: string;
    cardBorder: string;
    userBubbleBg: string;
    userBubbleBorder: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
  };
}

const THEME_STORAGE_KEY = 'sapphire_app_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'white') return 'light';
      if (saved === 'moon' || saved === 'dark') return 'moon';
      return 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyThemeClasses(newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === 'moon' ? 'light' : 'moon';
    setTheme(next);
  };

  const applyThemeClasses = (currTheme: AppTheme) => {
    if (currTheme === 'light') {
      document.documentElement.classList.add('theme-light', 'theme-sun');
      document.documentElement.classList.remove('theme-moon', 'dark');
    } else {
      document.documentElement.classList.add('theme-moon', 'dark');
      document.documentElement.classList.remove('theme-light', 'theme-sun');
    }
  };

  useEffect(() => {
    applyThemeClasses(theme);
  }, [theme]);

  const colors = theme === 'light'
    ? {
        chatAreaBg: '#f8fafc',
        sidebarBg: '#ffffff',
        sidebarBorder: '#e2e8f0',
        bottomBarBg: '#ffffff',
        bottomBarBorder: '#e2e8f0',
        cardBg: '#ffffff',
        cardBorder: '#e2e8f0',
        userBubbleBg: '#f1f5f9',
        userBubbleBorder: '#e2e8f0',
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        accent: '#2563eb'
      }
    : {
        chatAreaBg: '#151515',
        sidebarBg: '#111111',
        sidebarBorder: '#222222',
        bottomBarBg: '#20201f',
        bottomBarBorder: '#2b2b2a',
        cardBg: '#20201f',
        cardBorder: '#2b2b2a',
        userBubbleBg: '#20201f',
        userBubbleBorder: '#2b2b2a',
        textPrimary: '#ffffff',
        textSecondary: '#a3a3a3',
        accent: '#d97757'
      };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
};

export default ThemeContext;