import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthConfig, updateAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore } from "../store/authConfig.store";
import { Toggle, Button, Alert, Card, Spinner, Badge } from "../components/ui";
import { useState, useEffect } from "react";

const AVAILABLE_ROLES = ["TENANT_ADMIN", "DOMAIN_ADMIN", "FACULTY", "STUDENT", "STAFF"];

export function SSOOTPPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";

  const { config, setConfig, patchConfig, resetDirty, isDirty } = useAuthConfigStore((s) => ({
    config: s.config,
    setConfig: s.setConfig,
    patchConfig: s.patchConfig,
    resetDirty: s.resetDirty,
    isDirty: s.isDirty,
  }));

  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const queryClient = useQueryClient();

  const { isLoading, data: fetchedConfig } = useQuery({
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
      setSaveStatus({ type: res.success ? "success" : "error", text: res.message });
      if (res.success) {
        resetDirty();
        queryClient.invalidateQueries({ queryKey: ["auth-config", tenantId] });
      }
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus({ type: "error", text: "Save failed." });
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  const toggleRole = (role: string) => {
    if (!config) return;
    const current = config.allowedRoles ?? [];
    const updated = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    patchConfig({ allowedRoles: updated });
  };

  if (isLoading || !config) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">SSO & OTP</h1>
          <p className="text-sm text-text-muted mt-1">Configure federated sign-on and one-time passwords</p>
        </motion.div>
        <AnimatePresence>
          {isDirty && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
              <span className="text-xs text-amber-400 font-medium">Unsaved changes</span>
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {saveStatus && <div className="mb-6"><Alert type={saveStatus.type} message={saveStatus.text} /></div>}
      </AnimatePresence>

      <div className="space-y-6">
        {/* SSO */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card title="Single Sign-On (SSO)" subtitle="Allow users to authenticate via your institution's identity provider">
            <div className="space-y-6">
              <Toggle
                checked={config.ssoEnabled}
                onChange={(v) => patchConfig({ ssoEnabled: v })}
                label="Enable SSO"
                description="Enable SAML 2.0 / OAuth 2.0 federation. When active, users can sign in through your IdP."
              />

              <AnimatePresence>
                {config.ssoEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-semibold text-text-primary mb-3">Roles allowed to use SSO</p>
                      <p className="text-xs text-text-muted mb-4">Only selected roles will be directed to the SSO flow. Others will use password login.</p>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_ROLES.map((role) => {
                          const selected = config.allowedRoles?.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                                selected
                                  ? "bg-accent/10 border-accent/40 text-accent"
                                  : "bg-surface-2 border-border text-text-muted hover:border-accent/30 hover:text-text-primary"
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                      {config.allowedRoles?.length === 0 && (
                        <p className="text-xs text-amber-400 mt-3">Select at least one role to enable SSO for users.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* OTP */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card title="OTP Authentication" subtitle="Email-based one-time password as a standalone factor">
            <div className="space-y-4">
              <Toggle
                checked={config.otpEnabled}
                onChange={(v) => patchConfig({ otpEnabled: v })}
                label="Enable OTP Login"
                description="Users receive a time-limited OTP via email. Can be used standalone or as part of MFA."
              />
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge variant={config.mfaEnabled ? "success" : "warning"}>
                    MFA {config.mfaEnabled ? "Enforced" : "Off"}
                  </Badge>
                  <p className="text-xs text-text-muted">
                    {config.mfaEnabled
                      ? "OTP is also being used as the MFA second factor."
                      : "Enable MFA on the Auth Settings page to use OTP as a second factor."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-accent mb-1">Integration Note</p>
            <p className="text-xs text-text-muted leading-relaxed">
              The Authentication Team will consume these settings via{" "}
              <code className="text-accent font-mono text-[11px]">GET /api/auth-config/:tenantId</code>{" "}
              to enforce the appropriate login flow dynamically for each tenant.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
