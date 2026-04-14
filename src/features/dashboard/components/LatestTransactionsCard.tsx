import { StyleSheet, Text, View } from 'react-native';
import { getCategoryLabel } from '../../../constants/categories';
import { radii, spacing } from '../../../theme/tokens';
import { Transaction } from '../../../types/finance';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useAppTheme } from '../../../context/ThemeContext';

interface LatestTransactionsCardProps {
  transactions: Transaction[];
  categoryLabelMap: Record<string, string>;
  selectedCategory: string | null;
  onSelectTransaction: (transaction: Transaction) => void;
}

export const LatestTransactionsCard = ({
  transactions,
  categoryLabelMap,
  selectedCategory,
  onSelectTransaction,
}: LatestTransactionsCardProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <>
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
        {selectedCategory ? (
          <Text style={styles.filteredBy}>
            Filtrando por: {getCategoryLabel(selectedCategory, categoryLabelMap)}
          </Text>
        ) : null}
      </View>

      <View style={styles.transactionList}>
        {transactions.length > 0 ? (
          transactions.map((item) => (
            <TransactionItem
              key={item.id}
              item={item}
              categoryLabelMap={categoryLabelMap}
              onPress={onSelectTransaction}
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
    </>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
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
    emptyFilteredWrap: {
      paddingVertical: spacing.lg,
    },
    emptyFilteredText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
