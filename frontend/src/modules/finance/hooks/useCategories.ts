import type { Category } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import * as api from "../api.js";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useAppToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchCategories();
      if (mountedRef.current) setCategories(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load categories";
      if (mountedRef.current) {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, refresh: load };
}

export function useActiveCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useAppToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchActiveCategories();
      if (mountedRef.current) setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, refresh: load };
}
