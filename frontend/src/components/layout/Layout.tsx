import { Outlet } from "react-router-dom";
import MobileTabBar from "./MobileTabBar.js";
import Sidebar from "./Sidebar.js";
import Titlebar from "./Titlebar.js";

export default function Layout() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-surface flex">
      <Titlebar />
      <Sidebar />

      <main className="flex-1 min-h-screen relative z-10 sm:ml-20">
        <div className="w-full mx-auto px-4 sm:px-8 pt-8 pb-24 sm:pb-8 relative z-10">
          <Outlet />
        </div>
      </main>

      <div className="relative z-50">
        <MobileTabBar />
      </div>
    </div>
  );
}
