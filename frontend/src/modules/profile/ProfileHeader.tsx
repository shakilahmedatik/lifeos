import { CheckCircle2, ShieldCheck, Sparkles, User as UserIcon } from "lucide-react";
import type React from "react";
import Card from "../../components/ui/Card.js";
import type { UserSession } from "../../context/AuthContext.js";

interface ProfileHeaderProps {
  user: UserSession;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <Card className="relative overflow-hidden bg-card border-border p-6 sm:p-8 shadow-sm rounded-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {/* Modern Gradient Avatar Ring */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-linear-to-br from-blue-600 to-indigo-700 rounded-[14px] flex items-center justify-center text-white font-bold text-2xl sm:text-3xl tracking-wider shadow-inner">
              {initials || <UserIcon className="w-10 h-10 text-white" />}
            </div>
          </div>
          <div
            className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-card rounded-full p-1 shadow-md"
            title="Active Session"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* User Information */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary truncate">
              {user.name || "LifeOS User"}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 self-center sm:self-auto shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pro Member
            </span>
          </div>

          <p className="text-sm text-secondary font-medium truncate">{user.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-secondary">
            <div className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-lg border border-border shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">Session Authenticated</span>
            </div>
            <div className="bg-surface-elevated px-3 py-1.5 rounded-lg border border-border shadow-xs">
              User ID:{" "}
              <span className="font-mono text-primary font-semibold">
                {user.id.slice(0, 10)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
