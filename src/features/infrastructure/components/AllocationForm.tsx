import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Infrastructure } from "../types";
import { Input, Button, Toggle, Card } from "../../../shared/components";

interface AllocationFormProps {
  domain: { _id: string; domainName: string };
  infrastructure?: Infrastructure;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export function AllocationForm({
  domain,
  infrastructure,
  onSubmit,
  loading = false,
}: AllocationFormProps) {
  const [formData, setFormData] = useState({
    storageQuotaTotalGB: infrastructure?.storageQuota.totalGB || 100,
    cpuCores: infrastructure?.computeLimit.cpuCores || 4,
    memoryGB: infrastructure?.computeLimit.memoryGB || 8,
    maxConcurrentJobs: infrastructure?.computeLimit.maxConcurrentJobs || 10,
    labSystemAccess:
      infrastructure?.specialAccessFlags.labSystemAccess || false,
    biometricAccess:
      infrastructure?.specialAccessFlags.biometricAccess || false,
    faceRecognitionAccess:
      infrastructure?.specialAccessFlags.faceRecognitionAccess || false,
    deviceIdentityVerification:
      infrastructure?.specialAccessFlags.deviceIdentityVerification || false,
    advancedLabAccess:
      infrastructure?.specialAccessFlags.advancedLabAccess || false,
    allocationStatus: infrastructure?.allocationStatus || "ACTIVE",
    allocationReason: infrastructure?.metadata.allocationReason || "",
    notes: infrastructure?.metadata.notes || "",
  });

  // Reset form when infrastructure changes
  useEffect(() => {
    if (infrastructure) {
      setFormData({
        storageQuotaTotalGB: infrastructure.storageQuota.totalGB,
        cpuCores: infrastructure.computeLimit.cpuCores,
        memoryGB: infrastructure.computeLimit.memoryGB,
        maxConcurrentJobs: infrastructure.computeLimit.maxConcurrentJobs,
        labSystemAccess: infrastructure.specialAccessFlags.labSystemAccess,
        biometricAccess: infrastructure.specialAccessFlags.biometricAccess,
        faceRecognitionAccess:
          infrastructure.specialAccessFlags.faceRecognitionAccess,
        deviceIdentityVerification:
          infrastructure.specialAccessFlags.deviceIdentityVerification,
        advancedLabAccess: infrastructure.specialAccessFlags.advancedLabAccess,
        allocationStatus: infrastructure.allocationStatus,
        allocationReason: infrastructure.metadata.allocationReason || "",
        notes: infrastructure.metadata.notes || "",
      });
    }
  }, [infrastructure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      storageQuota: {
        totalGB: Number(formData.storageQuotaTotalGB),
      },
      computeLimit: {
        cpuCores: Number(formData.cpuCores),
        memoryGB: Number(formData.memoryGB),
        maxConcurrentJobs: Number(formData.maxConcurrentJobs),
      },
      specialAccessFlags: {
        labSystemAccess: formData.labSystemAccess,
        biometricAccess: formData.biometricAccess,
        faceRecognitionAccess: formData.faceRecognitionAccess,
        deviceIdentityVerification: formData.deviceIdentityVerification,
        advancedLabAccess: formData.advancedLabAccess,
      },
      allocationStatus: formData.allocationStatus,
      metadata: {
        allocationReason: formData.allocationReason,
        notes: formData.notes,
      },
    };

    await onSubmit(payload);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.25 },
    }),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Domain Header */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">⚙</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">
              {domain.domainName}
            </p>
            <p className="text-[11px] text-text-muted">
              Configure infrastructure allocation
            </p>
          </div>
        </div>
      </Card>

      {/* Storage Quota Section */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Card title="Storage Allocation" subtitle="Define total storage quota for this domain">
          <Input
            label="Total Storage (GB)"
            type="number"
            min={1}
            value={formData.storageQuotaTotalGB}
            onChange={(e) =>
              setFormData({
                ...formData,
                storageQuotaTotalGB: Number(e.target.value),
              })
            }
            hint="Minimum 1 GB — enforced by downstream services"
          />
        </Card>
      </motion.div>

      {/* Compute Limits Section */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Card title="Compute Allocation" subtitle="Set CPU, memory, and concurrency limits">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="CPU Cores"
              type="number"
              min={1}
              value={formData.cpuCores}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cpuCores: Number(e.target.value),
                })
              }
            />
            <Input
              label="Memory (GB)"
              type="number"
              min={1}
              value={formData.memoryGB}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  memoryGB: Number(e.target.value),
                })
              }
            />
            <Input
              label="Max Jobs"
              type="number"
              min={1}
              value={formData.maxConcurrentJobs}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxConcurrentJobs: Number(e.target.value),
                })
              }
            />
          </div>
        </Card>
      </motion.div>

      {/* Lab Access Section */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Card
          title="Lab System Access Rights"
          subtitle="Control digital authorization for secured lab systems and biometric methods"
        >
          <div className="space-y-4">
            <Toggle
              checked={formData.labSystemAccess}
              onChange={(v) =>
                setFormData({ ...formData, labSystemAccess: v })
              }
              label="Lab System Access"
              description="Allow login to secured laboratory systems"
            />
            <Toggle
              checked={formData.biometricAccess}
              onChange={(v) =>
                setFormData({ ...formData, biometricAccess: v })
              }
              label="Biometric Access"
              description="Enable fingerprint-based authentication for lab entry"
            />
            <Toggle
              checked={formData.faceRecognitionAccess}
              onChange={(v) =>
                setFormData({ ...formData, faceRecognitionAccess: v })
              }
              label="Face Recognition Access"
              description="Allow face recognition as an identity verification method"
            />
            <Toggle
              checked={formData.deviceIdentityVerification}
              onChange={(v) =>
                setFormData({
                  ...formData,
                  deviceIdentityVerification: v,
                })
              }
              label="Device Identity Verification"
              description="Restrict access to registered devices only"
            />
            <Toggle
              checked={formData.advancedLabAccess}
              onChange={(v) =>
                setFormData({ ...formData, advancedLabAccess: v })
              }
              label="Advanced Lab Access"
              description="Grant access to specialized research and high-security labs"
            />
          </div>
        </Card>
      </motion.div>

      {/* Allocation Status */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Card title="Allocation Status" subtitle="Set the current status of this allocation">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Status
            </label>
            <select
              value={formData.allocationStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allocationStatus: e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                })
              }
              className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/50 focus:border-accent appearance-none cursor-pointer"
            >
              <option value="ACTIVE">🟢 Active</option>
              <option value="INACTIVE">⚫ Inactive</option>
              <option value="SUSPENDED">🔴 Suspended</option>
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Metadata Section */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <Card title="Allocation Notes" subtitle="Provide context for this infrastructure allocation">
          <div className="space-y-4">
            <Input
              label="Reason for Allocation"
              type="text"
              value={formData.allocationReason}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allocationReason: e.target.value,
                })
              }
              placeholder="e.g., Research project, Teaching lab, Student workstation"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional notes about this allocation"
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Save Allocation
        </Button>
      </div>
    </form>
  );
}
