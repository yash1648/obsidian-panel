import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  login: (user, token, refreshToken) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, token, refreshToken, isAuthenticated: true });
  },

  setToken: (token) => {
    localStorage.setItem('access_token', token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
