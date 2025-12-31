# AI Провайдеры — общие принципы и механизм переключения

> Оглавление `docs/doc-ai-providers.md`
- § Архитектура провайдеров — общая архитектура системы провайдеров
- § Базовый интерфейс — описание базового класса BaseAIProvider
- § Менеджер провайдеров — как работает AIProviderManager
- § Механизм переключения — детали бесшовного переключения между провайдерами
- § Добавление нового провайдера — инструкция по добавлению нового провайдера

> § <br> АРХИТЕКТУРА ПРОВАЙДЕРОВ

## Общая концепция

Система провайдеров обеспечивает единый интерфейс для работы с разными AI сервисами (YandexGPT, Perplexity AI и т.д.), позволяя приложению переключаться между ними без изменения кода, использующего AI.

## Компоненты системы

```
┌─────────────────────────────────────────────────────────┐
│              AI Provider Manager                        │
│  (core/api/ai-provider-manager.js)                      │
│  - Управление переключением                             │
│  - Единая точка доступа                                 │
│  - Автоматическое получение настроек                    │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼──────┐
│  YandexGPT  │  │ Perplexity │
│  Provider   │  │  Provider  │
└──────┬──────┘  └─────┬──────┘
       │               │
       └───────┬───────┘
               │
    ┌──────────▼──────────┐
    │  BaseAIProvider     │
    │  (базовый класс)    │
    └─────────────────────┘
```

## Принципы

1. **Единый интерфейс**: Все провайдеры реализуют одинаковый интерфейс через `BaseAIProvider`
2. **Абстракция различий**: Различия в форматах запросов/ответов скрыты внутри провайдеров
3. **Независимость**: Код приложения не зависит от конкретного провайдера
4. **Автоматическое переключение**: Менеджер автоматически получает настройки для текущего провайдера

> § <br> БАЗОВЫЙ ИНТЕРФЕЙС

## BaseAIProvider

Все провайдеры наследуются от `BaseAIProvider` (`core/api/ai-providers/base-provider.js`), который определяет обязательные методы:

### Методы интерфейса

#### `sendRequest(apiKey, model, messages, options)`
Отправляет запрос к AI API и возвращает текст ответа.

**Параметры:**
- `apiKey` (string) — API ключ провайдера
- `model` (string) — модель AI
- `messages` (Array<Object>) — массив сообщений в формате `{role: 'user'|'assistant', content: string}`
- `options` (Object) — дополнительные опции (temperature, maxTokens и т.д.)

**Возвращает:** `Promise<string>` — текст ответа от AI

#### `getDefaultModel()`
Возвращает модель по умолчанию для провайдера.

**Возвращает:** `string`

#### `getAvailableModels()`
Возвращает список доступных моделей.

**Возвращает:** `Array<Object>` — массив объектов `{value: string, label: string}`

#### `getName()`
Возвращает внутреннее имя провайдера.

**Возвращает:** `string` — например, `'yandex'`, `'perplexity'`

#### `getDisplayName()`
Возвращает отображаемое имя провайдера.

**Возвращает:** `string` — например, `'YandexGPT'`, `'Perplexity AI'`

#### `validateApiKey(apiKey)`
Валидирует формат API ключа (базовая проверка).

**Параметры:**
- `apiKey` (string) — API ключ

**Возвращает:** `boolean`

## Реализация провайдера

Каждый провайдер должен:
1. Наследоваться от `BaseAIProvider`
2. Реализовать все обязательные методы
3. Преобразовывать единый формат сообщений в формат API провайдера
4. Преобразовывать ответ API в единый формат (строка текста)

**Пример:**

```javascript
class MyProvider extends BaseAIProvider {
  async sendRequest(apiKey, model, messages, options) {
    // Преобразование messages в формат API
    // Отправка запроса
    // Парсинг ответа
    // Возврат текста
  }

  getDefaultModel() {
    return 'my-default-model';
  }

  // ... остальные методы
}
```

