import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/auth.store";
import { useInfrastructureStore } from "../features/infrastructure";
import { AllocationForm, AllocationList } from "../features/infrastructure";
import { Infrastructure } from "../features/infrastructure/types";
import { Card } from "../shared/components";

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

  const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch infrastructure allocations on mount or when tenantId changes
  useEffect(() => {
    if (tenantId) {
      fetchInfrastructureByTenant(tenantId);
    }
  }, [tenantId, fetchInfrastructureByTenant]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!selectedInfra) return;

    setIsSubmitting(true);
    try {
      await updateInfrastructure(selectedInfra.domainId, data);
      setSuccessMessage("Infrastructure allocation updated successfully!");
      setSelectedInfra(null);
      // Refresh data
      if (tenantId) fetchInfrastructureByTenant(tenantId);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating infrastructure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Page Header */}
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
        <div className={selectedInfra ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">
                Current Allocations
              </h2>
            </div>
            <AllocationList
              infrastructures={infrastructures}
              onEdit={setSelectedInfra}
              loading={loading}
            />
          </div>
        </div>

        {/* Edit Panel */}
        <AnimatePresence mode="wait">
          {selectedInfra && (
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
                    onClick={() => setSelectedInfra(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all duration-150"
                  >
                    ✕
                  </button>
                </div>
                <AllocationForm
                  domain={{
                    _id: selectedInfra.domainId,
                    domainName:
                      typeof selectedInfra.domainId === "string"
                        ? selectedInfra.domainId
                        : (selectedInfra.domainId as any)?.domainName ||
                          "Unknown",
                  }}
                  infrastructure={selectedInfra}
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
