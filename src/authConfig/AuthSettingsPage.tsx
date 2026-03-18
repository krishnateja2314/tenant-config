import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import {
  useAuthConfigStore,
  useIsDirty,
  useIsReadOnly,
} from "../store/authConfig.store";
import {
  Toggle,
  Button,
  Badge,
  Alert,
  Spinner,
  Card,
  SaveStatusAlert,
} from "../components/ui";
import { useEffect } from "react";
import { useSaveConfig } from "./useSaveConfig";

const PAGE: "auth-settings" = "auth-settings";

export function AuthSettingsPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";
  const isReadOnly = useIsReadOnly();
  const isDirty = useIsDirty(PAGE);

  const { setConfig, patchConfig, resetAllDirty, config } = useAuthConfigStore(
    (s) => ({
      setConfig: s.setConfig,
      patchConfig: s.patchConfig,
      resetAllDirty: s.resetAllDirty,
      config: s.config,
    }),
  );

  const { save, isPending, saveStatus } = useSaveConfig();

  const {
    isLoading,
    isError,
    error,
    data: fetchedConfig,
  } = useQuery({
    queryKey: ["auth-config", tenantId],
    queryFn: () => getAuthConfig(tenantId),
    enabled: !!tenantId,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (fetchedConfig && !config) setConfig(fetchedConfig);
  }, [fetchedConfig, config, setConfig]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  if (isError)
    return (
      <div className="p-8">
        <Alert
          type="error"
          message={(error as Error)?.message ?? "Failed to load configuration."}
        />
      </div>
    );
  if (!config)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  const authMethods = [
    {
      key: "passwordEnabled" as const,
      label: "Password Authentication",
      description:
        "Allow users to sign in with email and password. Recommended to keep enabled.",
      badge: config.passwordEnabled ? "success" : "warning",
      badgeText: config.passwordEnabled ? "Active" : "Disabled",
    },
    {
      key: "ssoEnabled" as const,
      label: "Single Sign-On (SSO)",
      description:
        "Enable SAML or OAuth-based SSO for enterprise identity providers.",
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
      description:
        "Require a second factor for all admin sign-ins. Highly recommended.",
      badge: config.mfaEnabled ? "success" : "error",
      badgeText: config.mfaEnabled ? "Enforced" : "Not Enforced",
    },
  ] as const;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Authentication Settings
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure login mechanisms for tenant{" "}
            <span className="text-accent font-medium">{tenantId}</span>
          </p>
        </motion.div>
        <AnimatePresence>
          {isDirty && !isReadOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-amber-400 font-medium">
                Unsaved changes
              </span>
              <Button onClick={save} loading={isPending} variant="primary">
                Save Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {saveStatus && (
          <div className="mb-6">
            <SaveStatusAlert status={saveStatus} />
          </div>
        )}
        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <span className="text-amber-400 text-xs font-semibold">
              View only —
            </span>
            <span className="text-amber-400/80 text-xs">
              Your role does not have permission to modify authentication
              settings.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card
          title="Authentication Methods"
          subtitle="Enable or disable sign-in mechanisms for your tenant"
        >
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
                      <span className="text-sm font-semibold text-text-primary">
                        {method.label}
                      </span>
                      <Badge variant={method.badge as any}>
                        {method.badgeText}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                  <Toggle
                    checked={config[method.key]}
                    onChange={(v) => patchConfig({ [method.key]: v }, PAGE)}
                    disabled={isReadOnly}
                  />
                </div>
                {i < authMethods.length - 1 && (
                  <div className="h-px bg-border mt-6" />
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <Card
          title="Security Summary"
          subtitle="Overview of your current security posture"
        >
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "MFA Status",
                value: config.mfaEnabled ? "Enforced" : "Not Enforced",
                ok: config.mfaEnabled,
              },
              {
                label: "Password Login",
                value: config.passwordEnabled ? "Enabled" : "Disabled",
                ok: config.passwordEnabled,
              },
              {
                label: "Max Login Attempts",
                value: `${config.maxLoginAttempts} attempts`,
                ok: true,
              },
              {
                label: "Session Timeout",
                value: `${config.sessionTimeoutMinutes} minutes`,
                ok: true,
              },
              {
                label: "Lockout Duration",
                value: `${config.lockoutDurationMinutes} min`,
                ok: true,
              },
              {
                label: "SSO",
                value: config.ssoEnabled ? "Active" : "Off",
                ok: null,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1 p-3 bg-surface-2 rounded-lg border border-border"
              >
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                  {item.label}
                </span>
                <span
                  className={`text-sm font-bold ${item.ok === true ? "text-emerald-400" : item.ok === false ? "text-red-400" : "text-text-primary"}`}
                >
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
