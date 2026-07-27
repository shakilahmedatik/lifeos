import type { Account } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { archiveAccount, createAccount, fetchAccounts } from "./api.js";

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Account["type"]>("bank");

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await createAccount({ name: newName.trim(), type: newType });
    setNewName("");
    setShowForm(false);
    loadAccounts();
  }

  async function handleArchive(id: string) {
    await archiveAccount(id);
    loadAccounts();
  }

  if (loading) return <div className="text-gray-500">Loading accounts...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Accounts</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showForm ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Account name"
            className="flex-1 px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as Account["type"])}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="savings">Savings</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      )}

      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <span className="font-medium">{account.name}</span>
              <span className="ml-2 text-sm text-gray-500 capitalize">{account.type}</span>
            </div>
            <div className="flex gap-2">
              {account.archived && <span className="text-xs text-gray-400">Archived</span>}
              {!account.archived && (
                <button
                  type="button"
                  onClick={() => handleArchive(account.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        ))}
        {accounts.length === 0 && <p className="text-gray-500 text-center py-4">No accounts yet</p>}
      </div>
    </div>
  );
}
