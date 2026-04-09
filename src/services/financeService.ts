import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { buildMockDashboard } from '../mocks/financeData';
import { january2026SeedTransactions } from '../mocks/statementSeed';
import {
  CreateTransactionPayload,
  DashboardData,
  PeriodFilter,
  StatementImportResult,
  Transaction,
} from '../types/finance';
import { mergeParsedTransactions, parseNubankCsv } from './statementImport';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = 'app_fin_transactions_v1';
const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}app_fin_transactions_v1.json`;

let transactionsDb: Transaction[] = [...january2026SeedTransactions];
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
      transactionsDb = Array.isArray(parsed) ? parsed : [...january2026SeedTransactions];
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

    transactionsDb = [...january2026SeedTransactions];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactionsDb));
    await writeToFileBackup(transactionsDb);
  } catch {
    const fileBackup = await readFromFileBackup();
    if (fileBackup) {
      transactionsDb = fileBackup;
    } else {
      transactionsDb = [...january2026SeedTransactions];
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
};
