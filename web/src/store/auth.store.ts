import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string | null;
  role: 'WARD' | 'GUARDIAN' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('alivo_token'),
  isAuthenticated: !!localStorage.getItem('alivo_token'),

  setAuth: (user, token) => {
    localStorage.setItem('alivo_token', token);
    localStorage.setItem('alivo_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('alivo_token');
    localStorage.removeItem('alivo_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('alivo_token');
    const raw = localStorage.getItem('alivo_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw);
        set({ user, token, isAuthenticated: true });
      } catch {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
