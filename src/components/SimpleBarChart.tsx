import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useAppTheme } from '../context/ThemeContext';
import { ChartPoint } from '../types/finance';
import { radii, spacing } from '../theme/tokens';

interface SimpleBarChartProps {
  points: ChartPoint[];
}

const buildPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
};

export const SimpleBarChart = ({ points }: SimpleBarChartProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const deltas = points.map((point) => point.income - point.expense);
  const evolution = deltas.reduce<number[]>((acc, delta) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(previous + delta);
    return acc;
  }, []);

  const width = Math.max(320, points.length * 24);
  const height = 170;
  const padX = 8;
  const padTop = 12;
  const padBottom = 22;
  const innerHeight = height - padTop - padBottom;
  const innerWidth = width - padX * 2;

  const minValue = Math.min(0, ...evolution);
  const maxValue = Math.max(0, ...evolution);
  const range = Math.max(1, maxValue - minValue);

  const chartPoints = evolution.map((value, index) => {
    const x =
      evolution.length <= 1
        ? width / 2
        : padX + (index / (evolution.length - 1)) * innerWidth;
    const y = padTop + ((maxValue - value) / range) * innerHeight;
    return { x, y };
  });

  const linePath = buildPath(chartPoints);
  const areaPath =
    chartPoints.length > 0
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} ${(height - padBottom).toFixed(2)} L ${chartPoints[0].x.toFixed(2)} ${(height - padBottom).toFixed(2)} Z`
      : '';

  const endPoint = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Evolucao do saldo</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={{ width }}>
          <View style={styles.chartWrap}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <Defs>
                <LinearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.chartExpense} stopOpacity="0.45" />
                  <Stop offset="100%" stopColor={colors.chartExpense} stopOpacity="0.03" />
                </LinearGradient>
              </Defs>

              {areaPath ? <Path d={areaPath} fill="url(#balanceFill)" /> : null}
              {linePath ? <Path d={linePath} stroke={colors.chartExpense} strokeWidth={2.2} fill="none" /> : null}

              {endPoint ? (
                <Path
                  d={`M ${endPoint.x - 4} ${endPoint.y} a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`}
                  fill={colors.chartExpense}
                />
              ) : null}
            </Svg>
          </View>

          <View style={styles.labelsTrack}>
            {points.map((point, index) => {
              const x = chartPoints[index]?.x ?? 0;
              const left = Math.max(0, Math.min(width - 26, x - 13));
              return (
                <Text key={`${point.label}-${index}`} style={[styles.labelTick, { left }]}>
                  {point.label}
                </Text>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
      gap: spacing.sm,
    },
    kicker: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0,
    },
    chartWrap: {
      marginTop: spacing.xs,
      borderRadius: radii.md,
      overflow: 'hidden',
    },
    scrollContent: {
      paddingRight: spacing.xs,
    },
    labelsTrack: {
      position: 'relative',
      height: 16,
      marginTop: -6,
    },
    labelTick: {
      position: 'absolute',
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '500',
      width: 26,
      textAlign: 'center',
    },
  });
