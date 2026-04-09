import { backendBaseUrl } from '../config/backend';

interface PluggyImportResponseTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type?: string;
}

interface PluggyImportResponse {
  itemId: string;
  accountCount: number;
  transactionCount: number;
  transactions: PluggyImportResponseTransaction[];
}

const readJson = async <T>(response: Response): Promise<T> => {
  return (await response.json()) as T;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) {
      return data.message;
    }
  } catch {
    // ignore json parse errors
  }

  return `Backend request failed (${response.status}).`;
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Tempo de requisicao esgotado ao acessar ${backendBaseUrl}. Verifique se o backend esta rodando e acessivel na rede.`,
      );
    }

    throw new Error(
      `Falha de rede ao acessar ${backendBaseUrl}. Em celular fisico, use EXPO_PUBLIC_BACKEND_URL com o IP local da maquina.`,
    );
  } finally {
    clearTimeout(timer);
  }
};

export const pluggyService = {
  async createConnectToken(
    clientUserId: string,
  ): Promise<{ connectToken: string; clientUserId: string; meuPluggyConnectorId: number | null }> {
    const response = await fetchWithTimeout(`${backendBaseUrl}/pluggy/connect-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientUserId }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return readJson<{ connectToken: string; clientUserId: string; meuPluggyConnectorId: number | null }>(response);
  },

  async importItemTransactions(itemId: string): Promise<PluggyImportResponse> {
    const response = await fetchWithTimeout(`${backendBaseUrl}/pluggy/import-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return readJson<PluggyImportResponse>(response);
  },
};
