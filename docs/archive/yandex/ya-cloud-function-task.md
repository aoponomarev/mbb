# Задание для ИИ-ассистента Yandex Cloud: Создание прокси-функции для YandexGPT API

## ⚠️ ВАЖНО: Проверка прав доступа перед созданием функции

Перед созданием Cloud Function убедитесь, что у сервисного аккаунта есть необходимые права доступа на папку (folder):

1. **Проверьте права доступа** сервисного аккаунта на папку:
   ```bash
   yc resource-manager folder list-access-bindings b1gv03a122le5a934cqj
   ```

2. **Назначьте роль `editor`** сервисному аккаунту, если её нет:
   ```bash
   yc resource-manager folder add-access-binding b1gv03a122le5a934cqj \
     --role editor \
     --subject serviceAccount:{SERVICE_ACCOUNT_ID}
   ```

**Важные моменты:**
- Роль должна быть назначена на **папку** (`b1gv03a122le5a934cqj`), а не на облако или организацию
- Субъект должен быть **сервисным аккаунтом** (`serviceAccount`), а не пользователем
- Роль должна быть `editor` (или `admin`), а не `ai.languageModels.user`

**Ошибка при отсутствии прав:** Если права не назначены, при попытке создания функции возникнет ошибка `PermissionDenied`.

## Цель

Создать Yandex Cloud Function, которая будет работать как прокси-сервер для YandexGPT API (Foundation Models API), обеспечивая:
- Обработку CORS-запросов от клиентских приложений (браузеров)
- Безопасную передачу API-ключей через переменные окружения
- Перенаправление запросов к YandexGPT API
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
if (event.httpMethod === 'OPTIONS') {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400' // 24 часа
        },
        body: ''
    };
}
```

#### 2. Обработка POST-запросов

Функция принимает POST-запросы со следующим форматом тела:

```json
{
  "apiKey": "AQVN...",  // Опционально, если хранится в env
  "modelUri": "gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest",
  "messages": [
    {
      "role": "user",
      "text": "Привет, как дела?"
    }
  ],
  "completionOptions": {
    "temperature": 0.6,
    "maxTokens": 2000
  }
}
```

**Логика работы:**
1. Парсинг тела запроса (JSON)
2. Извлечение API-ключа:
   - Приоритет: переменная окружения `YANDEX_API_KEY`
   - Fallback: `apiKey` из тела запроса (если не указан в env)
3. Формирование запроса к YandexGPT API:
   - Endpoint: `https://llm.api.cloud.yandex.net/foundationModels/v1/completion`
   - Метод: POST
   - Headers:
     - `Authorization: Api-Key {apiKey}`
     - `Content-Type: application/json`
     - (Опционально) `x-folder-id: {folderId}` - если folderId можно извлечь из modelUri
4. Формирование тела запроса к YandexGPT API (передача modelUri, messages, completionOptions как есть)
5. Отправка запроса к YandexGPT API
6. Возврат ответа с CORS заголовками

#### 3. Формат ответа

Успешный ответ:
```javascript
{
    statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // ответ от YandexGPT API без изменений
}
```

Ошибка:
```javascript
{
    statusCode: 500, // или код ошибки от API
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

#### 4. Обработка ошибок

Функция должна корректно обрабатывать следующие случаи:
- Некорректный формат тела запроса (не JSON)
- Отсутствие обязательных полей (modelUri, messages)
- Ошибки сети при запросе к YandexGPT API
- Ошибки от YandexGPT API (передавать как есть с кодом статуса)
- Отсутствие API-ключа (в env и в запросе)

**Все ошибки должны логироваться** в консоль для отладки.

#### 5. Извлечение folderId из modelUri

Если `modelUri` имеет формат `gpt://{folderId}/{model}/{version}`, извлечь folderId и добавить заголовок `x-folder-id` в запрос к YandexGPT API (это может быть опционально, но улучшит совместимость).

## Переменные окружения

Функция должна использовать переменную окружения:
- `YANDEX_API_KEY` - API-ключ Yandex Cloud (тип: Секрет, если доступно, иначе Переменная)

**Приоритет использования API-ключа:**
1. Переменная окружения `YANDEX_API_KEY` (если установлена)
2. Поле `apiKey` из тела запроса (если переменная окружения не установлена)

## HTTP-триггер

Настроить HTTP-триггер с поддержкой методов:
- **POST** - для основных запросов
- **OPTIONS** - для CORS preflight-запросов

Триггер должен быть публичным (доступен из интернета) для работы с клиентскими приложениями.

## Структура кода функции

```javascript
// index.js
exports.handler = async (event, context) => {
    // 1. Обработка CORS preflight (OPTIONS)

    // 2. Валидация метода (только POST)

    // 3. Парсинг тела запроса

    // 4. Извлечение API-ключа (env → body)

    // 5. Валидация обязательных полей

    // 6. Формирование запроса к YandexGPT API
    //    - Извлечение folderId из modelUri (опционально)
    //    - Формирование headers
    //    - Формирование body

    // 7. Отправка запроса к YandexGPT API

    // 8. Обработка ответа
    //    - Успешный ответ → возврат с CORS заголовками
    //    - Ошибка → возврат ошибки с CORS заголовками

    // 9. Логирование (для отладки)
};
```

## Требования к безопасности

1. **Логирование API-ключей запрещено** - не выводить полные API-ключи в логи (только первые 10 символов для идентификации)
2. **HTTPS обязательно** - все запросы должны идти по HTTPS
3. **Валидация входных данных** - проверять формат и наличие обязательных полей

## Примеры запросов и ответов

### Пример 1: Успешный запрос

**Запрос:**
```http
POST /your-function-id
Content-Type: application/json

{
  "modelUri": "gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest",
  "messages": [
    {
      "role": "user",
      "text": "Привет!"
    }
  ],
  "completionOptions": {
    "temperature": 0.6,
    "maxTokens": 2000
  }
}
```

**Ответ:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Content-Type: application/json

{
  "result": {
    "alternatives": [
      {
        "message": {
          "role": "assistant",
          "text": "Привет! Как дела?"
        },
        "status": "ALTERNATIVE_STATUS_FINAL"
      }
    ],
    "usage": {
      "inputTextTokens": "10",
      "completionTokens": "12",
      "totalTokens": "22"
    }
  }
}
```

### Пример 2: CORS preflight

**Запрос:**
```http
OPTIONS /your-function-id
```

**Ответ:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### Пример 3: Ошибка валидации

**Запрос:**
```http
POST /your-function-id
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
    "message": "Не указан modelUri"
  }
}
```

## Дополнительные требования

1. **Производительность**: функция должна обрабатывать запросы быстро, без ненужных задержек
2. **Логирование**: логировать важные события (начало запроса, ошибки, успешные ответы) для отладки
3. **Обработка таймаутов**: учитывать возможные таймауты при запросах к YandexGPT API
4. **Комментарии в коде**: код должен быть хорошо прокомментирован на русском языке

## ССЫЛКИ

- Документация Yandex Cloud Functions: https://yandex.cloud/ru/docs/functions/
- Документация Foundation Models API: https://yandex.cloud/ru/docs/foundation-models/
- Решение проблем с CORS: https://yandex.cloud/docs/troubleshooting/functions/known-issues/cors-error-when-querying-api-fron-webapp-frontend
