import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { radii, spacing } from '../../../theme/tokens';

interface DashboardHeaderProps {
  userName?: string;
  onOpenSettings: () => void;
}

export const DashboardHeader = ({ userName, onOpenSettings }: DashboardHeaderProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.userName}>{userName ?? 'Usuario'}</Text>
      </View>

      <View style={styles.headerIcons}>
        <Pressable style={styles.circleIcon}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.circleIcon} onPress={onOpenSettings}>
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    userName: {
      color: colors.textPrimary,
      fontSize: 40,
      lineHeight: 42,
      fontWeight: '800',
      letterSpacing: -1,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    circleIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
