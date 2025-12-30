/**
 * ================================================================================================
 * PERPLEXITY AI PROVIDER - Провайдер для Perplexity AI API
 * ================================================================================================
 *
 * ЦЕЛЬ: Реализация провайдера для работы с Perplexity AI через существующий API модуль.
 *
 * ПРИНЦИПЫ:
 * - Использует существующий perplexity.js модуль
 * - Обертка над sendPerplexityRequest для единого интерфейса
 *
 * ОСОБЕННОСТИ:
 * - Endpoint: https://api.perplexity.ai/chat/completions
 * - Формат запроса: стандартный Chat Completions API
 * - Формат ответа: { choices: [{ message: { content: string } }] }
 *
 * ИСПОЛЬЗОВАНИЕ:
 * const provider = new PerplexityProvider();
 * const response = await provider.sendRequest(apiKey, model, messages);
 *
 * ССЫЛКИ:
 * - Базовый класс: core/api/ai-providers/base-provider.js
 * - Perplexity API модуль: core/api/perplexity.js
 */

(function() {
    'use strict';

    if (!window.BaseAIProvider) {
        console.error('perplexity-provider: BaseAIProvider не загружен');
        return;
    }

    /**
     * Провайдер для Perplexity AI API
     */
    class PerplexityProvider extends window.BaseAIProvider {
        constructor() {
            super();
            this.endpoint = 'https://api.perplexity.ai/chat/completions';
        }

        /**
         * Отправить запрос к Perplexity AI API
         * @param {string} apiKey - API ключ Perplexity
         * @param {string} model - Модель Perplexity (например: 'sonar-pro')
         * @param {Array<Object>} messages - Массив сообщений {role: 'user'|'assistant', content: string}
         * @param {Object} options - Дополнительные опции (не используются для Perplexity)
         * @returns {Promise<string>} Текст ответа
         * @throws {Error} При ошибке запроса
         */
        async sendRequest(apiKey, model, messages, options = {}) {
            if (!this.validateApiKey(apiKey)) {
                throw new Error('Необходимы apiKey для запроса к Perplexity');
            }

            if (!model) {
                throw new Error('Необходима model для запроса к Perplexity');
            }

            if (!messages || messages.length === 0) {
                throw new Error('Необходимы messages для запроса к Perplexity');
            }

            // Используем существующую функцию sendPerplexityRequest
            if (!window.perplexityAPI || !window.perplexityAPI.sendPerplexityRequest) {
                throw new Error('perplexityAPI не загружен');
            }

            return await window.perplexityAPI.sendPerplexityRequest(apiKey, model, messages);
        }

        /**
         * Получить модель по умолчанию
         * @returns {string}
         */
        getDefaultModel() {
            if (window.appConfig) {
                return window.appConfig.get('defaults.perplexity.model', 'sonar-pro');
            }
            return 'sonar-pro';
        }

        /**
         * Получить список доступных моделей
         * @returns {Array<Object>} [{ value: string, label: string }]
         */
        getAvailableModels() {
            if (window.appConfig) {
                return window.appConfig.get('defaults.perplexity.models', [
                    { value: 'sonar-pro', label: 'sonar-pro' },
                    { value: 'sonar', label: 'sonar' },
                    { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
                    { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
                ]);
            }
            return [
                { value: 'sonar-pro', label: 'sonar-pro' },
                { value: 'sonar', label: 'sonar' }
            ];
        }

        /**
         * Получить имя провайдера
         * @returns {string}
         */
        getName() {
            return 'perplexity';
        }

        /**
         * Получить отображаемое имя провайдера
         * @returns {string}
         */
        getDisplayName() {
            return 'Perplexity AI';
        }
    }

    // Экспорт класса
    window.PerplexityProvider = PerplexityProvider;

    console.log('perplexity-provider.js: инициализирован');
})();

