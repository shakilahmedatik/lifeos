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

export default function Dock() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-0 sm:pb-3 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto w-full sm:w-auto max-w-full sm:max-w-[95vw] flex items-center justify-between sm:justify-start gap-1 overflow-x-auto px-2 py-2 sm:px-3 sm:py-2 rounded-t-2xl sm:rounded-2xl bg-sidebar/95 backdrop-blur-lg border-t border-x-0 border-b-0 sm:border sm:border-border shadow-2xl shadow-black/50 scrollbar-none"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex-1 sm:flex-initial flex flex-col items-center justify-center min-w-[40px] h-11 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-accent/15 text-accent sm:-translate-y-1"
                  : "text-secondary hover:text-primary hover:bg-card-hover/50 sm:hover:-translate-y-1"
              }`
            }
          >
            <item.icon size={19} className="sm:w-[20px] sm:h-[20px]" />
            <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-sidebar text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg border border-border">
              {item.label}
            </span>
          </NavLink>
        ))}
        <div className="ml-1 pl-1 border-l border-border hidden sm:block">
          <SyncButton />
        </div>
      </nav>
    </div>
  );
}
