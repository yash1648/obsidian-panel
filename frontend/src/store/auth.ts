import { create } from 'zustand';
import { authApi } from '../api/auth';

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
  refreshAccessToken: () => Promise<boolean>;
  isRefreshing: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isRefreshing: false,

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
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      authApi.logout(rt).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isRefreshing: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (token) {
      // Decode basic user info from JWT payload (without verification — trust the backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.sub,
          username: payload.username || 'User',
          role: payload.role || 'VIEWER',
        };
        set({ user, token, refreshToken, isAuthenticated: true });
      } catch {
        // Token is malformed, treat as not authenticated
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  },

  refreshAccessToken: async () => {
    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    const state = get();
    if (!state.refreshToken) {
      state.logout();
      return false;
    }

    set({ isRefreshing: true });

    refreshPromise = authApi.refresh(state.refreshToken)
      .then((res) => {
        get().setToken(res.accessToken);
        set({ isRefreshing: false });
        refreshPromise = null;
        return true;
      })
      .catch(() => {
        get().logout();
        set({ isRefreshing: false });
        refreshPromise = null;
        return false;
      });

    return refreshPromise;
  },
}));
