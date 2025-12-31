/**
 * ================================================================================================
 * AI PROVIDER MANAGER - Менеджер для переключения между AI провайдерами
 * ================================================================================================
 *
 * ЦЕЛЬ: Единая точка доступа для работы с разными AI провайдерами (Perplexity, YandexGPT).
 * Управляет переключением между провайдерами и предоставляет единый интерфейс.
 *
 * ПРИНЦИПЫ:
 * - Единый интерфейс для всех провайдеров
 * - Автоматическое получение настроек (API ключ, модель) для текущего провайдера
 * - Кэширование переводов/новостей отдельно для каждого провайдера
 *
 * ОСОБЕННОСТИ:
 * - Дефолтный провайдер: YandexGPT
 * - Хранение текущего провайдера в cacheManager ('ai-provider')
 * - Хранение API ключей отдельно для каждого провайдера
 *
 * ИСПОЛЬЗОВАНИЕ:
 * // Отправить запрос через текущий провайдер
 * const response = await window.aiProviderManager.sendRequest(messages);
 *
 * // Переключить провайдера
 * await window.aiProviderManager.setProvider('yandex');
 *
 * // Получить текущий провайдер
 * const provider = await window.aiProviderManager.getCurrentProvider();
 *
 * ССЫЛКИ:
 * - Провайдеры: core/api/ai-providers/
 * - Кэш-менеджер: core/cache/cache-manager.js
 */

(function() {
    'use strict';

    /**
     * Менеджер AI провайдеров
     */
    class AIProviderManager {
        constructor() {
            this.providers = {};
            this.defaultProvider = 'yandex'; // Яндекс по умолчанию
        }

        /**
         * Инициализация провайдеров
         * Вызывается после загрузки всех провайдеров
         */
        init() {
            if (window.PerplexityProvider) {
                this.providers['perplexity'] = new window.PerplexityProvider();
            }
            if (window.YandexProvider) {
                this.providers['yandex'] = new window.YandexProvider();
            }
        }

        /**
         * Получить текущий активный провайдер
         * @returns {Promise<BaseAIProvider>}
         */
        async getCurrentProvider() {
            const providerName = await this.getCurrentProviderName();
            return this.providers[providerName] || this.providers[this.defaultProvider];
        }

        /**
         * Получить имя текущего провайдера
         * @returns {Promise<string>}
         */
        async getCurrentProviderName() {
            if (!window.cacheManager) {
                return this.defaultProvider;
            }
            try {
                const providerName = await window.cacheManager.get('ai-provider');
                return providerName || this.defaultProvider;
            } catch (error) {
                console.warn('ai-provider-manager: ошибка получения провайдера, используется дефолтный', error);
                return this.defaultProvider;
            }
        }

        /**
         * Установить активный провайдер
         * @param {string} providerName - 'perplexity' | 'yandex'
         * @returns {Promise<void>}
         */
        async setProvider(providerName) {
            if (!this.providers[providerName]) {
                throw new Error(`Провайдер ${providerName} не найден`);
            }
            if (window.cacheManager) {
                await window.cacheManager.set('ai-provider', providerName);
            }
        }

        /**
         * Отправить запрос через текущий провайдер
         * @param {Array<Object>} messages - Массив сообщений {role: 'user'|'assistant', content: string}
         * @param {Object} options - Дополнительные опции (temperature, maxTokens и т.д.)
         * @returns {Promise<string>} Текст ответа
         * @throws {Error} При ошибке запроса или отсутствии настроек
         */
        async sendRequest(messages, options = {}) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-provider-manager.js:106',message:'sendRequest entry',data:{messagesCount:messages.length,hasOptions:!!options},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            const provider = await this.getCurrentProvider();
            const providerName = await this.getCurrentProviderName();

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-provider-manager.js:108',message:'provider obtained',data:{providerName,hasProvider:!!provider,providerType:provider?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion

            // Получаем API ключ и модель для текущего провайдера
            const apiKey = await this.getApiKey(providerName);
            const model = await this.getModel(providerName);

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-provider-manager.js:113',message:'apiKey and model obtained',data:{providerName,hasApiKey:!!apiKey,apiKeyLength:apiKey?apiKey.length:0,model},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion

            if (!apiKey) {
                throw new Error(`API ключ для ${providerName} не настроен`);
            }

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-provider-manager.js:118',message:'calling provider.sendRequest',data:{providerName,model,messagesCount:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            const result = await provider.sendRequest(apiKey, model, messages, options);

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ai-provider-manager.js:120',message:'provider.sendRequest completed',data:{providerName,resultLength:result?result.length:0,hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion

            return result;
        }

        /**
         * Получить API ключ для провайдера
         * @param {string} providerName - 'perplexity' | 'yandex'
         * @returns {Promise<string|null>}
         */
        async getApiKey(providerName) {
            if (!window.cacheManager) return null;
            const keyName = providerName === 'yandex' ? 'yandex-api-key' : 'perplexity-api-key';
            try {
                const apiKey = await window.cacheManager.get(keyName);
                return apiKey;
            } catch (error) {
                console.warn(`ai-provider-manager: ошибка получения API ключа для ${providerName}`, error);
                return null;
            }
        }

        /**
         * Получить модель для провайдера
         * @param {string} providerName - 'perplexity' | 'yandex'
         * @returns {Promise<string>}
         */
        async getModel(providerName) {
            const provider = this.providers[providerName];
            if (!provider) {
                return null;
            }

            if (!window.cacheManager) {
                return provider.getDefaultModel();
            }

            const modelKey = providerName === 'yandex' ? 'yandex-model' : 'perplexity-model';
            try {
                const savedModel = await window.cacheManager.get(modelKey);
                return savedModel || provider.getDefaultModel();
            } catch (error) {
                console.warn(`ai-provider-manager: ошибка получения модели для ${providerName}`, error);
                return provider.getDefaultModel();
            }
        }

        /**
         * Получить список доступных моделей для провайдера
         * @param {string} providerName - 'perplexity' | 'yandex'
         * @returns {Array<Object>} [{ value: string, label: string }]
         */
        getAvailableModels(providerName) {
            const provider = this.providers[providerName];
            return provider ? provider.getAvailableModels() : [];
        }

        /**
         * Получить список всех доступных провайдеров
         * @returns {Array<Object>} [{ value: string, label: string, provider: BaseAIProvider }]
         */
        getAvailableProviders() {
            return Object.entries(this.providers).map(([name, provider]) => ({
                value: name,
                label: provider.getDisplayName(),
                provider: provider
            }));
        }

        /**
         * Получить провайдер по имени
         * @param {string} providerName
         * @returns {BaseAIProvider|null}
         */
        getProvider(providerName) {
            return this.providers[providerName] || null;
        }
    }

    // Создаем и экспортируем экземпляр менеджера
    window.aiProviderManager = new AIProviderManager();

    // Инициализируем после загрузки всех провайдеров
    // Вызываем init() сразу, так как провайдеры уже должны быть загружены
    // (они загружаются раньше через модульную систему)
    if (window.PerplexityProvider && window.YandexProvider) {
        window.aiProviderManager.init();
    } else {
        // Если провайдеры еще не загружены, ждем их
        const checkProviders = setInterval(() => {
            if (window.PerplexityProvider && window.YandexProvider) {
                window.aiProviderManager.init();
                clearInterval(checkProviders);
            }
        }, 50);
        // Таймаут на случай, если провайдеры не загрузятся
        setTimeout(() => {
            clearInterval(checkProviders);
        }, 5000);
    }

    console.log('ai-provider-manager.js: инициализирован');
})();

