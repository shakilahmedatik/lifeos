import { Download, FileSpreadsheet, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import Button from "./Button.js";
import Card from "./Card.js";
import Alert from "./Alert.js";

export interface BackupPanelProps {
  entityName: string;
  onExportJson: () => Promise<any>;
  onExportCsv?: () => Promise<string>;
  onImportJson: (data: any) => Promise<{ success: boolean; message: string }>;
  header?: React.ReactNode;
}

export default function BackupPanel({
  entityName,
  onExportJson,
  onExportCsv,
  onImportJson,
  header,
}: BackupPanelProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (content: BlobPart, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    if (!onExportCsv) return;
    setExportingCsv(true);
    try {
      const csvStr = await onExportCsv();
      downloadFile(
        csvStr,
        `${entityName.toLowerCase()}-transactions-${new Date().toISOString().split("T")[0]}.csv`,
        "text/csv;charset=utf-8;"
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const data = await onExportJson();
      const jsonStr = JSON.stringify(data, null, 2);
      downloadFile(
        jsonStr,
        `lifeos-${entityName.toLowerCase()}-backup-${new Date().toISOString().split("T")[0]}.json`,
        "application/json"
      );
    } finally {
      setExportingJson(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await onImportJson(json);
      setImportResult({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (error) {
      setImportResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to import data",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {header}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onExportCsv && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="text-success" size={18} />
              <h3 className="text-sm font-semibold text-primary">Export Transactions (CSV)</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Download your full history in CSV format for analysis.
            </p>
            <Button
              variant="primary"
              onClick={handleExportCsv}
              disabled={exportingCsv || exportingJson || importing}
              loading={exportingCsv}
              icon={<Download size={16} />}
            >
              Export CSV
            </Button>
          </Card>
        )}

        <Card padding="md">
          <div className="flex items-center gap-2 mb-2">
            <Download className="text-accent" size={18} />
            <h3 className="text-sm font-semibold text-primary">Export Full Backup (JSON)</h3>
          </div>
          <p className="text-xs text-muted mb-4">
            Download a complete JSON snapshot of all your {entityName.toLowerCase()} data.
          </p>
          <Button
            variant="secondary"
            onClick={handleExportJson}
            disabled={exportingCsv || exportingJson || importing}
            loading={exportingJson}
            icon={<Download size={16} />}
          >
            Export Backup (JSON)
          </Button>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="text-accent" size={18} />
          <h3 className="text-sm font-semibold text-primary">Restore Data from JSON Backup</h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Import {entityName.toLowerCase()} records from a previously exported JSON backup file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          id={`${entityName.toLowerCase()}-import-file`}
        />
        <Button
          variant="secondary"
          icon={<Upload size={16} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={exportingCsv || exportingJson || importing}
          loading={importing}
        >
          Select JSON Backup File
        </Button>
      </Card>

      {importResult && (
        <Alert variant={importResult.type} message={importResult.message} />
      )}
    </div>
  );
}
