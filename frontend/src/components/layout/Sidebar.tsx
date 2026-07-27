import { NavLink } from "react-router-dom";
import {
  BellIcon,
  CalendarIcon,
  CheckCheckIcon,
  DumbbellIcon,
  GraduationCapIcon,
  HomeIcon,
  NewspaperIcon,
  WalletIcon,
} from "../ui/icons.js";

const navItems = [
  { to: "/", icon: HomeIcon, label: "Home" },
  { to: "/routine", icon: CalendarIcon, label: "Tasks" },
  { to: "/habits", icon: CheckCheckIcon, label: "Habits" },
  { to: "/workouts", icon: DumbbellIcon, label: "Workouts" },
  { to: "/skills", icon: GraduationCapIcon, label: "Skills" },
  { to: "/finance", icon: WalletIcon, label: "Finance" },
  { to: "/news", icon: NewspaperIcon, label: "News" },
  { to: "/notifications", icon: BellIcon, label: "Alerts" },
];

export default function Dock() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 -translate-y-1"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/50 hover:-translate-y-1"
              }`
            }
          >
            <item.icon size={20} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg border border-gray-700/50">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
