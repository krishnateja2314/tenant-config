import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PolicyManager from "../features/academic-policies/components/PolicyManager";
import AuditLogViewer from "../features/academic-policies/components/AuditLogViewer";
import { Card, Button } from "../shared/components";
import { useDomains } from "../features/domains/hooks/useDomains";
import { useDomainWorkspaceStore } from "../features/domains/stores/domain.store";
import { TreeList } from "../features/domains/components/TreeList";
import { TreeCanvas } from "../features/domains/components/TreeCanvas";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";

export const AcademicPoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<"policies" | "audit">("policies");
  const { treeQuery } = useDomains();
  const {
    localNodes,
    initWorkspace,
    viewMode,
    setViewMode,
    pastStates,
    futureStates,
    pendingMutations,
    undo,
    redo,
    clearPendingMutations,
  } = useDomainWorkspaceStore();

  useEffect(() => {
    if (treeQuery.data) {
      initWorkspace(treeQuery.data);
    }
  }, [treeQuery.data, initWorkspace]);
  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between gap-4 bg-surface border-b border-border p-5">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Academic Policy Enforcement
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Configure tenant and domain-level attendance policies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="px-3 py-2 text-xs"
                onClick={undo}
                disabled={pastStates.length === 0}
              >
                ↶ Undo
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-2 text-xs"
                onClick={redo}
                disabled={futureStates.length === 0}
              >
                ↷ Redo
              </Button>
              <Button
                variant={pendingMutations.length > 0 ? "primary" : "secondary"}
                disabled={pendingMutations.length === 0}
                onClick={clearPendingMutations}
                className="px-3 py-2 text-xs"
              >
                Save Workspace
              </Button>
            </div>
          </div>

          <div className="border-b border-border p-4">
            <button
              onClick={() => setActiveTab("policies")}
              className={`pb-3 mr-6 text-sm font-semibold transition ${
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

          <div className="flex-1 overflow-y-auto p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "policies" && <PolicyManager />}
              {activeTab === "audit" && <AuditLogViewer />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPoliciesPage;
