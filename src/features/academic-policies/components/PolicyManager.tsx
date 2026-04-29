import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import { usePolicyStore } from "../stores/policy.store";
import { useDomains } from "../../domains/hooks/useDomains";
import { AcademicPolicy, CreatePolicyDTO } from "../types/academicPolicy.types";
import { Card, Button, Input, Alert, Badge } from "../../../shared/components";
import { Plus, Trash2 } from "lucide-react";

const MIN_THRESHOLD = 0;
const MAX_THRESHOLD = 100;

export const PolicyManager = () => {
  const admin = useAuthStore((s) => s.admin);
  const {
    policies,
    selectedPolicy,
    loading,
    error,
    isSaving,
    fetchPolicies,
    selectPolicy,
    createPolicy,
    updatePolicy,
    deletePolicy,
    clearError,
  } = usePolicyStore();

  const { treeQuery } = useDomains();
  const [formData, setFormData] = useState<CreatePolicyDTO>({
    domainId: null,
    threshold: 75,
    policyType: "ATTENDANCE",
    isHardConstraint: true,
    actionRestrictions: ["EXAM_REG", "COURSE_ENROLLMENT"],
    description: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tenantId = admin?.tenantId;

  useEffect(() => {
    if (tenantId) {
      fetchPolicies(tenantId);
    }
  }, [tenantId, fetchPolicies]);

  const handleSelectPolicy = (policy: AcademicPolicy) => {
    selectPolicy(policy);
    setFormData({
      domainId: policy.domainId,
      threshold: policy.threshold,
      policyType: policy.policyType,
      isHardConstraint: policy.isHardConstraint,
      actionRestrictions: policy.actionRestrictions,
      description: policy.metadata?.description,
    });
    setEditingId(policy._id);
    setShowForm(true);
  };

  const handleNewPolicy = () => {
    setFormData({
      domainId: null,
      threshold: 75,
      policyType: "ATTENDANCE",
      isHardConstraint: true,
      actionRestrictions: ["EXAM_REG", "COURSE_ENROLLMENT"],
      description: "",
    });
    selectPolicy(null);
    setEditingId(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (
      formData.threshold < MIN_THRESHOLD ||
      formData.threshold > MAX_THRESHOLD
    ) {
      alert(`Threshold must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}`);
      return;
    }

    try {
      if (editingId) {
        await updatePolicy(tenantId!, { ...formData, _id: editingId });
      } else {
        await createPolicy(tenantId!, formData);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      try {
        await deletePolicy(tenantId!, policyId);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const getDomainName = (domainId: string | null): string => {
    if (!domainId) return "Tenant Level";
    const domain = treeQuery.data?.find((d: any) => d._id === domainId);
    return domain?.domainName || domainId;
  };

  return (
    <div className="space-y-6">
      <Card
        title="Policy Configuration"
        subtitle="Manage attendance thresholds and domain-specific enforcement policies."
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-muted max-w-2xl">
            Select a policy to edit it, or create a tenant-level or
            domain-specific policy from the action panel.
          </p>
          <Button
            onClick={handleNewPolicy}
            variant="primary"
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Policy
          </Button>
        </div>
      </Card>

      {error && (
        <Alert variant="error" onDismiss={clearError}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-6">
        <Card
          title="Configured Policies"
          subtitle="Click a policy to edit its details."
        >
          {loading ? (
            <div className="text-center py-10 text-text-muted">
              Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              No policies configured. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <button
                  key={policy._id}
                  type="button"
                  onClick={() => handleSelectPolicy(policy)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedPolicy?._id === policy._id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:border-accent/70 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">
                        {getDomainName(policy.domainId)}
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Minimum attendance: {policy.threshold}%
                      </p>
                    </div>
                    <Badge variant="default">{policy.policyType}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={editingId ? "Edit Policy" : "New Policy"}
          subtitle="Enter policy details and save changes."
          className="sticky top-6"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Apply to Domain
              </label>
              <select
                value={formData.domainId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    domainId: e.target.value || null,
                  })
                }
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              >
                <option value="">Tenant Level</option>
                {treeQuery.data?.map((domain: any) => (
                  <option key={domain._id} value={domain._id}>
                    {domain.domainName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Attendance Threshold (%)
              </label>
              <Input
                type="number"
                min={MIN_THRESHOLD}
                max={MAX_THRESHOLD}
                value={formData.threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    threshold: parseInt(e.target.value, 10),
                  })
                }
                className="rounded-2xl"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Policy description..."
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isHardConstraint}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isHardConstraint: e.target.checked,
                  })
                }
                id="hardConstraint"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <label
                htmlFor="hardConstraint"
                className="text-sm text-text-primary"
              >
                Hard constraint (block if not met)
              </label>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  loading={isSaving}
                >
                  {editingId ? "Save Policy" : "Create Policy"}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>

              {editingId && (
                <Button
                  onClick={() => {
                    handleDelete(editingId);
                    setShowForm(false);
                  }}
                  variant="danger"
                  disabled={isSaving}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PolicyManager;
