import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/ui/EmptyState';
import { Screen } from '../components/ui/Screen';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { BalanceCard } from '../features/dashboard/components/BalanceCard';
import { DashboardHeader } from '../features/dashboard/components/DashboardHeader';
import { ExpenseDonutCard } from '../features/dashboard/components/ExpenseDonutCard';
import { FilterPills } from '../features/dashboard/components/FilterPills';
import { LatestTransactionsCard } from '../features/dashboard/components/LatestTransactionsCard';
import { PluggyBalanceFieldsCard } from '../features/dashboard/components/PluggyBalanceFieldsCard';
import { SimpleBarChart } from '../features/dashboard/components/SimpleBarChart';
import { CategorizeTransactionModal } from '../features/transactions/components/CategorizeTransactionModal';
import { Transaction } from '../types/finance';

interface DashboardScreenProps {
  onOpenSettings: () => void;
}

export const DashboardScreen = ({ onOpenSettings }: DashboardScreenProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | null>(null);

  const { user } = useAuth();
  const {
    dashboard,
    period,
    setPeriod,
    loadingDashboard,
    categoryOptions,
    categoryLabelMap,
    updateTransactionCategory,
  } = useFinance();

  useEffect(() => {
    setSelectedExpenseCategory(null);
  }, [period]);

  const filteredLatestTransactions = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    if (!selectedExpenseCategory) {
      return dashboard.transactions.slice(0, 6);
    }

    return dashboard.periodTransactions
      .filter((item) => item.type === 'expense' && item.category === selectedExpenseCategory)
      .slice(0, 6);
  }, [dashboard, selectedExpenseCategory]);

  if (loadingDashboard && !dashboard) {
    return (
      <Screen>
        <EmptyState
          title="Carregando dashboard"
          subtitle="Estamos preparando seu resumo financeiro agora."
        />
      </Screen>
    );
  }

  if (!dashboard) {
    return (
      <Screen>
        <EmptyState
          title="Nao foi possivel carregar"
          subtitle="Tente abrir novamente ou sincronizar o banco em Ajustes."
        />
      </Screen>
    );
  }

  const pluggyFields = dashboard.pluggyBalanceFieldCandidates ?? [];

  return (
    <Screen>
      <DashboardHeader userName={user?.name} onOpenSettings={onOpenSettings} />

      <BalanceCard summary={dashboard.summary} />

      <FilterPills value={period} onChange={setPeriod} />

      <SimpleBarChart points={dashboard.chart} />

      <ExpenseDonutCard
        transactions={dashboard.periodTransactions}
        categoryLabelMap={categoryLabelMap}
        selectedCategory={selectedExpenseCategory}
        onSelectCategory={setSelectedExpenseCategory}
      />

      <LatestTransactionsCard
        transactions={filteredLatestTransactions}
        categoryLabelMap={categoryLabelMap}
        selectedCategory={selectedExpenseCategory}
        onSelectTransaction={setSelectedTransaction}
      />

      <PluggyBalanceFieldsCard fields={pluggyFields} />

      <CategorizeTransactionModal
        visible={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        categories={categoryOptions}
        loading={savingCategory}
        onClose={() => setSelectedTransaction(null)}
        onSave={async (categoryId, newCategoryLabel) => {
          if (!selectedTransaction) {
            return;
          }
          setSavingCategory(true);
          try {
            await updateTransactionCategory(selectedTransaction.id, categoryId, newCategoryLabel);
            setSelectedTransaction(null);
          } finally {
            setSavingCategory(false);
          }
        }}
      />
    </Screen>
  );
};
