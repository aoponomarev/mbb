# Cloudflare Workers для интеграции MBB Dataset

## Структура проекта

```
workers/
├── src/
│   ├── index.js          # Главный роутер для всех endpoints
│   ├── auth.js           # OAuth endpoints (/auth/google, /auth/callback)
│   ├── portfolios.js     # Portfolios API (/api/portfolios/*)
│   ├── datasets.js       # Datasets API (/api/datasets/*)
│   └── utils/
│       ├── cors.js       # CORS утилиты
│       ├── auth.js       # Проверка авторизации (JWT)
│       ├── d1-helpers.js # Хелперы для работы с D1
│       └── r2-helpers.js # Хелперы для работы с R2
├── wrangler.toml         # Конфигурация Workers
└── README.md             # Этот файл
```

## Настройка

### 1. Установка Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Авторизация

**Вариант 1: Wrangler Login (рекомендуется для разработки)**
```bash
wrangler login
```

**Вариант 2: Использование API Token**
```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
```

### 3. Конфигурация

Файл `wrangler.toml` содержит:
- Настройки Worker (name, main, compatibility_date)
- Привязки к D1 базе данных
- Привязки к R2 bucket
- Переменные окружения

### 4. Secrets

Добавление secrets через Wrangler CLI:
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

## Деплой

```bash
cd workers
wrangler deploy
```

## Endpoints

### OAuth
- `GET /auth/google` — редирект на Google OAuth
- `GET /auth/callback` — обработка callback от Google
- `GET /auth/me` — получение текущего пользователя

### Portfolios API
- `GET /api/portfolios` — список портфелей пользователя
- `GET /api/portfolios/:id` — получение портфеля
- `POST /api/portfolios` — создание портфеля
- `PUT /api/portfolios/:id` — обновление портфеля
- `DELETE /api/portfolios/:id` — удаление портфеля

### Datasets API
- `GET /api/datasets/time-series/:coin/:date` — получение временных рядов
- `POST /api/datasets/time-series` — сохранение временных рядов (batch)
- `GET /api/datasets/metrics/:coin/:date` — получение метрик
- `POST /api/datasets/metrics` — сохранение метрик (batch)

## Разработка

### Локальный запуск
```bash
cd workers
wrangler dev
```

### Применение SQL схемы
```bash
cd workers
wrangler d1 execute mbb-database --file=./schema.sql
```

Или через Cloudflare Dashboard:
1. Перейти в Cloudflare Dashboard → Storage & databases → D1
2. Выбрать базу данных `mbb-database`
3. Перейти в раздел "Execute SQL"
4. Скопировать содержимое `workers/schema.sql` и выполнить

### Просмотр логов
```bash
wrangler tail
```

### Деплой Worker
```bash
cd workers
wrangler deploy
```

## Структура проекта

```
workers/
├── src/
│   ├── index.js          # Главный роутер
│   ├── auth.js           # OAuth endpoints
│   ├── portfolios.js     # Portfolios API
│   ├── datasets.js       # Datasets API (заглушки, R2 отложен)
│   └── utils/
│       ├── cors.js       # CORS утилиты
│       ├── auth.js       # JWT проверка и создание токенов
│       └── d1-helpers.js # Хелперы для работы с D1
├── migrations/
│   └── 001_initial_schema.sql  # SQL миграция
├── schema.sql            # SQL схема базы данных
├── wrangler.toml         # Конфигурация Workers
└── README.md             # Этот файл
```

## Структура данных

### D1 Database Schema

Таблицы:
- `users` — пользователи (google_id, email, name, avatar_url, created_at, updated_at)
- `portfolios` — портфели пользователей (user_id, name, description, assets JSON, created_at, updated_at)
- `rebalances` — история ребалансировок портфелей (опционально)
- `user_settings` — пользовательские настройки (опционально)

Подробная схема: `workers/schema.sql` и `workers/migrations/001_initial_schema.sql`

### Применение схемы

```bash
cd workers
wrangler d1 execute mbb-database --file=./schema.sql
```

Или через Cloudflare Dashboard:
1. Cloudflare Dashboard → Storage & databases → D1
2. Выбрать базу данных `mbb-database`
3. Перейти в "Execute SQL"
4. Скопировать содержимое `workers/schema.sql` и выполнить

## Безопасность

### Secrets

Все секретные данные хранятся в Workers secrets:
- `GOOGLE_CLIENT_SECRET` — секрет Google OAuth Client
- `JWT_SECRET` — секрет для подписи JWT токенов

**ВАЖНО:** Никогда не коммитить секреты в git!

### CORS

Все endpoints возвращают CORS заголовки для работы с браузерными клиентами:
- `Access-Control-Allow-Origin: *` (для разработки)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

### Авторизация

Защищённые endpoints требуют валидный JWT токен в заголовке:
```
Authorization: Bearer jwt_token
```

Токен проверяется через middleware `authenticate()` в `src/utils/auth.js`.

## Документация

- **Инфраструктура Cloudflare:** `docs/doc-cloudflare.md` — полное описание настройки Workers, D1, R2, Google OAuth
- **План интеграции:** `docs/doc-cloudflare-integration-plan.md` — детальный план с этапами и прогрессом
- **Тестовый план:** `docs/doc-cloudflare-testing.md` — чеклист для тестирования всех компонентов интеграции
