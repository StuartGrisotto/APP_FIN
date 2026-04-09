import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { Screen } from '../components/Screen';
import { TransactionItem } from '../components/TransactionItem';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';

export const TransactionsScreen = () => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { dashboard, loadingDashboard } = useFinance();

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
    <Screen>
      <View>
        <Text style={styles.title}>Extrato completo</Text>
        <Text style={styles.subtitle}>Todas as movimentacoes em ordem de data.</Text>
      </View>

      <View style={styles.list}>
        {dashboard.transactions.map((transaction) => (
          <TransactionItem key={transaction.id} item={transaction} />
        ))}
      </View>
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
    list: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
  });
