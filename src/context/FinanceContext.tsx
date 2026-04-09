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
  CategoryOption,
  CreateTransactionPayload,
  DashboardData,
  PeriodFilter,
  PluggyImportResult,
  StatementImportResult,
} from '../types/finance';

interface FinanceContextValue {
  dashboard: DashboardData | null;
  period: PeriodFilter;
  lastPluggySyncAt: string | null;
  categoryOptions: CategoryOption[];
  categoryLabelMap: Record<string, string>;
  loadingDashboard: boolean;
  importingStatement: boolean;
  importingPluggy: boolean;
  addingTransaction: boolean;
  statementImportFeedback: string | null;
  pluggyImportFeedback: string | null;
  setPeriod: (period: PeriodFilter) => void;
  refreshDashboard: () => Promise<void>;
  addTransaction: (payload: CreateTransactionPayload) => Promise<void>;
  importStatementCsv: (csvContent: string) => Promise<StatementImportResult>;
  importPluggyItem: (itemId: string) => Promise<PluggyImportResult>;
  updateTransactionCategory: (
    transactionId: string,
    categoryId: string,
    categoryLabel?: string,
  ) => Promise<void>;
  clearStatementFeedback: () => void;
  clearPluggyFeedback: () => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export const FinanceProvider = ({ children }: PropsWithChildren) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [period, setPeriodState] = useState<PeriodFilter>('month');
  const [lastPluggySyncAt, setLastPluggySyncAt] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryLabelMap, setCategoryLabelMap] = useState<Record<string, string>>({});
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [importingStatement, setImportingStatement] = useState(false);
  const [importingPluggy, setImportingPluggy] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [statementImportFeedback, setStatementImportFeedback] = useState<string | null>(null);
  const [pluggyImportFeedback, setPluggyImportFeedback] = useState<string | null>(null);
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

  useEffect(() => {
    financeService.getLastPluggySyncAt().then((value) => {
      setLastPluggySyncAt(value);
    });
    financeService.getCategoryOptions().then((value) => {
      setCategoryOptions(value);
    });
    financeService.getCategoryLabelMap().then((value) => {
      setCategoryLabelMap(value);
    });
  }, []);

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

  const importPluggyItem = async (itemId: string): Promise<PluggyImportResult> => {
    setImportingPluggy(true);
    setPluggyImportFeedback(null);

    try {
      const result = await financeService.importPluggyItem(itemId);
      await refreshDashboard();
      setLastPluggySyncAt(result.syncedAt);

      const summary = `Pluggy sincronizado: ${result.importedCount} novas, ${result.duplicateCount} duplicadas, ${result.invalidCount} invalidas. Contas: ${result.accountCount}.`;
      setPluggyImportFeedback(summary);
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel importar do Pluggy.';
      setPluggyImportFeedback(message);
      throw error;
    } finally {
      setImportingPluggy(false);
    }
  };

  const updateTransactionCategory = async (
    transactionId: string,
    categoryId: string,
    categoryLabel?: string,
  ) => {
    await financeService.updateTransactionCategory(transactionId, categoryId, categoryLabel);
    await refreshDashboard();
    const nextOptions = await financeService.getCategoryOptions();
    const nextLabels = await financeService.getCategoryLabelMap();
    setCategoryOptions(nextOptions);
    setCategoryLabelMap(nextLabels);
  };

  const clearPluggyFeedback = () => {
    setPluggyImportFeedback(null);
  };

  const value = useMemo<FinanceContextValue>(
    () => ({
      dashboard,
      period,
      lastPluggySyncAt,
      categoryOptions,
      categoryLabelMap,
      loadingDashboard,
      importingStatement,
      importingPluggy,
      addingTransaction,
      statementImportFeedback,
      pluggyImportFeedback,
      setPeriod,
      refreshDashboard,
      addTransaction,
      importStatementCsv,
      importPluggyItem,
      updateTransactionCategory,
      clearStatementFeedback,
      clearPluggyFeedback,
    }),
    [
      addingTransaction,
      categoryLabelMap,
      categoryOptions,
      dashboard,
      lastPluggySyncAt,
      loadingDashboard,
      importingPluggy,
      importingStatement,
      period,
      pluggyImportFeedback,
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
