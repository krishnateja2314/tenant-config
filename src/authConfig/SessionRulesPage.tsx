import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthConfig, updateAuthConfig } from "../api/authConfig.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore, useIsReadOnly } from "../store/authConfig.store";
import { Button, Alert, Card, Spinner } from "../components/ui";
import { useState, useEffect } from "react";
import { Slider } from "@mui/material";

function SliderField({
  label,
  description,
  value,
  min,
  max,
  unit,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const safeValue = Number.isFinite(value) ? value : min;

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (!disabled) onChange(newValue as number);
  };

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <span className="text-sm font-bold text-accent tabular-nums">
          {safeValue}{" "}
          <span className="text-xs font-normal text-text-muted">{unit}</span>
        </span>
      </div>
      <p className="text-xs text-text-muted">{description}</p>

      <div className="pt-2 px-1">
        <Slider
          value={safeValue}
          min={min}
          max={max}
          onChange={handleSliderChange}
          disabled={disabled}
          sx={{
            color: "#4f6ef7",
            padding: "13px 0",
            "& .MuiSlider-thumb": {
              width: 16,
              height: 16,
              backgroundColor: "#4f6ef7",
              border: "2px solid #ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                boxShadow: "0 0 0 8px rgba(0,0,0,0.08)",
              },
            },
            "& .MuiSlider-track": {
              height: 6,
              borderRadius: 3,
            },
            "& .MuiSlider-rail": {
              height: 6,
              borderRadius: 3,
              backgroundColor: "#1f2330",
              opacity: 1,
            },
            "&.Mui-disabled": {
              color: "#636880",
              "& .MuiSlider-thumb": {
                backgroundColor: "#636880",
              },
            },
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-text-muted/50 -mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function SessionRulesPage() {
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
      setSaveStatus({
        type: res.success ? "success" : "error",
        text: res.message,
      });
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

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Session Rules
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Control admin session lifetime and account lockout behaviour
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card
            title="Session Lifetime"
            subtitle="How long admin sessions remain active without interaction"
          >
            <SliderField
              label="Session Timeout"
              description="Admin is signed out automatically after this period of inactivity."
              value={config.sessionTimeoutMinutes}
              min={5}
              max={1440}
              unit="min"
              disabled={isReadOnly}
              onChange={(v) => patchConfig({ sessionTimeoutMinutes: v })}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title="Brute-Force Protection"
            subtitle="Limit login attempts and enforce lockouts"
          >
            <div className="space-y-8">
              <SliderField
                label="Max Login Attempts"
                description="Account is temporarily locked after this many consecutive failed logins."
                value={config.maxLoginAttempts}
                min={1}
                max={20}
                unit="attempts"
                disabled={isReadOnly}
                onChange={(v) => patchConfig({ maxLoginAttempts: v })}
              />
              <SliderField
                label="Lockout Duration"
                description="How long the account stays locked before the admin can retry."
                value={config.lockoutDurationMinutes}
                min={1}
                max={1440}
                unit="min"
                disabled={isReadOnly}
                onChange={(v) => patchConfig({ lockoutDurationMinutes: v })}
              />
            </div>
          </Card>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card
            title="Policy Preview"
            subtitle="Summary of the current session rules"
          >
            <div className="text-xs text-text-muted leading-loose font-mono bg-surface-2 rounded-lg p-4 border border-border">
              <p>
                sessionTimeoutMinutes:{" "}
                <span className="text-accent">
                  {config.sessionTimeoutMinutes}
                </span>
              </p>
              <p>
                maxLoginAttempts:{" "}
                <span className="text-accent">{config.maxLoginAttempts}</span>
              </p>
              <p>
                lockoutDurationMinutes:{" "}
                <span className="text-accent">
                  {config.lockoutDurationMinutes}
                </span>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
