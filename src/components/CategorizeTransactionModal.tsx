import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryOption, Transaction } from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import { InputField } from './InputField';
import { PrimaryButton } from './PrimaryButton';
import { useAppTheme } from '../context/ThemeContext';

interface CategorizeTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  categories: CategoryOption[];
  loading?: boolean;
  onClose: () => void;
  onSave: (categoryId: string, newCategoryLabel?: string) => Promise<void>;
}

export const CategorizeTransactionModal = ({
  visible,
  transaction,
  categories,
  loading,
  onClose,
  onSave,
}: CategorizeTransactionModalProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState<string>('others');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !transaction) {
      return;
    }
    setSelectedCategory(transaction.category || 'others');
    setCreatingCategory(false);
    setNewCategoryLabel('');
    setError(null);
  }, [visible, transaction]);

  const helperText = useMemo(() => {
    if (!transaction) {
      return '';
    }
    return `Regra por nome: todas as movimentacoes de \"${transaction.title}\" usarao a categoria escolhida.`;
  }, [transaction]);

  const handleSave = async () => {
    if (creatingCategory) {
      const label = newCategoryLabel.trim();
      if (!label) {
        setError('Informe o nome da nova categoria.');
        return;
      }
      setError(null);
      await onSave('__new__', label);
      return;
    }

    setError(null);
    await onSave(selectedCategory);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Categorizar movimentacao</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {transaction ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{transaction.title}</Text>
              <Text style={styles.infoSubtitle}>{helperText}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.categoriesWrap}>
              {categories.map((category) => {
                const active = !creatingCategory && selectedCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setCreatingCategory(false);
                      setSelectedCategory(category.id);
                    }}
                    style={[styles.categoryPill, active && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setCreatingCategory((prev) => !prev)}
              style={[styles.newCategoryButton, creatingCategory && styles.newCategoryButtonActive]}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.newCategoryText}>Criar nova categoria</Text>
            </Pressable>

            {creatingCategory ? (
              <InputField
                label="Nome da categoria"
                value={newCategoryLabel}
                onChangeText={setNewCategoryLabel}
                placeholder="Ex: Assinaturas, Pets, Educacao..."
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <PrimaryButton label="Salvar categoria" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(2, 6, 23, 0.45)',
      justifyContent: 'flex-end',
    },
    container: {
      maxHeight: '90%',
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      backgroundColor: colors.backgroundElevated,
      borderTopWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    infoCard: {
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    infoTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    infoSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    content: {
      maxHeight: 360,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    categoriesWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryPill: {
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    categoryPillActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    categoryText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    categoryTextActive: {
      color: colors.primary,
    },
    newCategoryButton: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    newCategoryButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    newCategoryText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    error: {
      marginTop: spacing.sm,
      color: colors.destructive,
      fontSize: 13,
    },
  });
