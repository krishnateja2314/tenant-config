import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthConfig, updateAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore, useIsReadOnly } from "../store/authConfig.store";
import { Toggle, Input, Button, Alert, Card, Spinner } from "../components/ui";
import { useState, useEffect } from "react";

export function PasswordPolicyPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";
  const isReadOnly = useIsReadOnly();

  const { config, setConfig, patchConfig, resetDirty, isDirty } =
    useAuthConfigStore((s) => ({
      config: s.config,
      setConfig: s.setConfig,
      patchConfig: s.patchConfig,
      resetDirty: s.resetDirty,
      isDirty: s.isDirty,
    }));

  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      if (res.success) {
        setSaveStatus({ type: "success", text: "Password policy saved." });
        resetDirty();
        queryClient.invalidateQueries({ queryKey: ["auth-config", tenantId] });
      } else {
        setSaveStatus({ type: "error", text: res.message });
      }
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus({ type: "error", text: "Save failed. Please try again." });
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  const handleNumericField = (
    key:
      | "minLength"
      | "expiryDays"
      | "sessionTimeoutMinutes"
      | "maxLoginAttempts"
      | "lockoutDurationMinutes",
    value: string,
    min: number,
    max: number,
  ) => {
    if (isReadOnly) return;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      setFieldErrors((e) => ({ ...e, [key]: "Must be a number." }));
      return;
    }
    if (parsed < min || parsed > max) {
      setFieldErrors((e) => ({
        ...e,
        [key]: `Must be between ${min} and ${max}.`,
      }));
      return;
    }
    setFieldErrors((e) => ({ ...e, [key]: "" }));
    if (
      key === "sessionTimeoutMinutes" ||
      key === "maxLoginAttempts" ||
      key === "lockoutDurationMinutes"
    ) {
      patchConfig({ [key]: parsed });
    } else {
      patchConfig({
        passwordPolicy: { ...config!.passwordPolicy, [key]: parsed },
      });
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const { passwordPolicy } = config;

  const passwordToggles = [
    {
      key: "requireUppercase" as const,
      label: "Require Uppercase Letter",
      description: "At least one uppercase letter (A–Z)",
    },
    {
      key: "requireNumbers" as const,
      label: "Require Number",
      description: "At least one numeric digit (0–9)",
    },
    {
      key: "requireSpecialChars" as const,
      label: "Require Special Character",
      description: "At least one special character (!@#$%…)",
    },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Password Policy
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Define strength and expiry rules for tenant passwords
          </p>
        </motion.div>

        <AnimatePresence>
          {isDirty && !isReadOnly && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-amber-400 font-medium">
                Unsaved changes
              </span>
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
              >
                Save Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {saveStatus && (
          <div className="mb-6">
            <Alert type={saveStatus.type} message={saveStatus.text} />
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
              Your role does not have permission to modify these settings.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Complexity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card
            title="Complexity Requirements"
            subtitle="Minimum requirements for user passwords"
          >
            <div className="space-y-4 mb-6">
              <Input
                label="Minimum Length"
                type="number"
                value={passwordPolicy.minLength}
                onChange={(e) =>
                  handleNumericField("minLength", e.target.value, 4, 64)
                }
                error={fieldErrors.minLength}
                hint="Recommended: 8 or more characters"
                min={4}
                max={64}
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-4">
              {passwordToggles.map((toggle) => (
                <Toggle
                  key={toggle.key}
                  checked={passwordPolicy[toggle.key]}
                  onChange={(v) =>
                    patchConfig({
                      passwordPolicy: { ...passwordPolicy, [toggle.key]: v },
                    })
                  }
                  label={toggle.label}
                  description={toggle.description}
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Expiry */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title="Password Expiry"
            subtitle="Force periodic password resets"
          >
            <Input
              label="Expiry (days)"
              type="number"
              value={passwordPolicy.expiryDays}
              onChange={(e) =>
                handleNumericField("expiryDays", e.target.value, 0, 365)
              }
              error={fieldErrors.expiryDays}
              hint="Set to 0 to disable expiry"
              min={0}
              max={365}
              disabled={isReadOnly}
            />
          </Card>
        </motion.div>

        {/* Session & Lockout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card
            title="Session & Lockout Rules"
            subtitle="Control session lifetime and brute-force protection"
          >
            <div className="space-y-4">
              <Input
                label="Session Timeout (minutes)"
                type="number"
                value={config.sessionTimeoutMinutes}
                onChange={(e) =>
                  handleNumericField(
                    "sessionTimeoutMinutes",
                    e.target.value,
                    5,
                    1440,
                  )
                }
                error={fieldErrors.sessionTimeoutMinutes}
                hint="Admin sessions expire after this duration of inactivity"
                min={5}
                max={1440}
                disabled={isReadOnly}
              />
              <Input
                label="Max Login Attempts"
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) =>
                  handleNumericField("maxLoginAttempts", e.target.value, 1, 20)
                }
                error={fieldErrors.maxLoginAttempts}
                hint="Account is locked after this many consecutive failures"
                min={1}
                max={20}
                disabled={isReadOnly}
              />
              <Input
                label="Lockout Duration (minutes)"
                type="number"
                value={config.lockoutDurationMinutes}
                onChange={(e) =>
                  handleNumericField(
                    "lockoutDurationMinutes",
                    e.target.value,
                    1,
                    1440,
                  )
                }
                error={fieldErrors.lockoutDurationMinutes}
                hint="How long the account stays locked after max attempts reached"
                min={1}
                max={1440}
                disabled={isReadOnly}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
