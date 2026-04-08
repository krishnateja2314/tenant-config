import { useEffect } from "react";
import { useDomains } from "../features/domains/hooks/useDomains";
import { useDomainWorkspaceStore } from "../features/domains/stores/domain.store";
import { TreeList } from "../features/domains/components/TreeList";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";
import { DomainDetailsPanel } from "../features/domains/components/DomainDetailsPanel";
import { Card } from "../shared/components/Card";
import { Button } from "../shared/components/Button";
import { useAuthStore } from "../stores/auth.store";

export function DomainConfigurationPage() {
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
    setSelectedNodeId,
    setIsCreatingChild,
  } = useDomainWorkspaceStore();

  useEffect(() => {
    if (treeQuery.data) {
      initWorkspace(treeQuery.data);
    }
  }, [treeQuery.data]);

  const handleSaveWorkspace = () => {
    console.log("Pushing mutations to backend:", pendingMutations);
    alert(
      `Saving ${pendingMutations.length} changes to backend... (Check console)`,
    );
  };

  const handleInitiateRootCreation = () => {
    setSelectedNodeId(null);
    setIsCreatingChild(true);
  };

  // ---------------------------------------------
  // RENDER LEFT PANE (Tree)
  // ---------------------------------------------
  const LeftPane = (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Domain Structure
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {isTenantAdmin ? "Drag to reparent" : "Your assigned scope"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {treeQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <span className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : localNodes.length > 0 ? (
          <TreeList parentId={null} level={0} />
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
      {/* WORKSPACE TOOLBAR */}
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
            disabled={pendingMutations.length === 0}
            onClick={handleSaveWorkspace}
          >
            Save Workspace
          </Button>
        </div>
      </div>

      {/* RESIZABLE WORKSPACE */}
      <div className="flex-1 min-h-0">
        <ResizableLayout
          leftPane={LeftPane}
          rightPane={<DomainDetailsPanel />}
        />
      </div>
    </div>
  );
}
