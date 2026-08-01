import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { fetchAccounts, fetchCategories, fetchTransactionsByDateRange } from "./api.js";

interface BackupPanelProps {
  onImportComplete?: () => void;
}

export function BackupPanel({ onImportComplete }: BackupPanelProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useAppToast();

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const now = new Date();
      const startDate = "2020-01-01";
      const endDate = `${now.getFullYear() + 5}-12-31`;

      const [transactions, categories, accounts] = await Promise.all([
        fetchTransactionsByDateRange(startDate, endDate),
        fetchCategories(),
        fetchAccounts(),
      ]);

      const catMap = new Map(categories.map((c) => [c.id, c]));
      const accMap = new Map(accounts.map((a) => [a.id, a]));

      const headers = ["ID", "Date", "Account", "Category", "Type", "Amount (BDT)", "Note"];
      const rows = transactions.map((tx) => {
        const cat = catMap.get(tx.categoryId);
        const acc = accMap.get(tx.accountId);
        const type = cat?.kind ?? "expense";
        const amount = (tx.amountMinor / 100).toFixed(2);
        const note = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : "";

        return [
          tx.id,
          tx.date,
          `"${acc?.name ?? tx.accountId}"`,
          `"${cat?.name ?? tx.categoryId}"`,
          type,
          amount,
          note,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = now.toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `finance-transactions-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Transactions exported to CSV");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const now = new Date();
      const startDate = "2020-01-01";
      const endDate = `${now.getFullYear() + 5}-12-31`;

      const [accounts, categories, transactions] = await Promise.all([
        fetchAccounts(),
        fetchCategories(),
        fetchTransactionsByDateRange(startDate, endDate),
      ]);

      const backupData = {
        version: "1.0",
        exportedAt: now.toISOString(),
        accounts,
        categories,
        transactions,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = now.toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `lifeos-finance-backup-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Finance backup exported successfully");
    } catch {
      toast.error("Failed to export JSON backup");
    } finally {
      setExportingJson(false);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        if (!data || (!data.accounts && !data.categories && !data.transactions)) {
          setImportMessage({
            type: "error",
            text: "Invalid backup file structure. Ensure it contains finance records.",
          });
          return;
        }

        const { createAccount, createCategory, createTransaction } = await import("./api.js");

        let accountsAdded = 0;
        let categoriesAdded = 0;
        let transactionsAdded = 0;

        if (Array.isArray(data.accounts)) {
          for (const acc of data.accounts) {
            try {
              await createAccount({ name: acc.name, type: acc.type });
              accountsAdded++;
            } catch {
              // skip duplicate or existing
            }
          }
        }

        if (Array.isArray(data.categories)) {
          for (const cat of data.categories) {
            try {
              await createCategory({ name: cat.name, kind: cat.kind });
              categoriesAdded++;
            } catch {
              // skip duplicate or existing
            }
          }
        }

        if (Array.isArray(data.transactions)) {
          for (const tx of data.transactions) {
            try {
              await createTransaction({
                accountId: tx.accountId,
                categoryId: tx.categoryId,
                date: tx.date,
                amountMinor: tx.amountMinor,
                currency: tx.currency,
                note: tx.note,
              });
              transactionsAdded++;
            } catch {
              // skip failed transaction imports
            }
          }
        }

        setImportMessage({
          type: "success",
          text: `Import complete! Restored ${accountsAdded} accounts, ${categoriesAdded} categories, and ${transactionsAdded} transactions.`,
        });
        toast.success("Finance data imported successfully");
        onImportComplete?.();
      } catch (err) {
        setImportMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to parse JSON backup file",
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="text-emerald-400" size={18} />
            <h3 className="text-sm font-semibold text-primary">Export Transactions (CSV)</h3>
          </div>
          <p className="text-xs text-muted mb-4">
            Download your full transaction history in CSV format for analysis in Excel or Google
            Sheets.
          </p>
          <Button
            variant="primary"
            onClick={handleExportCsv}
            disabled={exportingCsv}
            icon={<Download size={16} />}
          >
            {exportingCsv ? "Exporting CSV..." : "Export CSV"}
          </Button>
        </Card>

        <Card className="glass">
          <div className="flex items-center gap-2 mb-2">
            <Download className="text-accent" size={18} />
            <h3 className="text-sm font-semibold text-primary">Export Full Backup (JSON)</h3>
          </div>
          <p className="text-xs text-muted mb-4">
            Download a complete JSON snapshot of all your accounts, categories, and transactions.
          </p>
          <Button
            variant="secondary"
            onClick={handleExportJson}
            disabled={exportingJson}
            icon={<Download size={16} />}
          >
            {exportingJson ? "Exporting JSON..." : "Export Backup (JSON)"}
          </Button>
        </Card>
      </div>

      <Card className="glass">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="text-accent" size={18} />
          <h3 className="text-sm font-semibold text-primary">Restore Data from JSON Backup</h3>
        </div>
        <p className="text-xs text-muted mb-4">
          Import finance records from a previously exported JSON backup file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJson}
          className="hidden"
          id="finance-import-file"
        />
        <Button
          variant="secondary"
          icon={<Upload size={16} />}
          onClick={() => fileInputRef.current?.click()}
        >
          Select JSON Backup File
        </Button>
      </Card>

      {importMessage && (
        <div
          className={`p-4 rounded-xl border ${
            importMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
              : "bg-red-950/40 border-red-800/50 text-red-300"
          }`}
        >
          <p className="text-sm font-medium">{importMessage.text}</p>
        </div>
      )}
    </div>
  );
}
