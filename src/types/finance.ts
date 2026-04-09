export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'housing'
  | 'salary'
  | 'leisure'
  | 'health'
  | 'others';

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
}
