import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BalanceCard } from '../components/BalanceCard';
import { EmptyState } from '../components/EmptyState';
import { ExpenseDonutCard } from '../components/ExpenseDonutCard';
import { FilterPills } from '../components/FilterPills';
import { Screen } from '../components/Screen';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { TransactionItem } from '../components/TransactionItem';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';

interface DashboardScreenProps {
  onOpenSettings: () => void;
}

export const DashboardScreen = ({ onOpenSettings }: DashboardScreenProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const { user } = useAuth();
  const { dashboard, period, setPeriod, loadingDashboard } = useFinance();

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
          subtitle="Tente abrir novamente ou importar o extrato em Ajustes."
        />
      </Screen>
    );
  }

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

      <ExpenseDonutCard transactions={dashboard.transactions} />

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
      </View>

      <View style={styles.transactionList}>
        {dashboard.transactions.slice(0, 6).map((item) => (
          <TransactionItem key={item.id} item={item} />
        ))}
      </View>
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
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    transactionList: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
    },
  });
