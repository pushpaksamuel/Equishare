import { create } from 'zustand';
import { db } from '../db';

type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    db.settings.put({ id: 'theme', value: theme });
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      db.settings.put({ id: 'theme', value: newTheme });
      return { theme: newTheme };
    });
  },
}));
