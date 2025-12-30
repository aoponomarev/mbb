/**
 * ================================================================================================
 * PERPLEXITY API - Утилита для работы с Perplexity AI API
 * ================================================================================================
 *
 * ЦЕЛЬ: Независимый модуль для отправки запросов к Perplexity Chat Completions API.
 * Экспортирует функции через window.perplexityAPI.
 *
 * ПРИНЦИПЫ:
 * - Чистая логика без UI
 * - Обработка ошибок и форматирование ответов
 * - Независимость от Vue компонентов
 *
 * ОСОБЕННОСТИ:
 * - Отправка запросов к Perplexity Chat Completions API
 * - Обработка ошибок (rate limiting, пустые ответы)
 * - Форматирование ответов
 *
 * ССЫЛКИ:
 * - Perplexity API: https://docs.perplexity.ai/
 */

(function() {
    'use strict';

    /**
     * Отправка запроса к Perplexity Chat Completions API
     *
     * @param {string} apiKey - API ключ Perplexity
     * @param {string} model - Модель Perplexity (например: 'sonar-pro', 'sonar')
     * @param {Array<Object>} messages - Массив сообщений в формате {role: 'user'|'assistant', content: string}
     * @returns {Promise<string>} Текст ответа от Perplexity AI
     * @throws {Error} При ошибке HTTP запроса или пустом ответе
     */
    async function sendPerplexityRequest(apiKey, model, messages) {
        if (!apiKey || !model || !messages || messages.length === 0) {
            throw new Error('Необходимы apiKey, model и messages для запроса к Perplexity');
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Неизвестная ошибка' } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message.content;
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
            throw new Error(`Ошибка при запросе к Perplexity: ${error.message || 'Неизвестная ошибка'}`);
        }
    }

    // Экспорт функций через window для использования в других модулях
    window.perplexityAPI = {
        sendPerplexityRequest
    };

    console.log('perplexity.js: инициализирован');
})();