> § <br> МЕНЕДЖЕР ПРОВАЙДЕРОВ

## AIProviderManager

`AIProviderManager` (`core/api/ai-provider-manager.js`) — центральный компонент системы провайдеров.

### Основные функции

#### Инициализация провайдеров

```javascript
aiProviderManager.init()
```

Регистрирует все доступные провайдеры. Вызывается автоматически при загрузке модулей.

#### Получение текущего провайдера

```javascript
const provider = await aiProviderManager.getCurrentProvider();
const providerName = await aiProviderManager.getCurrentProviderName();
```

Текущий провайдер хранится в кэше под ключом `'ai-provider'`. Если провайдер не задан, используется дефолтный (`'yandex'`).

#### Переключение провайдера

```javascript
await aiProviderManager.setProvider('perplexity');
```

Изменяет текущий провайдер и сохраняет выбор в кэше.

#### Отправка запроса

```javascript
const response = await aiProviderManager.sendRequest(messages, options);
```

Автоматически:
1. Получает текущий провайдер
2. Загружает API ключ и модель для этого провайдера
3. Отправляет запрос через провайдер
4. Возвращает результат

#### Получение настроек провайдера

```javascript
const apiKey = await aiProviderManager.getApiKey('yandex');
const model = await aiProviderManager.getModel('yandex');
```

#### Получение списка провайдеров

```javascript
const providers = aiProviderManager.getAvailableProviders();
// [{ value: 'yandex', label: 'YandexGPT', provider: YandexProvider }, ...]
```

> § <br> МЕХАНИЗМ ПЕРЕКЛЮЧЕНИЯ

## Бесшовное переключение

Механизм переключения обеспечивает полную прозрачность для кода приложения.

### Хранение состояния

1. **Текущий провайдер**: хранится в кэше под ключом `'ai-provider'` (`'yandex'` или `'perplexity'`)
2. **API ключи**: хранятся отдельно для каждого провайдера:
   - `'yandex-api-key'` — ключ YandexGPT
   - `'perplexity-api-key'` — ключ Perplexity
3. **Модели**: хранятся отдельно:
   - `'yandex-model'` — модель YandexGPT
   - `'perplexity-model'` — модель Perplexity

### Процесс переключения

```
1. Пользователь выбирает провайдера в настройках
   ↓
2. ai-api-settings.js сохраняет выбор в кэш ('ai-provider')
   ↓
3. ai-api-settings.js вызывает aiProviderManager.setProvider()
   ↓
4. Менеджер обновляет внутреннее состояние
   ↓
5. Все последующие запросы через aiProviderManager автоматически
   используют новый провайдер
```

### Автоматическое получение настроек

При каждом запросе менеджер автоматически:

1. Определяет текущий провайдер из кэша
2. Загружает соответствующий API ключ и модель
3. Использует их для запроса

Это означает, что код приложения не нужно менять при переключении:

```javascript
// Этот код работает с любым провайдером
const response = await window.aiProviderManager.sendRequest([
  { role: 'user', content: 'Переведи tooltip' }
]);
```

### Кэширование с учетом провайдера

Кэширование переводов и новостей учитывает текущий провайдер. Ключи кэша включают имя провайдера:

```javascript
// Ключ кэша для переводов
`tooltips-${providerName}-${versionHash}-${language}`

// Примеры:
// tooltips-yandex-v123-english
// tooltips-perplexity-v123-english
```

Это гарантирует, что:
- Переводы от разных провайдеров кэшируются отдельно
- При переключении провайдера используются соответствующие кэшированные данные
- Данные не смешиваются между провайдерами

### Примеры использования

#### Пример 1: Переключение провайдера

```javascript
// Переключиться на Perplexity
await window.aiProviderManager.setProvider('perplexity');

// Все последующие запросы пойдут через Perplexity
const response = await window.aiProviderManager.sendRequest(messages);
```

