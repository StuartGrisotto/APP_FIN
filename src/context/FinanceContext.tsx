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
} from '../types/finance';

interface FinanceContextValue {
  dashboard: DashboardData | null;
  period: PeriodFilter;
  lastPluggySyncAt: string | null;
  categoryOptions: CategoryOption[];
  categoryLabelMap: Record<string, string>;
  loadingDashboard: boolean;
  importingPluggy: boolean;
  addingTransaction: boolean;
  resettingAppData: boolean;
  pluggyImportFeedback: string | null;
  setPeriod: (period: PeriodFilter) => void;
  refreshDashboard: () => Promise<void>;
  addTransaction: (payload: CreateTransactionPayload) => Promise<void>;
  importPluggyItem: (itemId: string) => Promise<PluggyImportResult>;
  resetAppData: () => Promise<void>;
  updateTransactionCategory: (
    transactionId: string,
    categoryId: string,
    categoryLabel?: string,
  ) => Promise<void>;
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
  const [importingPluggy, setImportingPluggy] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [resettingAppData, setResettingAppData] = useState(false);
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

  const resetAppData = async () => {
    setResettingAppData(true);
    try {
      await financeService.resetFactoryData();
      setDashboard(null);
      setLastPluggySyncAt(null);
      setCategoryOptions([]);
      setCategoryLabelMap({});
      setPluggyImportFeedback(null);
      setPeriodState('month');
    } finally {
      setResettingAppData(false);
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
      importingPluggy,
      addingTransaction,
      resettingAppData,
      pluggyImportFeedback,
      setPeriod,
      refreshDashboard,
      addTransaction,
      importPluggyItem,
      resetAppData,
      updateTransactionCategory,
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
      period,
      pluggyImportFeedback,
      resettingAppData,
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
