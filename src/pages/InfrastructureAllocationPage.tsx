import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/auth.store";
import { useInfrastructureStore } from "../features/infrastructure";
import { AllocationForm, AllocationList } from "../features/infrastructure";
import { Infrastructure } from "../features/infrastructure/types";
import { useDomains } from "../features/domains/hooks/useDomains";
import { Card, Button } from "../shared/components";

type PanelMode =
  | { kind: "idle" }
  | { kind: "edit"; infra: Infrastructure }
  | { kind: "create"; domainId: string; domainName: string };

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
  const [showDomainPicker, setShowDomainPicker] = useState(false);

  // Fetch infrastructure allocations on mount or when tenantId changes
  useEffect(() => {
    if (tenantId) {
      fetchInfrastructureByTenant(tenantId);
    }
  }, [tenantId, fetchInfrastructureByTenant]);

  // Domains that don't yet have an infrastructure allocation
  const allocatedDomainIds = new Set(
    infrastructures.map((i) => {
      // domainId could be populated (object) or a plain string
      return typeof i.domainId === "string"
        ? i.domainId
        : (i.domainId as any)?._id || i.domainId;
    })
  );

  const availableDomains = (treeQuery.data ?? []).filter(
    (d) => !allocatedDomainIds.has(d._id)
  );

  const handleEdit = (infra: Infrastructure) => {
    setPanel({ kind: "edit", infra });
    setShowDomainPicker(false);
  };

  const handleCreate = (domainId: string, domainName: string) => {
    setPanel({ kind: "create", domainId, domainName });
    setShowDomainPicker(false);
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
      setPanel({ kind: "idle" });
      // Refresh data
      if (tenantId) fetchInfrastructureByTenant(tenantId);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving infrastructure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const panelOpen = panel.kind !== "idle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Infrastructure Allocation
          </h1>
          <p className="text-sm text-text-muted max-w-2xl">
            Manage computational and digital infrastructure resources across
            domains — including storage quotas, compute limits, and lab system
            access rights.
          </p>
        </div>

        {/* New Allocation Button */}
        <div className="relative flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setShowDomainPicker((v) => !v)}
            disabled={availableDomains.length === 0 && !treeQuery.isLoading}
          >
            + New Allocation
          </Button>

          {/* Domain Picker Dropdown */}
          <AnimatePresence>
            {showDomainPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-text-primary">
                    Select a domain
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Only domains without an existing allocation are shown
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {treeQuery.isLoading ? (
                    <div className="flex justify-center p-6">
                      <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : availableDomains.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-text-muted">
                        All domains already have allocations
                      </p>
                    </div>
                  ) : (
                    availableDomains.map((domain) => (
                      <button
                        key={domain._id}
                        onClick={() =>
                          handleCreate(domain._id, domain.domainName)
                        }
                        className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                      >
                        <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">🏢</span>
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {domain.domainName}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {domain.metadata?.domainType || "DOMAIN"}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {showDomainPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDomainPicker(false)}
        />
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xl">💾</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Total Allocations
                </p>
                <p className="text-xl font-black text-text-primary">
                  {infrastructures.length}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Active
                </p>
                <p className="text-xl font-black text-emerald-400">
                  {
                    infrastructures.filter(
                      (i) => i.allocationStatus === "ACTIVE"
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="text-xl">⏸</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Suspended
                </p>
                <p className="text-xl font-black text-red-400">
                  {
                    infrastructures.filter(
                      (i) => i.allocationStatus === "SUSPENDED"
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex justify-between items-start"
          >
            <div>
              <h3 className="font-semibold text-red-400 text-sm">Error</h3>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 font-medium text-sm px-2 py-1 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4"
          >
            <p className="text-emerald-400 font-medium text-sm flex items-center gap-2">
              <span>✓</span> {successMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Allocations */}
        <div className={panelOpen ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">
                Current Allocations
              </h2>
            </div>
            <AllocationList
              infrastructures={infrastructures}
              onEdit={handleEdit}
              loading={loading}
            />
          </div>
        </div>

        {/* Side Panel (Edit or Create) */}
        <AnimatePresence mode="wait">
          {panel.kind === "edit" && (
            <motion.div
              key="edit-panel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-text-primary">
                    Edit Allocation
                  </h2>
                  <button
                    onClick={() => setPanel({ kind: "idle" })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all duration-150"
                  >
                    ✕
                  </button>
                </div>
                <AllocationForm
                  domain={{
                    _id:
                      typeof panel.infra.domainId === "string"
                        ? panel.infra.domainId
                        : (panel.infra.domainId as any)?._id,
                    domainName:
                      typeof panel.infra.domainId === "string"
                        ? panel.infra.domainId
                        : (panel.infra.domainId as any)?.domainName ||
                          "Unknown",
                  }}
                  infrastructure={panel.infra}
                  onSubmit={handleSubmit}
                  loading={isSubmitting}
                />
              </div>
            </motion.div>
          )}

          {panel.kind === "create" && (
            <motion.div
              key="create-panel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-8 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-text-primary">
                    New Allocation
                  </h2>
                  <button
                    onClick={() => setPanel({ kind: "idle" })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all duration-150"
                  >
                    ✕
                  </button>
                </div>
                <AllocationForm
                  domain={{
                    _id: panel.domainId,
                    domainName: panel.domainName,
                  }}
                  onSubmit={handleSubmit}
                  loading={isSubmitting}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Information Card */}
      <Card
        title="About Infrastructure Allocation"
        subtitle="How resources and access rights are managed within this module."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-sm">💾</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              Storage Quotas
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Define the total storage space available for each domain. Enforced
              by downstream storage modules.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="text-sm">⚡</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              Compute Limits
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Set CPU cores, memory allocation, and maximum concurrent jobs per
              domain to prevent over-consumption.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <span className="text-sm">🔐</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              Lab Access Rights
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Control digital authorization for secured labs including
              biometric, face recognition, and device verification.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <span className="text-sm">🔄</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              Status Management
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Activate, deactivate, or suspend allocations as needed. Status
              changes are enforced by resource booking services.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
