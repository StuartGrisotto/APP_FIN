import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CategorizeTransactionModal } from '../components/CategorizeTransactionModal';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TransactionItem } from '../components/TransactionItem';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';
import { Transaction } from '../types/finance';

const PAGE_SIZE = 20;

const filterLast90Days = (transactions: Transaction[]): Transaction[] => {
  if (transactions.length === 0) {
    return [];
  }

  const referenceDate = transactions.reduce((acc, item) => {
    const date = new Date(item.date);
    return date.getTime() > acc.getTime() ? date : acc;
  }, new Date(transactions[0].date));

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 89);

  return transactions.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date <= referenceDate;
  });
};

export const TransactionsScreen = () => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [page, setPage] = useState(1);
  const {
    dashboard,
    loadingDashboard,
    categoryOptions,
    categoryLabelMap,
    updateTransactionCategory,
  } = useFinance();

  const baseTransactions = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return filterLast90Days(dashboard.transactions);
  }, [dashboard]);

  useEffect(() => {
    setPage(1);
  }, [baseTransactions.length]);

  const visibleTransactions = useMemo(
    () => baseTransactions.slice(0, page * PAGE_SIZE),
    [baseTransactions, page],
  );

  const hasMore = visibleTransactions.length < baseTransactions.length;

  const loadMore = () => {
    if (!hasMore) {
      return;
    }
    setPage((prev) => prev + 1);
  };

  if (loadingDashboard) {
    return (
      <Screen>
        <EmptyState
          title="Carregando extrato"
          subtitle="Estamos buscando suas movimentacoes."
        />
      </Screen>
    );
  }

  if (!dashboard || dashboard.transactions.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Nenhuma movimentacao"
          subtitle="Adicione sua primeira movimentacao manualmente para comecar."
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false}>
      <View>
        <Text style={styles.title}>Extrato</Text>
        <Text style={styles.subtitle}>Exibindo fixo os ultimos 90 dias, com paginacao de 20 por vez.</Text>
      </View>

      <Text style={styles.countText}>
        {visibleTransactions.length} de {baseTransactions.length} movimentacoes
      </Text>

      <View style={styles.listWrap}>
        <FlatList
          data={visibleTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              categoryLabelMap={categoryLabelMap}
              onPress={(pressed) => setSelectedTransaction(pressed)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={8}
          removeClippedSubviews
          onEndReachedThreshold={0.35}
          onEndReached={loadMore}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerWrap}>
                <Pressable style={styles.loadMoreButton} onPress={loadMore}>
                  <Text style={styles.loadMoreText}>Carregar mais 20</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.footerWrap}>
                <Text style={styles.endText}>Fim das movimentacoes dos ultimos 90 dias.</Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhuma movimentacao nos ultimos 90 dias.</Text>
            </View>
          }
        />
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
    title: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: spacing.xs,
    },
    countText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    listWrap: {
      flex: 1,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    emptyWrap: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    footerWrap: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    loadMoreButton: {
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    loadMoreText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    endText: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
