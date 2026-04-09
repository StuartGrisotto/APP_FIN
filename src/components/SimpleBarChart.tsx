import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { ChartPoint } from '../types/finance';
import { radii, spacing } from '../theme/tokens';

interface SimpleBarChartProps {
  points: ChartPoint[];
}

export const SimpleBarChart = ({ points }: SimpleBarChartProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.income, point.expense]),
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Receitas vs Despesas</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.chartIncome }]} />
            <Text style={styles.legendLabel}>Receita</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.chartExpense }]} />
            <Text style={styles.legendLabel}>Despesa</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartRow}>
        {points.map((point) => {
          const incomeHeight = (point.income / maxValue) * 120;
          const expenseHeight = (point.expense / maxValue) * 120;

          return (
            <View key={point.label} style={styles.group}>
              <View style={styles.bars}>
                <View
                  style={[
                    styles.bar,
                    { backgroundColor: colors.chartIncome, height: Math.max(6, incomeHeight) },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    { backgroundColor: colors.chartExpense, height: Math.max(6, expenseHeight) },
                  ]}
                />
              </View>
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
    legendRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radii.pill,
    },
    legendLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    chartRow: {
      minHeight: 150,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    group: {
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      height: 126,
    },
    bar: {
      width: 14,
      borderTopLeftRadius: radii.pill,
      borderTopRightRadius: radii.pill,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
  });
