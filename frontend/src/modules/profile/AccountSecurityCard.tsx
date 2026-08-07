import { KeyRound, LogOut, ShieldAlert } from "lucide-react";
import type React from "react";
import { useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { useAuth } from "../../context/AuthContext.js";

export const AccountSecurityCard: React.FC = () => {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
  };

  return (
    <>
      <Card className="bg-surface/60 border-slate-800 p-6 shadow-lg">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Security & Session
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Active Session</p>
              <p className="text-xs text-slate-400">Authenticated on this browser device</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Log Out of LifeOS
              </p>
              <p className="text-xs text-slate-400">
                Safely end your current session on this device
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              icon={<LogOut className="w-4 h-4 mr-1" />}
              className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold px-4 py-2 rounded-xl text-xs shrink-0 transition-all duration-200"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign Out of LifeOS?"
        message="Are you sure you want to log out of your LifeOS account? You will need your email and password to sign back in."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
