import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCategoryIcon, getCategoryLabel } from '../../../constants/categories';
import { useAppTheme } from '../../../context/ThemeContext';
import { Transaction } from '../../../types/finance';
import { radii, spacing } from '../../../theme/tokens';
import { formatCurrency, formatDate, transactionTypeLabel } from '../../../utils/formatters';

interface TransactionItemProps {
  item: Transaction;
  categoryLabelMap?: Record<string, string>;
  onPress?: (item: Transaction) => void;
}

export const TransactionItem = ({ item, categoryLabelMap, onPress }: TransactionItemProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const isIncome = item.type === 'income';

  return (
    <Pressable style={styles.row} onPress={() => onPress?.(item)}>
      <View style={[styles.iconBox, isIncome ? styles.iconIncome : styles.iconExpense]}>
        <Ionicons
          name={getCategoryIcon(item.category)}
          size={20}
          color={isIncome ? colors.success : colors.destructive}
        />
      </View>

      <View style={styles.main}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {getCategoryLabel(item.category, categoryLabelMap)} - {transactionTypeLabel[item.type]} - {formatDate(item.date)}
        </Text>
      </View>

      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]} numberOfLines={1}>
        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
      </Text>
    </Pressable>
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
