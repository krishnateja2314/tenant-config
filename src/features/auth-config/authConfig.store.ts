import { create } from "zustand";
import type { AuthConfigPayload } from "./services/authConfigApi";

// Keys must match the path segments used in NAV_ITEMS in Sidebar.tsx
export type PageKey =
  | "auth-settings"
  | "password-policy"
  | "sso-otp"
  | "session";

interface AuthConfigState {
  config: AuthConfigPayload | null;
  dirtyPages: Set<PageKey>;

  setConfig: (config: AuthConfigPayload) => void;
  patchConfig: (patch: Partial<AuthConfigPayload>, page: PageKey) => void;
  resetDirtyPage: (page: PageKey) => void;
  resetAllDirty: () => void;
  clearConfig: () => void;
}

export const useAuthConfigStore = create<AuthConfigState>()((set) => ({
  config: null,
  dirtyPages: new Set(),

  setConfig: (config) => set({ config, dirtyPages: new Set() }),

  patchConfig: (patch, page) =>
    set((state) => {
      const next = new Set(state.dirtyPages);
      next.add(page);
      return {
        config: state.config ? { ...state.config, ...patch } : null,
        dirtyPages: next,
      };
    }),

  resetDirtyPage: (page) =>
    set((state) => {
      const next = new Set(state.dirtyPages);
      next.delete(page);
      return { dirtyPages: next };
    }),

  resetAllDirty: () => set({ dirtyPages: new Set() }),

  clearConfig: () => set({ config: null, dirtyPages: new Set() }),
}));

// ── Convenience selectors ─────────────────────────────────────────────────────
export function useIsDirty(page: PageKey): boolean {
  return useAuthConfigStore((s) => s.dirtyPages.has(page));
}

export function useAnyDirty(): boolean {
  return useAuthConfigStore((s) => s.dirtyPages.size > 0);
}

// ── Role helper ───────────────────────────────────────────────────────────────
import { useAuthStore } from "../../stores/auth.store";

export function useIsReadOnly(): boolean {
  const role = useAuthStore((s) => s.admin?.role);
  return role !== "TENANT_ADMIN";
}
