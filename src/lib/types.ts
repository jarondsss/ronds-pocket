import type { Id } from "@/convex/_generated/dataModel";

export interface WalletRow {
  _id: Id<"wallets">;
  name: string;
  type: string;
  icon: string;
  color: string;
  opening_balance: number;
  balance: number;
}

export interface CategoryRow {
  _id: Id<"categories">;
  name: string;
  type: "income" | "expense";
  color: string;
}

export interface BudgetRow {
  _id: Id<"budgets">;
  category: string;
  amount: number;
  color: string;
  spent: number;
}

export interface GoalRow {
  _id: Id<"goals">;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: number;
  created_at: number;
}

export interface SavingsRow {
  _id: Id<"savings">;
  name: string;
  kind: string;
  principal: number;
  interest_rate: number;
  started_at: number;
  balance: number;
  deposited: number;
  withdrawn: number;
  entryCount: number;
  projected: number;
  yearlyInterest: number;
}

export interface TransferRow {
  _id: Id<"wallet_transfers">;
  amount: number;
  note: string;
  occurred_at: number;
  from: { name: string; icon: string } | null;
  to: { name: string; icon: string } | null;
}

export interface LiabilityRow {
  _id: Id<"liabilities">;
  name: string;
  kind: "utang" | "piutang";
  counterparty: string;
  balance: number;
  due_date: number | undefined;
  note: string;
  settled_at: number | undefined;
  created_at: number;
}

export interface NetWorthSummary {
  wallets: number;
  savings: number;
  goals: number;
  utang: number;
  piutang: number;
  netWorth: number;
}
