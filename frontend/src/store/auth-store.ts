/**
 * Authentication Zustand store.
 *
 * Persists auth state to localStorage. On app load, if a stored token
 * exists the store re-hydrates and verifies the token with GET /auth/me.
 * The mock seed is removed — all authentication flows through the real API.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Set auth state after successful login. */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** Update the stored user object (e.g., after profile edit). */
  setUser: (user: User) => void;
  /** Update the access token only (e.g., after refresh). */
  setAccessToken: (token: string) => void;
  /** Clear all auth state and remove tokens from localStorage. */
  logout: () => void;
  /** Set loading state during auth operations. */
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      },

      setUser: (user) => set({ user }),

      setAccessToken: (token) => {
        localStorage.setItem("access_token", token);
        set({ accessToken: token });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "enterprise-ai-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
