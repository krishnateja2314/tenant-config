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
  sessionVerified: boolean;


  mfaPending: boolean;
  mfaSessionToken: string | null;
  pendingEmail: string | null;


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
          sessionVerified: true,
          mfaPending: false,
          mfaSessionToken: null,
          pendingEmail: null,
        }),
    }),
    {
      name: "tc-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
