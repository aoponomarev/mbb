# Код прокси GigaChat для Yandex Cloud Functions (готовый к использованию)

> Адаптированный код на основе рабочего прокси YandexGPT

## Используйте этот код

Скопируйте код ниже и вставьте в редактор функции Yandex Cloud Functions:

```javascript
// index.js
// Прокси-функция для GigaChat API с поддержкой CORS и OAuth

// Кэш для OAuth токенов (в памяти функции на уровне instance)
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

/**
 * Получение OAuth токена доступа
 * Использует https модуль напрямую для обхода проблем с SSL сертификатами на порту 9443
 */
async function getAccessToken(authKey) {
    // Проверяем кэш
    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) { // 60 сек запас
        console.log('OAuth: использование кэшированного токена');
        return tokenCache.accessToken;
    }

    // Генерируем RqUID (UUID v4 формат)
    // Используем криптографически стойкий генератор, если доступен
    let rqUID;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        rqUID = crypto.randomUUID();
    } else {
        // Fallback для старых версий Node.js
        rqUID = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    }

    // Запрос к OAuth API
    const oauthUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

    console.log('OAuth: начало запроса токена', {
        url: oauthUrl,
        hasAuthKey: !!authKey,
        authKeyLength: authKey ? authKey.length : 0,
        rqUID
    });

    // Используем https модуль напрямую для обхода проблем с SSL
    const https = require('https');
    const { URL } = require('url');

    return new Promise((resolve, reject) => {
        const urlObj = new URL(oauthUrl);
        const postData = 'scope=GIGACHAT_API_PERS';

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 9443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': rqUID,
                'Content-Length': Buffer.byteLength(postData)
            },
            // Для порта 9443 может потребоваться отключение проверки сертификата
            rejectUnauthorized: false // Внимание: снижает безопасность, но необходимо для порта 9443
        };

        console.log('OAuth: параметры запроса', {
            hostname: options.hostname,
            port: options.port,
            path: options.path,
            method: options.method,
            headers: {
                ...options.headers,
                'Authorization': `Basic ${authKey ? authKey.substring(0, 10) + '...' : '(отсутствует)'}`
            },
            bodyLength: postData.length,
            bodyPreview: postData
        });

        const req = https.request(options, (res) => {
            console.log('OAuth: ответ получен', {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                headers: res.headers
            });

            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log('OAuth: ответ полностью получен', {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    bodyLength: responseData.length,
                    bodyPreview: responseData.substring(0, 200)
                });

                if (res.statusCode !== 200) {
                    // Для ошибок 400+ важно показать полный ответ
                    const errorDetails = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        body: responseData || '(пустое тело ответа)',
                        headers: res.headers
                    };
                    console.error('OAuth: ошибка ответа', errorDetails);

                    // Пытаемся извлечь детали ошибки из JSON, если есть
                    let errorMessage = `OAuth error: ${res.statusCode} ${res.statusMessage}`;
                    if (responseData) {
                        try {
                            const errorData = JSON.parse(responseData);
                            if (errorData.error_description) {
                                errorMessage += ` - ${errorData.error_description}`;
                            } else if (errorData.error) {
                                errorMessage += ` - ${errorData.error}`;
                            } else {
                                errorMessage += ` - ${responseData}`;
                            }
                        } catch (e) {
                            errorMessage += ` - ${responseData}`;
                        }
                    }

                    reject(new Error(errorMessage));
                    return;
                }

                try {
                    const data = JSON.parse(responseData);
                    console.log('OAuth: токен получен', {
                        hasAccessToken: !!data.access_token,
                        expiresIn: data.expires_in
                    });

                    const accessToken = data.access_token;
                    const expiresIn = data.expires_in || 1800;

                    if (!accessToken) {
                        console.error('OAuth: токен не найден в ответе', { data });
                        reject(new Error('OAuth token not found in response'));
                        return;
                    }

                    // Сохраняем в кэш
                    tokenCache.accessToken = accessToken;
                    tokenCache.expiresAt = now + (expiresIn * 1000);

                    resolve(accessToken);
                } catch (parseError) {
                    console.error('OAuth: ошибка парсинга ответа', {
                        message: parseError.message,
                        responseData: responseData.substring(0, 200)
                    });
                    reject(new Error(`OAuth parse error: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('OAuth: ошибка запроса', {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
            reject(new Error(`OAuth request failed: ${error.message} (${error.code || error.name})`));
        });

        req.setTimeout(20000, () => {
            req.destroy();
            reject(new Error('OAuth request timeout (20s)'));
        });

        req.write(postData);
        req.end();
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OAuth: ошибка ответа', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`OAuth error: ${response.status} - ${errorText}`);
    }

    let data;
    try {
        data = await response.json();
        console.log('OAuth: токен получен', {
            hasAccessToken: !!data.access_token,
            expiresIn: data.expires_in
        });
    } catch (parseError) {
        console.error('OAuth: ошибка парсинга ответа', {
            message: parseError.message
        });
        throw new Error(`OAuth parse error: ${parseError.message}`);
    }

    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 1800; // по умолчанию 30 минут

    if (!accessToken) {
        console.error('OAuth: токен не найден в ответе', { data });
        throw new Error('OAuth token not found in response');
    }

    // Сохраняем в кэш
    tokenCache.accessToken = accessToken;
    tokenCache.expiresAt = now + (expiresIn * 1000);

    return accessToken;
}

