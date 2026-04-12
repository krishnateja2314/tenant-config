import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";
import { useDomains } from "../features/domains/hooks/useDomains";
import { useDomainWorkspaceStore } from "../features/domains/stores/domain.store";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";
import { Card } from "../shared/components/Card";
import { Button } from "../shared/components/Button";
import { Toggle } from "../shared/components/Toggle";
import { Input } from "../shared/components/Input";
import { Spinner } from "../shared/components/Spinner";
import { Alert } from "../shared/components/Alert";
import {
  getAuthConfig,
  updateAuthConfig,
  cascadeDomainAuthConfig,
  validateAuthConfig,
  type AuthConfigPayload,
} from "../features/auth-config/services/authConfigApi";

type SaveMessage = { type: "success" | "error"; text: string } | null;

function DomainTreePicker({
  parentId,
  level,
  selectedNodeId,
  onSelect,
}: {
  parentId: string | null;
  level: number;
  selectedNodeId: string | null;
  onSelect: (domainId: string) => void;
}) {
  const localNodes = useDomainWorkspaceStore((s) => s.localNodes);
  const nodeIds = useMemo(() => new Set(localNodes.map((node) => node._id)), [localNodes]);

  const children = localNodes.filter((node) => {
    if (parentId !== null) {
      return node.parentDomainId === parentId;
    }

    return node.parentDomainId === null || !nodeIds.has(node.parentDomainId);
  });

  if (!children.length) {
    return null;
  }

  return (
    <div className="w-full">
      {children.map((child) => {
        const isSelected = selectedNodeId === child._id;
        return (
          <div key={child._id}>
            <button
              className={`w-full text-left mt-1 rounded-md border px-3 py-2 transition-colors ${
                isSelected
                  ? "bg-accent/10 border-accent/30 text-text-primary"
                  : "bg-surface border-border text-text-primary hover:bg-surface-2"
              }`}
              style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
              onClick={() => onSelect(child._id)}
            >
              <span className="text-sm font-medium">{child.domainName}</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 bg-surface-2 text-text-muted rounded border border-border">
                {child.metadata.domainType}
              </span>
            </button>
            <DomainTreePicker
              parentId={child._id}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
            />
          </div>
        );
      })}
    </div>
  );
}

