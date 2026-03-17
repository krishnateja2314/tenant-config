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
  sessionVerified: boolean; // true once the boot-time /me check has completed

  // Mid-login state (between password step and MFA step)
  mfaPending: boolean;
  mfaSessionToken: string | null;
  pendingEmail: string | null;

  // Actions
  setMFAPending: (sessionToken: string, email: string) => void;
  setAdmin: (admin: Admin) => void;
  setSessionVerified: (verified: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      sessionVerified: false,
      mfaPending: false,
      mfaSessionToken: null,
      pendingEmail: null,

      setMFAPending: (sessionToken, email) =>
        set({
          mfaPending: true,
          mfaSessionToken: sessionToken,
          pendingEmail: email,
        }),

      setAdmin: (admin) =>
        set({
          admin,
          isAuthenticated: true,
          sessionVerified: true,
          mfaPending: false,
          mfaSessionToken: null,
          pendingEmail: null,
        }),

      setSessionVerified: (verified) => set({ sessionVerified: verified }),

      clearAuth: () =>
        set({
          admin: null,
          isAuthenticated: false,
          sessionVerified: true, // verified = true even on clear (check done, result: invalid)
          mfaPending: false,
          mfaSessionToken: null,
          pendingEmail: null,
        }),
    }),
    {
      name: "tc-auth",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist admin profile and auth flag — never tokens
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
