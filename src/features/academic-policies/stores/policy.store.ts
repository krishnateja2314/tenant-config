import { create } from "zustand";
import { AcademicPolicy, CreatePolicyDTO } from "../types/academicPolicy.types";
import { academicPolicyApi } from "../services/academicPolicyApi";

interface PolicyState {
  policies: AcademicPolicy[];
  selectedPolicy: AcademicPolicy | null;
  loading: boolean;
  error: string | null;
  isSaving: boolean;

  fetchPolicies: (tenantId: string) => Promise<void>;
  selectPolicy: (policy: AcademicPolicy | null) => void;
  createPolicy: (tenantId: string, policy: CreatePolicyDTO) => Promise<void>;
  updatePolicy: (
    tenantId: string,
    policy: CreatePolicyDTO & { _id: string },
  ) => Promise<void>;
  deletePolicy: (tenantId: string, policyId: string) => Promise<void>;
  clearError: () => void;
}

export const usePolicyStore = create<PolicyState>((set) => ({
  policies: [],
  selectedPolicy: null,
  loading: false,
  error: null,
  isSaving: false,

  fetchPolicies: async (tenantId: string) => {
    set({ loading: true, error: null });
    try {
      const policies = await academicPolicyApi.getPolicies(tenantId);
      set({ policies, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch policies";
      set({ error: message, loading: false });
    }
  },

  selectPolicy: (policy) => {
    set({ selectedPolicy: policy });
  },

  createPolicy: async (tenantId: string, policy: CreatePolicyDTO) => {
    set({ isSaving: true, error: null });
    try {
      const newPolicy = await academicPolicyApi.createPolicy(tenantId, policy);
      set((state) => ({
        policies: [...state.policies, newPolicy],
        isSaving: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create policy";
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  updatePolicy: async (
    tenantId: string,
    policy: CreatePolicyDTO & { _id: string },
  ) => {
    set({ isSaving: true, error: null });
    try {
      const updatedPolicy = await academicPolicyApi.updatePolicy(
        tenantId,
        policy,
      );
      set((state) => ({
        policies: state.policies.map((p) =>
          p._id === policy._id ? updatedPolicy : p,
        ),
        selectedPolicy:
          state.selectedPolicy?._id === policy._id
            ? updatedPolicy
            : state.selectedPolicy,
        isSaving: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update policy";
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  deletePolicy: async (tenantId: string, policyId: string) => {
    set({ isSaving: true, error: null });
    try {
      await academicPolicyApi.deletePolicy(tenantId, policyId);
      set((state) => ({
        policies: state.policies.filter((p) => p._id !== policyId),
        selectedPolicy:
          state.selectedPolicy?._id === policyId ? null : state.selectedPolicy,
        isSaving: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete policy";
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
