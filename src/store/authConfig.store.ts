import { create } from "zustand";
import type { AuthConfigPayload } from "../api/authConfig.api";

interface AuthConfigState {
  config: AuthConfigPayload | null;
  isDirty: boolean; // unsaved changes

  setConfig: (config: AuthConfigPayload) => void;
  patchConfig: (patch: Partial<AuthConfigPayload>) => void;
  resetDirty: () => void;
  clearConfig: () => void;
}

/**
 * Auth Config store — NOT persisted (fresh fetch every session).
 * Tracks the loaded configuration and whether there are unsaved local changes.
 */
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
