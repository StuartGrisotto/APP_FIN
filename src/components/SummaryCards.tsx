import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Summary } from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import { formatCurrencyShort } from '../utils/formatters';

interface SummaryCardsProps {
  summary: Summary;
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const periodResult = summary.incomeTotal - summary.expenseTotal;

  const cards = [
    {
      title: 'Receitas',
      value: summary.incomeTotal,
      color: colors.success,
    },
    {
      title: 'Despesas',
      value: summary.expenseTotal,
      color: colors.destructive,
    },
    {
      title: 'Resultado',
      value: periodResult,
      color: colors.accentBlue,
    },
  ];

  return (
    <View style={styles.row}>
      {cards.map((card) => (
        <View key={card.title} style={styles.card}>
          <Text style={styles.label}>{card.title}</Text>
          <Text style={[styles.value, { color: card.color }]} numberOfLines={1}>
            {formatCurrencyShort(card.value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      minHeight: 82,
      justifyContent: 'space-between',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    value: {
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '800',
    },
  });
