import { StatementImportResult, Transaction, TransactionCategory } from '../types/finance';

interface ParsedCsvTransaction {
  transaction: Transaction;
  uniqueKey: string;
}

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseAmount = (raw: string): number => {
  const cleaned = raw.replace(/\s/g, '');
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  if (hasDot && hasComma) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }

  if (hasComma) {
    return Number(cleaned.replace(',', '.'));
  }

  return Number(cleaned);
};

const parseDateToIso = (raw: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

const pickCategory = (description: string): TransactionCategory => {
  const text = description.toLowerCase();

  if (text.includes('burger') || text.includes('cafe') || text.includes('ifd')) {
    return 'food';
  }

  if (text.includes('uber') || text.includes('99')) {
    return 'transport';
  }

  if (text.includes('farmacia') || text.includes('saude')) {
    return 'health';
  }

  return 'others';
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

export const parseNubankCsv = (
  csvContent: string,
): { parsed: ParsedCsvTransaction[]; invalidCount: number; totalRead: number } => {
  const lines = csvContent
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { parsed: [], invalidCount: 0, totalRead: 0 };
  }

  const headerColumns = parseCsvLine(lines[0]).map(normalizeHeader);
  const dateIndex = headerColumns.findIndex((name) => name === 'data');
  const valueIndex = headerColumns.findIndex((name) => name === 'valor');
  const idIndex = headerColumns.findIndex((name) => name === 'identificador');
  const descriptionIndex = headerColumns.findIndex(
    (name) => name.startsWith('descricao') || name.startsWith('descri'),
  );

  const dataColumn = dateIndex >= 0 ? dateIndex : 0;
  const valueColumn = valueIndex >= 0 ? valueIndex : 1;
  const idColumn = idIndex >= 0 ? idIndex : 2;
  const descriptionColumn = descriptionIndex >= 0 ? descriptionIndex : 3;

  const parsed: ParsedCsvTransaction[] = [];
  let invalidCount = 0;

  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line);
    const dateIso = parseDateToIso(columns[dataColumn] ?? '');
    const amountRaw = columns[valueColumn] ?? '';
    const amountSigned = parseAmount(amountRaw);
    const identifier = (columns[idColumn] ?? '').trim();
    const description = (columns[descriptionColumn] ?? '').trim();

    if (!dateIso || !Number.isFinite(amountSigned) || !description) {
      invalidCount += 1;
      continue;
    }

    const amount = Math.abs(amountSigned);
    const type = amountSigned >= 0 ? 'income' : 'expense';
    const category = pickCategory(description);
    const uniqueKey = identifier
      ? `id:${identifier}`
      : buildFallbackKey(dateIso, amountSigned, description);

    parsed.push({
      uniqueKey,
      transaction: {
        id: identifier ? `csv_${identifier}` : `csv_${Math.random().toString(36).slice(2, 10)}`,
        title: description,
        category,
        type,
        amount,
        date: dateIso,
      },
    });
  }

  return {
    parsed,
    invalidCount,
    totalRead: lines.length - 1,
  };
};

export const mergeParsedTransactions = (
  currentTransactions: Transaction[],
  parsedTransactions: ParsedCsvTransaction[],
  invalidCount: number,
  totalRead: number,
): { nextTransactions: Transaction[]; result: StatementImportResult } => {
  const existingKeys = new Set<string>();

  for (const item of currentTransactions) {
    if (item.id.startsWith('csv_')) {
      existingKeys.add(`id:${item.id.slice(4)}`);
    }
    existingKeys.add(buildFallbackKey(item.date, item.type === 'income' ? item.amount : -item.amount, item.title));
  }

  const accepted: Transaction[] = [];
  let duplicateCount = 0;

  for (const parsed of parsedTransactions) {
    const fallback = buildFallbackKey(
      parsed.transaction.date,
      parsed.transaction.type === 'income' ? parsed.transaction.amount : -parsed.transaction.amount,
      parsed.transaction.title,
    );

    const duplicated = existingKeys.has(parsed.uniqueKey) || existingKeys.has(fallback);
    if (duplicated) {
      duplicateCount += 1;
      continue;
    }

    accepted.push(parsed.transaction);
    existingKeys.add(parsed.uniqueKey);
    existingKeys.add(fallback);
  }

  const nextTransactions = [...accepted, ...currentTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    nextTransactions,
    result: {
      importedCount: accepted.length,
      duplicateCount,
      invalidCount,
      totalRead,
    },
  };
};
