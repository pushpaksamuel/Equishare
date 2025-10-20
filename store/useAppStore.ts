import { create } from 'zustand';
import { db } from '../db';

type Theme = 'light' | 'dark';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
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
  isLoggedIn: sessionStorage.getItem('isLoggedIn') === 'true',
  login: () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    set({ isLoggedIn: true });
  },
  logout: () => {
    sessionStorage.removeItem('isLoggedIn');
    set({ isLoggedIn: false });
  },
  displayCurrency: 'USD', // Default fallback
  setDisplayCurrency: (currency) => {
    set({ displayCurrency: currency });
    // Also update the setting in the database for persistence
    db.settings.put({ id: 'currency', value: currency });
  },
}));