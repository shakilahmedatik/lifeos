import { useEffect, useState } from "react";
import type { AccountWithBalance, Transaction, Category, NewTransactionInput } from "../../../packages/contracts/src/index.js";
import * as financeApi from "../modules/finance/api.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Modal from "../components/ui/Modal.js";
import { PlusIcon, WalletIcon } from "../components/ui/icons.js";

export default function FinancePage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    try {
      const [acs, txs, cats] = await Promise.all([
        financeApi.fetchAccountBalances(),
        financeApi.fetchMonthlyTransactions(new Date().toISOString().slice(0, 7)),
        financeApi.fetchActiveCategories(),
      ]);
      setAccounts(acs);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !categoryId) return;
    try {
      const input: NewTransactionInput = {
        accountId,
        categoryId,
        date,
        amountMinor: Math.round(parseFloat(amount) * 100),
        note: note.trim() || undefined,
      };
      await financeApi.createTransaction(input);
      setAmount("");
      setNote("");
      setShowForm(false);
      fetchData();
    } catch {
      // silently fail
    }
  };

  const totalIncome = transactions
    .filter((t) => categories.find((c) => c.id === t.categoryId)?.kind === "income")
    .reduce((s, t) => s + t.amountMinor, 0);

  const totalExpense = transactions
    .filter((t) => categories.find((c) => c.id === t.categoryId)?.kind === "expense")
    .reduce((s, t) => s + t.amountMinor, 0);

  const net = totalIncome - totalExpense;

  const formatBDT = (amount: number) => {
    return `BDT ${(amount / 100).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Track your money</p>
        </div>
        <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
          Add Transaction
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs text-gray-500 mb-1">Income</p>
              <p className="text-xl font-bold text-emerald-400">{formatBDT(totalIncome)}</p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 mb-1">Expenses</p>
              <p className="text-xl font-bold text-red-400">{formatBDT(totalExpense)}</p>
            </Card>
            <Card className={net >= 0 ? "border-l-emerald-500/50" : "border-l-red-500/50"}>
              <p className="text-xs text-gray-500 mb-1">Net</p>
              <p className={`text-xl font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatBDT(Math.abs(net))}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Accounts</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {accounts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No accounts</p>
                ) : (
                  accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-300">{a.name}</span>
                      <span className="text-sm font-medium text-gray-200">{formatBDT(a.balance)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No transactions</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{t.note || "Transaction"}</p>
                        <p className="text-xs text-gray-600">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-sm font-medium ${categories.find((c) => c.id === t.categoryId)?.kind === "income" ? "text-emerald-400" : "text-red-400"}`}>
                        {formatBDT(t.amountMinor)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount (BDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                required
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              placeholder="Optional note"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Add Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
