import type { Transaction } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import * as api from "../api.js";

export function useTransactions(startDate?: string, endDate?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useAppToast();
  const mountedRef = useRef(true);

  const sd =
    startDate ??
    (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    })();
  const ed = endDate ?? getClientDateString();

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
      const data = await api.fetchTransactionsByDateRange(sd, ed);
      if (mountedRef.current) setTransactions(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load transactions";
      if (mountedRef.current) {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [sd, ed, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { transactions, loading, error, refresh: load, setTransactions };
}
