import { TransactionType } from '../types/finance';

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

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
};
