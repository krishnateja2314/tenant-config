import React, { useState } from "react";
import { motion } from "framer-motion";
import PolicyManager from "../features/academic-policies/components/PolicyManager";
import AuditLogViewer from "../features/academic-policies/components/AuditLogViewer";
import { Card } from "../shared/components";

export const AcademicPoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<"policies" | "audit">("policies");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8 max-w-6xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Academic Policy Enforcement
        </h1>
        <p className="text-sm text-text-muted max-w-2xl">
          Configure mandatory attendance policies and monitor enforcement
          decisions from a central dashboard.
        </p>
      </div>

      {/* Introduction Card */}
      <Card
        title="How it works"
        subtitle="Mandatory attendance policy enforcement through tenant and domain rules."
      >
        <ul className="space-y-3 text-sm text-text-muted">
          <li>
            ✓{" "}
            <strong className="text-text-primary">Policy configuration</strong>:
            set attendance thresholds at tenant and domain levels.
          </li>
          <li>
            ✓{" "}
            <strong className="text-text-primary">
              Hierarchical enforcement
            </strong>
            : policies inherit from child domains up through the tree.
          </li>
          <li>
            ✓ <strong className="text-text-primary">Gateway enforcement</strong>
            : every request is validated before reaching the ERP.
          </li>
          <li>
            ✓ <strong className="text-text-primary">Audit trail</strong>: every
            decision is logged for compliance and review.
          </li>
        </ul>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-border flex gap-6">
        <button
          onClick={() => setActiveTab("policies")}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === "policies"
              ? "border-b-2 border-accent text-accent"
              : "border-b-2 border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Policy Manager
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === "audit"
              ? "border-b-2 border-accent text-accent"
              : "border-b-2 border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Audit Logs & Statistics
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "policies" && <PolicyManager />}
        {activeTab === "audit" && <AuditLogViewer />}
      </motion.div>

      {/* System Architecture Info */}
      <Card
        title="System Architecture"
        subtitle="Overview of the policy enforcement pipeline and audit strategy."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-muted">
          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Reverse Proxy Layer
            </h4>
            <p>
              All student requests are validated at the gateway before reaching
              the ERP.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Policy Resolution
            </h4>
            <p>
              Effective policies are resolved by traversing the domain hierarchy
              up to tenant defaults.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Audit Trail
            </h4>
            <p>
              Every enforcement decision is recorded for compliance and
              visibility.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default AcademicPoliciesPage;
