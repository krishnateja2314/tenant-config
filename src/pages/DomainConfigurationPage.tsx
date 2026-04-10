import { useEffect, useState } from "react";
import { useDomains } from "../features/domains/hooks/useDomains";
import { useDomainWorkspaceStore } from "../features/domains/stores/domain.store";
import { TreeList } from "../features/domains/components/TreeList";
import { TreeCanvas } from "../features/domains/components/TreeCanvas";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";
import { DomainDetailsPanel } from "../features/domains/components/DomainDetailsPanel";
import { Card } from "../shared/components/Card";
import { Button } from "../shared/components/Button";
import { useAuthStore } from "../stores/auth.store";
import { domainApi } from "../features/domains/services/domainApi";

export function DomainConfigurationPage() {
  const [isSaving, setIsSaving] = useState(false);
  const admin = useAuthStore((s) => s.admin);
  const isTenantAdmin = admin?.role === "TENANT_ADMIN";

  const { treeQuery } = useDomains();

  const {
    localNodes,
    initWorkspace,
    pendingMutations,
    undo,
    redo,
    pastStates,
    futureStates,
    clearPendingMutations,
    setSelectedNodeId,
    setIsCreatingChild,
    viewMode,
    setViewMode,
  } = useDomainWorkspaceStore();

  useEffect(() => {
    if (treeQuery.data) {
      initWorkspace(treeQuery.data);
    }
  }, [treeQuery.data]);

  const handleSaveWorkspace = async () => {
    if (!admin?.tenantId || pendingMutations.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const tempIdMap = new Map<string, string>();

      for (const mutation of pendingMutations) {
        if (mutation.type === "CREATE") {
          const parentId = mutation.data?.parentDomainId;
          const resolvedParentId = parentId && tempIdMap.has(parentId)
            ? tempIdMap.get(parentId) || null
            : parentId;

          const created = await domainApi.create(admin.tenantId, {
            domainName: mutation.data?.domainName || "",
            parentDomainId: resolvedParentId ?? null,
            domainAdminId: mutation.data?.domainAdminId ?? null,
            metadata: {
              domainType: mutation.data?.metadata?.domainType || "DEPARTMENT",
              description: mutation.data?.metadata?.description || "",
            },
          });

          tempIdMap.set(mutation.id, created._id);
          continue;
        }

        const targetId = tempIdMap.get(mutation.id) || mutation.id;

        if (mutation.type === "UPDATE") {
          if (targetId.startsWith("temp-")) {
            continue;
          }

          const parentId = mutation.data?.parentDomainId;
          const resolvedParentId = parentId && tempIdMap.has(parentId)
            ? tempIdMap.get(parentId) || null
            : parentId;

          await domainApi.update(targetId, {
            domainName: mutation.data?.domainName,
            parentDomainId: resolvedParentId,
            domainAdminId: mutation.data?.domainAdminId,
            metadata: mutation.data?.metadata,
          });
          continue;
        }

        if (mutation.type === "DELETE") {
          if (targetId.startsWith("temp-")) {
            continue;
          }

          await domainApi.delete(targetId);
        }
      }

      const refreshed = await treeQuery.refetch();
      if (refreshed.data) {
        initWorkspace(refreshed.data);
      }
      clearPendingMutations();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save domain workspace";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateRootCreation = () => {
    setSelectedNodeId(null);
    setIsCreatingChild(true);
  };

  // ---------------------------------------------
  // RENDER LEFT PANE (Tree or Canvas)
  // ---------------------------------------------
  const LeftPane = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
      <div className="flex justify-between items-center p-4 border-b border-border z-10 bg-surface">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Domain Structure
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {isTenantAdmin ? "Drag to reparent" : "Your assigned scope"}
          </p>
        </div>

        {/* VIEW TOGGLES & ROOT CREATION */}
        <div className="flex gap-4 items-center">
          {/* NEW: Persistent Root Creation Button for Tenant Admins */}
          {isTenantAdmin && (
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs border border-border"
              onClick={handleInitiateRootCreation}
            >
              + Add Root
            </Button>
          )}

          <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "list" ? "bg-surface text-accent shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "canvas" ? "bg-surface text-accent shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Canvas
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden relative ${viewMode === "list" ? "p-4 overflow-y-auto" : ""}`}
      >
        {treeQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <span className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : localNodes.length > 0 ? (
          viewMode === "list" ? (
            <TreeList parentId={null} level={0} />
          ) : (
            <TreeCanvas />
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            {isTenantAdmin ? (
              <Button onClick={handleInitiateRootCreation}>
                Create Root Domain
              </Button>
            ) : (
              <p className="text-sm text-red-400">Access Restricted</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center bg-surface border border-border rounded-xl p-3 px-5 shadow-sm">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs"
            onClick={undo}
            disabled={pastStates.length === 0}
          >
            ↶ Undo
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs"
            onClick={redo}
            disabled={futureStates.length === 0}
          >
            ↷ Redo
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {pendingMutations.length > 0 && (
            <span className="text-xs font-medium text-amber-500 animate-pulse">
              {pendingMutations.length} unsaved changes
            </span>
          )}
          <Button
            variant={pendingMutations.length > 0 ? "primary" : "secondary"}
            disabled={pendingMutations.length === 0 || isSaving}
            onClick={handleSaveWorkspace}
          >
            {isSaving ? "Saving..." : "Save Workspace"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResizableLayout
          leftPane={LeftPane}
          rightPane={<DomainDetailsPanel />}
        />
      </div>
    </div>
  );
}
