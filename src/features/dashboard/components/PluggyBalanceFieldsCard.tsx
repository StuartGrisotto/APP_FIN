import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { radii, spacing } from '../../../theme/tokens';
import { PluggyBalanceFieldCandidate } from '../../../types/finance';
import { formatCurrency } from '../../../utils/formatters';

interface PluggyBalanceFieldsCardProps {
  fields: PluggyBalanceFieldCandidate[];
}

export const PluggyBalanceFieldsCard = ({ fields }: PluggyBalanceFieldsCardProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.balanceFieldsCard}>
      <Text style={styles.sectionTitle}>Campos de saldo (MeuPluggy)</Text>
      {fields.length > 0 ? (
        fields.map((item, index) => (
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
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    balanceFieldsCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.2,
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
    emptyFilteredText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
