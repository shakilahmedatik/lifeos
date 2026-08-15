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

export default function MobileTabBar() {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar glass-heavy border-t border-border pb-safe pt-1">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-colors duration-150 ${
                isActive
                  ? "text-accent"
                  : "text-secondary hover:text-primary hover:bg-card-hover/50"
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
        <div className="ml-2 pl-2 border-l border-border h-8 flex items-center shrink-0">
          <SyncButton />
        </div>
      </nav>
    </div>
  );
}
