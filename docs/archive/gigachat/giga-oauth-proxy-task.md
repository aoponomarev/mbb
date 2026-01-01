# Задание для создания прокси-функции GigaChat API

## Цель

Создать прокси-функцию (Cloudflare Workers, Yandex Cloud Functions или другой serverless-сервис), которая будет работать как прокси-сервер для GigaChat API, обеспечивая:
- Обработку CORS-запросов от клиентских приложений (браузеров)
- Получение OAuth токена доступа через GigaChat OAuth API
- Проксирование запросов к GigaChat Chat API
- Кэширование OAuth токенов
- Возврат ответов с корректными CORS-заголовками

## Технические требования

### Среда выполнения

- **Node.js 18** (или новее)
- **Русский язык**: все комментарии и сообщения об ошибках на русском

### Функциональность

#### 1. Обработка CORS preflight-запросов (OPTIONS)

Функция должна обрабатывать OPTIONS-запросы и возвращать корректные CORS заголовки:

```javascript
// Пример обработки OPTIONS
if (event.request.method === 'OPTIONS') {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400' // 24 часа
        }
    });
}
```

#### 2. Получение OAuth токена

Функция должна получать OAuth токен доступа через GigaChat OAuth API:

**Endpoint**: `https://ngw.devices.sberbank.ru:9443/api/v2/oauth`

**Формат запроса**:
```http
POST https://ngw.devices.sberbank.ru:9443/api/v2/oauth
Headers:
  Authorization: Basic {base64_credentials}
  Content-Type: application/x-www-form-urlencoded
  Accept: application/json
  RqUID: {uuid}
Body: scope=GIGACHAT_API_PERS
```

**Формат ответа**:
```json
{
  "access_token": "...",
  "expires_in": 1800,
  "token_type": "Bearer"
}
```

**Логика работы**:
1. Проверить кэш токена (если есть и не истек)
2. Если токен истек или отсутствует:
   - Получить Authorization Key из переменных окружения
   - Сгенерировать RqUID (UUID)
   - Отправить запрос к OAuth API
   - Сохранить токен в кэш с учетом `expires_in`
3. Вернуть токен

#### 3. Обработка POST-запросов (Chat API)

Функция принимает POST-запросы со следующим форматом тела:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Привет, как дела?"
    }
  ],
  "model": "GigaChat",
  "temperature": 0.6,
  "max_tokens": 2000
}
```

**Логика работы**:
1. Получить OAuth токен (с кэшированием)
2. Парсинг тела запроса (JSON)
3. Валидация обязательных полей (messages, model)
4. Формирование запроса к GigaChat Chat API:
   - Endpoint: `https://gigachat.devices.sberbank.ru/api/v1/chat/completions`
   - Метод: POST
   - Headers:
     - `Authorization: Bearer {access_token}`
     - `Content-Type: application/json`
   - Body: передать messages, model, temperature, max_tokens как есть
5. Отправка запроса к GigaChat Chat API
6. Возврат ответа с CORS заголовками

#### 4. Формат ответа

Успешный ответ:
```javascript
{
    status: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // ответ от GigaChat API без изменений
}
```

Ошибка:
```javascript
{
    status: 500, // или код ошибки от API
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        error: {
            message: 'Описание ошибки',
            ... // другие поля ошибки от API
        }
    })
}
```

#### 5. Обработка ошибок

Функция должна корректно обрабатывать следующие случаи:
- Некорректный формат тела запроса (не JSON)
- Отсутствие обязательных полей (messages, model)
- Ошибки сети при запросе к OAuth API
- Ошибки сети при запросе к Chat API
- Ошибки от GigaChat API (передавать как есть с кодом статуса)
- Отсутствие Authorization Key (в env)
- Истечение OAuth токена (автоматическое обновление)

**Все ошибки должны логироваться** в консоль для отладки.

#### 6. Кэширование OAuth токенов

