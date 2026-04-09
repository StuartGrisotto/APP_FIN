import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { ThemeMode } from '../theme/palettes';
import { radii, spacing } from '../theme/tokens';

interface SettingsScreenProps {
  onBackToHome: () => void;
}

const menuItems = [
  {
    id: 'profile',
    title: 'Meu perfil',
    subtitle: 'Informacoes pessoais',
    icon: 'person-outline' as const,
    enabled: true,
  },
  {
    id: 'statement',
    title: 'Importar extrato',
    subtitle: 'CSV do banco com historico',
    icon: 'document-attach-outline' as const,
    enabled: true,
  },
  {
    id: 'security',
    title: 'Seguranca',
    subtitle: 'Senha e autenticacao',
    icon: 'shield-checkmark-outline' as const,
    enabled: false,
  },
];

export const SettingsScreen = ({ onBackToHome }: SettingsScreenProps) => {
  const { colors, mode, setMode } = useAppTheme();
  const styles = createStyles(colors, mode);

  const { user, logout } = useAuth();
  const {
    dashboard,
    importingStatement,
    statementImportFeedback,
    importStatementCsv,
    clearStatementFeedback,
  } = useFinance();

  const handleImportStatement = async () => {
    clearStatementFeedback();

    const picked = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
    });

    if (picked.canceled) {
      return;
    }

    const asset = picked.assets[0];
    if (!asset?.uri) {
      return;
    }

    const csvContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await importStatementCsv(csvContent);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={onBackToHome}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.valueName}>{user?.name}</Text>
          <Text style={styles.valueEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.modeCard}>
        <Text style={styles.modeTitle}>Tema do app</Text>
        <View style={styles.modeSwitcher}>
          <ModeButton mode={mode} target="light" label="Lite mode" onPress={setMode} />
          <ModeButton mode={mode} target="dark" label="Dark mode" onPress={setMode} />
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => {
          const disabled = !item.enabled;

          return (
            <View key={item.id}>
              <Pressable style={styles.menuRow} disabled={disabled}>
                <View style={[styles.menuIcon, disabled && styles.menuIconDisabled]}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={disabled ? colors.textMuted : colors.textSecondary}
                  />
                </View>

                <View style={styles.menuTextBox}>
                  <Text style={[styles.menuTitle, disabled && styles.disabledText]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, disabled && styles.disabledText]}>{item.subtitle}</Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>

      <View style={styles.statementCard}>
        <View style={styles.statementHeader}>
          <View style={styles.statementIconBox}>
            <Ionicons name="document-text-outline" size={18} color={colors.accentBlue} />
          </View>

          <View style={styles.statementInfo}>
            <Text style={styles.statementTitle}>Adicionar extrato (CSV)</Text>
            <Text style={styles.statementSubtitle}>Acumula historico e remove duplicados automaticamente</Text>
          </View>
        </View>

        <Text style={styles.statementDescription}>
          Selecione o arquivo CSV do banco no celular. O app soma no historico existente e ignora lancamentos repetidos.
        </Text>

        <Text style={styles.metaLine}>
          Total de movimentacoes no app: {dashboard?.transactions.length ?? 0}
        </Text>

        {statementImportFeedback ? <Text style={styles.feedbackText}>{statementImportFeedback}</Text> : null}

        <View style={styles.buttons}>
          <PrimaryButton
            label="Selecionar extrato CSV"
            onPress={() => {
              handleImportStatement().catch(() => {
                // feedback exibido no contexto ao falhar no parse/import
              });
            }}
            loading={importingStatement}
          />
        </View>
      </View>
    </Screen>
  );
};

const ModeButton = ({
  mode,
  target,
  label,
  onPress,
}: {
  mode: ThemeMode;
  target: ThemeMode;
  label: string;
  onPress: (mode: ThemeMode) => void;
}) => {
  const { colors } = useAppTheme();
  const active = mode === target;

  return (
    <Pressable
      style={{
        flex: 1,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primarySoft : colors.surface,
        paddingVertical: spacing.sm,
        alignItems: 'center',
      }}
      onPress={() => onPress(target)}
    >
      <Text
        style={{
          color: active ? colors.primary : colors.textSecondary,
          fontWeight: '700',
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const createStyles = (colors: any, mode: ThemeMode) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    profileCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.primary,
      fontSize: 28,
      fontWeight: '800',
    },
    profileInfo: {
      flex: 1,
    },
    valueName: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    valueEmail: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 2,
    },
    modeCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    modeTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    modeSwitcher: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    menuCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    menuIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      backgroundColor: colors.backgroundElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuIconDisabled: {
      opacity: 0.7,
    },
    menuTextBox: {
      flex: 1,
    },
    menuTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
    },
    menuSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    disabledText: {
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 70,
    },
    logoutButton: {
      borderRadius: radii.lg,
      backgroundColor: colors.destructiveSoft,
      borderWidth: 1,
      borderColor: colors.destructive,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    logoutText: {
      color: colors.destructive,
      fontSize: 19,
      fontWeight: '700',
    },
    statementCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    statementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statementIconBox: {
      width: 42,
      height: 42,
      borderRadius: radii.md,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statementInfo: {
      flex: 1,
    },
    statementTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    statementSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    statementDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    metaLine: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    feedbackText: {
      color: mode === 'dark' ? colors.success : colors.accentBlue,
      fontSize: 12,
      fontWeight: '600',
    },
    buttons: {
      gap: spacing.sm,
    },
  });
