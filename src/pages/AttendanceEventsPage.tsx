import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Alert, Spinner } from "../shared/components";
import { useAttendanceStore } from "../features/attendance/stores/attendance.store";
import { useAuthStore } from "../stores/auth.store";
import EventCreationForm from "../features/attendance/components/EventCreationForm";
import EventList from "../features/attendance/components/EventList";
import CSVUploadForm from "../features/attendance/components/CSVUploadForm";
import { useDomains } from "../features/domains/hooks/useDomains";
import { useDomainWorkspaceStore } from "../features/domains/stores/domain.store";
import { TreeList } from "../features/domains/components/TreeList";
import { TreeCanvas } from "../features/domains/components/TreeCanvas";
import { ResizableLayout } from "../features/domains/components/ResizableLayout";
import { useErrorMessage } from "../hooks/useErrorMessage";

export default function AttendanceEventsPage() {
  const admin = useAuthStore((state) => state.admin);
  const { events, loading, fetchEvents, deleteEvent } = useAttendanceStore();
  const { error, setError } = useErrorMessage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "import">(
    "list",
  );

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

  useEffect(() => {
    const checkAuth = async () => {
      if (!admin) {
        navigate({ to: "/login" });
        return;
      }

      if (admin.role !== "TENANT_ADMIN") {
        navigate({ to: "/auth-config" });
        return;
      }
    };

    checkAuth();
  }, [admin, navigate]);

  useEffect(() => {
    if (admin?.tenantId) {
      fetchEvents(admin.tenantId);
    }
  }, [admin?.tenantId, fetchEvents]);

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const leftPane = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
      <div className="flex justify-between items-center p-4 border-b border-border z-10 bg-surface">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Domain Structure
          </h3>
          <p className="text-xs text-text-muted mt-1">
            View domains while configuring attendance events.
          </p>
        </div>

        <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-surface text-accent shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("canvas")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "canvas"
                ? "bg-surface text-accent shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Canvas
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden relative ${
          viewMode === "list" ? "p-4 overflow-y-auto" : ""
        }`}
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
            <p className="text-sm text-text-muted">
              No domain structure loaded.
            </p>
          </div>
        )}
      </div>
    </Card>
  );

  const rightPane = (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Attendance Events
            </h1>
            <p className="text-sm text-text-muted">
              Create and manage attendance events for your tenant.
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

        {error && <Alert type="error" message={error} />}

        <div className="border-b border-border">
          <nav className="flex space-x-8" aria-label="Tabs">
            {(["list", "create", "import"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
                }`}
              >
                {tab === "list"
                  ? "Events"
                  : tab === "create"
                    ? "Create Event"
                    : "Import CSV"}
              </button>
            ))}
          </nav>
        </div>

        {loading && activeTab === "list" ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : activeTab === "list" ? (
          <EventList
            events={events}
            tenantId={admin.tenantId}
            onDeleteEvent={(eventId) => deleteEvent(admin.tenantId, eventId)}
          />
        ) : activeTab === "create" ? (
          <EventCreationForm tenantId={admin.tenantId} />
        ) : (
          <CSVUploadForm tenantId={admin.tenantId} events={events} />
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex-1 min-h-0">
        <ResizableLayout leftPane={leftPane} rightPane={rightPane} />
      </div>
    </div>
  );
}
