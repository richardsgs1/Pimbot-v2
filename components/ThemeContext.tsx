import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('pimbot-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'dark'; // Default to dark
  });

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('pimbot-theme', theme);
    
    // Apply theme class to document
    document.documentElement.className = theme;
    
    // Update CSS custom properties
    const root = document.documentElement;
    
    if (theme === 'light') {
      // Light blue theme colors - easier on the eyes
      root.style.setProperty('--bg-primary', '#f0f8ff');      // Very light blue (Alice Blue)
      root.style.setProperty('--bg-secondary', '#e6f3ff');    // Slightly deeper light blue
      root.style.setProperty('--bg-tertiary', '#dbeafe');     // Light blue with subtle gray
      root.style.setProperty('--text-primary', '#1e293b');    // Dark slate for primary text
      root.style.setProperty('--text-secondary', '#475569');  // Medium slate for secondary text
      root.style.setProperty('--text-tertiary', '#64748b');   // Lighter slate for tertiary text
      root.style.setProperty('--border-primary', '#bfdbfe');  // Light blue border
      root.style.setProperty('--border-secondary', '#93c5fd'); // Slightly stronger blue border
      root.style.setProperty('--accent-primary', '#0284c7');  // Sky blue accent
      root.style.setProperty('--accent-hover', '#0369a1');    // Darker sky blue on hover
      root.style.setProperty('--success', '#059669');         // Green (unchanged)
      root.style.setProperty('--warning', '#d97706');         // Orange (unchanged)
      root.style.setProperty('--error', '#dc2626');           // Red (unchanged)
      root.style.setProperty('--shadow', '0 1px 3px 0 rgb(59 130 246 / 0.1), 0 1px 2px -1px rgb(59 130 246 / 0.1)'); // Blue-tinted shadow
    } else {
      // Dark theme colors (current)
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--border-primary', '#334155');
      root.style.setProperty('--border-secondary', '#475569');
      root.style.setProperty('--accent-primary', '#22d3ee');
      root.style.setProperty('--accent-hover', '#06b6d4');
      root.style.setProperty('--success', '#10b981');
      root.style.setProperty('--warning', '#f59e0b');
      root.style.setProperty('--error', '#ef4444');
      root.style.setProperty('--shadow', '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};