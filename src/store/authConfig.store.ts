import { create } from "zustand";
import type { AuthConfigPayload } from "../api/authConfig.api";

interface AuthConfigState {
  config: AuthConfigPayload | null;
  isDirty: boolean;

  setConfig: (config: AuthConfigPayload) => void;
  patchConfig: (patch: Partial<AuthConfigPayload>) => void;
  resetDirty: () => void;
  clearConfig: () => void;
}

export const useAuthConfigStore = create<AuthConfigState>()((set) => ({
  config: null,
  isDirty: false,

  setConfig: (config) => set({ config, isDirty: false }),

  patchConfig: (patch) =>
    set((state) => ({
      config: state.config ? { ...state.config, ...patch } : null,
      isDirty: true,
    })),

  resetDirty: () => set({ isDirty: false }),

  clearConfig: () => set({ config: null, isDirty: false }),
}));

// ── Role helper ───────────────────────────────────────────────────────────────
// Import this wherever you need to gate editing.
// TENANT_ADMIN: full read + write
// DOMAIN_ADMIN: read only — can view config but not save changes
import { useAuthStore } from "./auth.store";

export function useIsReadOnly(): boolean {
  const role = useAuthStore((s) => s.admin?.role);
  return role !== "TENANT_ADMIN";
}
