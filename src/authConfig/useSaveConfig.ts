import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validateAuthConfig, updateAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore } from "../store/authConfig.store";
import { useState } from "react";

export interface SaveStatus {
  type: "success" | "error" | "validation";
  text: string;
  errors?: string[]; // validation error list from backend
}

/**
 * Shared save hook used by all config pages.
 *
 * Flow:
 *   1. POST /api/auth-config/validate  — backend checks cross-field rules
 *   2. If valid → PUT /api/auth-config/:tenantId  — persist the config
 *   3. On success → resetAllDirty + invalidate query cache
 *
 * Returns { save, isPending, saveStatus, clearStatus } so each page
 * just calls save() on button click and renders saveStatus.
 */
export function useSaveConfig() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";

  const { config, resetAllDirty } = useAuthConfigStore((s) => ({
    config: s.config,
    resetAllDirty: s.resetAllDirty,
  }));

  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!config) throw new Error("No config loaded.");

      // ── Step 1: Validate ───────────────────────────────────────────────────
      const validation = await validateAuthConfig(config);

      if (!validation.success || !validation.data?.valid) {
        // Throw a structured error so onError can handle it
        const err = new ValidationError(
          validation.data?.errors ?? ["Configuration is invalid."]
        );
        throw err;
      }

      // ── Step 2: Save ───────────────────────────────────────────────────────
      return updateAuthConfig(tenantId, config);
    },

    onSuccess: (res) => {
      if (res.success) {
        setSaveStatus({ type: "success", text: "All changes saved successfully." });
        resetAllDirty();
        queryClient.invalidateQueries({ queryKey: ["auth-config", tenantId] });
      } else {
        setSaveStatus({ type: "error", text: res.message });
      }
      setTimeout(() => setSaveStatus(null), 4000);
    },

    onError: (err) => {
      if (err instanceof ValidationError) {
        setSaveStatus({
          type: "validation",
          text: "Configuration has validation errors. Please fix them before saving.",
          errors: err.errors,
        });
      } else {
        setSaveStatus({
          type: "error",
          text: (err as Error).message ?? "Save failed. Please try again.",
        });
      }
      setTimeout(() => setSaveStatus(null), 6000);
    },
  });

  return {
    save: () => mutation.mutate(),
    isPending: mutation.isPending,
    saveStatus,
    clearStatus: () => setSaveStatus(null),
  };
}

// ── Custom error class to carry validation errors through TanStack Query ──────
class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super("Validation failed");
    this.errors = errors;
  }
}