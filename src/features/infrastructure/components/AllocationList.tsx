import { motion, AnimatePresence } from "framer-motion";
import { Infrastructure } from "../types";
import { Badge } from "../../../shared/components";

interface AllocationListProps {
  infrastructures: Infrastructure[];
  onEdit: (infrastructure: Infrastructure) => void;
  loading?: boolean;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "SUSPENDED":
      return "error" as const;
    default:
      return "warning" as const;
  }
};

function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  const color =
    pct > 85
      ? "bg-red-500"
      : pct > 60
      ? "bg-amber-400"
      : "bg-emerald-400";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">Storage</span>
        <span className="text-text-primary font-medium">
          {used} / {total} GB
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function AccessBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
      <span className="w-1 h-1 rounded-full bg-accent" />
      {label}
    </span>
  );
}

export function AllocationList({
  infrastructures,
  onEdit,
  loading = false,
}: AllocationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Loading allocations…</p>
        </div>
      </div>
    );
  }

  if (infrastructures.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-border rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📦</span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              No allocations yet
            </p>
            <p className="text-xs text-text-muted mt-1">
              Infrastructure allocations will appear here once configured
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {infrastructures.map((infra, i) => (
          <motion.div
            key={infra._id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="group bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 transition-all duration-300 cursor-pointer"
            onClick={() => onEdit(infra)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-primary truncate">
                  {typeof infra.domainId === "string"
                    ? infra.domainId
                    : (infra.domainId as any)?.domainName || "Unknown Domain"}
                </h3>
              </div>
              <Badge variant={statusVariant(infra.allocationStatus)}>
                {infra.allocationStatus}
              </Badge>
            </div>

            {/* Storage Bar */}
            <StorageBar
              used={infra.storageQuota.usedGB}
              total={infra.storageQuota.totalGB}
            />

            {/* Compute Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-text-muted">CPU</p>
                <p className="text-sm font-bold text-text-primary">
                  {infra.computeLimit.cpuCores}
                </p>
                <p className="text-[10px] text-text-muted">cores</p>
              </div>
              <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-text-muted">RAM</p>
                <p className="text-sm font-bold text-text-primary">
                  {infra.computeLimit.memoryGB}
                </p>
                <p className="text-[10px] text-text-muted">GB</p>
              </div>
              <div className="bg-surface-2 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-text-muted">Jobs</p>
                <p className="text-sm font-bold text-text-primary">
                  {infra.computeLimit.maxConcurrentJobs}
                </p>
                <p className="text-[10px] text-text-muted">max</p>
              </div>
            </div>

            {/* Access Flags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <AccessBadge
                label="Lab"
                active={infra.specialAccessFlags.labSystemAccess}
              />
              <AccessBadge
                label="Biometric"
                active={infra.specialAccessFlags.biometricAccess}
              />
              <AccessBadge
                label="Face ID"
                active={infra.specialAccessFlags.faceRecognitionAccess}
              />
              <AccessBadge
                label="Device"
                active={infra.specialAccessFlags.deviceIdentityVerification}
              />
              <AccessBadge
                label="Advanced"
                active={infra.specialAccessFlags.advancedLabAccess}
              />
            </div>

            {/* Reason */}
            {infra.metadata.allocationReason && (
              <p className="text-[11px] text-text-muted mt-3 italic truncate">
                "{infra.metadata.allocationReason}"
              </p>
            )}

            {/* Edit Hint */}
            <div className="mt-4 pt-3 border-t border-border">
              <span className="text-xs text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                <span>✎</span> Click to edit
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
