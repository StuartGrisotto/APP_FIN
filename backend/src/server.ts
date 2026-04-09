import 'dotenv/config';
import cors from 'cors';
import express from 'express';

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

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Backend ON at http://0.0.0.0:${port}`);
});
