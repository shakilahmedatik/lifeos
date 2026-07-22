import { Outlet } from "react-router-dom";
import Dock from "./Sidebar.js";

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 shadow-lg">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-600/20">
            <span className="text-white font-bold text-[10px]">L</span>
          </div>
          <span className="text-sm font-semibold text-gray-300 tracking-wide">LifeOS</span>
        </div>
      </div>
      <main className="min-h-screen pb-24">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-6">
          <Outlet />
        </div>
      </main>
      <Dock />
    </div>
  );
}
