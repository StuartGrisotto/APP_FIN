export type TransactionType = 'income' | 'expense';

export type TransactionCategory = string;

export type PeriodFilter = 'today' | '7d' | '30d' | 'month';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  date: string;
}

export interface Summary {
  balance: number;
  incomeTotal: number;
  expenseTotal: number;
  previousMonthBalance: number;
}

export interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

export interface DashboardData {
  summary: Summary;
  transactions: Transaction[];
  periodTransactions: Transaction[];
  chart: ChartPoint[];
  pluggyBalanceFieldCandidates?: PluggyBalanceFieldCandidate[];
}

export interface PluggyBalanceFieldCandidate {
  accountId: string;
  accountName: string;
  accountType: string;
  field: string;
  value: number | null;
  source: 'account' | 'realtime';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateTransactionPayload {
  title: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  date: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface PluggyImportResult {
  itemId: string;
  accountCount: number;
  pulledTransactions: number;
  totalAvailableBalance: number | null;
  totalCurrentBalance: number | null;
  balanceFieldCandidates: PluggyBalanceFieldCandidate[];
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  totalRead: number;
  syncedAt: string;
}
