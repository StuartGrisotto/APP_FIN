import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { getCategoryLabel } from '../constants/categories';
import { useAppTheme } from '../context/ThemeContext';
import { Transaction } from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import { formatCurrency } from '../utils/formatters';

interface ExpenseDonutCardProps {
  transactions: Transaction[];
  categoryLabelMap?: Record<string, string>;
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
}

interface CategorySlice {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

const getMonochromeColor = (index: number, total: number): string => {
  if (total <= 1) {
    return '#FFFFFF';
  }

  const ratio = index / (total - 1);
  const channel = Math.round(255 * (1 - ratio));
  const hex = channel.toString(16).padStart(2, '0').toUpperCase();
  return `#${hex}${hex}${hex}`;
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

export const ExpenseDonutCard = ({
  transactions,
  categoryLabelMap,
  selectedCategory,
  onSelectCategory,
}: ExpenseDonutCardProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const expenseTransactions = transactions.filter((item) => item.type === 'expense');
  const total = expenseTransactions.reduce((acc, item) => acc + item.amount, 0);

  const grouped = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount;
    return acc;
  }, {});

  const sortedEntries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

  const slices: CategorySlice[] = sortedEntries
    .map(([category, value], index, arr) => ({
      category,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: getMonochromeColor(index, arr.length),
    }));

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

              const active = selectedCategory === slice.category;
              const dimmed = Boolean(selectedCategory && !active);

              return (
                <G key={slice.category}>
                  <Path
                    d={arcPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle)}
                    fill={slice.color}
                    opacity={dimmed ? 0.3 : 1}
                    stroke={active ? colors.textPrimary : colors.background}
                    strokeWidth={active ? 1.8 : 1}
                    onPress={() => onSelectCategory?.(active ? null : slice.category)}
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
          {visibleSlices.map((slice) => {
            const active = selectedCategory === slice.category;
            return (
              <Pressable
                style={[styles.legendRow, active && styles.legendRowActive]}
                key={slice.category}
                onPress={() => onSelectCategory?.(active ? null : slice.category)}
              >
                <View style={[styles.dot, { backgroundColor: slice.color }]} />
                <Text style={styles.legendName}>{getCategoryLabel(slice.category, categoryLabelMap)}</Text>
                <Text style={styles.legendValue}>{Math.round(slice.percentage)}%</Text>
              </Pressable>
            );
          })}

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
      borderRadius: radii.md,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
    },
    legendRowActive: {
      backgroundColor: colors.primarySoft,
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
