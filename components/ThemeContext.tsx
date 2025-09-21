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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Set data attribute for theme
    root.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
      // High contrast light theme - maximum readability
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--bg-tertiary', '#e2e8f0');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#1e293b');
      root.style.setProperty('--text-tertiary', '#475569');
      root.style.setProperty('--border-primary', '#d1d5db');
      root.style.setProperty('--accent-primary', '#3b82f6');
      root.style.setProperty('--accent-secondary', '#2563eb');

      // Inject CSS for form inputs and prose styling
      let lightThemeCSS = document.getElementById('light-theme-override');
      if (!lightThemeCSS) {
        lightThemeCSS = document.createElement('style');
        lightThemeCSS.id = 'light-theme-override';
        lightThemeCSS.innerHTML = `
          /* Form input overrides */
          [data-theme="light"] input,
          [data-theme="light"] textarea,
          [data-theme="light"] select {
            color: #000000 !important;
            background-color: #ffffff !important;
            border-color: #d1d5db !important;
          }
          
          [data-theme="light"] input::placeholder,
          [data-theme="light"] textarea::placeholder {
            color: #6b7280 !important;
            opacity: 1 !important;
          }
          
          /* Prose text overrides */
          [data-theme="light"] .prose,
          [data-theme="light"] .prose * {
            color: #000000 !important;
          }
          
          /* Chat message and briefing text */
          [data-theme="light"] .prose h1,
          [data-theme="light"] .prose h2,
          [data-theme="light"] .prose h3,
          [data-theme="light"] .prose p,
          [data-theme="light"] .prose ul,
          [data-theme="light"] .prose ol,
          [data-theme="light"] .prose li {
            color: #000000 !important;
          }
          
          /* Preserve dark cards */
          [data-theme="light"] .bg-slate-800,
          [data-theme="light"] .bg-slate-800 * {
            color: #ffffff !important;
          }
        `;
        document.head.appendChild(lightThemeCSS);
      }
      
      // Force body text color
      document.body.style.color = '#000000';
    } else {
      // Dark theme
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#e2e8f0');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--border-primary', '#475569');
      root.style.setProperty('--accent-primary', '#3b82f6');
      root.style.setProperty('--accent-secondary', '#2563eb');

      // Remove light theme overrides
      const lightThemeCSS = document.getElementById('light-theme-override');
      if (lightThemeCSS) {
        lightThemeCSS.remove();
      }
      
      document.body.style.color = '#f8fafc';
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};