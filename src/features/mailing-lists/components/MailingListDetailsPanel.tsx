import { useState, useEffect } from "react";
import { useMLWorkspaceStore } from "../stores/mailingList.store";
import { Card } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { DynamicRuleAction } from "../types/mailingList.types";
import { useAuthStore } from "../../../stores/auth.store";

export function MailingListDetailsPanel() {
  const admin = useAuthStore((s) => s.admin);
  const {
    localLists,
    selectedListId,
    commitLocalChange,
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
  } = useMLWorkspaceStore();

  const selectedList = localLists.find((l) => l._id === selectedListId);

  const [formData, setFormData] = useState({
    listName: "",
    domainLinkedId: "",
    action: "AUTO_ADD" as DynamicRuleAction,
    includeChildren: true,
    isActive: true,
  });

  useEffect(() => {
    if (isEditing && selectedList) {
      setFormData({
        listName: selectedList.listName,
        domainLinkedId: selectedList.domainLinkedId,
        action: selectedList.dynamicRule.action,
        includeChildren: selectedList.dynamicRule.includeChildren,
        isActive: selectedList.isActive,
      });
    } else if (isCreating) {
      setFormData({
        listName: "",
        domainLinkedId: "",
        action: "AUTO_ADD",
        includeChildren: true,
        isActive: true,
      });
    }
  }, [isEditing, isCreating, selectedList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.listName.trim() || !formData.domainLinkedId.trim()) return;

    const dynamicRule = {
      action: formData.action,
      includeChildren: formData.includeChildren,
    };

    if (isEditing && selectedList) {
      const updatedList = {
        ...selectedList,
        ...formData,
        dynamicRule,
        updatedAt: new Date().toISOString(),
      };
      const newLists = localLists.map((l) =>
        l._id === selectedList._id ? updatedList : l,
      );
      commitLocalChange(newLists, {
        id: selectedList._id,
        type: "UPDATE",
        data: updatedList,
      });
      setIsEditing(false);
    } else if (isCreating) {
      const tempId = `temp-ml-${Date.now()}`;
      const newList = {
        _id: tempId,
        tenantId: admin?.tenantId || "tenant-a",
        ...formData,
        dynamicRule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      commitLocalChange([...localLists, newList], {
        id: tempId,
        type: "CREATE",
        data: newList,
      });
      setIsCreating(false);
    }
  };

  const handleDeleteLocal = () => {
    if (!selectedList) return;
    const newLists = localLists.filter((l) => l._id !== selectedList._id);
    commitLocalChange(newLists, { id: selectedList._id, type: "DELETE" });
  };

  if (!selectedList && !isCreating) {
    return (
      <Card className="h-full flex items-center justify-center text-sm text-text-muted">
        Select a mailing list to view configurations.
      </Card>
    );
  }

  if (isCreating || isEditing) {
    return (
      <Card className="h-full overflow-y-auto">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
              }}
              className="text-text-muted hover:text-text-primary"
            >
              ← Back
            </button>
            <h2 className="text-lg font-bold text-text-primary">
              {isEditing ? "Edit Mailing List" : "Create Mailing List"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label
                htmlFor="mailing-list-name"
                className="text-xs font-semibold text-text-primary mb-1 block"
              >
                List Name
              </label>
              <Input
                id="mailing-list-name"
                value={formData.listName}
                onChange={(e) =>
                  setFormData({ ...formData, listName: e.target.value })
                }
                placeholder="e.g., CSE Announcements"
                required
              />
            </div>

            <div>
              <label
                htmlFor="mailing-list-domain-id"
                className="text-xs font-semibold text-text-primary mb-1 block"
              >
                Target Domain ID
              </label>
              {/* In a real app, this would be an Autocomplete Dropdown connected to the Domain Query */}
              <Input
                id="mailing-list-domain-id"
                value={formData.domainLinkedId}
                onChange={(e) =>
                  setFormData({ ...formData, domainLinkedId: e.target.value })
                }
                placeholder="e.g., root-1 or sec-a"
                required
              />
              <p className="text-[10px] text-text-muted mt-1">
                Users entering this domain will trigger routing rules.
              </p>
            </div>

            <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Dynamic Automation Rules
              </h3>

              <div>
                <label
                  htmlFor="mailing-list-action"
                  className="text-xs font-semibold text-text-primary mb-1 block"
                >
                  Trigger Action
                </label>
                <select
                  id="mailing-list-action"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value as DynamicRuleAction,
                    })
                  }
                >
                  <option value="AUTO_ADD">Auto-Add (Silent)</option>
                  <option value="APPROVAL_REQUIRED">
                    Require Admin Approval
                  </option>
                </select>
              </div>

              {/* <label className="flex items-center gap-3 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={formData.includeChildren}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeChildren: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary block">
                    Cascade to Child Domains
                  </span>
                  <span className="text-xs text-text-muted">
                    Apply this list to all domains nested under the target.
                  </span>
                </div>
              </label> */}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-accent bg-surface border-border rounded"
              />
              <span className="text-sm font-medium text-text-primary">
                List is Active
              </span>
            </label>

            <div className="pt-2">
              <Button type="submit">Save to Local Workspace</Button>
            </div>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-y-auto">
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-start border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {selectedList?.listName}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${selectedList?.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-surface-2 text-text-muted border-border"}`}
              >
                {selectedList?.isActive ? "Active Routing" : "Routing Paused"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit Rules
            </Button>
            <Button variant="danger" onClick={handleDeleteLocal}>
              Delete
            </Button>
          </div>
        </div>

        {/* M2M Integration Block (Answers your request for cross-team visibility) */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
            M2M Integration Endpoint
          </h3>
          <p className="text-xs text-text-muted mb-2">
            Other services can route messages to this list using the Domain ID
            below.
          </p>
          <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-2.5">
            <code className="text-sm text-text-primary font-mono">
              {selectedList?.domainLinkedId}
            </code>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  selectedList?.domainLinkedId || "",
                )
              }
              className="text-[10px] bg-surface-2 hover:bg-border text-text-primary px-3 py-1.5 rounded transition-colors"
            >
              Copy ID
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Automation Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-2 p-3 rounded-lg border border-border">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">
                Trigger Action
              </span>
              <span className="text-sm text-text-primary">
                {selectedList?.dynamicRule.action.replace("_", " ")}
              </span>
            </div>
            <div className="bg-surface-2 p-3 rounded-lg border border-border">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">
                Cascading Rules
              </span>
              <span className="text-sm text-text-primary">
                {selectedList?.dynamicRule.includeChildren
                  ? "Includes Child Domains"
                  : "Target Domain Only"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
