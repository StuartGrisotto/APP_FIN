const PLUGGY_BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai';
const PLUGGY_CLIENT_ID = process.env.PLUGGY_CLIENT_ID || '';
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || '';

let cachedApiKey: { value: string; expiresAt: number } | null = null;

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureCredentials = () => {
  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
    throw new Error(
      'Pluggy credentials missing. Configure PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET in backend/.env.',
    );
  }
};

const extractApiKey = (body: Record<string, unknown>): string => {
  const candidates = [
    body.apiKey,
    body.accessToken,
    body.access_token,
    body.token,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  throw new Error('Pluggy auth response does not contain an API key token.');
};

const fetchApiKey = async (): Promise<string> => {
  ensureCredentials();

  if (cachedApiKey && cachedApiKey.expiresAt > Date.now() + 30_000) {
    return cachedApiKey.value;
  }

  const response = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Pluggy auth failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  const apiKey = extractApiKey(payload);
  const expiresInSeconds = toNumber(payload.expiresIn ?? payload.expires_in, 15 * 60);

  cachedApiKey = {
    value: apiKey,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  return apiKey;
};

const requestPluggy = async (
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Record<string, unknown>> => {
  const apiKey = await fetchApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
  };

  if (init.headers && typeof init.headers === 'object') {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  const response = await fetch(`${PLUGGY_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (response.status === 401 && retry) {
    cachedApiKey = null;
    return requestPluggy(path, init, false);
  }

  if (!response.ok) {
    throw new Error(`Pluggy request failed (${response.status}) ${path}: ${JSON.stringify(payload)}`);
  }

  return payload;
};

const parseList = <T>(payload: Record<string, unknown>): T[] => {
  const results = payload.results;
  if (Array.isArray(results)) {
    return results as T[];
  }

  return [];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const readPagesCount = (payload: Record<string, unknown>): number | null => {
  const raw =
    payload.totalPages ??
    payload.total_pages ??
    payload.pages ??
    payload.pageCount;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const paginateResults = async <T>(path: string, pageSize: number, maxPages = 50): Promise<T[]> => {
  const results: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const payload = await requestPluggy(
      `${path}${separator}page=${page}&pageSize=${pageSize}`,
      { method: 'GET' },
    );

    const pageResults = parseList<T>(payload);
    results.push(...pageResults);

    const totalPages = readPagesCount(payload);
    if (totalPages !== null && page >= totalPages) {
      break;
    }

    if (totalPages === null && pageResults.length < pageSize) {
      break;
    }
  }

  return results;
};

export interface PluggyRawTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type?: string;
}

export interface PullItemTransactionsResult {
  itemId: string;
  accountCount: number;
  transactionCount: number;
  totalAvailableBalance: number | null;
  totalCurrentBalance: number | null;
  transactions: PluggyRawTransaction[];
}

export interface WaitItemResult {
  itemId: string;
  status: string;
  executionStatus: string;
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const readAccountBalance = (account: Record<string, unknown>) => {
  const balanceObject =
    account.balance && typeof account.balance === 'object'
      ? (account.balance as Record<string, unknown>)
      : null;
  const availableCandidates = [
    account.availableBalance,
    account.available,
    account.balanceAvailable,
    account.balance_available,
    balanceObject?.available,
    balanceObject?.availableBalance,
    balanceObject?.amountAvailable,
  ];
  const currentCandidates = [
    account.balance,
    account.currentBalance,
    account.current,
    account.current_balance,
    balanceObject?.current,
    balanceObject?.currentBalance,
    balanceObject?.amount,
    balanceObject?.value,
  ];

  let available: number | null = null;
  for (const candidate of availableCandidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      available = parsed;
      break;
    }
  }

  let current: number | null = null;
  for (const candidate of currentCandidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      current = parsed;
      break;
    }
  }

  return { available, current };
};

export const createConnectToken = async (clientUserId: string): Promise<string> => {
  const payload = await requestPluggy('/connect_token', {
    method: 'POST',
    body: JSON.stringify({ clientUserId }),
  });

  const token = payload.accessToken;
  if (typeof token !== 'string' || !token) {
    throw new Error(`Pluggy connect token response invalid: ${JSON.stringify(payload)}`);
  }

  return token;
};

export const findMeuPluggyConnectorId = async (): Promise<number | null> => {
  const connectors = await paginateResults<Record<string, unknown>>('/connectors', 500, 10);

  for (const connector of connectors) {
    const id = Number(connector.id);
    const name = normalizeText(String(connector.name ?? ''));

    if (!Number.isFinite(id) || !name) {
      continue;
    }

    if (name.includes('meupluggy') || name.includes('meu pluggy')) {
      return id;
    }
  }

  return null;
};

export const waitForItemReady = async (
  itemId: string,
  timeoutMs = 45_000,
  intervalMs = 3_000,
): Promise<WaitItemResult> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const payload = await requestPluggy(`/items/${encodeURIComponent(itemId)}`, { method: 'GET' });
    const status = readString(payload.status) || 'UNKNOWN';
    const executionStatus = readString(payload.executionStatus) || 'UNKNOWN';

    if (status === 'UPDATED' || status === 'OUTDATED') {
      return { itemId, status, executionStatus };
    }

    if (status === 'LOGIN_ERROR' || status === 'ERROR') {
      const message =
        readString(payload.message) ||
        readString((payload.error as Record<string, unknown> | undefined)?.message) ||
        'Item retornou erro na sincronizacao.';
      throw new Error(`Pluggy item ${itemId} em erro (${status}): ${message}`);
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `Pluggy item ${itemId} ainda nao ficou pronto em ${Math.round(timeoutMs / 1000)}s. Tente novamente em alguns instantes.`,
  );
};

export const pullItemTransactions = async (itemId: string): Promise<PullItemTransactionsResult> => {
  const accounts = await paginateResults<Record<string, unknown>>(
    `/accounts?itemId=${encodeURIComponent(itemId)}`,
    200,
    10,
  );

  const transactions: PluggyRawTransaction[] = [];
  const seenTransactionIds = new Set<string>();
  let totalAvailableBalance = 0;
  let totalCurrentBalance = 0;
  let availableBalanceCount = 0;
  let currentBalanceCount = 0;

  await Promise.all(
    accounts.map(async (account) => {
      const balances = readAccountBalance(account);
      if (balances.available !== null) {
        totalAvailableBalance += balances.available;
        availableBalanceCount += 1;
      }
      if (balances.current !== null) {
        totalCurrentBalance += balances.current;
        currentBalanceCount += 1;
      }

      const accountIdRaw = account.id;
      const accountId =
        typeof accountIdRaw === 'string' || typeof accountIdRaw === 'number'
          ? String(accountIdRaw).trim()
          : '';
      if (!accountId) {
        return;
      }

      const txs = await paginateResults<Record<string, unknown>>(
        `/transactions?accountId=${encodeURIComponent(accountId)}`,
        500,
        30,
      );

      for (const tx of txs) {
        const id = String(tx.id ?? '');
        const amount = Number(tx.amount ?? tx.value ?? 0);
        const description = String(tx.description ?? tx.merchantName ?? tx.title ?? 'Movimentacao bancaria');
        const date = String(tx.date ?? tx.createdAt ?? '');
        const type = typeof tx.type === 'string' ? tx.type : undefined;

        if (!id || !Number.isFinite(amount) || !date || seenTransactionIds.has(id)) {
          continue;
        }

        seenTransactionIds.add(id);
        transactions.push({
          id,
          amount,
          description,
          date,
          type,
        });
      }
    }),
  );

  return {
    itemId,
    accountCount: accounts.length,
    transactionCount: transactions.length,
    totalAvailableBalance: availableBalanceCount > 0 ? totalAvailableBalance : null,
    totalCurrentBalance: currentBalanceCount > 0 ? totalCurrentBalance : null,
    transactions,
  };
};
