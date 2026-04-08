import { useState, useRef, useEffect } from "react";
import { DomainNode } from "../types/domain.types";
import { useDomainWorkspaceStore } from "../stores/domain.store";

// Helper: Cycle check for drag and drop
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

// --- Recursive Canvas Node ---
function CanvasNode({ node }: { node: DomainNode }) {
  const { localNodes, selectedNodeId, setSelectedNodeId, commitLocalChange } =
    useDomainWorkspaceStore();
  const children = localNodes.filter((n) => n.parentDomainId === node._id);
  const isSelected = selectedNodeId === node._id;

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("domainId", node._id);
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-4", "ring-accent/50");

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
    e.currentTarget.classList.add("ring-4", "ring-accent/50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-4", "ring-accent/50");
  };

  return (
    <li className="relative float-left text-center list-none px-2 pt-6 pb-0 transition-all duration-300">
      <div className="flex flex-col items-center justify-center">
        {/* THE NODE CARD */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeId(node._id);
          }}
          className={`node-card relative z-10 w-48 bg-surface border rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
            isSelected ? "border-accent ring-2 ring-accent/20" : "border-border"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs px-2 py-0.5 bg-surface-2 text-text-muted rounded-full border border-border inline-block">
              {node.metadata.domainType}
            </span>
            <span
              className="text-sm font-bold text-text-primary mt-1 text-center truncate w-full"
              title={node.domainName}
            >
              {node.domainName}
            </span>
            {node.domainAdminId ? (
              <span className="text-[10px] text-accent mt-1 truncate max-w-full">
                👤 {node.domainAdminId}
              </span>
            ) : (
              <span className="text-[10px] text-text-muted mt-1">
                Tenant Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CHILDREN CONTAINER */}
      {children.length > 0 && (
        <ul className="pt-6 relative transition-all duration-300 flex justify-center">
          {children.map((child) => (
            <CanvasNode key={child._id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

// --- Main Canvas Wrapper ---
export function TreeCanvas() {
  const { localNodes } = useDomainWorkspaceStore();
  const rootNodes = localNodes.filter((n) => n.parentDomainId === null);

  // Pan and Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 50 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle zooming via scroll wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scrolling
      const zoomSensitivity = 0.0015;
      const newScale = Math.min(
        Math.max(0.2, scale - e.deltaY * zoomSensitivity),
        3,
      );
      setScale(newScale);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale]);

  // Handle Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent panning if we are clicking/dragging a node card
    if ((e.target as HTMLElement).closest(".node-card")) return;

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full overflow-hidden bg-surface-2 cursor-move"
      style={{
        // Checkerboard Background that scales and pans with the tree!
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${40 * scale}px ${40 * scale}px`,
        backgroundPosition: `${position.x}px ${position.y}px`,
      }}
    >
      {/* CSS to draw the Org Chart Lines */}
      <style>{`
        .org-tree ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #e5e7eb; width: 0; height: 24px; transform: translateX(-50%); }
        .org-tree li::before, .org-tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #e5e7eb; width: 50%; height: 24px; }
        .org-tree li::after { right: auto; left: 50%; border-left: 2px solid #e5e7eb; }
        .org-tree li:only-child::after, .org-tree li:only-child::before { display: none; }
        .org-tree li:only-child { padding-top: 0; }
        .org-tree li:first-child::before, .org-tree li:last-child::after { border: 0 none; }
        .org-tree li:last-child::before { border-right: 2px solid #e5e7eb; border-radius: 0 8px 0 0; }
        .org-tree li:first-child::after { border-radius: 8px 0 0 0; }
        .org-tree.root-level > li::before, .org-tree.root-level > li::after { display: none; }
      `}</style>

      {/* The Transform Layer */}
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-linear"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
      >
        <div className="flex justify-center min-w-max p-10">
          {rootNodes.length > 0 ? (
            <ul className="org-tree root-level flex justify-center gap-8">
              {rootNodes.map((rootNode) => (
                <CanvasNode key={rootNode._id} node={rootNode} />
              ))}
            </ul>
          ) : (
            <div className="text-text-muted mt-20">
              No domains to display. Create a root domain.
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 bg-surface p-1 rounded-lg border border-border shadow-sm">
        <button
          onClick={() => setScale((s) => Math.max(0.2, s - 0.2))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-2 text-text-primary font-bold"
        >
          -
        </button>
        <div className="w-12 flex items-center justify-center text-xs text-text-muted font-medium">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-2 text-text-primary font-bold"
        >
          +
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 50 });
          }}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-2 text-text-primary text-xs"
          title="Reset View"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
