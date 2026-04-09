import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import {
  createConnectToken,
  findMeuPluggyConnectorId,
  pullItemTransactions,
  waitForItemReady,
} from './pluggy.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const fixedEmail = (process.env.APP_FIXED_EMAIL || 'grisotto.work@gmail.com').toLowerCase();
const fixedPassword = process.env.APP_FIXED_PASSWORD || 'appfingrisotto';
const fixedName = process.env.APP_USER_NAME || 'Grisotto';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'app-fin-backend' });
});

app.post('/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== fixedEmail || password !== fixedPassword) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  return res.json({
    token: 'backend-fixed-login-session-token',
    user: {
      id: 'u_01',
      name: fixedName,
      email: fixedEmail,
    },
  });
});

app.post('/pluggy/connect-token', async (req, res) => {
  try {
    const rawUserId = req.body?.clientUserId;
    const clientUserId =
      typeof rawUserId === 'string' && rawUserId.trim()
        ? rawUserId.trim()
        : `app-fin-user-${Date.now()}`;

    const connectToken = await createConnectToken(clientUserId);
    const meuPluggyConnectorId = await findMeuPluggyConnectorId();
    return res.json({ connectToken, clientUserId, meuPluggyConnectorId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Pluggy connect token.';
    return res.status(500).json({ message });
  }
});

app.post('/pluggy/import-item', async (req, res) => {
  try {
    const itemId = String(req.body?.itemId || '').trim();
    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required.' });
    }

    await waitForItemReady(itemId);
    const result = await pullItemTransactions(itemId);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import Pluggy item.';
    return res.status(500).json({ message });
  }
});

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Backend ON at http://0.0.0.0:${port}`);
});
