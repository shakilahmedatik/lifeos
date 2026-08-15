import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  CheckCheck as CheckCheckIcon,
  Dumbbell as DumbbellIcon,
  GraduationCap as GraduationCapIcon,
  Home as HomeIcon,
  Newspaper as NewspaperIcon,
  User as UserIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { SyncButton } from "../SyncButton.js";

const navItems = [
  { to: "/", icon: HomeIcon, label: "Home" },
  { to: "/routine", icon: CalendarIcon, label: "Tasks" },
  { to: "/habits", icon: CheckCheckIcon, label: "Habits" },
  { to: "/workouts", icon: DumbbellIcon, label: "Workouts" },
  { to: "/skills", icon: GraduationCapIcon, label: "Skills" },
  { to: "/finance", icon: WalletIcon, label: "Finance" },
  { to: "/news", icon: NewspaperIcon, label: "News" },
  { to: "/notifications", icon: BellIcon, label: "Alerts" },
  { to: "/profile", icon: UserIcon, label: "Profile" },
];

export default function Sidebar() {
  return (
    <aside className="hidden sm:flex flex-col h-screen bg-sidebar glass border-r border-border fixed left-0 top-0 z-40 pt-10 pb-4 shadow-lg shadow-black/5 w-20 px-2">
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2 space-y-1 mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center justify-center gap-3 py-2 rounded-lg transition-colors duration-150 ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-secondary hover:bg-card-hover hover:text-primary"
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
          </NavLink>
        ))}
      </div>

      <div className="pt-4 border-t border-border mt-auto flex justify-center px-0">
        <SyncButton compact />
      </div>
    </aside>
  );
}
