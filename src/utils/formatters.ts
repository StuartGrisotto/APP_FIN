import { TransactionCategory, TransactionType } from '../types/finance';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCurrencyShort = (value: number): string => {
  const abs = Math.abs(value);

  if (abs >= 1000) {
    const shortValue = (value / 1000).toFixed(1).replace('.', ',');
    return `R$ ${shortValue}k`;
  }

  return `R$ ${value.toFixed(0).replace('.', ',')}`;
};

export const formatDate = (value: string): string => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

export const categoryLabel: Record<TransactionCategory, string> = {
  food: 'Alimentacao',
  transport: 'Transporte',
  housing: 'Moradia',
  salary: 'Salario',
  leisure: 'Lazer',
  health: 'Saude',
  others: 'Outros',
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
};
