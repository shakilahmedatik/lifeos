import { Activity, Database, Download, Server } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { api } from "../../lib/api.js";

export const SystemManagementCard: FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealthStatus(
          res.status === "ok" || res.status === "healthy" ? "Healthy (Online)" : res.status,
        );
      } catch (_err) {
        setHealthStatus("Offline / Unreachable");
      }
    };
    fetchHealth();
  }, []);

  const handleBackupDownload = async () => {
    setDownloading(true);
    setDownloadMsg(null);
    try {
      const blob = await api.exportBackupJson();
      const filename = `lifeos-backup-${new Date().toISOString().split("T")[0]}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadMsg(`Successfully downloaded ${filename}!`);
    } catch (_err) {
      setDownloadMsg("Failed to export database backup.");
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(null), 5000);
    }
  };

  return (
    <Card className="bg-surface border-border p-6 shadow-lg">
      <CardHeader className="mb-4">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          System Health & Backup
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3.5 bg-surface-elevated rounded-xl border border-border-subtle">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-primary">Backend Server Status</p>
              <p className="text-xs text-muted">LibSQL SQLite Database & Services</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> {healthStatus}
          </span>
        </div>

        <div className="p-4 bg-surface-elevated rounded-xl border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">System Data Export</p>
            <p className="text-xs text-muted">
              Export a complete snapshot of your tasks, habits, workouts, and skills
            </p>
          </div>

          <Button
            type="button"
            loading={downloading}
            onClick={handleBackupDownload}
            icon={<Download className="w-4 h-4 mr-1" />}
            className="bg-card hover:bg-card-hover text-primary border border-border font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors"
          >
            Export Backup JSON
          </Button>
        </div>

        {downloadMsg && (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg animate-fade-in">
            {downloadMsg}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
