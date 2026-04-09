# APP_FIN Backend

Backend Node + TypeScript com healthcheck e login fixo para testes.

## 1) Instalar dependencias

```bash
cd backend
npm install
```

## 2) Configurar ambiente

```bash
cp .env.example .env
```

Ajuste se quiser:
- `PORT=8080`
- `ALLOWED_ORIGIN=*`
- `APP_FIXED_EMAIL=grisotto.work@gmail.com`
- `APP_FIXED_PASSWORD=appfingrisotto`
- `APP_USER_NAME=Grisotto`

## 3) Rodar em desenvolvimento

```bash
npm run dev
```

Backend em:
- `http://localhost:8080`
- health: `GET /health`

## Endpoints

- `POST /auth/login`
