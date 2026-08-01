import type { Account } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { ArrowRightLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Button from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import Modal from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { createTransfer } from "./api.js";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
}

export function TransferModal({ open, onClose, onSuccess, accounts }: TransferModalProps) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getClientDateString());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (!open) return;
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDate(getClientDateString());
    setNote("");
    setSubmitting(false);
  }, [open]);

  const activeAccounts = accounts.filter((a) => !a.archived);

  function handleAmountChange(val: string) {
    const sanitized = val.replace(/,/g, "");
    if (sanitized === "" || /^\d*\.?\d{0,2}$/.test(sanitized)) {
      setAmount(val);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !amount) return;
    if (fromAccountId === toAccountId) {
      toast.error("Source and destination accounts must be different");
      return;
    }

    const cleanAmount = amount.replace(/,/g, "").trim();
    const amountNum = Number.parseFloat(cleanAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Amount must be a valid positive number");
      return;
    }

    if (amountNum > 1_000_000_000_000) {
      toast.error("Amount exceeds maximum limit (1 Trillion BDT)");
      return;
    }

    setSubmitting(true);
    try {
      const amountMinor = Math.round(amountNum * 100);
      await createTransfer(fromAccountId, toAccountId, amountMinor, date, note.trim() || undefined);
      toast.success("Transfer completed successfully");
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to execute transfer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer Between Accounts">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="From Account"
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            required
            options={[
              { value: "", label: "Select source account" },
              ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` })),
            ]}
          />
          <Select
            label="To Account"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            required
            options={[
              { value: "", label: "Select destination account" },
              ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount (BDT)"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00 (e.g. 10000)"
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Note (optional)"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason or reference for transfer"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} icon={<ArrowRightLeft size={16} />}>
            {submitting ? "Transferring..." : "Complete Transfer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
