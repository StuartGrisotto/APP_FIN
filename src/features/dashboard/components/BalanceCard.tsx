import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { Summary } from '../../../types/finance';
import { radii, spacing } from '../../../theme/tokens';
import { formatCurrency } from '../../../utils/formatters';

interface BalanceCardProps {
  summary: Summary;
}

export const BalanceCard = ({ summary }: BalanceCardProps) => {
  const { colors, mode } = useAppTheme();
  const styles = createStyles(colors, mode);
  const [hidden, setHidden] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Saldo disponivel</Text>
        <Pressable style={styles.eyeButton} onPress={() => setHidden((prev) => !prev)}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.white}
          />
        </Pressable>
      </View>

      <Text style={styles.balance}>{hidden ? 'R$ ••••••' : formatCurrency(summary.balance)}</Text>

      <View style={styles.row}>
        <View style={[styles.miniCard, styles.incomeBackground]}>
          <View style={styles.miniContent}>
            <View style={[styles.miniIconWrap, styles.incomeIconWrap]}>
              <MaterialCommunityIcons name="trending-up" size={14} color={colors.success} />
            </View>
            <View>
              <Text style={styles.miniLabel}>Receitas</Text>
              <Text style={styles.miniValue}>
                {hidden ? 'R$ ••••••' : formatCurrency(summary.incomeTotal)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.miniCard, styles.expenseBackground]}>
          <View style={styles.miniContent}>
            <View style={[styles.miniIconWrap, styles.expenseIconWrap]}>
              <MaterialCommunityIcons name="trending-down" size={14} color={colors.destructive} />
            </View>
            <View>
              <Text style={styles.miniLabel}>Despesas</Text>
              <Text style={styles.miniValue}>
                {hidden ? 'R$ ••••••' : formatCurrency(summary.expenseTotal)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any, mode: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      borderRadius: radii.xl,
      backgroundColor: mode === 'dark' ? colors.surface : colors.primary,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      color: 'rgba(255, 255, 255, 0.86)',
      fontSize: 16,
      fontWeight: '500',
    },
    eyeButton: {
      width: 34,
      height: 34,
      borderRadius: radii.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    balance: {
      color: colors.white,
      fontSize: 32,
      lineHeight: 42,
      fontWeight: '700',
      letterSpacing: -1,
    },
    row: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      gap: spacing.md,
    },
    miniCard: {
      flex: 1,
      borderRadius: radii.md,
      padding: spacing.md,
    },
    miniContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    miniIconWrap: {
      width: 22,
      height: 22,
      borderRadius: radii.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    incomeIconWrap: {
      backgroundColor: colors.successSoft,
    },
    expenseIconWrap: {
      backgroundColor: colors.destructiveSoft,
    },
    incomeBackground: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    expenseBackground: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    miniLabel: {
      color: 'rgba(255, 255, 255, 0.86)',
      fontSize: 12,
      fontWeight: '500',
    },
    miniValue: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
    },
  });
