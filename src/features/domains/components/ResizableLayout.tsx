import { ReactNode, useEffect, useRef } from "react";
import { useDomainWorkspaceStore } from "../stores/domain.store";

interface ResizableLayoutProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
}

export function ResizableLayout({ leftPane, rightPane }: ResizableLayoutProps) {
  const { leftPaneWidth, setLeftPaneWidth } = useDomainWorkspaceStore();
  const isDragging = useRef(false);

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
    if (!isDragging.current) return;

    // Calculate new width as a percentage of the window
    // Adjusting slightly for padding
    const containerWidth = window.innerWidth - 256; // 256px is roughly the sidebar width
    const newWidthPercentage = ((e.clientX - 256) / containerWidth) * 100;

    // Constrain the resize between 20% and 80%
    if (newWidthPercentage >= 20 && newWidthPercentage <= 80) {
      setLeftPaneWidth(newWidthPercentage);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden gap-2">
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
