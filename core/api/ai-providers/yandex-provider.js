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
            // Инициализация прокси (ленивая - при первом использовании)
            // Для обратной совместимости используем синхронную загрузку из конфигурации
            this.proxyUrl = null;
            this._proxyInitialized = false;
        }

        /**
         * Инициализация прокси (асинхронная загрузка из кэша)
         * Вызывается при первом использовании
         */
        async initProxy() {
            if (this._proxyInitialized) return;

            try {
                // Пытаемся получить тип прокси из настроек пользователя
                let proxyType = null;
                if (window.cacheManager) {
                    proxyType = await window.cacheManager.get('yandex-proxy-type');
                }

                // Если не найден в кэше, используем дефолтный из конфигурации
                if (!proxyType && window.appConfig) {
                    proxyType = window.appConfig.get('defaults.yandex.proxyType', 'yandex');
                }

                // Получаем URL прокси из конфигурации через единый источник правды
                if (window.appConfig && typeof window.appConfig.getProxyUrl === 'function') {
                    this.proxyUrl = window.appConfig.getProxyUrl('yandex', proxyType);
                } else {
                    // Fallback: для обратной совместимости
                    this.proxyUrl = window.appConfig?.get('defaults.yandex.proxyUrl', null);
                }

                this._proxyInitialized = true;
            } catch (error) {
                console.warn('yandex-provider: ошибка инициализации прокси, используется fallback:', error);
                // Fallback: для обратной совместимости
                this.proxyUrl = window.appConfig?.get('defaults.yandex.proxyUrl', null);
                this._proxyInitialized = true;
            }
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

            try {
                // Инициализируем прокси при первом использовании
                await this.initProxy();

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
                    const response = await fetch(this.proxyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(proxyRequestBody)
                    });

                    if (!response.ok) {
                        let errorText = '';
                        try {
                            errorText = await response.text();
                        } catch (e) {
                            errorText = '';
                        }
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

                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        throw new Error(`Ошибка парсинга ответа от прокси: ${parseError.message}`);
                    }

                    // Проверяем наличие ошибки в ответе от Yandex API
                    if (data.error) {
                        const errorMessage = data.error.message || 'Неизвестная ошибка от Yandex API';
                        const httpCode = data.error.httpCode || '';
                        throw new Error(`Yandex API ошибка (HTTP ${httpCode}): ${errorMessage}`);
                    }

                    // Парсим ответ YandexGPT
                    if (data.result && data.result.alternatives && data.result.alternatives.length > 0) {
                        const answer = data.result.alternatives[0].message.text;
                        if (!answer || answer.trim().length === 0) {
                            throw new Error('Пустой ответ от API');
                        }
                        return answer.trim();
                    } else {
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

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({
                            error: { message: 'Неизвестная ошибка' }
                        }));
                        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();

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

