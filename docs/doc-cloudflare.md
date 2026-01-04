# Документация по интеграции Cloudflare

> Оглавление `docs/doc-cloudflare.md`
- § Инфраструктура Cloudflare
- § Настройка Workers
- § Настройка D1 базы данных
- § Настройка R2 хранилища
- § Настройка Google OAuth
- § Деплой и CI/CD
- § Структура Workers проекта
- § API Endpoints
- § Примеры использования

---

## § ИНФРАСТРУКТУРА CLOUDFLARE

### Аккаунт Cloudflare

**Email:** Ponomarev.ux@gmail.com
**Account ID:** `f412d655d286dd554cb28e121d4bbde5`

**Статус:** ✅ Аккаунт настроен

### API Token

**Статус:** ✅ Создан

**Токен:** `Qtsi4hNhiGAjtoj4DT1tLWwldMx5M0PGRRrWRIb8`

**ВАЖНО:** Токен сохранен здесь временно для настройки. НЕ коммитить токен в git! После настройки Wrangler токен будет использоваться только через CLI или переменные окружения.

**ВАЖНО:** Для локальной разработки и деплоя через Wrangler CLI можно использовать авторизацию через `wrangler login` вместо API Token. API Token нужен только для CI/CD или автоматизации.

**Вариант 1: Использование Wrangler Login (рекомендуется для разработки)**
1. Установить Wrangler CLI: `npm install -g wrangler`
2. Выполнить: `wrangler login`
3. Авторизоваться через браузер
4. Готово! Wrangler будет использовать сессию браузера

**Вариант 2: Создание API Token (для CI/CD)**
1. Перейти в Cloudflare Dashboard → My Profile → API Tokens
2. Нажать "Create Token"
3. Выбрать "Create Custom Token"
4. Настроить права доступа:

   **Добавить следующие права (кнопка "+ Add more" для каждого):**

   **Первое право:**
   - Первый дропдаун: `Account`
   - Второй дропдаун: `Workers Scripts`
   - Третий дропдаун: `Edit`
   - Четвертый дропдаун: `Include` → `All accounts`

   **Второе право (нажать "+ Add more"):**
   - Первый дропдаун: `Account`
   - Второй дропдаун: `Workers KV Storage` (или `Workers KV`)
   - Третий дропдаун: `Edit`
   - Четвертый дропдаун: `Include` → `All accounts`

   **Третье право (нажать "+ Add more"):**
   - Первый дропдаун: `Account`
   - Второй дропдаун: `D1`
   - Третий дропдаун: `Edit`
   - Четвертый дропдаун: `Include` → `All accounts`

   **Четвертое право (нажать "+ Add more"):**
   - Первый дропдаун: `Account`
   - Второй дропдаун: `R2`
   - Третий дропдаун: `Edit`
   - Четвертый дропдаун: `Include` → `All accounts`

   **Пятое право (нажать "+ Add more"):**
   - Первый дропдаун: `Account`
   - Второй дропдаун: `Account Settings`
   - Третий дропдаун: `Read`
   - Четвертый дропдаун: `Include` → `All accounts`

5. Указать имя токена: `MBB Dataset Integration Token`
6. Нажать "Continue to summary" → "Create Token"
7. **ВАЖНО:** Скопировать токен сразу (он показывается только один раз!)

**ВАЖНО:** Токен будет сохранен здесь временно для настройки, затем будет использован только через Wrangler CLI. НЕ коммитить токен в git!

---

## § НАСТРОЙКА WORKERS

### Структура проекта

```
workers/
├── src/
│   ├── index.js          # Главный роутер
│   ├── auth.js           # OAuth endpoints
│   ├── portfolios.js     # Portfolios API
│   ├── datasets.js       # Datasets API
│   └── utils/
│       ├── cors.js       # CORS утилиты
│       ├── auth.js       # Проверка авторизации
│       ├── d1-helpers.js # Хелперы для D1
│       └── r2-helpers.js # Хелперы для R2
├── wrangler.toml         # Конфигурация Workers
└── README.md             # Инструкции по деплою
```

**Статус:** ✅ Структура создана

### Worker

**Имя:** `mbb-api`
**Статус:** ✅ Базовый Worker создан (заглушка)
**Файлы:**
- `workers/wrangler.toml` — конфигурация Worker с привязкой к D1
- `workers/src/index.js` — главный роутер с базовой маршрутизацией

### Worker URL

**Статус:** ✅ Задеплоен

**URL:** `https://mbb-api.ponomarev-ux.workers.dev`

**Health check:** `https://mbb-api.ponomarev-ux.workers.dev/health`

