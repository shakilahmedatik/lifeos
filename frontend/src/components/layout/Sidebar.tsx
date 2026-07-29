import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  CheckCheck as CheckCheckIcon,
  Dumbbell as DumbbellIcon,
  GraduationCap as GraduationCapIcon,
  Home as HomeIcon,
  Newspaper as NewspaperIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

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
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto flex items-center gap-1 max-w-[95vw] overflow-x-auto px-3 py-2 rounded-2xl bg-sidebar/90 backdrop-blur-xl border border-border shadow-2xl shadow-black/50 scrollbar-none"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-w-11 min-h-11 w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-accent/15 text-accent -translate-y-1"
                  : "text-secondary hover:text-primary hover:bg-card-hover/50 hover:-translate-y-1"
              }`
            }
          >
            <item.icon size={20} />
            <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-sidebar text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg border border-border">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
