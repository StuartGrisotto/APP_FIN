import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { buildMockDashboard } from '../mocks/financeData';
import {
  CreateTransactionPayload,
  DashboardData,
  PeriodFilter,
  PluggyImportResult,
  StatementImportResult,
  Transaction,
  TransactionCategory,
} from '../types/finance';
import { pluggyService } from './pluggyService';
import { mergeParsedTransactions, parseNubankCsv } from './statementImport';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = 'app_fin_transactions_realonly_v1';
const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}app_fin_transactions_realonly_v1.json`;

let transactionsDb: Transaction[] = [];
let hydrated = false;

const readFromFileBackup = async (): Promise<Transaction[] | null> => {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  try {
    const info = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (!info.exists) {
      return null;
    }

    const raw = await FileSystem.readAsStringAsync(STORAGE_FILE, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed = JSON.parse(raw) as Transaction[];
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeToFileBackup = async (transactions: Transaction[]) => {
  if (!FileSystem.documentDirectory) {
    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(transactions), {
    encoding: FileSystem.EncodingType.UTF8,
  });
};

const hydrateTransactions = async () => {
  if (hydrated) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Transaction[];
      transactionsDb = Array.isArray(parsed) ? parsed : [];
      hydrated = true;
      return;
    }

    const fileBackup = await readFromFileBackup();
    if (fileBackup) {
      transactionsDb = fileBackup;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fileBackup));
      hydrated = true;
      return;
    }

    transactionsDb = [];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactionsDb));
    await writeToFileBackup(transactionsDb);
  } catch {
    const fileBackup = await readFromFileBackup();
    if (fileBackup) {
      transactionsDb = fileBackup;
    } else {
      transactionsDb = [];
    }
  }

  hydrated = true;
};

const persistTransactions = async () => {
  const payload = JSON.stringify(transactionsDb);

  let asyncStorageOk = false;
  let fileOk = false;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, payload);
    asyncStorageOk = true;
  } catch {
    asyncStorageOk = false;
  }

  try {
    await writeToFileBackup(transactionsDb);
    fileOk = true;
  } catch {
    fileOk = false;
  }

  if (!asyncStorageOk && !fileOk) {
    throw new Error('Nao foi possivel salvar os dados localmente no dispositivo.');
  }
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildFallbackKey = (date: string, amount: number, description: string) =>
  `${date}|${amount.toFixed(2)}|${normalizeText(description)}`;

const pickCategory = (description: string): TransactionCategory => {
  const text = normalizeText(description);

  if (text.includes('uber') || text.includes('combustivel') || text.includes('gasolina')) {
    return 'transport';
  }

  if (text.includes('mercado') || text.includes('restaurante') || text.includes('ifood')) {
    return 'food';
  }

  if (text.includes('farmacia') || text.includes('clinica') || text.includes('hospital')) {
    return 'health';
  }

  if (text.includes('aluguel') || text.includes('condominio')) {
    return 'housing';
  }

  if (text.includes('salario') || text.includes('folha') || text.includes('pro-labore')) {
    return 'salary';
  }

  if (text.includes('cinema') || text.includes('netflix') || text.includes('spotify')) {
    return 'leisure';
  }

  return 'others';
};

const toDateIso = (raw: string): string => {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
};

export const financeService = {
  async getDashboard(period: PeriodFilter): Promise<DashboardData> {
    await hydrateTransactions();
    await wait(180);

    const sorted = [...transactionsDb].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return buildMockDashboard(sorted, period);
  },

  async addTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    await hydrateTransactions();
    await wait(220);

    const transaction: Transaction = {
      id: `t_${Math.random().toString(36).slice(2, 10)}`,
      ...payload,
      amount: Number(payload.amount),
    };

    transactionsDb = [transaction, ...transactionsDb];
    await persistTransactions();
    return transaction;
  },

  async syncTransactions(): Promise<void> {
    await wait(500);
  },

  async importStatementCsv(csvContent: string): Promise<StatementImportResult> {
    await hydrateTransactions();
    await wait(250);

    const { parsed, invalidCount, totalRead } = parseNubankCsv(csvContent);
    const { nextTransactions, result } = mergeParsedTransactions(
      transactionsDb,
      parsed,
      invalidCount,
      totalRead,
    );

    transactionsDb = nextTransactions;
    await persistTransactions();
    return result;
  },

  async importPluggyItem(itemId: string): Promise<PluggyImportResult> {
    await hydrateTransactions();
    await wait(250);

    const payload = await pluggyService.importItemTransactions(itemId);

    const existingKeys = new Set<string>();
    for (const item of transactionsDb) {
      existingKeys.add(item.id);
      existingKeys.add(
        buildFallbackKey(
          item.date,
          item.type === 'income' ? item.amount : -item.amount,
          item.title,
        ),
      );
    }

    const accepted: Transaction[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const tx of payload.transactions) {
      const description = String(tx.description || '').trim();
      const dateIso = toDateIso(tx.date);
      const amountSigned = Number(tx.amount);
      const id = String(tx.id || '').trim();

      if (!id || !description || !Number.isFinite(amountSigned)) {
        invalidCount += 1;
        continue;
      }

      const loweredType = String(tx.type || '').toLowerCase();
      const isIncomeByType = loweredType.includes('credit') || loweredType.includes('income');
      const isIncome = isIncomeByType || amountSigned > 0;
      const amount = Math.abs(amountSigned);

      const transaction: Transaction = {
        id: `pluggy_${id}`,
        title: description,
        category: pickCategory(description),
        type: isIncome ? 'income' : 'expense',
        amount,
        date: dateIso,
      };

      const fallback = buildFallbackKey(
        transaction.date,
        transaction.type === 'income' ? transaction.amount : -transaction.amount,
        transaction.title,
      );

      if (existingKeys.has(transaction.id) || existingKeys.has(fallback)) {
        duplicateCount += 1;
        continue;
      }

      existingKeys.add(transaction.id);
      existingKeys.add(fallback);
      accepted.push(transaction);
    }

    transactionsDb = [...accepted, ...transactionsDb].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    await persistTransactions();

    return {
      itemId: payload.itemId,
      accountCount: payload.accountCount,
      pulledTransactions: payload.transactionCount,
      importedCount: accepted.length,
      duplicateCount,
      invalidCount,
      totalRead: payload.transactions.length,
    };
  },
};
