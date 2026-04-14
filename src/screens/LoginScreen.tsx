import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Screen } from '../components/ui/Screen';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';

export const LoginScreen = () => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { unlockWithBiometrics, clearLoginError, loggingIn, loginError } = useAuth();
  const attemptedAutoUnlock = useRef(false);

  const handleBiometricUnlock = useCallback(async () => {
    clearLoginError();

    try {
      await unlockWithBiometrics();
    } catch {
      // erro tratado no contexto
    }
  }, [clearLoginError, unlockWithBiometrics]);

  useEffect(() => {
    if (attemptedAutoUnlock.current) {
      return;
    }

    attemptedAutoUnlock.current = true;
    handleBiometricUnlock().catch(() => {
      // erro tratado no contexto
    });
  }, [handleBiometricUnlock]);

  return (
    <Screen scrollable={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoCard}>
            <Image
              source={require('../../assets/LogoStuart.png')}
              resizeMode="contain"
              style={styles.logoImage}
            />
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title}>Fluxo Financeiro</Text>
            <Text style={styles.subtitle}>Desbloqueie com biometria para entrar no app</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.infoRow}>
              <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              <Text style={styles.statusText}>
                {loggingIn ? 'Aguardando autenticacao biometrica...' : 'Use sua biometria para continuar.'}
              </Text>
            </View>

            {loginError ? <Text style={styles.globalError}>{loginError}</Text> : null}

            <PrimaryButton
              label={loggingIn ? 'Autenticando...' : 'Entrar com biometria'}
              onPress={() => {
                handleBiometricUnlock().catch(() => {
                  // erro tratado no contexto
                });
              }}
              loading={loggingIn}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.lg,
      paddingBottom: spacing.md,
    },
    content: {
      width: '100%',
      maxWidth: 420,
      gap: spacing.lg,
    },
    logoCard: {
      width: '100%',
      height: 220,
      borderRadius: radii.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    titleBox: {
      gap: spacing.xs,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 34,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },
    form: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.xl,
      gap: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    statusText: {
      color: colors.textPrimary,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '600',
    },
    globalError: {
      color: colors.destructive,
      fontSize: 13,
      textAlign: 'center',
    },
  });
