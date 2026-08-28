import type { Transaction } from "@lifeos/contracts";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import BackupPanel from "../components/ui/BackupPanel.js";
import Button from "../components/ui/Button.js";
import Modal from "../components/ui/Modal.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import {
  AccountList,
  CategoryList,
  MonthlyView,
  TransactionForm,
  TransactionList,
  useFinanceBackup,
} from "../modules/finance/index.js";

type Tab = "overview" | "transactions" | "accounts" | "categories" | "backup";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setShowTransactionModal(true);
  }, []);

  const { exportCsv, exportJson, importJson } = useFinanceBackup(handleRefresh);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Finance"
        description="Track accounts, income, expenses, and category budgets"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
            >
              Add Transaction
            </Button>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as Tab);
          handleRefresh();
        }}
        variant="underline"
      >
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="backup">Backup & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MonthlyView refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionList
            refreshTrigger={refreshTrigger}
            onDataChange={handleRefresh}
            onEditTransaction={handleEditTransaction}
          />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <AccountList refreshTrigger={refreshTrigger} onDataChange={handleRefresh} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryList refreshTrigger={refreshTrigger} onDataChange={handleRefresh} />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupPanel
            entityName="Finance"
            onExportCsv={exportCsv}
            onExportJson={exportJson}
            onImportJson={importJson}
          />
        </TabsContent>
      </Tabs>

      <Modal
        open={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Transaction" : "Log New Transaction"}
      >
        <TransactionForm
          key={editingTransaction?.id ?? "new"}
          editTransaction={editingTransaction}
          onTransactionCreated={() => {
            handleRefresh();
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
}
