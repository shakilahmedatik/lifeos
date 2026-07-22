import { useCallback, useEffect, useState } from "react";
import { createCategory, deleteCategory, getCategories, updateCategory } from "./storage";
import type { NewSkillCategoryInput, SkillCategory } from "./types";

export function useSkillCategories() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(() => {
    setLoading(true);
    const data = getCategories();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = useCallback((input: NewSkillCategoryInput) => {
    const newCategory = createCategory(input);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, []);

  const editCategory = useCallback((id: string, patch: Partial<NewSkillCategoryInput>) => {
    const updated = updateCategory(id, patch);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    return updated;
  }, []);

  const removeCategory = useCallback((id: string) => {
    const success = deleteCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  return {
    categories,
    loading,
    addCategory,
    editCategory,
    removeCategory,
    refresh: loadCategories,
  };
}
