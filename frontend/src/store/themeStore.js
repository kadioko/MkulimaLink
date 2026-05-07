import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'mkulimalink-theme';

// Check for system preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light', 'dark', 'system'
      resolvedTheme: 'light',
      
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme(theme);
      },
      
      toggleTheme: () => {
        const { resolvedTheme } = get();
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        get().applyTheme(newTheme);
      },
      
      applyTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme: resolved });
        
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          if (resolved === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          
          // Update meta theme-color
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
          }
        }
      },
      
      initTheme: () => {
        const { theme } = get();
        get().applyTheme(theme);
        
        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e) => {
            if (get().theme === 'system') {
              get().applyTheme('system');
            }
          };
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.initTheme(), 0);
        }
      },
    }
  )
);
