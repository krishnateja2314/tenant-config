import { useState, useEffect } from "react";
import { useDomainWorkspaceStore } from "../stores/domain.store";
import { Card } from "../../../shared/components/Card";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";
import { DomainType } from "../types/domain.types";
import { useAuthStore } from "../../../stores/auth.store";
import { Check } from "lucide-react";
export function DomainDetailsPanel() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (selectedNode?._id) {
      navigator.clipboard.writeText(selectedNode._id);
      setCopied(true);
      // Reset back to "Copy" after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const admin = useAuthStore((s) => s.admin);
  const isTenantAdmin = admin?.role === "TENANT_ADMIN";

  const {
    localNodes,
    selectedNodeId,
    commitLocalChange,
    isCreatingChild,
    setIsCreatingChild,
    isEditing,
    setIsEditing,
  } = useDomainWorkspaceStore();

  const selectedNode = localNodes.find((n) => n._id === selectedNodeId);

  const [formData, setFormData] = useState({
    domainName: "",
    domainType: "DEPARTMENT" as DomainType,
    description: "",
    domainAdminId: "",
  });

  const domainNameFieldId = "domain-name-field";
  const domainTypeFieldId = "domain-type-field";
  const descriptionFieldId = "domain-description-field";
  const domainAdminIdFieldId = "domain-admin-id-field";

  useEffect(() => {
    if (isEditing && selectedNode) {
      setFormData({
        domainName: selectedNode.domainName,
        domainType: selectedNode.metadata.domainType,
        description: selectedNode.metadata.description,
        domainAdminId: selectedNode.domainAdminId || "",
      });
    } else if (isCreatingChild) {
      setFormData({
        domainName: "",
        domainType: "DEPARTMENT",
        description: "",
        domainAdminId: "",
      });
    }
  }, [isEditing, isCreatingChild, selectedNode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.domainName.trim()) return;

    if (isEditing && selectedNode) {
      const updatedNode = {
        ...selectedNode,
        domainName: formData.domainName,
        domainAdminId: formData.domainAdminId || null,
        metadata: {
          ...selectedNode.metadata,
          domainType: formData.domainType,
          description: formData.description,
        },
        updatedAt: new Date().toISOString(),
      };
      const newNodes = localNodes.map((n) =>
        n._id === selectedNode._id ? updatedNode : n,
      );
      commitLocalChange(newNodes, {
        id: selectedNode._id,
        type: "UPDATE",
        data: updatedNode,
      });
      setIsEditing(false);
    } else if (isCreatingChild) {
      const isRoot = !selectedNode;
      const tempId = `temp-${Date.now()}`;
      const newNode = {
        _id: tempId,
        tenantId: admin?.tenantId || "tenant",
        domainName: formData.domainName,
        parentDomainId: isRoot ? null : selectedNode._id,
        domainAdminId: formData.domainAdminId || null,
        metadata: {
          domainType: formData.domainType,
          description: formData.description,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      commitLocalChange([...localNodes, newNode], {
        id: tempId,
        type: "CREATE",
        data: newNode,
      });
      setIsCreatingChild(false);
    }
  };

  const handleDeleteLocal = () => {
    if (!selectedNode) return;
    const newNodes = localNodes.filter((n) => n._id !== selectedNode._id);
    commitLocalChange(newNodes, { id: selectedNode._id, type: "DELETE" });
  };

  if (!selectedNode && !isCreatingChild) {
    return (
      <Card className="h-full flex items-center justify-center">
        <span className="text-text-muted text-sm">
          Select a domain node from the tree to view configurations.
        </span>
      </Card>
    );
  }

  if (isCreatingChild || isEditing) {
    return (
      <Card className="h-full overflow-y-auto">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <button
              onClick={() => {
                setIsCreatingChild(false);
                setIsEditing(false);
              }}
              className="text-text-muted hover:text-text-primary"
            >
              ← Back
            </button>
            <h2 className="text-lg font-bold text-text-primary">
              {isEditing
                ? `Edit "${selectedNode?.domainName}"`
                : selectedNode
                  ? `Create Child under "${selectedNode.domainName}"`
                  : "Create Root Domain"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor={domainNameFieldId}
                className="text-xs font-semibold text-text-primary mb-1 block"
              >
                Domain Name
              </label>
              <Input
                id={domainNameFieldId}
                value={formData.domainName}
                onChange={(e) =>
                  setFormData({ ...formData, domainName: e.target.value })
                }
                required
              />
            </div>

            {(!isEditing || selectedNode?.parentDomainId !== null) && (
              <div>
                <label
                  htmlFor={domainTypeFieldId}
                  className="text-xs font-semibold text-text-primary mb-1 block"
                >
                  Domain Type
                </label>
                <select
                  id={domainTypeFieldId}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  value={formData.domainType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      domainType: e.target.value as DomainType,
                    })
                  }
                >
                  <option value="DEPARTMENT">Department</option>
                  <option value="YEAR">Academic Year</option>
                  <option value="SECTION">Section</option>
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor={descriptionFieldId}
                className="text-xs font-semibold text-text-primary mb-1 block"
              >
                Description
              </label>
              <Input
                id={descriptionFieldId}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional"
              />
            </div>

            {isTenantAdmin && (
              <div>
                <label
                  htmlFor={domainAdminIdFieldId}
                  className="text-xs font-semibold text-accent mb-1 block"
                >
                  Assign Domain Admin ID (RBAC)
                </label>
                <Input
                  id={domainAdminIdFieldId}
                  value={formData.domainAdminId}
                  onChange={(e) =>
                    setFormData({ ...formData, domainAdminId: e.target.value })
                  }
                  placeholder="e.g., admin-123 (Optional)"
                />
              </div>
            )}

            <div className="pt-2">
              <Button type="submit">Save to Local Workspace</Button>
            </div>
          </form>
        </div>
      </Card>
    );
  }

  const hasChildren = localNodes.some(
    (n) => n.parentDomainId === selectedNode?._id,
  );

  return (
    <Card className="h-full overflow-y-auto">
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-start border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {selectedNode?.domainName}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {selectedNode?.metadata.description || "No description provided."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsCreatingChild(true)}
            >
              + Child
            </Button>
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            {isTenantAdmin && (
              <Button
                variant="danger"
                onClick={handleDeleteLocal}
                disabled={hasChildren}
                title={
                  hasChildren
                    ? "Delete Disabled: You can only delete leaf nodes (nodes with no children)."
                    : "Delete this domain"
                }
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* --- DOMAIN ID DISPLAY BLOCK --- */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
              Domain Identifier
            </h3>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Copy this ID to link Mailing Lists, Infrastructure, or Academic
            configurations to this specific domain.
          </p>
          <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-2.5">
            <code className="text-sm text-text-primary font-mono select-all">
              {selectedNode?._id}
            </code>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 text-[10px] font-semibold px-3 py-1.5 rounded transition-all ${
                copied
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-surface-2 hover:bg-border text-text-primary"
              }`}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* ---------------------------------- */}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Node Specifications
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-2 p-3 rounded-lg border border-border">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">
                Domain Type
              </span>
              <span className="text-sm text-text-primary">
                {selectedNode?.metadata.domainType}
              </span>
            </div>
            <div className="bg-surface-2 p-3 rounded-lg border border-border">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block mb-1">
                Assigned Domain Admin
              </span>
              <span className="text-sm text-text-primary">
                {selectedNode?.domainAdminId ? (
                  <span className="text-accent font-medium">
                    {selectedNode.domainAdminId}
                  </span>
                ) : (
                  <span className="italic text-text-muted/70">
                    None (Tenant Admin Controlled)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
