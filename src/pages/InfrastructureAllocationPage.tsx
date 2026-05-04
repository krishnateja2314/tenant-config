import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../stores/auth.store";
import { useInfrastructureStore } from "../features/infrastructure";
import { AllocationForm } from "../features/infrastructure";
import { Infrastructure } from "../features/infrastructure/types";
import { useDomains } from "../features/domains/hooks/useDomains";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";
import { Card } from "../shared/components/Card";
import { Button } from "../shared/components/Button";
import { Badge } from "../shared/components/Badge";
import { AnimatePresence, motion } from "framer-motion";

type PanelMode =
  | { kind: "idle" }
  | { kind: "edit"; infra: Infrastructure }
  | { kind: "create"; domainId: string; domainName: string };

const statusBadgeVariant = (s: string) =>
  s === "ACTIVE" ? "success" as const : s === "SUSPENDED" ? "error" as const : "warning" as const;

export function InfrastructureAllocationPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId || "";

  const {
    infrastructures,
    loading,
    error,
    fetchInfrastructureByTenant,
    updateInfrastructure,
    clearError,
  } = useInfrastructureStore();

  const { treeQuery } = useDomains();

  const [panel, setPanel] = useState<PanelMode>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchInfrastructureByTenant(tenantId);
    }
  }, [tenantId, fetchInfrastructureByTenant]);

  // Domains that don't yet have an allocation
  const allocatedDomainIds = useMemo(
    () =>
      new Set(
        infrastructures.map((i) =>
          typeof i.domainId === "string"
            ? i.domainId
            : (i.domainId as any)?._id || i.domainId
        )
      ),
    [infrastructures]
  );

  const availableDomains = useMemo(
    () => (treeQuery.data ?? []).filter((d) => !allocatedDomainIds.has(d._id)),
    [treeQuery.data, allocatedDomainIds]
  );

  // Auto-select first allocation on load
  useEffect(() => {
    if (panel.kind === "idle" && infrastructures.length > 0) {
      setPanel({ kind: "edit", infra: infrastructures[0] });
    }
  }, [infrastructures]);

  const selectedId = panel.kind === "edit"
    ? (typeof panel.infra.domainId === "string" ? panel.infra.domainId : (panel.infra.domainId as any)?._id)
    : panel.kind === "create"
    ? panel.domainId
    : null;

  const handleSelectInfra = (infra: Infrastructure) => {
    setPanel({ kind: "edit", infra });
  };

  const handleNewAllocation = (domainId: string, domainName: string) => {
    setPanel({ kind: "create", domainId, domainName });
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    let targetDomainId: string;
    if (panel.kind === "edit") {
      const raw = panel.infra.domainId;
      targetDomainId = typeof raw === "string" ? raw : (raw as any)?._id || raw;
    } else if (panel.kind === "create") {
      targetDomainId = panel.domainId;
    } else {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateInfrastructure(targetDomainId, data);
      const verb = panel.kind === "create" ? "created" : "updated";
      setSuccessMessage(`Infrastructure allocation ${verb} successfully!`);
      if (tenantId) fetchInfrastructureByTenant(tenantId);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving infrastructure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Left Pane: allocation list ──────────────────────────────────────────────
  const leftPane = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
      <div className="flex justify-between items-center p-4 border-b border-border z-10 bg-surface">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Allocations
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Select a domain to view or edit
          </p>
        </div>
        {/* Inline new-allocation dropdown */}
        <NewAllocationButton
          domains={availableDomains}
          domainsLoading={treeQuery.isLoading}
          onCreate={handleNewAllocation}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <span className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : infrastructures.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">
            <span className="text-3xl block mb-2">📦</span>
            No infrastructure allocations found.
            <br />
            Click "+ New" above to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {infrastructures.map((infra) => {
              const domId =
                typeof infra.domainId === "string"
                  ? infra.domainId
                  : (infra.domainId as any)?._id;
              const domName =
                typeof infra.domainId === "string"
                  ? infra.domainId
                  : (infra.domainId as any)?.domainName || "Unknown";
              const isSelected = selectedId === domId;

              return (
                <button
                  key={infra._id}
                  type="button"
                  onClick={() => handleSelectInfra(infra)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-accent/10 border-accent/50 ring-1 ring-accent/20"
                      : "bg-surface border-border hover:border-text-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-text-primary truncate">
                      {domName}
                    </h4>
                    <Badge variant={statusBadgeVariant(infra.allocationStatus)}>
                      {infra.allocationStatus}
                    </Badge>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-text-muted">
                    <span>
                      💾 {infra.storageQuota.usedGB}/{infra.storageQuota.totalGB} GB
                    </span>
                    <span>
                      ⚡ {infra.computeLimit.cpuCores}c / {infra.computeLimit.memoryGB}GB
                    </span>
                    <span>🔄 {infra.computeLimit.maxConcurrentJobs} jobs</span>
                  </div>

                  {/* Access flag pills */}
                  {(infra.specialAccessFlags.labSystemAccess ||
                    infra.specialAccessFlags.biometricAccess ||
                    infra.specialAccessFlags.faceRecognitionAccess ||
                    infra.specialAccessFlags.deviceIdentityVerification ||
                    infra.specialAccessFlags.advancedLabAccess) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {infra.specialAccessFlags.labSystemAccess && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          Lab
                        </span>
                      )}
                      {infra.specialAccessFlags.biometricAccess && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Bio
                        </span>
                      )}
                      {infra.specialAccessFlags.faceRecognitionAccess && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Face
                        </span>
                      )}
                      {infra.specialAccessFlags.deviceIdentityVerification && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Device
                        </span>
                      )}
                      {infra.specialAccessFlags.advancedLabAccess && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                          Adv
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );

  // ── Right Pane: edit / create form ──────────────────────────────────────────
  const rightPane = (
    <Card className="h-full overflow-y-auto">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between items-start"
          >
            <p className="text-red-400 text-xs">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 text-xs ml-2"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3"
          >
            <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
              <span>✓</span> {successMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {panel.kind === "idle" ? (
        <div className="h-full flex items-center justify-center text-sm text-text-muted">
          Select an allocation from the left panel, or create a new one.
        </div>
      ) : panel.kind === "edit" ? (
        <AllocationForm
          domain={{
            _id:
              typeof panel.infra.domainId === "string"
                ? panel.infra.domainId
                : (panel.infra.domainId as any)?._id,
            domainName:
              typeof panel.infra.domainId === "string"
                ? panel.infra.domainId
                : (panel.infra.domainId as any)?.domainName || "Unknown",
          }}
          infrastructure={panel.infra}
          onSubmit={handleSubmit}
          loading={isSubmitting}
        />
      ) : (
        <AllocationForm
          domain={{
            _id: panel.domainId,
            domainName: panel.domainName,
          }}
          onSubmit={handleSubmit}
          loading={isSubmitting}
        />
      )}
    </Card>
  );

  // ── Page ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-surface border border-border rounded-xl p-3 px-5 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Infrastructure Allocation
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage storage quotas, compute limits, and lab system access rights
            per domain.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>
            {infrastructures.length} allocation{infrastructures.length !== 1 ? "s" : ""}
          </span>
          <span className="text-emerald-400">
            {infrastructures.filter((i) => i.allocationStatus === "ACTIVE").length} active
          </span>
        </div>
      </div>

      {/* RESIZABLE LEFT/RIGHT LAYOUT */}
      <div className="flex-1 min-h-0">
        <ResizableLayout leftPane={leftPane} rightPane={rightPane} />
      </div>
    </div>
  );
}

// ── Inline component: "+ New" button with dropdown ──────────────────────────
function NewAllocationButton({
  domains,
  domainsLoading,
  onCreate,
}: {
  domains: { _id: string; domainName: string; metadata?: { domainType?: string } }[];
  domainsLoading: boolean;
  onCreate: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="px-3 py-1.5 text-xs border border-border"
        onClick={() => setOpen((v) => !v)}
        disabled={domains.length === 0 && !domainsLoading}
      >
        + New
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-text-primary">
                  Select domain
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Domains without an existing allocation
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {domainsLoading ? (
                  <div className="flex justify-center p-4">
                    <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : domains.length === 0 ? (
                  <p className="p-4 text-center text-[11px] text-text-muted">
                    All domains already have allocations
                  </p>
                ) : (
                  domains.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => {
                        onCreate(d._id, d.domainName);
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2 transition-colors border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium">{d.domainName}</span>
                      {d.metadata?.domainType && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-surface-2 text-text-muted rounded border border-border">
                          {d.metadata.domainType}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
