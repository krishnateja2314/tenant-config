import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthConfig, updateAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore } from "../store/authConfig.store";
import { Toggle, Button, Badge, Alert, Spinner, Card } from "../components/ui";
import { useEffect, useState } from "react";

export function AuthSettingsPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";

  const { setConfig, patchConfig, resetDirty, config, isDirty } = useAuthConfigStore((s) => ({
    setConfig: s.setConfig,
    patchConfig: s.patchConfig,
    resetDirty: s.resetDirty,
    config: s.config,
    isDirty: s.isDirty,
  }));

  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const queryClient = useQueryClient();

  const { isLoading, isError, error, data: fetchedConfig } = useQuery({
    queryKey: ["auth-config", tenantId],
    queryFn: () => getAuthConfig(tenantId),
    enabled: !!tenantId,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (fetchedConfig) setConfig(fetchedConfig);
  }, [fetchedConfig, setConfig]);

  const saveMutation = useMutation({
    mutationFn: () => updateAuthConfig(tenantId, config!),
    onSuccess: (res) => {
      if (res.success) {
        setSaveStatus({ type: "success", text: "Configuration saved successfully." });
        resetDirty();
        queryClient.invalidateQueries({ queryKey: ["auth-config", tenantId] });
      } else {
        setSaveStatus({ type: "error", text: res.message });
      }
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus({ type: "error", text: "Failed to save. Please try again." });
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <Alert type="error" message={(error as Error)?.message ?? "Failed to load authentication configuration."} />
      </div>
    );
  }

  if (!config) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const authMethods = [
    {
      key: "passwordEnabled" as const,
      label: "Password Authentication",
      description: "Allow users to sign in with email and password. Recommended to keep enabled.",
      badge: config.passwordEnabled ? "success" : "warning",
      badgeText: config.passwordEnabled ? "Active" : "Disabled",
    },
    {
      key: "ssoEnabled" as const,
      label: "Single Sign-On (SSO)",
      description: "Enable SAML or OAuth-based SSO for enterprise identity providers.",
      badge: config.ssoEnabled ? "success" : "default",
      badgeText: config.ssoEnabled ? "Active" : "Off",
    },
    {
      key: "otpEnabled" as const,
      label: "OTP Authentication",
      description: "Send a one-time password via email as a login factor.",
      badge: config.otpEnabled ? "success" : "default",
      badgeText: config.otpEnabled ? "Active" : "Off",
    },
    {
      key: "mfaEnabled" as const,
      label: "Multi-Factor Authentication (MFA)",
      description: "Require a second factor for all admin sign-ins. Highly recommended.",
      badge: config.mfaEnabled ? "success" : "error",
      badgeText: config.mfaEnabled ? "Enforced" : "Not Enforced",
    },
  ] as const;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Authentication Settings</h1>
          <p className="text-sm text-text-muted mt-1">
            Configure login mechanisms for tenant{" "}
            <span className="text-accent font-medium">{tenantId}</span>
          </p>
        </motion.div>

        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-amber-400 font-medium">Unsaved changes</span>
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} variant="primary">
                Save Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {saveStatus && <div className="mb-6"><Alert type={saveStatus.type} message={saveStatus.text} /></div>}
      </AnimatePresence>

      {/* Auth Methods */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card title="Authentication Methods" subtitle="Enable or disable sign-in mechanisms for your tenant">
          <div className="space-y-6">
            {authMethods.map((method, i) => (
              <motion.div
                key={method.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{method.label}</span>
                      <Badge variant={method.badge as any}>{method.badgeText}</Badge>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{method.description}</p>
                  </div>
                  <Toggle
                    checked={config[method.key]}
                    onChange={(v) => patchConfig({ [method.key]: v })}
                  />
                </div>
                {i < authMethods.length - 1 && <div className="h-px bg-border mt-6" />}
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Security summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <Card title="Security Summary" subtitle="Overview of your current security posture">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "MFA Status", value: config.mfaEnabled ? "Enforced" : "Not Enforced", ok: config.mfaEnabled },
              { label: "Password Login", value: config.passwordEnabled ? "Enabled" : "Disabled", ok: config.passwordEnabled },
              { label: "Max Login Attempts", value: `${config.maxLoginAttempts} attempts`, ok: true },
              { label: "Session Timeout", value: `${config.sessionTimeoutMinutes} minutes`, ok: true },
              { label: "Lockout Duration", value: `${config.lockoutDurationMinutes} min`, ok: true },
              { label: "SSO", value: config.ssoEnabled ? "Active" : "Off", ok: null },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1 p-3 bg-surface-2 rounded-lg border border-border">
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{item.label}</span>
                <span className={`text-sm font-bold ${item.ok === true ? "text-emerald-400" : item.ok === false ? "text-red-400" : "text-text-primary"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
