import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme/tokens';

export const LoginScreen = () => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { login, loggingIn, loginError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    if (!touched) {
      return { email: null, password: null };
    }

    return {
      email: email.includes('@') ? null : 'Digite um e-mail valido.',
      password: password.length >= 6 ? null : 'Senha deve ter ao menos 6 caracteres.',
    };
  }, [email, password, touched]);

  const handleLogin = async () => {
    setTouched(true);

    if (errors.email || errors.password) {
      return;
    }

    try {
      await login({ email, password });
    } catch {
      // erro tratado no contexto
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.brandCircle}>
          <Ionicons name="trending-up" size={42} color={colors.primary} />
        </View>

        <Text style={styles.title}>Fluxo Financeiro</Text>
        <Text style={styles.subtitle}>Entre para acompanhar sua vida financeira</Text>

        <View style={styles.form}>
          <InputField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            error={errors.email}
          />

          <InputField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="******"
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            error={errors.password}
          />

          {loginError ? <Text style={styles.globalError}>{loginError}</Text> : null}

          <PrimaryButton label="Entrar" onPress={handleLogin} loading={loggingIn} />

          <Pressable>
            <Text style={styles.helperLink}>Esqueci minha senha</Text>
          </Pressable>

          <Pressable style={styles.linkRow}>
            <Text style={styles.linkHint}>Ainda nao tem conta?</Text>
            <Text style={styles.linkStrong}> Criar conta</Text>
          </Pressable>

          <PrimaryButton
            variant="ghost"
            label="Continuar com Google (em breve)"
            onPress={() => undefined}
          />
        </View>
      </View>
    </Screen>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    brandCircle: {
      width: 88,
      height: 88,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 36,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
    },
    form: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: spacing.xl,
      gap: spacing.md,
    },
    helperLink: {
      color: colors.accentBlue,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    linkHint: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    linkStrong: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    globalError: {
      color: colors.destructive,
      fontSize: 13,
      textAlign: 'center',
    },
  });
