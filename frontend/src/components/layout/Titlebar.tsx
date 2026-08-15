import { isTauri } from "../../lib/dataSource.js";

export default function Titlebar() {
  const handleDrag = async (e: React.MouseEvent) => {
    // Only handle left mouse button
    if (isTauri() && e.buttons === 1) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        getCurrentWindow().startDragging();
      } catch (err) {
        console.error("Failed to start dragging", err);
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleDrag}
      className="drag-region fixed top-0 left-0 right-0 h-8 z-9999 pointer-events-auto cursor-default select-none"
    />
  );
}
