import { useRef, useState } from "react";
import {
  downloadBackup,
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
  const [merge, setMerge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadBackup();
    markBackupCompleted();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const result = importBackup(json, merge);
      setImportMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      if (result.success) {
        onImportComplete();
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {shouldShowBackupReminder() && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Backup reminder:</strong> You have learning data that hasn't been backed up
            recently. Consider exporting your data to prevent loss.
          </p>
        </div>
      )}

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download all your learning data as a JSON file. This includes sessions, courses, and
          categories.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Export Backup
        </button>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Import learning data from a backup file. Choose whether to merge with existing data or
          replace it entirely.
        </p>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={merge}
              onChange={(e) => setMerge(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Merge with existing data</span>
          </label>
        </div>
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
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
        >
          Select Backup File
        </label>
      </div>

      {importMessage && (
        <div
          className={`p-4 rounded-lg ${
            importMessage.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              importMessage.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {importMessage.text}
          </p>
        </div>
      )}
    </div>
  );
}
