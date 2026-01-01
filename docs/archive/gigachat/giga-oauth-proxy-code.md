# Код прокси-функции GigaChat API

## ⚠️ Важно

Этот код является шаблоном для создания прокси-функции. Адаптируйте его под выбранную платформу (Cloudflare Workers, Yandex Cloud Functions и т.д.).

## Вариант 1: Cloudflare Workers

```javascript
// worker.js

// Кэш для OAuth токенов (в памяти worker instance)
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

/**
 * Получение OAuth токена доступа
 */
async function getAccessToken(authKey) {
    // Проверяем кэш
    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) { // 60 сек запас
        return tokenCache.accessToken;
    }

    // Генерируем RqUID
    const rqUID = crypto.randomUUID();

    // Запрос к OAuth API
    const oauthUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    const response = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': rqUID
        },
        body: 'scope=GIGACHAT_API_PERS'
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 1800; // по умолчанию 30 минут

    // Сохраняем в кэш
    tokenCache.accessToken = accessToken;
    tokenCache.expiresAt = now + (expiresIn * 1000);

    return accessToken;
}

/**
 * Основной обработчик запросов
 */
async function handleRequest(request, env) {
    // CORS заголовки
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Обработка OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // Только POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            error: { message: 'Метод не поддерживается' }
        }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        // Получаем Authorization Key из переменных окружения
        const authKey = env.GIGACHAT_AUTH_KEY;
        if (!authKey) {
            return new Response(JSON.stringify({
                error: { message: 'Authorization Key не настроен' }
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Парсим тело запроса
        let requestBody;
        try {
            const bodyText = await request.text();
            if (!bodyText || bodyText.trim() === '') {
                return new Response(JSON.stringify({
                    error: { message: 'Тело запроса пустое. Отправьте JSON с полями model и messages.' }
                }), {
                    status: 400,
                    headers: corsHeaders
                });
            }
            requestBody = JSON.parse(bodyText);
        } catch (parseError) {
            return new Response(JSON.stringify({
                error: {
                    message: 'Некорректный формат JSON: ' + parseError.message
                }
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Валидация обязательных полей
        const { messages, model } = requestBody;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({
                error: { message: 'Поле messages должно быть непустым массивом' }
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        if (!model) {
            return new Response(JSON.stringify({
                error: { message: 'Поле model обязательно' }
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Получаем OAuth токен
        const accessToken = await getAccessToken(authKey);

        // Формируем запрос к GigaChat Chat API
        const chatApiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
        const chatRequestBody = {
            model: model || 'GigaChat',
            messages: messages,
            temperature: requestBody.temperature || 0.6,
            max_tokens: requestBody.max_tokens || 2000
        };

        // Отправляем запрос к GigaChat API
        const chatResponse = await fetch(chatApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequestBody)
        });

        const chatData = await chatResponse.json();

        // Возвращаем ответ с CORS заголовками
        return new Response(JSON.stringify(chatData), {
            status: chatResponse.status,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Ошибка обработки запроса:', error);
        return new Response(JSON.stringify({
            error: {
                message: 'Внутренняя ошибка сервера: ' + error.message
            }
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// Обработчик для Cloudflare Workers
export default {
    async fetch(request, env) {
        return handleRequest(request, env);
    }
};
```

## Вариант 2: Yandex Cloud Functions

```javascript
// index.js

// Кэш для OAuth токенов (в памяти функции на уровне instance)
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

/**
 * Получение OAuth токена доступа
 */
async function getAccessToken(authKey) {
    // Проверяем кэш
    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) { // 60 сек запас
        return tokenCache.accessToken;
    }

    // Генерируем RqUID (упрощенная версия UUID)
    const rqUID = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Запрос к OAuth API
    const oauthUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    const response = await fetch(oauthUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': rqUID
        },
        body: 'scope=GIGACHAT_API_PERS'
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 1800; // по умолчанию 30 минут

    // Сохраняем в кэш
    tokenCache.accessToken = accessToken;
    tokenCache.expiresAt = now + (expiresIn * 1000);

    return accessToken;
}

/**
 * Основной обработчик для Yandex Cloud Functions
 */
exports.handler = async (event, context) => {
    // CORS заголовки
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Определение HTTP метода
    const httpMethod = event?.httpMethod ||
                       event?.requestContext?.httpMethod ||
                       event?.method ||
                       'UNKNOWN';

    // Обработка OPTIONS (preflight)
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    // Только POST
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({
                error: { message: 'Метод не поддерживается' }
            })
        };
    }

    try {
        // Получаем Authorization Key из переменных окружения
        const authKey = process.env.GIGACHAT_AUTH_KEY;
        if (!authKey) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: { message: 'Authorization Key не настроен' }
                })
            };
        }

        // Парсим тело запроса
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: { message: 'Некорректный формат JSON' }
                })
            };
        }

        // Валидация обязательных полей
        const { messages, model } = requestBody;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: { message: 'Поле messages должно быть непустым массивом' }
                })
            };
        }

        if (!model) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: { message: 'Поле model обязательно' }
                })
            };
        }

        // Получаем OAuth токен
        const accessToken = await getAccessToken(authKey);

        // Формируем запрос к GigaChat Chat API
        const chatApiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
        const chatRequestBody = {
            model: model || 'GigaChat',
            messages: messages,
            temperature: requestBody.temperature || 0.6,
            max_tokens: requestBody.max_tokens || 2000
        };

        // Отправляем запрос к GigaChat API
        const chatResponse = await fetch(chatApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequestBody)
        });

        const chatData = await chatResponse.json();

        // Возвращаем ответ с CORS заголовками
        return {
            statusCode: chatResponse.status,
            headers: corsHeaders,
            body: JSON.stringify(chatData)
        };

    } catch (error) {
        console.error('Ошибка обработки запроса:', error);
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

## Важные моменты

1. **Кэширование токенов**: Токены кэшируются в памяти до истечения срока действия. При истечении автоматически обновляются.

2. **Безопасность**: Authorization Key хранится только в переменных окружения, не передается через клиент.

3. **Обработка ошибок**: Все ошибки логируются и возвращаются с корректными CORS заголовками.

4. **Валидация**: Проверяется наличие обязательных полей перед отправкой запроса к API.

## Переменные окружения

Необходимо настроить:
- `GIGACHAT_AUTH_KEY` - Authorization Key GigaChat (Base64)

## Тестирование

После создания функции протестируйте через `giga-cors.html`:
1. Откройте `giga-cors.html` в браузере
2. Введите URL прокси
3. Введите тестовый запрос
4. Проверьте, что OAuth токен получен и запрос к API выполнен успешно

## ССЫЛКИ

- Задание для создания прокси: `giga-oauth-proxy-task.md`
- Пошаговое руководство: `giga-oauth-proxy-steps-guide.md`
- Тестовая страница: `giga-cors.html`
