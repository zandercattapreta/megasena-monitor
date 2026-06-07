import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

export type Theme = 'light' | 'dark' | 'system';

export const SettingsService = {
  getTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) || 'system';
  },

  setTheme(theme: Theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  applyTheme(theme: Theme) {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const update = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    const isDarkInitial = 
      theme === 'dark' || 
      (theme === 'system' && mediaQuery.matches);
    
    update(isDarkInitial);

    // Remover listener anterior se houver (para evitar duplicatas)
    // @ts-ignore
    if (window._themeListener) {
      // @ts-ignore
      mediaQuery.removeEventListener('change', window._themeListener);
    }

    if (theme === 'system') {
      const listener = (e: MediaQueryListEvent) => update(e.matches);
      mediaQuery.addEventListener('change', listener);
      // @ts-ignore
      window._themeListener = listener;
    }
  },

  async isAutostartEnabled(): Promise<boolean> {
    try {
      return await isEnabled();
    } catch (e) {
      console.error('Autostart check failed:', e);
      return false;
    }
  },

  async setAutostart(enabled: boolean) {
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    } catch (e) {
      console.error('Failed to update autostart:', e);
    }
  }
};