Функция должна кэшировать OAuth токены:
- Хранить токен и время истечения
- Проверять валидность перед использованием
- Автоматически обновлять при истечении

**Варианты кэширования**:
- В памяти функции (для Cloudflare Workers - на уровне worker instance)
- В KV storage (Cloudflare Workers KV)
- В переменных окружения (не рекомендуется, но возможно)
- В кэше платформы (если доступно)

## Переменные окружения

Функция должна использовать переменную окружения:
- `GIGACHAT_AUTH_KEY` - Authorization Key GigaChat (Base64, тип: Секрет, если доступно)

## HTTP-триггер / Routes

Настроить HTTP-триггер с поддержкой методов:
- **POST** - для основных запросов
- **OPTIONS** - для CORS preflight-запросов

Триггер должен быть публичным (доступен из интернета) для работы с клиентскими приложениями.

## Структура кода функции

```javascript
// Основной обработчик
async function handler(event) {
    // 1. Обработка CORS preflight (OPTIONS)

    // 2. Валидация метода (только POST)

    // 3. Получение OAuth токена (с кэшированием)

    // 4. Парсинг тела запроса

    // 5. Валидация обязательных полей

    // 6. Формирование запроса к GigaChat Chat API

    // 7. Отправка запроса к GigaChat Chat API

    // 8. Обработка ответа
    //    - Успешный ответ → возврат с CORS заголовками
    //    - Ошибка → возврат ошибки с CORS заголовками

    // 9. Логирование (для отладки)
}
```

## Требования к безопасности

1. **Логирование ключей запрещено** - не выводить полные Authorization Keys в логи (только первые 10 символов для идентификации)
2. **HTTPS обязательно** - все запросы должны идти по HTTPS
3. **Валидация входных данных** - проверять формат и наличие обязательных полей
4. **Безопасное хранение** - Authorization Key только в переменных окружения, не в коде

## Примеры запросов и ответов

### Пример 1: Успешный запрос

**Запрос:**
```http
POST /your-proxy-url
Content-Type: application/json

{
  "model": "GigaChat",
  "messages": [
    {
      "role": "user",
      "content": "Привет!"
    }
  ],
  "temperature": 0.6,
  "max_tokens": 2000
}
```

**Ответ:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Content-Type: application/json

{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Привет! Как дела?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  }
}
```

### Пример 2: CORS preflight

**Запрос:**
```http
OPTIONS /your-proxy-url
```

**Ответ:**
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### Пример 3: Ошибка валидации

**Запрос:**
```http
POST /your-proxy-url
Content-Type: application/json

{
  "messages": []
}
```

**Ответ:**
```http
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: *
Content-Type: application/json

{
  "error": {
    "message": "Поле messages не должно быть пустым"
  }
}
```

## Дополнительные требования

1. **Производительность**: функция должна обрабатывать запросы быстро, использовать кэширование токенов
2. **Логирование**: логировать важные события (получение токена, ошибки, успешные ответы) для отладки
3. **Обработка таймаутов**: учитывать возможные таймауты при запросах к GigaChat API
4. **Комментарии в коде**: код должен быть хорошо прокомментирован на русском языке

## Платформо-специфичные особенности

### Cloudflare Workers

- Использовать Workers KV для кэширования токенов (опционально)
- Использовать встроенный `fetch` API
- Обработка через `addEventListener('fetch', event => { ... })`

### Yandex Cloud Functions

- Использовать глобальный `fetch` (Node.js 18+)
- Обработка через `exports.handler = async (event, context) => { ... }`
- Кэширование токенов в памяти функции (на уровне instance)

## ССЫЛКИ

- Документация GigaChat API: https://developers.sber.ru/help
- План интеграции: `giga-integration-mbb-plan.md`
- Документация Cloudflare Workers: https://developers.cloudflare.com/workers/
- Документация Yandex Cloud Functions: https://yandex.cloud/ru/docs/functions/
