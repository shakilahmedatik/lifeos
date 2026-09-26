import { KeyRound, LogOut, ShieldAlert, Smartphone } from "lucide-react";
import { type FC, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { useAuth } from "../../context/AuthContext.js";

export const AccountSecurityCard: FC = () => {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
  };

  return (
    <>
      <Card className="bg-card border-border p-6 shadow-sm rounded-2xl">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-accent" />
            Security & Session
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Active Browser Session</p>
                <p className="text-xs text-muted">Secured via local bearer token storage</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active Now
            </span>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> End Session
              </p>
              <p className="text-xs text-muted">
                Safely sign out of your LifeOS account on this device
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              icon={<LogOut className="w-4 h-4 mr-1" />}
              className="bg-red-500/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-all duration-200"
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