export function DomainAuthConfigPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId ?? "";
  const isReadOnly = admin?.role !== "TENANT_ADMIN";

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AuthConfigPayload | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<SaveMessage>(null);

  const queryClient = useQueryClient();
  const { treeQuery } = useDomains();
  const initWorkspace = useDomainWorkspaceStore((s) => s.initWorkspace);
  const localNodes = useDomainWorkspaceStore((s) => s.localNodes);

  useEffect(() => {
    if (treeQuery.data) {
      initWorkspace(treeQuery.data);
    }
  }, [treeQuery.data, initWorkspace]);

  useEffect(() => {
    if (!selectedDomainId && localNodes.length > 0) {
      setSelectedDomainId(localNodes[0]._id);
    }
  }, [localNodes, selectedDomainId]);

  const selectedDomain = useMemo(
    () => localNodes.find((node) => node._id === selectedDomainId) || null,
    [localNodes, selectedDomainId],
  );

  const configQuery = useQuery({
    queryKey: ["auth-config", tenantId, "domain", selectedDomainId],
    queryFn: () => getAuthConfig(tenantId, selectedDomainId),
    enabled: !!tenantId && !!selectedDomainId,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (configQuery.data) {
      setFormState(configQuery.data);
      setIsDirty(false);
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !selectedDomainId || !formState) {
        throw new Error("Select a domain and wait for config to load.");
      }

      const validation = await validateAuthConfig(formState);
      if (!validation.success || !validation.data?.valid) {
        throw new Error(validation.data?.errors?.[0] || "Configuration validation failed.");
      }

      return updateAuthConfig(tenantId, formState, selectedDomainId);
    },
    onSuccess: (res) => {
      if (res.success) {
        setMessage({ type: "success", text: "Domain auth config saved." });
        setIsDirty(false);
        queryClient.invalidateQueries({ queryKey: ["auth-config", tenantId, "domain", selectedDomainId] });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    },
    onError: (error) => {
      setMessage({ type: "error", text: (error as Error).message || "Failed to save." });
    },
  });

  const cascadeMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !selectedDomainId) {
        throw new Error("Select a domain first.");
      }

      return cascadeDomainAuthConfig(tenantId, selectedDomainId);
    },
    onSuccess: (res) => {
      if (res.success) {
        const cascaded = res.data?.cascaded ?? 0;
        const skipped = res.data?.skippedExisting ?? 0;
        setMessage({
          type: "success",
          text: `Cascade complete. Created ${cascaded} child configs, skipped ${skipped} existing overrides.`,
        });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    },
    onError: (error) => {
      setMessage({ type: "error", text: (error as Error).message || "Cascade failed." });
    },
  });

  const patchForm = (patch: Partial<AuthConfigPayload>) => {
    setFormState((previous) => {
      if (!previous) {
        return previous;
      }

      return { ...previous, ...patch };
    });
    setIsDirty(true);
  };

  const updatePasswordPolicy = (
    patch: Partial<AuthConfigPayload["passwordPolicy"]>,
  ) => {
    setFormState((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        passwordPolicy: {
          ...previous.passwordPolicy,
          ...patch,
        },
      };
    });
    setIsDirty(true);
  };

  const leftPane = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
      <div className="p-4 border-b border-border bg-surface">
        <h3 className="text-base font-semibold text-text-primary">Domain Structure</h3>
        <p className="text-xs text-text-muted mt-1">
          Pick a domain to configure domain-level authentication.
        </p>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {treeQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="md" />
          </div>
        ) : localNodes.length > 0 ? (
          <DomainTreePicker
            parentId={null}
            level={0}
            selectedNodeId={selectedDomainId}
            onSelect={setSelectedDomainId}
          />
        ) : (
          <p className="text-sm text-text-muted">No domains found for this tenant.</p>
        )}
      </div>
    </Card>
  );

  const rightPane = (
    <Card className="h-full overflow-y-auto">
      {!selectedDomainId ? (
        <div className="h-full flex items-center justify-center text-sm text-text-muted">
          Select a domain from the left panel.
        </div>
      ) : configQuery.isLoading || !formState ? (
        <div className="h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Domain Auth Config</h2>
              <p className="text-sm text-text-muted mt-1">
                Domain: <span className="text-accent font-semibold">{selectedDomain?.domainName || selectedDomainId}</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                Source: {formState.sourceType || "tenant"}
                {formState.sourceDomainId ? ` (${formState.sourceDomainId})` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => cascadeMutation.mutate()}
                loading={cascadeMutation.isPending}
                disabled={isReadOnly || saveMutation.isPending}
              >
                Cascade
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!isDirty || isReadOnly}
              >
                Save Config
              </Button>
            </div>
          </div>

          {message && (
            <Alert
              type={message.type === "success" ? "success" : "error"}
              message={message.text}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Authentication Methods</h3>
            <div className="grid grid-cols-1 gap-3">
              <Toggle
                checked={formState.passwordEnabled}
                disabled={isReadOnly}
                onChange={(v) => patchForm({ passwordEnabled: v })}
                label="Password Authentication"
              />
              <Toggle
                checked={formState.ssoEnabled}
                disabled={isReadOnly}
                onChange={(v) => patchForm({ ssoEnabled: v })}
                label="SSO"
              />
              <Toggle
                checked={formState.otpEnabled}
                disabled={isReadOnly}
                onChange={(v) => patchForm({ otpEnabled: v })}
                label="OTP Login"
              />
              <Toggle
                checked={formState.mfaEnabled}
                disabled={isReadOnly}
                onChange={(v) => patchForm({ mfaEnabled: v })}
                label="MFA Required"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Password Policy</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min Length"
                type="number"
                min={4}
                max={64}
                value={formState.passwordPolicy.minLength}
                onChange={(e) => updatePasswordPolicy({ minLength: Number(e.target.value) || 0 })}
              />
              <Input
                label="Expiry Days"
                type="number"
                min={0}
                max={365}
                value={formState.passwordPolicy.expiryDays}
                onChange={(e) => updatePasswordPolicy({ expiryDays: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Toggle
                checked={formState.passwordPolicy.requireUppercase}
                disabled={isReadOnly}
                onChange={(v) => updatePasswordPolicy({ requireUppercase: v })}
                label="Require Uppercase"
              />
              <Toggle
                checked={formState.passwordPolicy.requireNumbers}
                disabled={isReadOnly}
                onChange={(v) => updatePasswordPolicy({ requireNumbers: v })}
                label="Require Numbers"
              />
              <Toggle
                checked={formState.passwordPolicy.requireSpecialChars}
                disabled={isReadOnly}
                onChange={(v) => updatePasswordPolicy({ requireSpecialChars: v })}
                label="Require Special Character"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Session Rules</h3>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Timeout (min)"
                type="number"
                min={5}
                max={1440}
                value={formState.sessionTimeoutMinutes}
                onChange={(e) => patchForm({ sessionTimeoutMinutes: Number(e.target.value) || 0 })}
              />
              <Input
                label="Max Attempts"
                type="number"
                min={1}
                max={20}
                value={formState.maxLoginAttempts}
                onChange={(e) => patchForm({ maxLoginAttempts: Number(e.target.value) || 0 })}
              />
              <Input
                label="Lockout (min)"
                type="number"
                min={1}
                max={1440}
                value={formState.lockoutDurationMinutes}
                onChange={(e) => patchForm({ lockoutDurationMinutes: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );

  if (treeQuery.isError) {
    return (
      <div className="p-8">
        <Alert type="error" message="Unable to load domain structure." />
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center bg-surface border border-border rounded-xl p-3 px-5 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Domain Authentication Configuration</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Configure auth at domain-level and optionally cascade to children that do not already have overrides.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResizableLayout leftPane={leftPane} rightPane={rightPane} />
      </div>
    </div>
  );
}
