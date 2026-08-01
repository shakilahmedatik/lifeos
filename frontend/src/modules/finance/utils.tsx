import type { AccountWithBalance } from "@lifeos/contracts";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import type { ReactNode } from "react";

export function formatBDT(amountMinor: number, decimals = 2): string {
  return `BDT ${(amountMinor / 100).toLocaleString("en-BD", { minimumFractionDigits: decimals })}`;
}

export function getTypeIcon(type: AccountWithBalance["type"], size = 16): ReactNode {
  switch (type) {
    case "bank":
      return <Landmark size={size} className="text-blue-400" />;
    case "card":
      return <CreditCard size={size} className="text-purple-400" />;
    case "cash":
      return <Wallet size={size} className="text-emerald-400" />;
    case "savings":
      return <Landmark size={size} className="text-amber-400" />;
    case "mfs":
      return <Smartphone size={size} className="text-pink-400" />;
  }
}
