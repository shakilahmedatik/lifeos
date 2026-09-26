import { Activity, Database, HardDrive, Server } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { getDataSource } from "../../lib/dataSource.js";

export const SystemManagementCard: FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await getDataSource().getHealth();
        setHealthStatus(
          res.status === "ok" || res.status === "healthy" ? "Healthy (Online)" : res.status,
        );
      } catch (_err) {
        setHealthStatus("Offline / Unreachable");
      }
    };
    fetchHealth();
  }, []);

  return (
    <Card className="bg-card border-border p-6 shadow-sm rounded-2xl">
      <CardHeader className="mb-4">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <Database className="w-5 h-5 text-accent" />
          System & Storage Health
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3.5 bg-surface-elevated rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-accent">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Backend Server</p>
              <p className="text-xs text-muted">API Services & Endpoints</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> {healthStatus}
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-surface-elevated rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Local LibSQL DB</p>
              <p className="text-xs text-muted">Offline-Ready SQLite Engine</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