**Инструкция по деплою:**
1. Установить Wrangler CLI: `npm install -g wrangler` ✅ Выполнено
2. Авторизоваться: `wrangler login` ✅ Выполнено
3. Перейти в папку workers: `cd workers` ✅ Выполнено
4. Задеплоить: `wrangler deploy` ✅ Выполнено
5. Скопировать полученный URL Worker ✅ Выполнено
6. Обновить Authorized redirect URIs в Google OAuth с продакшен URL ⏳ Требуется выполнить

---

## § НАСТРОЙКА D1 БАЗЫ ДАННЫХ

### База данных

**Имя:** `mbb-database`
**Database ID:** `887a3f58-98c2-41a4-a512-8dcdaea751e8`
**Статус:** ✅ Создана

**Инструкция по созданию:**
1. Перейти в Cloudflare Dashboard → Storage & databases → D1
2. Нажать "Create database"
3. Имя: `mbb-database`
4. После создания скопировать Database ID

---

## § НАСТРОЙКА R2 ХРАНИЛИЩА

### Bucket

**Имя:** `mbb-storage`
**Bucket name:** ⏸️ ОТЛОЖЕНО
**Статус:** ⏸️ ОТЛОЖЕНО — требуется добавление платежного метода

**Примечание:** R2 требует добавления платежного метода для активации, даже при бесплатном лимите (10GB/месяц бесплатно). Можно пропустить и добавить позже, когда будет доступен платежный метод.

**Инструкция по созданию (когда будет доступен платежный метод):**
1. Перейти в Cloudflare Dashboard → Storage & databases → R2
2. Добавить платежный метод (если требуется)
3. Нажать "Create bucket"
4. Имя: `mbb-storage`
5. Регион: выбрать ближайший (например, Europe)

---

## § НАСТРОЙКА GOOGLE OAUTH

### OAuth 2.0 Client

**Проект Google Cloud:** `MBB Dataset Integration`
**Project ID:** `swift-park-483113-p6` (или другой, если был изменен)
**Статус проекта:** ✅ Создан

**Client ID:** `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
**Client Secret:** `YOUR_GOOGLE_CLIENT_SECRET` (сохранен в Workers secrets)
**Redirect URI (локальный):** `http://localhost:8787/auth/callback` ✅ Настроен
**Redirect URI (продакшен):** `https://mbb-api.ponomarev-ux.workers.dev/auth/callback` ✅ Настроен
**Статус OAuth:** ✅ Client ID создан, в режиме тестирования

**Инструкция по созданию:**
1. Перейти в Google Cloud Console (console.cloud.google.com) ✅ Выполнено
2. Создать новый проект или выбрать существующий ✅ Выполнено
3. Перейти в APIs & Services → Credentials ✅ Выполнено
4. **Настроить Consent Screen (обязательно перед созданием OAuth client ID):** ✅ Выполнено
   - User Type: External (для публичного доступа)
   - App name: `MBB Dataset Integration`
   - User support email: `ponomarev.ux@gmail.com`
   - Developer contact information: `ponomarev.ux@gmail.com`
   - Статус: ✅ Consent Screen настроен
5. Создать OAuth 2.0 Client ID: ✅ Выполнено
   - Application type: Web application
   - Name: MBB Dataset Integration
   - Authorized JavaScript origins: `http://localhost:8787`
   - Authorized redirect URIs:
     - Для локальной разработки: `http://localhost:8787/auth/callback` ✅ Настроен
     - Для продакшена: `https://mbb-api.ponomarev-ux.workers.dev/auth/callback` ✅ Настроен
   - Дата создания: January 2, 2026, 5:46:06 PM GMT+3
   - Статус: ✅ Enabled

**ВАЖНО:**
- Client Secret будет добавлен в Workers secrets через Wrangler CLI на шаге 1.7, не хранить в коде!
- **Режим тестирования:** OAuth доступ ограничен тестовыми пользователями, указанными в OAuth consent screen. Для публичного доступа потребуется верификация приложения в Google.

---

## § ДЕПЛОЙ И CI/CD

### Wrangler CLI

**Установка:**
```bash
npm install -g wrangler
```

**Авторизация:**
```bash
wrangler login
```

**Деплой Worker:**
```bash
cd workers
wrangler deploy
```

**Добавление secrets:**
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

**Статус:** ✅ Секреты добавлены
- `GOOGLE_CLIENT_SECRET`: ✅ Добавлен
- `JWT_SECRET`: ✅ Добавлен (сгенерирован через `openssl rand -base64 32`)

---

## ПРИМЕЧАНИЯ

1. **Безопасность:** Все секретные данные (API Token, Client Secret, JWT Secret) хранятся только в Workers secrets или локально, НЕ коммитятся в git.
2. **Временное хранение:** ID и токены сохраняются здесь временно для настройки, затем будут перенесены в конфигурационные файлы на Этапе 2.
3. **Прогресс:** Отметки прогресса ведутся в `docs/doc-cloudflare-integration-plan.md`.
