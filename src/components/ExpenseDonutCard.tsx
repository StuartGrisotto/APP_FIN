import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useAppTheme } from '../context/ThemeContext';
import { Transaction, TransactionCategory } from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import { categoryLabel, formatCurrency } from '../utils/formatters';

interface ExpenseDonutCardProps {
  transactions: Transaction[];
}

interface CategorySlice {
  category: TransactionCategory;
  value: number;
  percentage: number;
  color: string;
}

const categoryColors: Record<TransactionCategory, string> = {
  food: '#FB923C',
  transport: '#60A5FA',
  housing: '#C084FC',
  health: '#FB7185',
  leisure: '#22D3EE',
  salary: '#2DD4BF',
  others: '#71717A',
};

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const arcPath = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
};

export const ExpenseDonutCard = ({ transactions }: ExpenseDonutCardProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const expenseTransactions = transactions.filter((item) => item.type === 'expense');
  const total = expenseTransactions.reduce((acc, item) => acc + item.amount, 0);

  const grouped = expenseTransactions.reduce<Record<TransactionCategory, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {} as Record<TransactionCategory, number>);

  const slices: CategorySlice[] = Object.entries(grouped)
    .map(([category, value]) => ({
      category: category as TransactionCategory,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: categoryColors[category as TransactionCategory],
    }))
    .sort((a, b) => b.value - a.value);

  const visibleSlices = slices.slice(0, 5);
  const hiddenCount = Math.max(0, slices.length - visibleSlices.length);

  let currentAngle = 0;
  const chartSize = 132;
  const cx = chartSize / 2;
  const cy = chartSize / 2;
  const outerRadius = 65;
  const innerRadius = 45;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Despesas por categoria</Text>

      <View style={styles.contentRow}>
        <View style={styles.chartWrap}>
          <Svg width={chartSize} height={chartSize}>
            <Circle cx={cx} cy={cy} r={outerRadius} fill={colors.muted} />
            {visibleSlices.map((slice) => {
              const sweep = (slice.percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + sweep;
              currentAngle = endAngle;

              if (sweep <= 0) {
                return null;
              }

              return (
                <G key={slice.category}>
                  <Path
                    d={arcPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle)}
                    fill={slice.color}
                  />
                </G>
              );
            })}
            <Circle cx={cx} cy={cy} r={innerRadius - 1} fill={colors.surface} />
          </Svg>

          <View style={styles.centerTextWrap}>
            <Text style={styles.centerValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.legendCol}>
          {visibleSlices.map((slice) => (
            <View style={styles.legendRow} key={slice.category}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendName}>{categoryLabel[slice.category]}</Text>
              <Text style={styles.legendValue}>{Math.round(slice.percentage)}%</Text>
            </View>
          ))}

          {hiddenCount > 0 ? <Text style={styles.moreText}>+{hiddenCount} outras</Text> : null}
        </View>
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
      gap: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: -0.4,
    },
    contentRow: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
    },
    chartWrap: {
      width: 150,
      height: 132,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerTextWrap: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: 80,
    },
    centerLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    centerValue: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    legendCol: {
      flex: 1,
      gap: spacing.sm,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radii.pill,
    },
    legendName: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
    },
    legendValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    moreText: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      fontSize: 13,
    },
  });
