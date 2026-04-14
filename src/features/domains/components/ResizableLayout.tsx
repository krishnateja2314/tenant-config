import { ReactNode, useEffect, useRef } from "react";
import { useDomainWorkspaceStore } from "../stores/domain.store";

interface ResizableLayoutProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
}

export function ResizableLayout({ leftPane, rightPane }: ResizableLayoutProps) {
  const { leftPaneWidth, setLeftPaneWidth } = useDomainWorkspaceStore();
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none"; // Prevent text selection while dragging
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerBounds = containerRef.current.getBoundingClientRect();
    const containerWidth = containerBounds.width;
    const pointerX = e.clientX - containerBounds.left;
    const newWidthPercentage = (pointerX / containerWidth) * 100;

    // Constrain the resize between 20% and 80%
    if (newWidthPercentage >= 20 && newWidthPercentage <= 80) {
      setLeftPaneWidth(newWidthPercentage);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full h-full overflow-hidden gap-2"
    >
      {/* LEFT PANE */}
      <div
        style={{ width: `${leftPaneWidth}%` }}
        className="h-full flex flex-col"
      >
        {leftPane}
      </div>

      {/* RESIZER HANDLE */}
      <div
        onMouseDown={handleMouseDown}
        className="w-4 flex-shrink-0 cursor-col-resize hover:bg-surface-2 active:bg-surface-2 transition-colors flex items-center justify-center group rounded-lg"
      >
        <div className="h-12 w-1 bg-border group-hover:bg-accent rounded-full transition-colors" />
      </div>

      {/* RIGHT PANE */}
      <div
        style={{ width: `${100 - leftPaneWidth}%` }}
        className="h-full flex flex-col"
      >
        {rightPane}
      </div>
    </div>
  );
}
