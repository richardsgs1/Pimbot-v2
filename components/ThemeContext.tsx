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
    
    // Set data attribute for theme
    root.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
      // High contrast light theme - maximum readability
      root.style.setProperty('--bg-primary', '#ffffff');      
      root.style.setProperty('--bg-secondary', '#f8fafc');    
      root.style.setProperty('--bg-tertiary', '#f1f5f9');     
      root.style.setProperty('--text-primary', '#000000');    
      root.style.setProperty('--text-secondary', '#1e293b');  
      root.style.setProperty('--text-tertiary', '#475569');   
      root.style.setProperty('--border-primary', '#cbd5e1');  
      root.style.setProperty('--accent-primary', '#0369a1');  
      root.style.setProperty('--accent-secondary', '#0284c7'); 
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
      
      // Force text colors for common elements and prose
      document.body.style.color = '#000000';
      root.style.setProperty('--tw-prose-body', '#000000');
      root.style.setProperty('--tw-prose-headings', '#000000');
      root.style.setProperty('--tw-prose-lead', '#000000');
      root.style.setProperty('--tw-prose-links', '#0369a1');
      root.style.setProperty('--tw-prose-bold', '#000000');
      root.style.setProperty('--tw-prose-counters', '#000000');
      root.style.setProperty('--tw-prose-bullets', '#000000');
      root.style.setProperty('--tw-prose-hr', '#e5e7eb');
      root.style.setProperty('--tw-prose-quotes', '#000000');
      root.style.setProperty('--tw-prose-quote-borders', '#e5e7eb');
      root.style.setProperty('--tw-prose-captions', '#000000');
      root.style.setProperty('--tw-prose-code', '#000000');
      root.style.setProperty('--tw-prose-pre-code', '#e5e7eb');
      root.style.setProperty('--tw-prose-pre-bg', '#1f2937');
      root.style.setProperty('--tw-prose-th-borders', '#d1d5db');
      root.style.setProperty('--tw-prose-td-borders', '#e5e7eb');

      // Inject aggressive CSS to override prose styling
      let lightThemeCSS = document.getElementById('light-theme-override');
      if (!lightThemeCSS) {
        lightThemeCSS = document.createElement('style');
        lightThemeCSS.id = 'light-theme-override';
        document.head.appendChild(lightThemeCSS);
      }
      lightThemeCSS.textContent = `
        /* Prose styling overrides */
        [data-theme="light"] .prose,
        [data-theme="light"] .prose *,
        [data-theme="light"] .prose p,
        [data-theme="light"] .prose h1,
        [data-theme="light"] .prose h2,
        [data-theme="light"] .prose h3,
        [data-theme="light"] .prose h4,
        [data-theme="light"] .prose h5,
        [data-theme="light"] .prose h6,
        [data-theme="light"] .prose ul,
        [data-theme="light"] .prose ol,
        [data-theme="light"] .prose li,
        [data-theme="light"] .prose strong,
        [data-theme="light"] .prose em {
          color: #000000 !important;
        }
        [data-theme="light"] .prose a {
          color: #0369a1 !important;
        }
        
        /* Light backgrounds should have dark text */
        [data-theme="light"] [class*="bg-white"] *,
        [data-theme="light"] [class*="bg-slate-50"] *,
        [data-theme="light"] [class*="bg-slate-100"] *,
        [data-theme="light"] [class*="bg-gray-50"] *,
        [data-theme="light"] [class*="bg-gray-100"] *,
        [data-theme="light"] .bg-\\[var\\(--bg-primary\\)\\] *,
        [data-theme="light"] .bg-\\[var\\(--bg-secondary\\)\\] *,
        [data-theme="light"] .bg-\\[var\\(--bg-tertiary\\)\\] * {
          color: #000000 !important;
        }
        
        /* Override specific muted text classes on light backgrounds */
        [data-theme="light"] .text-slate-400,
        [data-theme="light"] .text-slate-500,
        [data-theme="light"] .text-slate-600,
        [data-theme="light"] .text-gray-400,
        [data-theme="light"] .text-gray-500,
        [data-theme="light"] .text-gray-600,
        [data-theme="light"] .text-\\[var\\(--text-tertiary\\)\\] {
          color: #475569 !important;
        }
        
        /* Keep dark backgrounds with light text intact */
        [data-theme="light"] [class*="bg-slate-800"],
        [data-theme="light"] [class*="bg-slate-900"],
        [data-theme="light"] [class*="bg-gray-800"],
        [data-theme="light"] [class*="bg-gray-900"],
        [data-theme="light"] [class*="bg-blue-"],
        [data-theme="light"] [class*="bg-cyan-"],
        [data-theme="light"] [class*="bg-green-"],
        [data-theme="light"] [class*="bg-red-"],
        [data-theme="light"] [class*="bg-yellow-"] {
          color: inherit;
        }
        
        /* Preserve button and accent colors */
        [data-theme="light"] button,
        [data-theme="light"] a,
        [data-theme="light"] .text-white,
        [data-theme="light"] .text-cyan-400,
        [data-theme="light"] .text-blue-400,
        [data-theme="light"] .text-green-400 {
          color: inherit !important;
        }
      `;
    } else {
      // Dark theme colors
      root.style.setProperty('--bg-primary', '#0f172a');      
      root.style.setProperty('--bg-secondary', '#1e293b');    
      root.style.setProperty('--bg-tertiary', '#334155');     
      root.style.setProperty('--text-primary', '#f8fafc');    
      root.style.setProperty('--text-secondary', '#e2e8f0');  
      root.style.setProperty('--text-tertiary', '#94a3b8');   
      root.style.setProperty('--border-primary', '#475569');  
      root.style.setProperty('--accent-primary', '#06b6d4');  
      root.style.setProperty('--accent-secondary', '#0891b2'); 
      root.style.setProperty('--shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.3)');
      
      // Reset prose colors for dark theme
      document.body.style.color = '#f8fafc';
      root.style.setProperty('--tw-prose-body', '#f8fafc');
      root.style.setProperty('--tw-prose-headings', '#f8fafc');
      root.style.setProperty('--tw-prose-lead', '#e2e8f0');
      root.style.setProperty('--tw-prose-links', '#06b6d4');
      root.style.setProperty('--tw-prose-bold', '#f8fafc');
      root.style.setProperty('--tw-prose-counters', '#94a3b8');
      root.style.setProperty('--tw-prose-bullets', '#475569');
      root.style.setProperty('--tw-prose-hr', '#475569');
      root.style.setProperty('--tw-prose-quotes', '#e2e8f0');
      root.style.setProperty('--tw-prose-quote-borders', '#475569');
      root.style.setProperty('--tw-prose-captions', '#94a3b8');
      root.style.setProperty('--tw-prose-code', '#e2e8f0');
      root.style.setProperty('--tw-prose-pre-code', '#94a3b8');
      root.style.setProperty('--tw-prose-pre-bg', '#1e293b');
      root.style.setProperty('--tw-prose-th-borders', '#475569');
      root.style.setProperty('--tw-prose-td-borders', '#334155');

      // Remove light theme CSS override
      const lightThemeCSS = document.getElementById('light-theme-override');
      if (lightThemeCSS) {
        lightThemeCSS.remove();
      }
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