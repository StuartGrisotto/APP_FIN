import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { radii, spacing } from '../../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export const PrimaryButton = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: PrimaryButtonProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[styles.button, variant === 'ghost' ? styles.ghost : styles.primary, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.textPrimary : colors.white} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' && styles.labelGhost]}>{label}</Text>
      )}
    </Pressable>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    button: {
      height: 52,
      borderRadius: radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabled: {
      opacity: 0.6,
    },
    label: {
      color: colors.white,
      fontSize: 17,
      fontWeight: '700',
    },
    labelGhost: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
