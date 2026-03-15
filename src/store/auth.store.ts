import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Admin {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: string;
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  // Mid-login state (between password step and MFA step)
  mfaPending: boolean;
  mfaSessionToken: string | null;
  pendingEmail: string | null;

  // Actions
  setMFAPending: (sessionToken: string, email: string) => void;
  setAdmin: (admin: Admin) => void;
  clearAuth: () => void;
}

/**
 * Auth store — persisted to sessionStorage (clears on tab close).
 * Never store JWTs here; the HttpOnly cookie handles that.
 * We only persist non-sensitive UI state (admin profile, tenant info).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      mfaPending: false,
      mfaSessionToken: null,
      pendingEmail: null,

      setMFAPending: (sessionToken, email) =>
        set({ mfaPending: true, mfaSessionToken: sessionToken, pendingEmail: email }),

      setAdmin: (admin) =>
        set({
          admin,
          isAuthenticated: true,
          mfaPending: false,
          mfaSessionToken: null,
          pendingEmail: null,
        }),

      clearAuth: () =>
        set({
          admin: null,
          isAuthenticated: false,
          mfaPending: false,
          mfaSessionToken: null,
          pendingEmail: null,
        }),
    }),
    {
      name: "tc-auth", // sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // clears on tab close
      partialize: (state) => ({
        // Only persist what's needed across page refreshes in the same session
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
