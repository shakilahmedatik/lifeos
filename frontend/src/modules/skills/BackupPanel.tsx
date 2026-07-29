import { useRef, useState } from "react";
import {
  downloadBackupjson,
  exportBackup,
  importBackup,
  markBackupCompleted,
  shouldShowBackupReminder,
} from "./backup";

interface BackupPanelProps {
  onImportComplete: () => void;
}

export default function BackupPanel({ onImportComplete }: BackupPanelProps) {
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      const json = await exportBackup();
      downloadBackupjson(json);
      markBackupCompleted();
    } catch {
      setImportMessage({ type: "error", text: "Failed to export backup" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const json = event.target?.result as string;
      const result = await importBackup(json);
      setImportMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      if (result.success) {
        onImportComplete();
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {shouldShowBackupReminder() && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl">
          <p className="text-sm text-yellow-400">
            <strong>Backup reminder:</strong> Consider exporting your data to prevent loss.
          </p>
        </div>
      )}

      <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Export Data</h3>
        <p className="text-xs text-gray-500 mb-4">
          Download all your learning data as a JSON file.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 text-sm bg-green-600/20 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export Backup"}
        </button>
      </div>

      <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Import Data</h3>
        <p className="text-xs text-gray-500 mb-4">
          Import learning data from a backup file. This will replace all existing data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          id="import-file"
        />
        <label
          htmlFor="import-file"
          className="inline-block px-4 py-2 text-sm bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors cursor-pointer"
        >
          Select Backup File
        </label>
      </div>

      {importMessage && (
        <div
          className={`p-4 rounded-xl ${
            importMessage.type === "success"
              ? "bg-green-900/20 border border-green-600/30"
              : "bg-red-900/20 border border-red-600/30"
          }`}
        >
          <p
            className={`text-sm ${
              importMessage.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {importMessage.text}
          </p>
        </div>
      )}
    </div>
  );
}
