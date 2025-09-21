import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'light') {
      // High contrast light theme - maximum readability
      root.style.setProperty('--bg-primary', '#ffffff');      // Pure white background
      root.style.setProperty('--bg-secondary', '#f8fafc');    // Slate-50 - cards background
      root.style.setProperty('--bg-tertiary', '#f1f5f9');     // Slate-100 - hover states
      root.style.setProperty('--text-primary', '#000000');    // Pure black - maximum contrast
      root.style.setProperty('--text-secondary', '#1e293b');  // Slate-800 - dark secondary text
      root.style.setProperty('--text-tertiary', '#475569');   // Slate-600 - muted but dark enough
      root.style.setProperty('--border-primary', '#cbd5e1');  // Slate-300 - visible borders
      root.style.setProperty('--accent-primary', '#0369a1');  // Blue-700 - strong accent
      root.style.setProperty('--accent-secondary', '#0284c7'); // Sky-600 - hover state
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)'); // Standard shadow
    } else {
      // Dark theme colors
      root.style.setProperty('--bg-primary', '#0f172a');      // Slate-900
      root.style.setProperty('--bg-secondary', '#1e293b');    // Slate-800
      root.style.setProperty('--bg-tertiary', '#334155');     // Slate-700
      root.style.setProperty('--text-primary', '#f8fafc');    // Slate-50
      root.style.setProperty('--text-secondary', '#e2e8f0');  // Slate-200
      root.style.setProperty('--text-tertiary', '#94a3b8');   // Slate-400
      root.style.setProperty('--border-primary', '#475569');  // Slate-600
      root.style.setProperty('--accent-primary', '#06b6d4');  // Cyan-500
      root.style.setProperty('--accent-secondary', '#0891b2'); // Cyan-600
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.3)'); // Dark shadow
    }

    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};