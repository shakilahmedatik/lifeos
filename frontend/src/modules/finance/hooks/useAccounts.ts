import type { Account, AccountWithBalance } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import * as api from "../api.js";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
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
      const data = await api.fetchAccounts();
      if (mountedRef.current) setAccounts(data);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, loading, refresh: load };
}

export function useActiveAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
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
      const data = await api.fetchActiveAccounts();
      if (mountedRef.current) setAccounts(data);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, loading, refresh: load };
}

export function useAccountBalances() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
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
      const data = await api.fetchAccountBalances();
      if (mountedRef.current) setAccounts(data);
    } catch {
      toast.error("Failed to load account balances");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, loading, refresh: load };
}
