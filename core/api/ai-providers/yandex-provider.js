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

            const requestBody = {
                modelUri: modelUri,
                messages: yandexMessages,
                temperature: options.temperature !== undefined ? options.temperature : 0.6,
                maxTokens: options.maxTokens ? String(options.maxTokens) : '2000'
            };

            try {
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
            } catch (error) {
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

