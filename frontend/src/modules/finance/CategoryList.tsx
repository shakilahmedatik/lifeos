import type { Category } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { archiveCategory, createCategory, fetchCategories } from "./api.js";

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Category["kind"]>("expense");

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    await createCategory({ name: newName.trim(), kind: newKind });
    setNewName("");
    setShowForm(false);
    loadCategories();
  }

  async function handleArchive(id: string) {
    await archiveCategory(id);
    loadCategories();
  }

  if (loading) return <div className="text-gray-500">Loading categories...</div>;

  const incomeCategories = categories.filter((c) => c.kind === "income");
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showForm ? "Cancel" : "+ Add Category"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-3 py-2 border rounded-lg"
            required
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as Category["kind"])}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-green-600 mb-2">Income</h4>
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
              >
                <span>{category.name}</span>
                {!category.archived && (
                  <button
                    type="button"
                    onClick={() => handleArchive(category.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Archive
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-red-600 mb-2">Expense</h4>
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
              >
                <span>{category.name}</span>
                {!category.archived && (
                  <button
                    type="button"
                    onClick={() => handleArchive(category.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Archive
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
