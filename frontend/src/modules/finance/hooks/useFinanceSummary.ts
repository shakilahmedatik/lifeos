import type { AccountWithBalance, CategoryBreakdown, MonthlySummary } from "@lifeos/contracts";
import { getClientMonthString } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import * as api from "../api.js";

export function useFinanceSummary(yearMonth?: string) {
  const ym = yearMonth ?? getClientMonthString();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [balances, setBalances] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useAppToast();
  const prevYm = useRef(ym);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (prevYm.current !== ym) {
      setLoading(true);
    }
    setError(null);
    try {
      const [s, b, bal] = await Promise.all([
        api.fetchMonthlySummary(ym),
        api.fetchCategoryBreakdown(ym),
        api.fetchAccountBalances(),
      ]);
      if (mountedRef.current) {
        setSummary(s);
        setBreakdown(b);
        setBalances(bal);
        prevYm.current = ym;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load finance summary";
      if (mountedRef.current) {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [ym, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, breakdown, balances, loading, error, refresh: load };
}
