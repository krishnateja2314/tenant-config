import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DomainNode } from "../types/domain.types";
import { useDomainWorkspaceStore } from "../stores/domain.store";

const isDescendant = (
  nodes: DomainNode[],
  targetId: string,
  potentialChildId: string,
): boolean => {
  let currentId: string | null = potentialChildId;
  while (currentId) {
    if (currentId === targetId) return true;
    const parent = nodes.find((d) => d._id === currentId);
    currentId = parent?.parentDomainId || null;
  }
  return false;
};

interface TreeListProps {
  parentId: string | null;
  level: number;
}

export function TreeList({ parentId, level }: TreeListProps) {
  const { localNodes } = useDomainWorkspaceStore();
  const children = localNodes.filter((n) => n.parentDomainId === parentId);

  if (children.length === 0) return null;

  return (
    <div className="w-full">
      {children.map((child) => (
        <TreeItem key={child._id} node={child} level={level} />
      ))}
    </div>
  );
}

function TreeItem({ node, level }: { node: DomainNode; level: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const { selectedNodeId, setSelectedNodeId, localNodes, commitLocalChange } =
    useDomainWorkspaceStore();

  const isSelected = selectedNodeId === node._id;
  const hasChildren = localNodes.some((n) => n.parentDomainId === node._id);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("domainId", node._id);
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-accent/20");

    const draggedId = e.dataTransfer.getData("domainId");
    if (draggedId && draggedId !== node._id) {
      if (isDescendant(localNodes, draggedId, node._id)) {
        alert("Cannot move a parent into its own child!");
        return;
      }
      const updatedNodes = localNodes.map((n) =>
        n._id === draggedId ? { ...n, parentDomainId: node._id } : n,
      );
      commitLocalChange(updatedNodes, {
        id: draggedId,
        type: "UPDATE",
        data: { parentDomainId: node._id },
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-accent/20");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-accent/20");
  };

  return (
    <div className="w-full">
      <div
        draggable
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => setSelectedNodeId(node._id)}
        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors mt-1 ${
          isSelected
            ? "bg-accent/10 border border-accent/30"
            : "hover:bg-surface-2"
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div
          className="w-6 flex justify-center items-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren && (
            <motion.span
              animate={{ rotate: isOpen ? 90 : 0 }}
              className="text-text-muted text-[10px] inline-block transform origin-center"
            >
              ▶
            </motion.span>
          )}
        </div>

        <span className="text-sm font-medium text-text-primary mr-2">
          {node.domainName}
        </span>
        <span className="text-[10px] px-2 py-0.5 bg-surface-2 text-text-muted rounded border border-border">
          {node.metadata.domainType}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden origin-top"
          >
            <TreeList parentId={node._id} level={level + 1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
