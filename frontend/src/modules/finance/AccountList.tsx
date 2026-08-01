import type { AccountWithBalance } from "@lifeos/contracts";
import { ArrowRightLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Input } from "../../components/ui/Input.js";
import Modal from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import {
  archiveAccount as apiArchiveAccount,
  createAccount as apiCreateAccount,
  deleteAccount as apiDeleteAccount,
  unarchiveAccount as apiUnarchiveAccount,
  updateAccount as apiUpdateAccount,
} from "./api.js";
import { useAccountBalances } from "./hooks/useAccounts.js";
import { TransferModal } from "./TransferModal.js";
import { formatBDT, getTypeIcon } from "./utils.js";

interface AccountListProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

export function AccountList({ refreshTrigger, onDataChange }: AccountListProps) {
  const { accounts, loading, refresh } = useAccountBalances();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountWithBalance | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: "delete" | "archive";
    id: string;
    name: string;
  } | null>(null);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"bank" | "cash" | "card" | "savings" | "mfs">("bank");
  const [submitting, setSubmitting] = useState(false);

  const prevRefreshTrigger = useRef(refreshTrigger);
  const toast = useAppToast();

  useEffect(() => {
    if (refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      refresh();
    }
  }, [refreshTrigger, refresh]);

  function resetForm() {
    setNewName("");
    setNewType("bank");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await apiCreateAccount({ name: newName.trim(), type: newType });
      toast.success("Account created successfully");
      resetForm();
      setShowAddModal(false);
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editAccount || !newName.trim()) return;
    setSubmitting(true);
    try {
      await apiUpdateAccount(editAccount.id, { name: newName.trim(), type: newType });
      toast.success("Account updated");
      setShowEditModal(false);
      setEditAccount(null);
      resetForm();
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(account: AccountWithBalance) {
    setEditAccount(account);
    setNewName(account.name);
    setNewType(account.type);
    setShowEditModal(true);
  }

  async function handleArchive(id: string, name: string) {
    try {
      await apiArchiveAccount(id);
      toast.success(`Archived account "${name}"`);
      refresh();
      onDataChange?.();
    } catch {
      toast.error("Failed to archive account");
    }
  }

  async function handleUnarchive(id: string, name: string) {
    try {
      await apiUnarchiveAccount(id);
      toast.success(`Restored account "${name}"`);
      refresh();
      onDataChange?.();
    } catch {
      toast.error("Failed to unarchive account");
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await apiDeleteAccount(id);
      toast.success(`Deleted account "${name}"`);
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">Financial Accounts</h3>
          <p className="text-xs text-muted">Manage bank accounts, wallets, and balances</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={<ArrowRightLeft size={14} />}
            onClick={() => setShowTransferModal(true)}
          >
            Transfer Funds
          </Button>
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            Add Account
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts found"
          description="Create your first bank, cash, or credit account to start tracking transactions."
          action={
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>
              Create Account
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`p-3 rounded-xl glass border ${
                account.archived
                  ? "border-dashed border-border opacity-60"
                  : "border-border hover:border-accent/30"
              } transition-colors`}
            >
              <div className="flex flex-row items-center justify-between pb-1.5 border-b border-border">
                <div className="flex items-center gap-1.5">
                  {getTypeIcon(account.type)}
                  <span className="text-sm font-semibold text-primary">{account.name}</span>
                </div>
                <Badge
                  variant={account.archived ? "default" : "info"}
                  className="text-[10px] py-0 px-1.5 capitalize"
                >
                  {account.type}
                </Badge>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-muted">Current Balance</p>
                  <p
                    className={`text-base font-bold ${
                      account.balance >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {formatBDT(account.balance)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {account.archived ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[11px] py-0.5 px-2 text-muted hover:text-emerald-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchive(account.id, account.name);
                      }}
                    >
                      Unarchive
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1 text-muted hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(account);
                        }}
                        title="Edit Account"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1 text-muted text-[11px] hover:text-amber-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmTarget({
                            action: "archive",
                            id: account.id,
                            name: account.name,
                          });
                        }}
                        title="Archive Account"
                      >
                        Archive
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="p-1 text-muted hover:text-amber-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTarget({ action: "delete", id: account.id, name: account.name });
                    }}
                    title="Delete Account"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
        title="Add Financial Account"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Account Name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. City Bank Salary, Cash Wallet"
            required
          />
          <Select
            label="Account Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value as typeof newType)}
            options={[
              { value: "bank", label: "Bank Account" },
              { value: "cash", label: "Cash" },
              { value: "card", label: "Credit / Debit Card" },
              { value: "savings", label: "Savings" },
              { value: "mfs", label: "MFS (Mobile Banking)" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => {
          resetForm();
          setShowEditModal(false);
          setEditAccount(null);
        }}
        title="Edit Account"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Account Name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Select
            label="Account Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value as typeof newType)}
            options={[
              { value: "bank", label: "Bank Account" },
              { value: "cash", label: "Cash" },
              { value: "card", label: "Credit / Debit Card" },
              { value: "savings", label: "Savings" },
              { value: "mfs", label: "MFS (Mobile Banking)" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetForm();
                setShowEditModal(false);
                setEditAccount(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <TransferModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          refresh();
          onDataChange?.();
        }}
        accounts={accounts}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "delete" ? "Delete Account" : "Archive Account"}
        message={
          confirmTarget?.action === "delete"
            ? `Are you sure you want to permanently delete "${confirmTarget?.name}"?`
            : `Are you sure you want to archive "${confirmTarget?.name}"?`
        }
        confirmLabel={confirmTarget?.action === "delete" ? "Delete" : "Archive"}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          if (confirmTarget.action === "delete") {
            await handleDelete(confirmTarget.id, confirmTarget.name);
          } else {
            await handleArchive(confirmTarget.id, confirmTarget.name);
          }
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
