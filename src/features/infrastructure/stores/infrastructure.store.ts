import { create } from "zustand";
import { Infrastructure } from "../types";
import { infrastructureService } from "../services/infrastructure.service";

interface InfrastructureStore {
  infrastructures: Infrastructure[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchInfrastructureByTenant: (tenantId: string) => Promise<void>;
  updateInfrastructure: (
    domainId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
  clearError: () => void;
}

export const useInfrastructureStore = create<InfrastructureStore>((set) => ({
  infrastructures: [],
  loading: false,
  error: null,

  fetchInfrastructureByTenant: async (tenantId: string) => {
    set({ loading: true, error: null });
    try {
      const infrastructures = await infrastructureService.getInfrastructureByTenant(tenantId);
      set({ infrastructures, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      });
    }
  },

  updateInfrastructure: async (domainId: string, updates: Record<string, unknown>) => {
    set({ loading: true, error: null });
    try {
      const updated = await infrastructureService.updateInfrastructure(domainId, updates);
      set((state) => ({
        infrastructures: state.infrastructures.map((infra) =>
          infra.domainId === updated.domainId ? updated : infra
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
