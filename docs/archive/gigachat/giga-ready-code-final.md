# Финальный готовый код для Yandex Cloud Functions GigaChat прокси

> ⚠️ **ВНИМАНИЕ**: Проверьте, что этот код используется в функции!
> Если в логах видите "timeout (45s)" - значит код не обновлен, нужно скопировать этот код.

## Полный код для вставки в функцию

Скопируйте весь код ниже (от ```javascript до ```) и вставьте в редактор функции:

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
            path: options.path
        });

        const req = https.request(options, (res) => {
            console.log('OAuth: ответ получен', {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage
            });

            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log('OAuth: ответ полностью получен', {
                    statusCode: res.statusCode,
                    bodyLength: responseData.length
                });

                if (res.statusCode !== 200) {
                    const errorDetails = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        body: responseData || '(пустое тело ответа)'
                    };
                    console.error('OAuth: ошибка ответа', errorDetails);

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
                code: error.code
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
            const bodyText = event.body || '';
            if (!bodyText || bodyText.trim() === '') {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: { message: 'Тело запроса пустое. Отправьте JSON с полями model и messages.' }
                    })
                };
            }
            requestBody = JSON.parse(bodyText);
        } catch (parseError) {
            console.error('Ошибка парсинга JSON:', parseError.message);
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: {
                        message: 'Некорректный формат JSON: ' + parseError.message
                    }
                })
            };
        }

        // 4. Извлечение Authorization Key
        const authKey = process.env.GIGACHAT_AUTH_KEY || requestBody.authKey;

        console.log('Извлечение Authorization Key', {
            hasEnvKey: !!process.env.GIGACHAT_AUTH_KEY,
            hasRequestBodyKey: !!requestBody.authKey,
            keyLength: authKey ? authKey.length : 0
        });

        if (!authKey) {
            console.error('Authorization Key не указан');
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: { message: 'Authorization Key не указан' } })
            };
        }

        // Валидация формата ключа (должен быть Base64, без префикса "Basic ")
        const cleanAuthKey = authKey.startsWith('Basic ') ? authKey.substring(6) : authKey;

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
        const oauthStartTime = Date.now();
        console.log('=== НАЧАЛО OAuth ===', {
            timestamp: new Date().toISOString(),
            hasAuthKey: !!cleanAuthKey,
            authKeyLength: cleanAuthKey ? cleanAuthKey.length : 0
        });

        let accessToken;
        try {
            accessToken = await getAccessToken(cleanAuthKey);
            const oauthDuration = Date.now() - oauthStartTime;
            console.log('=== OAuth УСПЕХ ===', {
                duration: oauthDuration + 'ms',
                hasToken: !!accessToken,
                tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'missing'
            });
        } catch (tokenError) {
            const oauthDuration = Date.now() - oauthStartTime;
            console.error('=== OAuth ОШИБКА ===', {
                duration: oauthDuration + 'ms',
                message: tokenError.message,
                error: tokenError
            });
            throw tokenError;
        }

        // 7. Формирование запроса к GigaChat Chat API
        const chatApiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

        // Уменьшаем max_tokens по умолчанию до 500 для ускорения обработки
        // и предотвращения таймаутов на стороне GigaChat API (~60 сек)
        const defaultMaxTokens = 500;
        const requestedMaxTokens = requestBody.max_tokens || defaultMaxTokens;
        const maxTokens = Math.min(requestedMaxTokens, 1000); // Ограничиваем максимум 1000

        const chatRequestBody = {
            model: model || 'GigaChat',
            messages: messages,
            temperature: requestBody.temperature || 0.6,
            max_tokens: maxTokens
        };

        console.log('=== ПАРАМЕТРЫ ЗАПРОСА GigaChat ===', {
            max_tokens: maxTokens,
            requestedMaxTokens: requestedMaxTokens,
            model: model,
            messagesCount: messages.length,
            hasAccessToken: !!accessToken,
            timestamp: new Date().toISOString()
        });

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

        // Создаем agent с keep-alive для поддержания соединения
        const httpsAgent = new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: 1,
            maxFreeSockets: 1,
            timeout: 300000, // 5 минут
            rejectUnauthorized: false
        });

        const chatData = await new Promise((resolve, reject) => {
            const urlObj = new URL(chatApiUrl);
            const postData = JSON.stringify(chatRequestBody);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname,
                method: 'POST',
                agent: httpsAgent, // Используем agent с keep-alive
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive',
                    'Keep-Alive': 'timeout=300, max=1',
                    'Content-Length': Buffer.byteLength(postData)
                },
                // Может потребоваться отключение проверки сертификата
                rejectUnauthorized: false,
                timeout: 300000 // 5 минут таймаут на уровне соединения
            };

            const requestStartTime = Date.now();

            console.log('=== НАЧАЛО ЗАПРОСА К GigaChat API ===', {
                timestamp: new Date().toISOString(),
                hostname: options.hostname,
                port: options.port,
                path: options.path,
                method: options.method,
                hasAccessToken: !!accessToken,
                accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'missing',
                bodyLength: postData.length,
                bodyPreview: postData.substring(0, 200)
            });

            const req = https.request(options, (res) => {
                const responseReceivedTime = Date.now();
                const timeToResponse = responseReceivedTime - requestStartTime;
                console.log('GigaChat API: ответ получен', {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers
                });

                let responseData = '';
                let firstChunkTime = Date.now();
                let chunkCount = 0;

                res.on('data', (chunk) => {
                    if (chunkCount === 0) {
                        firstChunkTime = Date.now();
                        const timeToFirstChunk = firstChunkTime - requestStartTime;
                        console.log('GigaChat API: получен первый chunk данных', {
                            chunkSize: chunk.length,
                            timeToFirstChunk: timeToFirstChunk + 'ms',
                            timeFromResponseHeaders: (firstChunkTime - responseReceivedTime) + 'ms',
                            chunkPreview: chunk.toString().substring(0, 100)
                        });
                    }
                    chunkCount++;
                    responseData += chunk;
                    console.log(`GigaChat API: chunk #${chunkCount} получен, размер: ${chunk.length}, всего: ${responseData.length}`);
                });

                res.on('end', () => {
                    console.log('GigaChat API: ответ полностью получен', {
                        statusCode: res.statusCode,
                        bodyLength: responseData.length,
                        chunkCount: chunkCount,
                        timeToFirstChunk: firstChunkTime ? (firstChunkTime - Date.now()) + 'ms' : 'не получен'
                    });

                    if (res.statusCode !== 200) {
                        const errorDetails = {
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage,
                            body: responseData || '(пустое тело ответа)'
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
                            hasError: !!data.error
                        });
                        resolve(data);
                    } catch (parseError) {
                        console.error('GigaChat API: ошибка парсинга ответа', {
                            message: parseError.message
                        });
                        reject(new Error(`GigaChat API parse error: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                const errorTime = Date.now();
                const timeSinceStart = errorTime - requestStartTime;
                console.error('=== ОШИБКА ЗАПРОСА GigaChat API ===', {
                    timestamp: new Date().toISOString(),
                    timeSinceStart: timeSinceStart + 'ms',
                    message: error.message,
                    code: error.code,
                    errno: error.errno,
                    syscall: error.syscall,
                    stack: error.stack
                });

                // Специальная обработка ECONNRESET
                if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                    reject(new Error(`GigaChat API connection reset после ${timeSinceStart}ms. Возможно, сервер закрыл соединение из-за длительного ожидания.`));
                } else {
                    reject(new Error(`GigaChat API request failed: ${error.message} (${error.code || error.name})`));
                }
            });

            // Обработка закрытия соединения до завершения запроса
            req.on('close', () => {
                if (!req.aborted && !req.destroyed) {
                    console.warn('GigaChat API: соединение закрыто до получения ответа');
                }
            });

            // ВАЖНО: Таймаут увеличен до 300 секунд (5 минут) для медленного API
            req.setTimeout(300000, () => {
                const timeoutTime = Date.now();
                const timeSinceStart = timeoutTime - requestStartTime;
                console.error('=== ТАЙМАУТ ЗАПРОСА GigaChat API ===', {
                    timestamp: new Date().toISOString(),
                    timeSinceStart: timeSinceStart + 'ms',
                    timeoutValue: '300s',
                    note: 'Запрос не получил ответ в течение 5 минут'
                });
                req.destroy();
                reject(new Error(`GigaChat API request timeout после ${timeSinceStart}ms. API не ответил в течение 5 минут.`));
            });

            req.write(postData);
            req.end();
        });

        // 9. Возврат ответа с CORS заголовками
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
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
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

## Важные настройки

1. **Таймаут функции**: Установите `300` секунд (5 минут) в настройках функции
2. **Переменная окружения**: `GIGACHAT_AUTH_KEY` (Base64, без префикса "Basic ")
3. **Память**: Минимум 128 МБ

## Проверка

После вставки кода проверьте в логах:
- НЕ должно быть "timeout (45s)" - это значит старый код
- Должно быть "timeout (180s)" - значит код обновлен
