import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getAuthConfig } from "../features/auth-config/services/authConfigApi";
import { useAuthStore } from "../stores/auth.store";
import {
  useAuthConfigStore,
  useIsDirty,
  useIsReadOnly,
} from "../features/auth-config/authConfig.store";
import {
  Toggle,
  Button,
  Alert,
  Card,
  Spinner,
  SaveStatusAlert,
} from "../shared/components";
import { useState, useEffect } from "react";
import { useSaveConfig } from "../features/auth-config/hooks/useSaveConfig";

const PAGE: "password-policy" = "password-policy";

function NumericInput({
  label,
  value,
  min,
  max,
  hint,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setRaw(String(value));
    setError(undefined);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const str = e.target.value;
    setRaw(str);
    if (str === "" || str === "-") {
      setError("Must be a number.");
      return;
    }
    const parsed = parseInt(str, 10);
    if (isNaN(parsed)) {
      setError("Must be a number.");
      return;
    }
    if (parsed < min || parsed > max) {
      setError(`Must be between ${min} and ${max}.`);
      return;
    }
    setError(undefined);
    onChange(parsed);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        {label}
      </label>
      <input
        type="number"
        value={raw}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handleChange}
        className={`w-full bg-surface-2 border rounded-lg px-4 py-3 text-sm text-text-primary
          outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/50 focus:border-accent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:ring-red-500/30" : "border-border"}`}
      />
      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        ) : (
          hint && <p className="text-xs text-text-muted">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PasswordPolicyPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";
  const isReadOnly = useIsReadOnly();
  const isDirty = useIsDirty(PAGE);

  const { config, setConfig, patchConfig } = useAuthConfigStore((s) => ({
    config: s.config,
    setConfig: s.setConfig,
    patchConfig: s.patchConfig,
  }));

  const { save, isPending, saveStatus } = useSaveConfig();

  const { isLoading, data: fetchedConfig } = useQuery({
    queryKey: ["auth-config", tenantId],
    queryFn: () => getAuthConfig(tenantId),
    enabled: !!tenantId,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (fetchedConfig && !config) setConfig(fetchedConfig);
  }, [fetchedConfig, config, setConfig]);

  if (isLoading || !config)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

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
              <Button onClick={save} loading={isPending}>
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
              Your role does not have permission to modify these settings.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
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
              <NumericInput
                label="Minimum Length"
                value={passwordPolicy.minLength}
                min={4}
                max={64}
                hint="Recommended: 8 or more characters"
                disabled={isReadOnly}
                onChange={(v) =>
                  patchConfig(
                    { passwordPolicy: { ...passwordPolicy, minLength: v } },
                    PAGE,
                  )
                }
              />
            </div>
            <div className="space-y-4">
              {passwordToggles.map((toggle) => (
                <Toggle
                  key={toggle.key}
                  checked={passwordPolicy[toggle.key]}
                  onChange={(v) =>
                    patchConfig(
                      {
                        passwordPolicy: { ...passwordPolicy, [toggle.key]: v },
                      },
                      PAGE,
                    )
                  }
                  label={toggle.label}
                  description={toggle.description}
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title="Password Expiry"
            subtitle="Force periodic password resets"
          >
            <NumericInput
              label="Expiry (days)"
              value={passwordPolicy.expiryDays}
              min={0}
              max={365}
              hint="Set to 0 to disable expiry"
              disabled={isReadOnly}
              onChange={(v) =>
                patchConfig(
                  { passwordPolicy: { ...passwordPolicy, expiryDays: v } },
                  PAGE,
                )
              }
            />
          </Card>
        </motion.div>

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
              <NumericInput
                label="Session Timeout (minutes)"
                value={config.sessionTimeoutMinutes}
                min={5}
                max={1440}
                hint="Admin sessions expire after this duration of inactivity"
                disabled={isReadOnly}
                onChange={(v) =>
                  patchConfig({ sessionTimeoutMinutes: v }, PAGE)
                }
              />
              <NumericInput
                label="Max Login Attempts"
                value={config.maxLoginAttempts}
                min={1}
                max={20}
                hint="Account is locked after this many consecutive failures"
                disabled={isReadOnly}
                onChange={(v) => patchConfig({ maxLoginAttempts: v }, PAGE)}
              />
              <NumericInput
                label="Lockout Duration (minutes)"
                value={config.lockoutDurationMinutes}
                min={1}
                max={1440}
                hint="How long the account stays locked after max attempts reached"
                disabled={isReadOnly}
                onChange={(v) =>
                  patchConfig({ lockoutDurationMinutes: v }, PAGE)
                }
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
