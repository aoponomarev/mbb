/**
 * ================================================================================================
 * YANDEX AI PROVIDER - Провайдер для YandexGPT API
 * ================================================================================================
 *
 * ЦЕЛЬ: Реализация провайдера для работы с YandexGPT через Yandex Cloud API.
 *
 * ПРИНЦИПЫ:
 * - Использует Yandex Cloud Foundation Models API
 * - Поддерживает yandexgpt и yandexgpt-lite
 * - Аутентификация через Api-Key
 *
 * ОСОБЕННОСТИ:
 * - Endpoint: https://llm.api.cloud.yandex.net/foundationModels/v1/completion
 * - Формат запроса: { modelUri, messages, temperature, maxTokens }
 * - Формат ответа: { result: { alternatives: [{ message: { text } }] } }
 *
 * ИСПОЛЬЗОВАНИЕ:
 * const provider = new YandexProvider();
 * const response = await provider.sendRequest(apiKey, model, messages);
 *
 * ССЫЛКИ:
 * - Базовый класс: core/api/ai-providers/base-provider.js
 * - Yandex Cloud API: https://yandex.cloud/ru/docs/foundation-models/
 */

(function() {
    'use strict';

    if (!window.BaseAIProvider) {
        console.error('yandex-provider: BaseAIProvider не загружен');
        return;
    }

    /**
     * Провайдер для YandexGPT API
     */
    class YandexProvider extends window.BaseAIProvider {
        constructor() {
            super();
            this.endpoint = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
            this.defaultFolderId = 'b1gv03a122le5a934cqj';
            // Получаем URL прокси из конфигурации (если указан)
            this.proxyUrl = window.appConfig?.get('defaults.yandex.proxyUrl', null);
        }

        /**
         * Отправить запрос к YandexGPT API
         * @param {string} apiKey - API ключ Yandex Cloud
         * @param {string} model - Model URI (например: gpt://folderId/yandexgpt-lite/latest)
         * @param {Array<Object>} messages - Массив сообщений {role: 'user'|'assistant', content: string}
         * @param {Object} options - Дополнительные опции {temperature: number, maxTokens: number}
         * @returns {Promise<string>} Текст ответа
         * @throws {Error} При ошибке запроса
         */
        async sendRequest(apiKey, model, messages, options = {}) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:54',message:'sendRequest entry',data:{hasApiKey:!!apiKey,apiKeyLength:apiKey?apiKey.length:0,model,messagesCount:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion

            if (!this.validateApiKey(apiKey)) {
                throw new Error('Необходимы apiKey для запроса к YandexGPT');
            }

            if (!messages || messages.length === 0) {
                throw new Error('Необходимы messages для запроса к YandexGPT');
            }

            // Преобразуем messages в формат YandexGPT
            // YandexGPT использует {role: 'user'|'assistant', text: string}
            const yandexMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                text: msg.content || msg.text || ''
            }));

            // Формируем modelUri (если не передан, используем дефолтный)
            const modelUri = model || this.getDefaultModel();

            // Формируем тело запроса согласно документации Yandex API
            // Используем completionOptions для temperature и maxTokens
            const requestBody = {
                modelUri: modelUri,
                messages: yandexMessages
            };

            // Добавляем completionOptions, если указаны temperature или maxTokens
            if (options.temperature !== undefined || options.maxTokens) {
                requestBody.completionOptions = {};
                if (options.temperature !== undefined) {
                    requestBody.completionOptions.temperature = options.temperature;
                } else {
                    requestBody.completionOptions.temperature = 0.6; // Дефолтное значение
                }
                if (options.maxTokens) {
                    requestBody.completionOptions.maxTokens = typeof options.maxTokens === 'string'
                        ? parseInt(options.maxTokens, 10)
                        : options.maxTokens;
                } else {
                    requestBody.completionOptions.maxTokens = 2000; // Дефолтное значение
                }
            }

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:79',message:'request body prepared',data:{endpoint:this.endpoint,modelUri,messageCount:yandexMessages.length,requestBodyKeys:Object.keys(requestBody),hasProxy:!!this.proxyUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            try {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:81',message:'fetch call starting',data:{endpoint:this.proxyUrl||this.endpoint,origin:window.location.origin,protocol:window.location.protocol,usingProxy:!!this.proxyUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion

                // Если указан прокси, используем его (для обхода CORS)
                if (this.proxyUrl) {
                    // Через прокси: передаем API ключ и тело запроса в теле запроса к прокси
                    // Формируем тело запроса в том же формате, что и для прямого запроса
                    const proxyRequestBody = {
                        apiKey: apiKey,
                        modelUri: modelUri,
                        messages: yandexMessages
                    };

                    // Добавляем completionOptions, если указаны temperature или maxTokens
                    if (options.temperature !== undefined || options.maxTokens) {
                        proxyRequestBody.completionOptions = {};
                        if (options.temperature !== undefined) {
                            proxyRequestBody.completionOptions.temperature = options.temperature;
                        } else {
                            proxyRequestBody.completionOptions.temperature = 0.6; // Дефолтное значение
                        }
                        if (options.maxTokens) {
                            proxyRequestBody.completionOptions.maxTokens = typeof options.maxTokens === 'string'
                                ? parseInt(options.maxTokens, 10)
                                : options.maxTokens;
                        } else {
                            proxyRequestBody.completionOptions.maxTokens = 2000; // Дефолтное значение
                        }
                    } else {
                        // Если опции не указаны, используем дефолтные значения
                        proxyRequestBody.completionOptions = {
                            temperature: 0.6,
                            maxTokens: 2000
                        };
                    }
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:104',message:'proxy request body prepared',data:{proxyUrl:this.proxyUrl,modelUri,messageCount:yandexMessages.length,apiKeyPrefix:apiKey?apiKey.substring(0,10)+'...':null,hasCompletionOptions:!!proxyRequestBody.completionOptions,completionOptions:proxyRequestBody.completionOptions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion

                    const response = await fetch(this.proxyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(proxyRequestBody)
                    });

                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:106',message:'proxy response received',data:{ok:response.ok,status:response.status,statusText:response.statusText,proxyUrl:this.proxyUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion

                    if (!response.ok) {
                        let errorText = '';
                        try {
                            errorText = await response.text();
                        } catch (e) {
                            errorText = '';
                        }
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:114',message:'proxy response error',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        let errorData = { error: { message: 'Неизвестная ошибка' } };
                        try {
                            if (errorText) {
                                errorData = JSON.parse(errorText);
                            }
                        } catch (parseError) {
                            // Если не удалось распарсить, используем дефолтное сообщение
                        }
                        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                    }

                    const responseText = await response.text();
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:122',message:'proxy response text',data:{responseTextLength:responseText.length,responseTextPreview:responseText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion

                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:128',message:'proxy response parse error',data:{parseError:parseError.message,responseTextPreview:responseText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        throw new Error(`Ошибка парсинга ответа от прокси: ${parseError.message}`);
                    }

                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:133',message:'response parsed via proxy',data:{hasResult:!!data.result,hasAlternatives:!!(data.result?.alternatives),alternativesCount:data.result?.alternatives?.length||0,dataKeys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion

                    // Проверяем наличие ошибки в ответе от Yandex API
                    if (data.error) {
                        const errorMessage = data.error.message || 'Неизвестная ошибка от Yandex API';
                        const httpCode = data.error.httpCode || '';
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:136',message:'yandex api error',data:{errorMessage,httpCode,grpcCode:data.error.grpcCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        throw new Error(`Yandex API ошибка (HTTP ${httpCode}): ${errorMessage}`);
                    }

                    // Парсим ответ YandexGPT
                    if (data.result && data.result.alternatives && data.result.alternatives.length > 0) {
                        const answer = data.result.alternatives[0].message.text;
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:145',message:'answer extracted',data:{hasAnswer:!!answer,answerLength:answer?answer.length:0,answerPreview:answer?answer.substring(0,100):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        if (!answer || answer.trim().length === 0) {
                            throw new Error('Пустой ответ от API');
                        }
                        return answer.trim();
                    } else {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:153',message:'empty response structure',data:{hasData:!!data,dataKeys:Object.keys(data||{}),hasResult:!!data?.result,hasAlternatives:!!(data?.result?.alternatives),alternativesCount:data?.result?.alternatives?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        throw new Error('Пустой ответ от API');
                    }
                } else {
                    // Прямой запрос к Yandex API (работает только с серверной частью)
                    const response = await fetch(this.endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Api-Key ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:140',message:'fetch response received (direct)',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({
                            error: { message: 'Неизвестная ошибка' }
                        }));
                        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();

                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:150',message:'response parsed (direct)',data:{hasResult:!!data.result,hasAlternatives:!!(data.result?.alternatives),alternativesCount:data.result?.alternatives?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion

                    // Парсим ответ YandexGPT
                    // Формат: { result: { alternatives: [{ message: { text: string } }] } }
                    if (data.result && data.result.alternatives && data.result.alternatives.length > 0) {
                        const answer = data.result.alternatives[0].message.text;
                        if (!answer || answer.trim().length === 0) {
                            throw new Error('Пустой ответ от API');
                        }
                        return answer.trim();
                    } else {
                        throw new Error('Пустой ответ от API');
                    }
                }
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'yandex-provider.js:110',message:'error in sendRequest',data:{errorMessage:error.message,errorName:error.name,isNetworkError:error.message?.includes('fetch')||error.message?.includes('Failed')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion

                // Проверяем, является ли это CORS ошибкой
                const isCorsError = error.message === 'Failed to fetch' ||
                                   error.name === 'TypeError' && error.message?.includes('fetch');

                if (isCorsError) {
                    throw new Error('CORS ошибка: Yandex API блокирует запросы из браузера. Для работы API необходим прокси-сервер или серверная часть. Текущий origin: ' + (window.location.origin || 'unknown'));
                }

                // Если это уже наша ошибка - пробрасываем её дальше
                if (error instanceof Error && error.message) {
                    throw error;
                }
                // Иначе оборачиваем в общую ошибку
                throw new Error(`Ошибка при запросе к YandexGPT: ${error.message || 'Неизвестная ошибка'}`);
            }
        }

        /**
         * Получить модель по умолчанию
         * @returns {string} Model URI
         */
        getDefaultModel() {
            return `gpt://${this.defaultFolderId}/yandexgpt-lite/latest`;
        }

        /**
         * Получить список доступных моделей
         * @returns {Array<Object>} [{ value: string, label: string }]
         */
        getAvailableModels() {
            return [
                {
                    value: `gpt://${this.defaultFolderId}/yandexgpt-lite/latest`,
                    label: 'YandexGPT Lite'
                },
                {
                    value: `gpt://${this.defaultFolderId}/yandexgpt/latest`,
                    label: 'YandexGPT'
                }
            ];
        }

        /**
         * Получить имя провайдера
         * @returns {string}
         */
        getName() {
            return 'yandex';
        }

        /**
         * Получить отображаемое имя провайдера
         * @returns {string}
         */
        getDisplayName() {
            return 'YandexGPT';
        }
    }

    // Экспорт класса
    window.YandexProvider = YandexProvider;

    console.log('yandex-provider.js: инициализирован');
})();

