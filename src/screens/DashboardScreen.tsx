import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BalanceCard } from '../components/BalanceCard';
import { CategorizeTransactionModal } from '../components/CategorizeTransactionModal';
import { EmptyState } from '../components/EmptyState';
import { ExpenseDonutCard } from '../components/ExpenseDonutCard';
import { FilterPills } from '../components/FilterPills';
import { Screen } from '../components/Screen';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { TransactionItem } from '../components/TransactionItem';
import { getCategoryLabel } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';
import { Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface DashboardScreenProps {
  onOpenSettings: () => void;
}

export const DashboardScreen = ({ onOpenSettings }: DashboardScreenProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.userName}>{user?.name ?? 'Usuario'}</Text>
        </View>

        <View style={styles.headerIcons}>
          <Pressable style={styles.circleIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.circleIcon} onPress={onOpenSettings}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <BalanceCard summary={dashboard.summary} />

      <FilterPills value={period} onChange={setPeriod} />

      <SimpleBarChart points={dashboard.chart} />

      <ExpenseDonutCard
        transactions={dashboard.periodTransactions}
        categoryLabelMap={categoryLabelMap}
        selectedCategory={selectedExpenseCategory}
        onSelectCategory={setSelectedExpenseCategory}
      />

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
        {selectedExpenseCategory ? (
          <Text style={styles.filteredBy}>
            Filtrando por: {getCategoryLabel(selectedExpenseCategory, categoryLabelMap)}
          </Text>
        ) : null}
      </View>

      <View style={styles.transactionList}>
        {filteredLatestTransactions.length > 0 ? (
          filteredLatestTransactions.map((item) => (
            <TransactionItem
              key={item.id}
              item={item}
              categoryLabelMap={categoryLabelMap}
              onPress={(transaction) => setSelectedTransaction(transaction)}
            />
          ))
        ) : (
          <View style={styles.emptyFilteredWrap}>
            <Text style={styles.emptyFilteredText}>
              Nenhuma transacao para essa categoria no periodo selecionado.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.balanceFieldsCard}>
        <Text style={styles.sectionTitle}>Campos de saldo (MeuPluggy)</Text>
        {pluggyFields.length > 0 ? (
          pluggyFields.map((item, index) => (
            <View key={`${item.accountId}-${item.source}-${item.field}-${index}`} style={styles.balanceFieldRow}>
              <Text style={styles.balanceFieldTitle}>
                {item.accountName} ({item.accountType || 'N/A'})
              </Text>
              <Text style={styles.balanceFieldMeta}>
                {item.source}.{item.field}
              </Text>
              <Text style={styles.balanceFieldValue}>
                {item.value !== null ? formatCurrency(item.value) : 'sem valor'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyFilteredText}>
            Nenhum campo de saldo recebido ainda. Sincronize pelo Pluggy para listar os valores.
          </Text>
        )}
      </View>

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

const createStyles = (colors: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userName: {
      color: colors.textPrimary,
      fontSize: 40,
      lineHeight: 42,
      fontWeight: '800',
      letterSpacing: -1,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    circleIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transactionsHeader: {
      marginTop: spacing.sm,
      gap: 2,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    filteredBy: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    transactionList: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
    balanceFieldsCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    balanceFieldRow: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    balanceFieldTitle: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    balanceFieldMeta: {
      color: colors.textMuted,
      fontSize: 11,
    },
    balanceFieldValue: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    emptyFilteredWrap: {
      paddingVertical: spacing.lg,
    },
    emptyFilteredText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
