import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import {
  CreateTransactionPayload,
  TransactionCategory,
  TransactionType,
} from '../types/finance';
import { radii, spacing } from '../theme/tokens';
import { InputField } from './InputField';
import { PrimaryButton } from './PrimaryButton';

interface AddTransactionModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
}

const categories: { label: string; value: TransactionCategory }[] = [
  { label: 'Alimentacao', value: 'food' },
  { label: 'Transporte', value: 'transport' },
  { label: 'Moradia', value: 'housing' },
  { label: 'Salario', value: 'salary' },
  { label: 'Lazer', value: 'leisure' },
  { label: 'Saude', value: 'health' },
  { label: 'Outros', value: 'others' },
];

const types: { label: string; value: TransactionType }[] = [
  { label: 'Receita', value: 'income' },
  { label: 'Despesa', value: 'expense' },
];

export const AddTransactionModal = ({
  visible,
  loading,
  onClose,
  onSubmit,
}: AddTransactionModalProps) => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('others');
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => Number(amount.replace(',', '.')), [amount]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Informe o nome da movimentacao.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor valido.');
      return;
    }

    setError(null);

    await onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      category,
      type,
      date: new Date().toISOString(),
    });

    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('others');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Nova movimentacao</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <InputField
                label="Descricao"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Mercado, Salario, Uber..."
              />

              <InputField
                label="Valor"
                value={amount}
                onChangeText={setAmount}
                placeholder="0,00"
                keyboardType="numeric"
              />

              <View style={styles.selectGroup}>
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.selectRow}>
                  {types.map((item) => {
                    const active = item.value === type;
                    return (
                      <Pressable
                        key={item.value}
                        style={[styles.selectPill, active && styles.selectPillActive]}
                        onPress={() => setType(item.value)}
                      >
                        <Text
                          style={[
                            styles.selectPillText,
                            active && styles.selectPillTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.selectGroup}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.selectWrap}>
                  {categories.map((item) => {
                    const active = item.value === category;
                    return (
                      <Pressable
                        key={item.value}
                        style={[styles.categoryPill, active && styles.categoryPillActive]}
                        onPress={() => setCategory(item.value)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            active && styles.categoryTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <PrimaryButton
                label="Salvar movimentacao"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </ScrollView>
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
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
    },
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xl,
    },
    selectGroup: {
      gap: spacing.sm,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    selectRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    selectPill: {
      flex: 1,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    selectPillActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    selectPillText: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    selectPillTextActive: {
      color: colors.primary,
    },
    selectWrap: {
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
      backgroundColor: colors.accentBlue,
      borderColor: colors.accentBlue,
    },
    categoryText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    categoryTextActive: {
      color: colors.white,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
    },
  });
