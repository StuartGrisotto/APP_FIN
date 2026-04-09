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

export interface StatementImportResult {
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  totalRead: number;
}

export interface PluggyImportResult extends StatementImportResult {
  itemId: string;
  accountCount: number;
  pulledTransactions: number;
  syncedAt: string;
}