#### Пример 2: Использование без переключения

```javascript
// Получить конкретный провайдер напрямую
const perplexity = window.aiProviderManager.getProvider('perplexity');
const apiKey = await window.cacheManager.get('perplexity-api-key');
const model = await window.cacheManager.get('perplexity-model') || 'sonar-pro';

// Использовать провайдер напрямую
const response = await perplexity.sendRequest(apiKey, model, messages);
```

#### Пример 3: Проверка текущего провайдера

```javascript
const currentProvider = await window.aiProviderManager.getCurrentProviderName();

if (currentProvider === 'yandex') {
  console.log('Используется YandexGPT');
} else if (currentProvider === 'perplexity') {
  console.log('Используется Perplexity AI');
}
```

> § <br> ДОБАВЛЕНИЕ НОВОГО ПРОВАЙДЕРА

## Пошаговая инструкция

### Шаг 1: Создать класс провайдера

Создайте файл `core/api/ai-providers/my-provider.js`:

```javascript
class MyProvider extends window.BaseAIProvider {
  async sendRequest(apiKey, model, messages, options = {}) {
    // Реализация отправки запроса
  }

  getDefaultModel() {
    return 'my-default-model';
  }

  getAvailableModels() {
    return [
      { value: 'model-1', label: 'Model 1' },
      { value: 'model-2', label: 'Model 2' }
    ];
  }

  getName() {
    return 'my-provider';
  }

  getDisplayName() {
    return 'My AI Provider';
  }
}

window.MyProvider = MyProvider;
```

### Шаг 2: Зарегистрировать в modules-config.js

Добавьте модуль в `core/modules-config.js`:

```javascript
{
  name: 'my-provider',
  path: 'core/api/ai-providers/my-provider.js',
  dependencies: ['base-provider']
}
```

### Шаг 3: Добавить в AIProviderManager

Обновите `core/api/ai-provider-manager.js`:

```javascript
init() {
  // ... существующие провайдеры
  if (window.MyProvider) {
    this.providers['my-provider'] = new window.MyProvider();
  }
}

async getApiKey(providerName) {
  // ...
  const keyName = providerName === 'yandex' ? 'yandex-api-key'
    : providerName === 'perplexity' ? 'perplexity-api-key'
    : providerName === 'my-provider' ? 'my-provider-api-key'  // ← добавить
    : null;
  // ...
}

async getModel(providerName) {
  // ...
  const modelKey = providerName === 'yandex' ? 'yandex-model'
    : providerName === 'perplexity' ? 'perplexity-model'
    : providerName === 'my-provider' ? 'my-provider-model'  // ← добавить
    : null;
  // ...
}
```

### Шаг 4: Добавить в настройки

Обновите `app/components/ai-api-settings.js` для отображения нового провайдера в UI.

### Шаг 5: Добавить конфигурацию

Добавьте дефолтные настройки в `core/config/app-config.js`:

```javascript
defaults: {
  myProvider: {
    model: 'my-default-model',
    models: [
      { value: 'model-1', label: 'Model 1' },
      { value: 'model-2', label: 'Model 2' }
    ]
  }
}
```

### Шаг 6: Добавить в cache-config.js

Добавьте ключи кэша для настроек провайдера в `core/cache/cache-config.js`:

```javascript
TTL: {
  'my-provider-api-key': 'cache-only',
  'my-provider-model': 'cache-only'
}
```

## ССЫЛКИ

- Менеджер провайдеров: `core/api/ai-provider-manager.js`
- Базовый класс: `core/api/ai-providers/base-provider.js`
- YandexGPT провайдер: `core/api/ai-providers/yandex-provider.js`
- Perplexity провайдер: `core/api/ai-providers/perplexity-provider.js`
- Настройки AI API: `app/components/ai-api-settings.js`
- Документация YandexGPT: `docs/archive/yandex/`
- Документация Perplexity: `docs/archive/perplexity/ppx-connect.md`
