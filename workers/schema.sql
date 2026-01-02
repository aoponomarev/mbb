-- ================================================================================================
-- SQL SCHEMA для D1 базы данных MBB Dataset Integration
-- ================================================================================================
--
-- ЦЕЛЬ: Определение структуры таблиц для хранения пользователей, портфелей и настроек.
--
-- ТАБЛИЦЫ:
-- - users — пользователи (данные из Google OAuth)
-- - portfolios — портфели пользователей
-- - user_settings — настройки пользователей (опционально)
--
-- ИСПОЛЬЗОВАНИЕ:
-- wrangler d1 execute mbb-database --file=./schema.sql
-- или через Cloudflare Dashboard → D1 → Execute SQL
--

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Индекс для быстрого поиска по google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Индекс для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Таблица портфелей
CREATE TABLE IF NOT EXISTS portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  assets TEXT NOT NULL, -- JSON массив активов портфеля
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска портфелей пользователя
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);

-- Таблица настроек пользователей (опционально, для будущего расширения)
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  settings TEXT NOT NULL, -- JSON объект с настройками
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска настроек пользователя
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
