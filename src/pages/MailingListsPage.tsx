import { useEffect, useState } from "react";
import { useMLWorkspaceStore } from "../features/mailing-lists/stores/mailingList.store";
import { mailingListApi } from "../features/mailing-lists/services/mailingListApi.mock";
import { MailingListGrid } from "../features/mailing-lists/components/MailingListGrid";
import { MailingListDetailsPanel } from "../features/mailing-lists/components/MailingListDetailsPanel";
import { ResizableLayout } from "../features/domains/components/ResizableLayout"; // Reusing layout!
import { Card } from "../shared/components/Card";
import { Button } from "../shared/components/Button";
import { useAuthStore } from "../stores/auth.store";

export function MailingListsPage() {
  const admin = useAuthStore((s) => s.admin);
  const tenantId = admin?.tenantId || "tenant-a";

  const { 
    initWorkspace, pendingMutations, 
    undo, redo, pastStates, futureStates,
    setIsCreating
  } = useMLWorkspaceStore();

  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data (Mocking a TanStack query for brevity)
  useEffect(() => {
    mailingListApi.getAll(tenantId).then(data => {
      initWorkspace(data);
      setIsLoading(false);
    });
  }, [tenantId]);

  const handleSaveWorkspace = () => {
    console.log("Pushing ML mutations to backend:", pendingMutations);
    alert(`Saving ${pendingMutations.length} list changes to backend...`);
  };

  const LeftPane = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
      <div className="flex justify-between items-center p-4 border-b border-border z-10 bg-surface">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Mailing Lists</h3>
          <p className="text-xs text-text-muted mt-1">Automated routing groups</p>
        </div>
        <Button variant="ghost" className="px-3 py-1.5 text-xs border border-border" onClick={() => setIsCreating(true)}>
          + New List
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" /></div>
        ) : (
          <MailingListGrid />
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-surface border border-border rounded-xl p-3 px-5 shadow-sm">
        <div className="flex gap-2">
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={undo} disabled={pastStates.length === 0}>↶ Undo</Button>
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={redo} disabled={futureStates.length === 0}>↷ Redo</Button>
        </div>
        
        <div className="flex items-center gap-4">
          {pendingMutations.length > 0 && <span className="text-xs font-medium text-amber-500 animate-pulse">{pendingMutations.length} unsaved changes</span>}
          <Button variant={pendingMutations.length > 0 ? "primary" : "secondary"} disabled={pendingMutations.length === 0} onClick={handleSaveWorkspace}>
            Save Workspace
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResizableLayout leftPane={LeftPane} rightPane={<MailingListDetailsPanel />} />
      </div>
    </div>
  );
}