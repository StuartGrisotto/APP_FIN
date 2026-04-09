import { Ionicons } from '@expo/vector-icons';
import { CategoryOption } from '../types/finance';

export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'housing', label: 'Moradia', isCustom: false },
  { id: 'food', label: 'Alimentacao', isCustom: false },
  { id: 'shopping', label: 'Compras', isCustom: false },
  { id: 'transport', label: 'Transporte', isCustom: false },
  { id: 'health', label: 'Saude', isCustom: false },
  { id: 'salary', label: 'Salario', isCustom: false },
  { id: 'leisure', label: 'Lazer', isCustom: false },
  { id: 'others', label: 'Outros', isCustom: false },
];

const defaultCategoryMap: Record<string, string> = DEFAULT_CATEGORY_OPTIONS.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<string, string>,
);

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const humanizeCategoryId = (categoryId: string): string => {
  if (categoryId.startsWith('custom_')) {
    const raw = categoryId.slice('custom_'.length);
    const pretty = raw.replace(/[-_]+/g, ' ').trim();
    return pretty ? toTitleCase(pretty) : 'Categoria personalizada';
  }

  const plain = categoryId.replace(/[-_]+/g, ' ').trim();
  return plain ? toTitleCase(plain) : categoryId;
};

export const getCategoryLabel = (
  categoryId: string,
  customLabels: Record<string, string> = {},
): string => {
  const custom = customLabels[categoryId];
  if (custom) {
    return custom;
  }
  const defaultLabel = defaultCategoryMap[categoryId];
  if (defaultLabel) {
    return defaultLabel;
  }
  return humanizeCategoryId(categoryId);
};

export const buildCategoryOptions = (
  customLabels: Record<string, string> = {},
): CategoryOption[] => {
  const defaultsById = new Set(DEFAULT_CATEGORY_OPTIONS.map((item) => item.id));
  const customOptions = Object.entries(customLabels)
    .filter(([id, label]) => Boolean(id) && Boolean(label) && !defaultsById.has(id))
    .map(([id, label]) => ({ id, label, isCustom: true }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  return [...DEFAULT_CATEGORY_OPTIONS, ...customOptions];
};

export const getCategoryIcon = (categoryId: string): keyof typeof Ionicons.glyphMap => {
  const known: Record<string, keyof typeof Ionicons.glyphMap> = {
    food: 'restaurant-outline',
    transport: 'car-outline',
    housing: 'home-outline',
    shopping: 'bag-handle-outline',
    salary: 'cash-outline',
    leisure: 'game-controller-outline',
    health: 'medkit-outline',
    others: 'wallet-outline',
  };

  return known[categoryId] ?? 'pricetag-outline';
};

export const getCategoryColor = (categoryId: string): string => {
  const known: Record<string, string> = {
    food: '#FB923C',
    transport: '#60A5FA',
    housing: '#C084FC',
    shopping: '#A78BFA',
    health: '#FB7185',
    leisure: '#22D3EE',
    salary: '#2DD4BF',
    others: '#71717A',
  };

  return known[categoryId] ?? '#94A3B8';
};

export const normalizeCounterpartyName = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const slugifyCategoryLabel = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
