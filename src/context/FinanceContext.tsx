import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { financeService } from '../services/financeService';
import {
  CreateTransactionPayload,
  DashboardData,
  PeriodFilter,
  StatementImportResult,
} from '../types/finance';

interface FinanceContextValue {
  dashboard: DashboardData | null;
  period: PeriodFilter;
  loadingDashboard: boolean;
  importingStatement: boolean;
  addingTransaction: boolean;
  statementImportFeedback: string | null;
  setPeriod: (period: PeriodFilter) => void;
  refreshDashboard: () => Promise<void>;
  addTransaction: (payload: CreateTransactionPayload) => Promise<void>;
  importStatementCsv: (csvContent: string) => Promise<StatementImportResult>;
  clearStatementFeedback: () => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export const FinanceProvider = ({ children }: PropsWithChildren) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [period, setPeriodState] = useState<PeriodFilter>('month');
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [importingStatement, setImportingStatement] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [statementImportFeedback, setStatementImportFeedback] = useState<string | null>(null);
  const firstLoadRef = useRef(true);

  const loadDashboard = useCallback(async (activePeriod: PeriodFilter, fullScreenLoader: boolean) => {
    if (fullScreenLoader) {
      setLoadingDashboard(true);
    }
    try {
      const data = await financeService.getDashboard(activePeriod);
      setDashboard(data);
    } finally {
      if (fullScreenLoader) {
        setLoadingDashboard(false);
      }
    }
  }, []);

  useEffect(() => {
    const shouldShowFullLoader = firstLoadRef.current;
    loadDashboard(period, shouldShowFullLoader)
      .catch(() => {
        if (shouldShowFullLoader) {
          setLoadingDashboard(false);
        }
      })
      .finally(() => {
        firstLoadRef.current = false;
      });
  }, [period, loadDashboard]);

  const setPeriod = (next: PeriodFilter) => {
    if (next === period) {
      return;
    }
    setPeriodState(next);
  };

  const refreshDashboard = async () => {
    await loadDashboard(period, dashboard === null);
  };

  const addTransaction = async (payload: CreateTransactionPayload) => {
    setAddingTransaction(true);
    await financeService.addTransaction(payload);
    await refreshDashboard();
    setAddingTransaction(false);
  };

  const importStatementCsv = async (csvContent: string): Promise<StatementImportResult> => {
    setImportingStatement(true);
    setStatementImportFeedback(null);

    try {
      const result = await financeService.importStatementCsv(csvContent);
      await refreshDashboard();

      const summary = `Extrato processado: ${result.importedCount} novas, ${result.duplicateCount} duplicadas, ${result.invalidCount} invalidas.`;
      setStatementImportFeedback(summary);
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel importar o extrato.';
      setStatementImportFeedback(message);
      throw error;
    } finally {
      setImportingStatement(false);
    }
  };

  const clearStatementFeedback = () => {
    setStatementImportFeedback(null);
  };

  const value = useMemo<FinanceContextValue>(
    () => ({
      dashboard,
      period,
      loadingDashboard,
      importingStatement,
      addingTransaction,
      statementImportFeedback,
      setPeriod,
      refreshDashboard,
      addTransaction,
      importStatementCsv,
      clearStatementFeedback,
    }),
    [
      addingTransaction,
      dashboard,
      loadingDashboard,
      importingStatement,
      period,
      statementImportFeedback,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextValue => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de FinanceProvider');
  }

  return context;
};
