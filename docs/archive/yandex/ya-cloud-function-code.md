# Исправленный код для Yandex Cloud Function

## ⚠️ Важное исправление

В коде, предоставленном ИИ-ассистентом, есть проблема:
- ❌ Используется `require('node-fetch')` - это внешняя библиотека
- ✅ В Node.js 18+ есть встроенный `fetch`, не нужно требовать библиотеку

## Исправленный код

Используйте этот код вместо предоставленного ИИ-ассистентом:

```javascript
// index.js
// Прокси-функция для YandexGPT API с поддержкой CORS

exports.handler = async (event, context) => {
    // ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ (удалить после исправления проблемы)
    console.log('=== Function called ===');
    console.log('Event type:', typeof event);
    console.log('Event keys:', Object.keys(event || {}));
    console.log('Event.httpMethod:', event?.httpMethod);
    console.log('Event.method:', event?.method);
    console.log('Event.requestContext:', event?.requestContext);
    console.log('Event headers:', event?.headers);
    console.log('Full event (first 500 chars):', JSON.stringify(event).substring(0, 500));

    // CORS заголовки (используются во всех ответах)
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 часа - кэширование preflight
        'Content-Type': 'application/json'
    };

    // Определение HTTP метода (разные варианты для разных платформ)
    const httpMethod = event?.httpMethod ||
                       event?.requestContext?.httpMethod ||
                       event?.method ||
                       event?.request?.method ||
                       (event?.headers && event?.headers['x-request-method']) ||
                       'UNKNOWN';

    console.log('Detected HTTP method:', httpMethod);

    // 1. Обработка CORS preflight (OPTIONS)
    if (httpMethod === 'OPTIONS') {
        console.log('OPTIONS preflight request handled');
        // Используем статус 204 (No Content) для OPTIONS - стандартная практика
        const response = {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
        console.log('OPTIONS response:', JSON.stringify(response));
        return response;
    }

    // 2. Проверка метода
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: { message: 'Метод не поддерживается' } })
        };
    }

    try {
        // 3. Парсинг тела запроса
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('Ошибка парсинга JSON:', parseError.message);
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Некорректный формат JSON' } })
            };
        }

        // 4. Извлечение API-ключа
        const apiKey = process.env.YANDEX_API_KEY || requestBody.apiKey;
        if (!apiKey) {
            console.error('API-ключ не указан');
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'API-ключ не указан' } })
            };
        }

        // 5. Проверка обязательных полей
        const { modelUri, messages, completionOptions } = requestBody;
        if (!modelUri) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Не указан modelUri' } })
            };
        }
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Некорректное поле messages (должен быть непустой массив)' } })
            };
        }

        // 6. Формирование запроса к YandexGPT API
        const url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

        // Извлечение folderId из modelUri (опционально)
        let folderId = null;
        const modelUriMatch = modelUri.match(/^gpt:\/\/([^\/]+)\//);
        if (modelUriMatch) {
            folderId = modelUriMatch[1];
        }

        const headers = {
            'Authorization': `Api-Key ${apiKey}`,
            'Content-Type': 'application/json'
        };
        if (folderId) {
            headers['x-folder-id'] = folderId;
        }

        const body = JSON.stringify({
            modelUri,
            messages,
            completionOptions
        });

        // Логирование запроса (без API-ключа)
        console.log('Запрос к YandexGPT API:', {
            url,
            modelUri,
            messagesCount: messages.length,
            hasCompletionOptions: !!completionOptions,
            folderId: folderId || 'не извлечен'
        });

        // 7. Отправка запроса к YandexGPT API
        // В Node.js 18+ fetch доступен глобально, не требуется require
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });

        const data = await response.json();

        // Логирование ответа
        console.log('Ответ от YandexGPT API:', {
            status: response.status,
            hasResult: !!data.result,
            hasError: !!data.error
        });

        // 8. Возврат ответа с CORS заголовками
        const result = {
            statusCode: response.status,
            headers: corsHeaders,
            body: JSON.stringify(data)
        };
        console.log('Response that will be returned:', JSON.stringify({
            statusCode: result.statusCode,
            headers: result.headers,
            bodyLength: result.body.length
        }));
        return result;

    } catch (error) {
        console.error('Ошибка обработки запроса:', {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: {
                    message: 'Внутренняя ошибка сервера: ' + error.message
                }
            })
        };
    }
};
```

## Изменения в исправленном коде

1. ✅ **Удален `require('node-fetch')`** - в Node.js 18+ `fetch` доступен глобально
2. ✅ **Улучшена обработка ошибок** - добавлен try-catch для парсинга JSON
3. ✅ **Улучшено логирование** - добавлены логи для отладки (без API-ключей)
4. ✅ **Вынесены CORS заголовки** - для переиспользования
5. ✅ **Улучшена валидация** - проверка на пустой массив messages

## Инструкции по шагам

### Шаг 3: Вставка кода

При выполнении **Шага 3** используйте исправленный код выше вместо того, что предоставил ИИ-ассистент.

**Важно**: Не добавляйте строку `const fetch = require('node-fetch');` - она не нужна и может вызвать ошибку!

### Шаг 4: Переменные окружения

Если вы хотите хранить API-ключ в переменных окружения (рекомендуется):

1. В разделе "Переменные окружения" нажмите "Добавить"
2. Ключ: `YANDEX_API_KEY`
3. Значение: ваш API-ключ (например, `AQVN...` - замените на ваш реальный ключ)
4. Нажмите "Сохранить"

После этого API-ключ не нужно будет передавать в теле запроса.

### Шаг 7: Тестирование

После создания версии функции можно протестировать через `ya-cors.html`:

1. Откройте `ya-cors.html` в браузере
2. Введите URL функции: `https://functions.yandexcloud.net/d4erd8d1pttbufsl26s1`
3. (Опционально) Введите API-ключ, если не сохранен в env
4. Введите Folder ID: `b1gv03a122le5a934cqj`
5. Выберите модель и отправьте запрос
6. Проверьте логи на наличие ошибок

## ССЫЛКИ

- План интеграции: `ya-integration-mbb-plan.md`
- Задание для ИИ-ассистента: `ya-cloud-function-task.md`
- Тестовая страница: `ya-cors.html`
