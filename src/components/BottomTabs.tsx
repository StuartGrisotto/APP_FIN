import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';

export type TabKey = 'home' | 'transactions' | 'settings';

interface BottomTabsProps {
  current: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Inicio', icon: 'grid-outline' },
  { key: 'transactions', label: 'Extrato', icon: 'swap-horizontal-outline' },
  { key: 'settings', label: 'Ajustes', icon: 'settings-outline' },
];

export const BottomTabs = ({ current, onChange }: BottomTabsProps) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const active = tab.key === current;

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={active ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      paddingHorizontal: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    tab: {
      alignItems: 'center',
      gap: 2,
      minWidth: 64,
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
    labelActive: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
