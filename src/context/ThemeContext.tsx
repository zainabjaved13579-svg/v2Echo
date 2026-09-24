import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'moon';

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
  const [theme] = useState<AppTheme>('moon');

  const setTheme = () => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'moon');
    } catch {}
  };

  const toggleTheme = () => {
    // No-op: Dark moon theme is the permanent aesthetic
  };

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'moon');
      document.documentElement.classList.add('theme-moon');
      document.documentElement.classList.remove('theme-sun');
    } catch {}
  }, []);

  // Dark Moon / Obsidian theme:
  // - Full chat area: #151515
  // - Sidebar: #111111, border: #222222
  // - Bottom message bar: #20201f, with border of #2b2b2a
  // - Answers and questions: crisp white (#ffffff)
  const colors = {
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
