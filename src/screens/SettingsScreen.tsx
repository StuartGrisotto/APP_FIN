import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PluggyConnect } from 'react-native-pluggy-connect';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { backendBaseUrl } from '../config/backend';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAppTheme } from '../context/ThemeContext';
import { pluggyService } from '../services/pluggyService';
import { ThemeMode } from '../theme/palettes';
import { radii, spacing } from '../theme/tokens';
import { formatDateTime } from '../utils/formatters';

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
    importingPluggy,
    pluggyImportFeedback,
    lastPluggySyncAt,
    importPluggyItem,
    clearPluggyFeedback,
  } = useFinance();
  const [lastConnectedItemId, setLastConnectedItemId] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [meuPluggyConnectorId, setMeuPluggyConnectorId] = useState<number | null>(null);
  const [creatingConnectToken, setCreatingConnectToken] = useState(false);
  const [pluggyFlowError, setPluggyFlowError] = useState<string | null>(null);

  const handleCreateConnectToken = async () => {
    setCreatingConnectToken(true);
    setPluggyFlowError(null);
    clearPluggyFeedback();

    try {
      const clientUserId = user?.id ? `appfin-${user.id}` : `appfin-${Date.now()}`;
      const data = await pluggyService.createConnectToken(clientUserId);
      setMeuPluggyConnectorId(data.meuPluggyConnectorId);
      setConnectToken(data.connectToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel iniciar o Pluggy Connect.';
      setPluggyFlowError(message);
    } finally {
      setCreatingConnectToken(false);
    }
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
            <Ionicons name="link-outline" size={18} color={colors.primary} />
          </View>

          <View style={styles.statementInfo}>
            <Text style={styles.statementTitle}>Open Finance (Pluggy)</Text>
            <Text style={styles.statementSubtitle}>Conecte e importe transacoes bancarias</Text>
          </View>
        </View>

        <Text style={styles.statementDescription}>
          Abra o Pluggy Connect dentro do app, conecte via MeuPluggy e a importacao das transacoes reais sera feita automaticamente.
        </Text>

        <Text style={styles.metaLine}>Backend: {backendBaseUrl}</Text>
        <Text style={styles.metaLine}>Total de movimentacoes no app: {dashboard?.transactions.length ?? 0}</Text>
        {lastPluggySyncAt ? (
          <Text style={styles.metaLine}>Ultima sincronizacao: {formatDateTime(lastPluggySyncAt)}</Text>
        ) : (
          <Text style={styles.metaLine}>Ultima sincronizacao: ainda nao realizada</Text>
        )}

        <PrimaryButton
          label="Conectar MeuPluggy"
          onPress={() => {
            handleCreateConnectToken().catch(() => {
              // erro tratado no estado local
            });
          }}
          loading={creatingConnectToken}
        />

        {lastConnectedItemId ? <Text style={styles.metaLine}>Ultimo item conectado: {lastConnectedItemId}</Text> : null}
        {importingPluggy ? <Text style={styles.metaLine}>Importando transacoes do item conectado...</Text> : null}
        {pluggyFlowError ? <Text style={styles.errorText}>{pluggyFlowError}</Text> : null}
        {pluggyImportFeedback ? <Text style={styles.feedbackText}>{pluggyImportFeedback}</Text> : null}
      </View>

      <Modal visible={Boolean(connectToken)} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.connectModal}>
          <View style={styles.connectHeader}>
            <Text style={styles.connectTitle}>Pluggy Connect</Text>
            <Pressable
              style={styles.connectClose}
              onPress={() => {
                setConnectToken(null);
              }}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {connectToken ? (
            <PluggyConnect
              connectToken={connectToken}
              includeSandbox={false}
              connectorIds={meuPluggyConnectorId ? [meuPluggyConnectorId] : undefined}
              selectedConnectorId={meuPluggyConnectorId ?? undefined}
              language="pt"
              theme={mode === 'dark' ? 'dark' : 'light'}
              onSuccess={({ item }) => {
                const itemId = item?.id;
                if (!itemId) {
                  return;
                }

                setLastConnectedItemId(itemId);
                setConnectToken(null);
                setPluggyFlowError(null);
                clearPluggyFeedback();
                importPluggyItem(itemId)
                  .catch((error) => {
                    const message =
                      error instanceof Error
                        ? error.message
                        : 'Falha ao importar transacoes apos conectar o banco.';
                    setPluggyFlowError(message);
                  });
              }}
              onError={(error) => {
                const message = error?.message || 'Erro no Pluggy Connect.';
                setPluggyFlowError(message);
              }}
              onClose={() => {
                setConnectToken(null);
              }}
            />
          ) : null}
        </View>
      </Modal>
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
    errorText: {
      color: colors.destructive,
      fontSize: 12,
      fontWeight: '600',
    },
    connectModal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    connectHeader: {
      height: 60,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    connectTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    connectClose: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    buttons: {
      gap: spacing.sm,
    },
  });
