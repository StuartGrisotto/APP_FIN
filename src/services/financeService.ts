import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  buildCategoryOptions,
  getCategoryLabel,
  normalizeCounterpartyName,
  slugifyCategoryLabel,
} from '../constants/categories';
import { buildMockDashboard } from '../mocks/financeData';
import {
  CategoryOption,
  CreateTransactionPayload,
  DashboardData,
  PeriodFilter,
  PluggyBalanceFieldCandidate,
  PluggyImportResult,
  Transaction,
  TransactionCategory,
} from '../types/finance';
import { pluggyService } from './pluggyService';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = 'app_fin_transactions_realonly_v1';
const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}app_fin_transactions_realonly_v1.json`;
const PLUGGY_LAST_SYNC_KEY = 'app_fin_pluggy_last_sync_at_v1';
const PLUGGY_AVAILABLE_BALANCE_KEY = 'app_fin_pluggy_available_balance_v1';
const PLUGGY_BALANCE_FIELDS_KEY = 'app_fin_pluggy_balance_fields_v1';
const CATEGORY_RULES_KEY = 'app_fin_category_rules_v1';
const CATEGORY_LABELS_KEY = 'app_fin_custom_category_labels_v1';
const APP_KEY_PREFIX = 'app_fin_';

let transactionsDb: Transaction[] = [];
let categoryRulesDb: Record<string, string> = {};
let customCategoryLabelsDb: Record<string, string> = {};
let hydrated = false;

const stripLegacyStatementTransactions = (items: Transaction[]): Transaction[] =>
  items.filter((item) => !item.id.startsWith('csv_'));

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
    } else {
      const fileBackup = await readFromFileBackup();
      if (fileBackup) {
        transactionsDb = fileBackup;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fileBackup));
      } else {
        transactionsDb = [];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactionsDb));
        await writeToFileBackup(transactionsDb);
      }
    }
  } catch {
    const fileBackup = await readFromFileBackup();
    if (fileBackup) {
      transactionsDb = stripLegacyStatementTransactions(fileBackup);
    } else {
      transactionsDb = [];
    }
  }

  const sanitizedTransactions = stripLegacyStatementTransactions(transactionsDb);
  const removedLegacyStatementRows = sanitizedTransactions.length !== transactionsDb.length;
  transactionsDb = sanitizedTransactions;
  if (removedLegacyStatementRows) {
    await persistTransactions();
  }

  hydrated = true;

  try {
    const rawRules = await AsyncStorage.getItem(CATEGORY_RULES_KEY);
    if (rawRules) {
      const parsed = JSON.parse(rawRules) as Record<string, string>;
      categoryRulesDb = parsed && typeof parsed === 'object' ? parsed : {};
    } else {
      categoryRulesDb = {};
    }
  } catch {
    categoryRulesDb = {};
  }

  try {
    const rawLabels = await AsyncStorage.getItem(CATEGORY_LABELS_KEY);
    if (rawLabels) {
      const parsed = JSON.parse(rawLabels) as Record<string, string>;
      customCategoryLabelsDb = parsed && typeof parsed === 'object' ? parsed : {};
    } else {
      customCategoryLabelsDb = {};
    }
  } catch {
    customCategoryLabelsDb = {};
  }
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
  normalizeCounterpartyName(value);

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

const resolveCategoryByRule = (title: string, fallback: string): string => {
  const key = normalizeCounterpartyName(title);
  return categoryRulesDb[key] ?? fallback;
};

const persistCategoryRules = async () => {
  try {
    await AsyncStorage.setItem(CATEGORY_RULES_KEY, JSON.stringify(categoryRulesDb));
  } catch {
    // sem erro fatal
  }
};

const persistCustomCategoryLabels = async () => {
  try {
    await AsyncStorage.setItem(CATEGORY_LABELS_KEY, JSON.stringify(customCategoryLabelsDb));
  } catch {
    // sem erro fatal
  }
};

const deleteTransactionsBackupFile = async () => {
  if (!FileSystem.documentDirectory) {
    return;
  }

  try {
    await FileSystem.deleteAsync(STORAGE_FILE, { idempotent: true });
  } catch {
    // Em alguns ambientes o modulo legacy pode nao estar disponivel.
    // O reset deve continuar limpando ao menos o AsyncStorage.
  }
};

export const financeService = {
  async resetFactoryData(): Promise<void> {
    transactionsDb = [];
    categoryRulesDb = {};
    customCategoryLabelsDb = {};

    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter((key) => key.startsWith(APP_KEY_PREFIX));
    if (appKeys.length > 0) {
      await Promise.all(appKeys.map((key) => AsyncStorage.removeItem(key)));
    }

    await deleteTransactionsBackupFile();
    hydrated = false;
  },

  async getCategoryOptions(): Promise<CategoryOption[]> {
    await hydrateTransactions();
    const options = buildCategoryOptions(customCategoryLabelsDb);
    const knownIds = new Set(options.map((item) => item.id));
    const discoveredIds = new Set<string>([
      ...transactionsDb.map((item) => item.category),
      ...Object.values(categoryRulesDb),
    ]);

    const discoveredCustomOptions: CategoryOption[] = [];
    discoveredIds.forEach((id) => {
      if (!id || knownIds.has(id)) {
        return;
      }

      discoveredCustomOptions.push({
        id,
        label: getCategoryLabel(id, customCategoryLabelsDb),
        isCustom: true,
      });
    });

    discoveredCustomOptions.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    return [...options, ...discoveredCustomOptions];
  },

  async getCategoryLabelMap(): Promise<Record<string, string>> {
    await hydrateTransactions();
    return { ...customCategoryLabelsDb };
  },

  async updateTransactionCategory(
    transactionId: string,
    categoryId: string,
    categoryLabel?: string,
  ): Promise<{ updatedCount: number; counterparty: string; categoryId: string }> {
    await hydrateTransactions();

    const selected = transactionsDb.find((item) => item.id === transactionId);
    if (!selected) {
      throw new Error('Movimentacao nao encontrada para categorizar.');
    }

    const normalizedCounterparty = normalizeCounterpartyName(selected.title);
    if (!normalizedCounterparty) {
      throw new Error('Nao foi possivel identificar o nome para criar regra.');
    }

    let finalCategoryId = categoryId;
    if (categoryId === '__new__') {
      const label = String(categoryLabel || '').trim();
      if (!label) {
        throw new Error('Informe o nome da nova categoria.');
      }
      const slug = slugifyCategoryLabel(label);
      if (!slug) {
        throw new Error('Nome da categoria invalido.');
      }
      finalCategoryId = `custom_${slug}`;
      customCategoryLabelsDb[finalCategoryId] = label;
      await persistCustomCategoryLabels();
    } else if (categoryLabel && finalCategoryId.startsWith('custom_')) {
      customCategoryLabelsDb[finalCategoryId] = categoryLabel.trim();
      await persistCustomCategoryLabels();
    }

    categoryRulesDb[normalizedCounterparty] = finalCategoryId;
    await persistCategoryRules();

    let updatedCount = 0;
    transactionsDb = transactionsDb.map((item) => {
      if (normalizeCounterpartyName(item.title) !== normalizedCounterparty) {
        return item;
      }
      updatedCount += 1;
      return {
        ...item,
        category: finalCategoryId,
      };
    });

    await persistTransactions();

    return {
      updatedCount,
      counterparty: selected.title,
      categoryId: finalCategoryId,
    };
  },

  async getLastPluggySyncAt(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PLUGGY_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  },

  async getDashboard(period: PeriodFilter): Promise<DashboardData> {
    await hydrateTransactions();
    await wait(180);

    const sorted = [...transactionsDb].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const dashboard = buildMockDashboard(sorted, period);

    try {
      const rawAvailableBalance = await AsyncStorage.getItem(PLUGGY_AVAILABLE_BALANCE_KEY);
      if (rawAvailableBalance !== null) {
        const parsedAvailableBalance = Number(rawAvailableBalance);
        if (Number.isFinite(parsedAvailableBalance)) {
          dashboard.summary.balance = parsedAvailableBalance;
        }
      }
    } catch {
      // Falha ao ler saldo do Pluggy nao deve quebrar dashboard
    }

    try {
      const rawCandidates = await AsyncStorage.getItem(PLUGGY_BALANCE_FIELDS_KEY);
      if (rawCandidates) {
        const parsed = JSON.parse(rawCandidates) as PluggyBalanceFieldCandidate[];
        if (Array.isArray(parsed)) {
          dashboard.pluggyBalanceFieldCandidates = parsed;
        }
      }
    } catch {
      dashboard.pluggyBalanceFieldCandidates = [];
    }

    return dashboard;
  },

  async addTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    await hydrateTransactions();
    await wait(220);

    const transaction: Transaction = {
      id: `t_${Math.random().toString(36).slice(2, 10)}`,
      ...payload,
      category: resolveCategoryByRule(payload.title, payload.category),
      amount: Number(payload.amount),
    };

    transactionsDb = [transaction, ...transactionsDb];
    await persistTransactions();
    return transaction;
  },

  async syncTransactions(): Promise<void> {
    await wait(500);
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
        category: resolveCategoryByRule(description, pickCategory(description)),
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
    const syncedAt = new Date().toISOString();

    try {
      await AsyncStorage.setItem(PLUGGY_LAST_SYNC_KEY, syncedAt);
      const balanceToPersist =
        payload.totalAvailableBalance !== null && Number.isFinite(payload.totalAvailableBalance)
          ? payload.totalAvailableBalance
          : null;
      if (balanceToPersist !== null) {
        await AsyncStorage.setItem(
          PLUGGY_AVAILABLE_BALANCE_KEY,
          String(balanceToPersist),
        );
      } else {
        await AsyncStorage.removeItem(PLUGGY_AVAILABLE_BALANCE_KEY);
      }
      await AsyncStorage.setItem(
        PLUGGY_BALANCE_FIELDS_KEY,
        JSON.stringify(payload.balanceFieldCandidates ?? []),
      );
    } catch {
      // Falha de persistencia da data nao deve quebrar importacao
    }

    return {
      itemId: payload.itemId,
      accountCount: payload.accountCount,
      pulledTransactions: payload.transactionCount,
      totalAvailableBalance: payload.totalAvailableBalance,
      totalCurrentBalance: payload.totalCurrentBalance,
      balanceFieldCandidates: payload.balanceFieldCandidates ?? [],
      importedCount: accepted.length,
      duplicateCount,
      invalidCount,
      totalRead: payload.transactions.length,
      syncedAt,
    };
  },
};
