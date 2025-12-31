# Подключение Perplexity AI

> Оглавление `docs/archive/perplexity/ppx-connect.md`
- § Общая информация — описание Perplexity AI и его использования в проекте
- § Получение API ключа — инструкции по получению API ключа
- § Настройка — конфигурация Perplexity в приложении
- § Использование — как использовать Perplexity через менеджер провайдеров

> § <br> ОБЩАЯ ИНФОРМАЦИЯ

## Perplexity AI в проекте

Perplexity AI — один из доступных AI провайдеров в приложении MBB. Используется для:
- Перевода tooltips на различные языки
- Генерации новостей о криптовалютах
- Других задач, требующих AI-анализа текста

## Реализация

Perplexity интегрирован через систему провайдеров:
- **Модуль API**: `core/api/perplexity.js` — низкоуровневая работа с Perplexity Chat Completions API
- **Провайдер**: `core/api/ai-providers/perplexity-provider.js` — обертка для единого интерфейса
- **Менеджер**: `core/api/ai-provider-manager.js` — управление переключением между провайдерами

## API Endpoint

```
https://api.perplexity.ai/chat/completions
```

## Формат запроса

Perplexity использует стандартный формат Chat Completions API:

```javascript
{
  "model": "sonar-pro",
  "messages": [
    {
      "role": "user",
      "content": "Ваш запрос"
    }
  ]
}
```

## Формат ответа

```javascript
{
  "choices": [
    {
      "message": {
        "content": "Ответ от AI"
      }
    }
  ]
}
```

> § <br> ПОЛУЧЕНИЕ API КЛЮЧА

## Шаг 1: Регистрация

1. Перейдите на https://www.perplexity.ai/
2. Зарегистрируйте аккаунт или войдите в существующий

## Шаг 2: Создание API ключа

1. Перейдите в настройки аккаунта
2. Найдите раздел "API Keys" или "Developer Settings"
3. Создайте новый API ключ
4. Скопируйте и сохраните ключ в безопасном месте

**Важно**: API ключ виден только один раз при создании. Сохраните его сразу.

## Шаг 3: Добавление ключа в приложение

1. Откройте приложение MBB
2. Перейдите в настройки: **Настройки → AI API**
3. Выберите провайдер **Perplexity AI**
4. Введите API ключ в поле "API Key"
5. Выберите модель (по умолчанию: `sonar-pro`)
6. Нажмите **Сохранить**

> § <br> НАСТРОЙКА

## Модели Perplexity

Доступные модели (определены в `core/config/app-config.js`):

- `sonar-pro` — продвинутая модель (по умолчанию)
- `sonar` — стандартная модель
- `llama-3.1-sonar-small-128k-online` — онлайн-модель с поддержкой до 128k токенов
- `llama-3.1-sonar-large-128k-online` — большая онлайн-модель с поддержкой до 128k токенов

## Хранение настроек

Настройки Perplexity хранятся в кэше:
- `perplexity-api-key` — API ключ
- `perplexity-model` — выбранная модель
- `ai-provider` — текущий провайдер (должен быть `'perplexity'` для использования Perplexity)

## Конфигурация по умолчанию

Дефолтные настройки определены в `core/config/app-config.js`:

```javascript
defaults: {
  perplexity: {
    model: 'sonar-pro',
    models: [
      { value: 'sonar-pro', label: 'sonar-pro' },
      { value: 'sonar', label: 'sonar' },
      { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
      { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
    ]
  }
}
```

> § <br> ИСПОЛЬЗОВАНИЕ

## Переключение на Perplexity

1. Откройте настройки: **Настройки → AI API**
2. Выберите **Perplexity AI** в списке провайдеров
3. Введите API ключ (если еще не введен)
4. Выберите модель
5. Нажмите **Сохранить**

## Использование через менеджер провайдеров

Все запросы к AI идут через `aiProviderManager`, который автоматически использует текущий выбранный провайдер:

```javascript
// Получить текущий провайдер
const providerName = await window.aiProviderManager.getCurrentProviderName();

// Отправить запрос (автоматически использует текущий провайдер)
const response = await window.aiProviderManager.sendRequest([
  { role: 'user', content: 'Ваш запрос' }
]);

// Переключиться на Perplexity
await window.aiProviderManager.setProvider('perplexity');
```

## Прямое использование провайдера

Если необходимо использовать Perplexity напрямую (без менеджера):

```javascript
const provider = window.aiProviderManager.getProvider('perplexity');
const apiKey = await window.cacheManager.get('perplexity-api-key');
const model = await window.cacheManager.get('perplexity-model') || 'sonar-pro';

const response = await provider.sendRequest(apiKey, model, [
  { role: 'user', content: 'Ваш запрос' }
]);
```

## Кэширование

Кэширование переводов и новостей учитывает текущий провайдер. При переключении с Perplexity на YandexGPT (или наоборот) данные кэшируются отдельно для каждого провайдера.

## Обработка ошибок

Perplexity Provider обрабатывает следующие ошибки:
- Отсутствие API ключа
- Неверный формат запроса
- HTTP ошибки (rate limiting, 401, 500 и т.д.)
- Пустые ответы от API

Все ошибки логируются в консоль браузера.

## ССЫЛКИ

- Perplexity API документация: https://docs.perplexity.ai/
- Менеджер провайдеров: `core/api/ai-provider-manager.js`
- Провайдер Perplexity: `core/api/ai-providers/perplexity-provider.js`
- API модуль: `core/api/perplexity.js`
- Общие принципы работы с провайдерами: `docs/doc-ai-providers.md`
