# Архитектура прокси для GigaChat: единый источник правды

> Описание архитектуры проксирования для GigaChat с поддержкой переключения между прокси-сервисами

## Принцип единого источника правды

Все настройки прокси хранятся централизованно в `core/config/app-config.js`, что обеспечивает:
- Единое место для изменения URL прокси
- Исключение дублирования настроек
- Легкое добавление новых прокси-сервисов
- Гибкое переключение между прокси

## Структура конфигурации

### Централизованная конфигурация прокси

В `app-config.js` определена структура для каждого AI провайдера:

```javascript
gigachat: {
    model: 'GigaChat',
    models: [...],
    proxyType: 'cloudflare', // Тип прокси по умолчанию
    proxies: {
        cloudflare: {
            url: 'https://gigachat-proxy.your-subdomain.workers.dev',
            label: 'Cloudflare Workers',
            description: 'Бесплатный тариф, глобальная CDN'
        },
        yandex: {
            url: 'https://functions.yandexcloud.net/your-function-id',
            label: 'Yandex Cloud Functions',
            description: 'Единая платформа с YandexGPT'
        }
    }
}
```

### Функции для работы с прокси

#### `getProxyUrl(providerName, proxyType)`

Получить URL прокси для AI провайдера:

```javascript
// Получить URL прокси для GigaChat (дефолтный тип)
const url = appConfig.getProxyUrl('gigachat');

// Получить URL конкретного типа прокси
const url = appConfig.getProxyUrl('gigachat', 'cloudflare');
```

#### `getAvailableProxies(providerName)`

Получить список доступных прокси для AI провайдера:

```javascript
const proxies = appConfig.getAvailableProxies('gigachat');
// [
//   { type: 'cloudflare', url: '...', label: 'Cloudflare Workers', description: '...' },
//   { type: 'yandex', url: '...', label: 'Yandex Cloud Functions', description: '...' }
// ]
```

## Хранение пользовательских настроек

Пользовательский выбор типа прокси хранится в `cacheManager`:
- Ключ: `gigachat-proxy-type` (значение: `'cloudflare'` | `'yandex'`)
- TTL: `null` (настройки без срока действия)

URL прокси берется из конфигурации по выбранному типу, не хранится отдельно в кэше.

## Использование в провайдере GigaChat

```javascript
class GigachatProvider extends BaseAIProvider {
    constructor() {
        super();
        // Получаем тип прокси из настроек пользователя или дефолтный
        this.proxyType = await cacheManager.get('gigachat-proxy-type') ||
                         appConfig.get('defaults.gigachat.proxyType', 'cloudflare');

        // Получаем URL прокси из конфигурации
        this.proxyUrl = appConfig.getProxyUrl('gigachat', this.proxyType);
    }
}
```

## Переключение прокси в настройках

В компоненте настроек (`ai-api-settings.js`):
1. Загружаем список доступных прокси: `appConfig.getAvailableProxies('gigachat')`
2. Отображаем select для выбора типа прокси
3. При сохранении сохраняем только тип: `cacheManager.set('gigachat-proxy-type', selectedType)`
4. URL прокси получаем динамически из конфигурации

## Проверка доступности прокси

При переключении прокси:
1. Отправляем OPTIONS запрос (preflight) к выбранному прокси
2. Если успешно (статус 200/204) - прокси доступен
3. Если ошибка - показываем предупреждение и не переключаемся

## Преимущества архитектуры

1. **Единый источник правды**: Все URL прокси в одном месте (`app-config.js`)
2. **Гибкость**: Легко добавить новый тип прокси (AWS Lambda, Vercel и т.д.)
3. **Отказоустойчивость**: Можно переключиться при проблемах с одним прокси
4. **Безопасность**: URL прокси не хранятся в localStorage пользователя
5. **Обновляемость**: Можно обновить URL прокси в конфигурации без изменения кода приложения

## Пример добавления нового прокси

1. Обновить `app-config.js`:
```javascript
gigachat: {
    proxies: {
        cloudflare: {...},
        yandex: {...},
        aws: {  // Новый прокси
            url: 'https://your-lambda-url.execute-api.region.amazonaws.com/prod',
            label: 'AWS Lambda',
            description: 'Amazon Lambda Functions'
        }
    }
}
```

2. Обновить компонент настроек для отображения нового прокси в списке

3. Готово! Провайдер автоматически будет использовать новый прокси при выборе

## ССЫЛКИ

- Конфигурация: `core/config/app-config.js`
- Настройки: `app/components/ai-api-settings.js`
- Провайдер GigaChat: `core/api/ai-providers/gigachat-provider.js` (после создания)
- Кэш-конфигурация: `core/cache/cache-config.js`