/**
 * Основной обработчик для Yandex Cloud Functions
 */
exports.handler = async (event, context) => {
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
                       'UNKNOWN';

    // 1. Обработка CORS preflight (OPTIONS)
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
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

        // 4. Извлечение Authorization Key
        const authKey = process.env.GIGACHAT_AUTH_KEY || requestBody.authKey;

        console.log('Извлечение Authorization Key', {
            hasEnvKey: !!process.env.GIGACHAT_AUTH_KEY,
            hasRequestBodyKey: !!requestBody.authKey,
            keyLength: authKey ? authKey.length : 0,
            keyPreview: authKey ? authKey.substring(0, 10) + '...' : '(отсутствует)'
        });

        if (!authKey) {
            console.error('Authorization Key не указан', {
                envExists: !!process.env.GIGACHAT_AUTH_KEY,
                requestBodyHasKey: !!requestBody.authKey
            });
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Authorization Key не указан' } })
            };
        }

        // Валидация формата ключа (должен быть Base64, без префикса "Basic ")
        const cleanAuthKey = authKey.startsWith('Basic ') ? authKey.substring(6) : authKey;

        console.log('Authorization Key после обработки', {
            originalLength: authKey.length,
            cleanedLength: cleanAuthKey.length,
            isBase64Like: /^[A-Za-z0-9+/=]+$/.test(cleanAuthKey),
            cleanedPreview: cleanAuthKey.substring(0, 10) + '...'
        });

        // 5. Валидация обязательных полей
        const { messages, model } = requestBody;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Поле messages должно быть непустым массивом' } })
            };
        }

        if (!model) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Поле model обязательно' } })
            };
        }

        // 6. Получение OAuth токена
        console.log('Начало получения OAuth токена');
        let accessToken;
        try {
            // Используем очищенный ключ (без префикса "Basic " если есть)
            const cleanAuthKey = authKey.startsWith('Basic ') ? authKey.substring(6) : authKey;
            accessToken = await getAccessToken(cleanAuthKey);
            console.log('OAuth токен получен успешно');
        } catch (tokenError) {
            console.error('Ошибка получения OAuth токена:', {
                message: tokenError.message,
                stack: tokenError.stack?.split('\n').slice(0, 3).join('\n')
            });
            throw tokenError;
        }

        // 7. Формирование запроса к GigaChat Chat API
        const chatApiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
        const chatRequestBody = {
            model: model || 'GigaChat',
            messages: messages,
            temperature: requestBody.temperature || 0.6,
            max_tokens: requestBody.max_tokens || 2000
        };

        // Логирование запроса (без токенов)
        console.log('Запрос к GigaChat API:', {
            url: chatApiUrl,
            model,
            messagesCount: messages.length,
            hasAccessToken: !!accessToken
        });

        // 8. Отправка запроса к GigaChat API
        // Используем https модуль напрямую (как для OAuth) для обхода проблем с SSL
        const https = require('https');
        const { URL } = require('url');

        const chatData = await new Promise((resolve, reject) => {
            const urlObj = new URL(chatApiUrl);
            const postData = JSON.stringify(chatRequestBody);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                // Может потребоваться отключение проверки сертификата
                rejectUnauthorized: false
            };

            console.log('GigaChat API: параметры запроса', {
                hostname: options.hostname,
                port: options.port,
                path: options.path,
                method: options.method,
                bodyLength: postData.length
            });

            const req = https.request(options, (res) => {
                console.log('GigaChat API: ответ получен', {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers
                });

                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    console.log('GigaChat API: ответ полностью получен', {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        bodyLength: responseData.length,
                        bodyPreview: responseData.substring(0, 200)
                    });

                    if (res.statusCode !== 200) {
                        const errorDetails = {
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage,
                            body: responseData || '(пустое тело ответа)',
                            headers: res.headers
                        };
                        console.error('GigaChat API: ошибка ответа', errorDetails);

                        let errorMessage = `GigaChat API error: ${res.statusCode} ${res.statusMessage}`;
                        if (responseData) {
                            try {
                                const errorData = JSON.parse(responseData);
                                if (errorData.error?.message) {
                                    errorMessage += ` - ${errorData.error.message}`;
                                } else if (errorData.error) {
                                    errorMessage += ` - ${JSON.stringify(errorData.error)}`;
                                } else {
                                    errorMessage += ` - ${responseData}`;
                                }
                            } catch (e) {
                                errorMessage += ` - ${responseData}`;
                            }
                        }

                        reject(new Error(errorMessage));
                        return;
                    }

                    try {
                        const data = JSON.parse(responseData);
                        console.log('GigaChat API: данные распарсены', {
                            hasChoices: !!(data.choices && data.choices.length > 0),
                            hasError: !!data.error,
                            choicesCount: data.choices?.length || 0
                        });
                        resolve(data);
                    } catch (parseError) {
                        console.error('GigaChat API: ошибка парсинга ответа', {
                            message: parseError.message,
                            responseData: responseData.substring(0, 200)
                        });
                        reject(new Error(`GigaChat API parse error: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('GigaChat API: ошибка запроса', {
                    message: error.message,
                    name: error.name,
                    code: error.code,
                    stack: error.stack?.split('\n').slice(0, 3).join('\n')
                });
                reject(new Error(`GigaChat API request failed: ${error.message} (${error.code || error.name})`));
            });

            req.setTimeout(180000, () => {
                req.destroy();
                reject(new Error('GigaChat API request timeout (180s)'));
            });

            req.write(postData);
            req.end();
        });

        // Логирование ответа
        console.log('Ответ от GigaChat API готов к возврату', {
            hasChoices: !!(chatData.choices && chatData.choices.length > 0),
            hasError: !!chatData.error,
            choicesCount: chatData.choices?.length || 0
        });

        // 9. Возврат ответа с CORS заголовками
        // Определяем статус на основе наличия ошибки в ответе
        const statusCode = chatData.error ? 400 : 200;

        return {
            statusCode: statusCode,
            headers: corsHeaders,
            body: JSON.stringify(chatData)
        };

    } catch (error) {
        console.error('Ошибка обработки запроса:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'),
            cause: error.cause?.message || error.cause
        });
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: {
                    message: 'Внутренняя ошибка сервера: ' + error.message,
                    type: error.name || 'Error'
                }
            })
        };
    }
};
```

## Что дальше?

После вставки кода:
1. Настройте переменные окружения (GIGACHAT_AUTH_KEY)
2. Установите таймаут (30 секунд)
3. Настройте HTTP-триггер
4. Включите публичный доступ
5. Создайте версию функции
6. Обновите URL в `app-config.js`

Подробные шаги будут в следующих файлах.

## Важные отличия от YandexGPT прокси

- Использует OAuth токены (получение через `getAccessToken`)
- Кэширует OAuth токены до истечения срока действия
- Использует Authorization Key (Base64) вместо API Key
- Работает с GigaChat Chat API вместо Yandex Foundation Models API

## ССЫЛКИ

- Полное руководство: `giga-oauth-proxy-steps-guide.md`
- Получение Authorization Key: `giga-get-api-key.md`
