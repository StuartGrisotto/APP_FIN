import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Transaction } from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import {
  categoryLabel,
  formatCurrency,
  formatDate,
  transactionTypeLabel,
} from '../utils/formatters';

interface TransactionItemProps {
  item: Transaction;
}

const categoryIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline',
  transport: 'car-outline',
  housing: 'home-outline',
  salary: 'cash-outline',
  leisure: 'game-controller-outline',
  health: 'medkit-outline',
  others: 'wallet-outline',
};

export const TransactionItem = ({ item }: TransactionItemProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const isIncome = item.type === 'income';

  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, isIncome ? styles.iconIncome : styles.iconExpense]}>
        <Ionicons
          name={categoryIcon[item.category]}
          size={20}
          color={isIncome ? colors.success : colors.destructive}
        />
      </View>

      <View style={styles.main}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {categoryLabel[item.category]} - {transactionTypeLabel[item.type]} - {formatDate(item.date)}
        </Text>
      </View>

      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]} numberOfLines={1}>
        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
      </Text>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: radii.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconIncome: {
      backgroundColor: colors.successSoft,
    },
    iconExpense: {
      backgroundColor: colors.destructiveSoft,
    },
    main: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    amount: {
      fontSize: 15,
      fontWeight: '800',
      maxWidth: 110,
      textAlign: 'right',
    },
    income: {
      color: colors.success,
    },
    expense: {
      color: colors.destructive,
    },
  });
