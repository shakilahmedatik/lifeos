import { Download, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent } from "../../../components/ui/Card.js";
import { habitApi } from "../api.js";

export function BackupPanel({ onImportComplete }: { onImportComplete: () => void }) {
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useAppToast();

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await habitApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-habits-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success("Export successful");
    } catch (_err) {
      error("Failed to export habits");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await habitApi.importData(json);
        success("Import successful");
        onImportComplete();
      } catch (_err) {
        error("Failed to import habits");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-200">Export Data</h3>
          <p className="text-xs text-gray-500">
            Download all your habits and activity logs as a JSON file.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={exporting}
              icon={<Download size={16} />}
            >
              {exporting ? "Exporting..." : "Export Backup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-200">Import Data</h3>
          <p className="text-xs text-gray-500">Import habits and logs from a JSON backup file.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <div className="pt-2">
            <Button
              variant="secondary"
              icon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Select Backup File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
