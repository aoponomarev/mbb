/**
 * ================================================================================================
 * RATE LIMITER - Централизованное управление запросами к API
 * ================================================================================================
 *
 * ЦЕЛЬ: Предотвратить блокировку API из-за превышения лимитов запросов.
 * Адаптивные таймауты, очередь запросов, приоритизация.
 *
 * ПРИНЦИПЫ:
 * - Адаптивные таймауты (увеличение при 429, уменьшение при успехе)
 * - Очередь запросов с приоритизацией
 * - Обработка rate limiting для всех внешних API
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    // Зависимости
    // - core/config/api-config.js (window.apiConfig)

    /**
     * Адаптивный таймаут для запросов
     */
    const adaptiveTimeout = {
        base: 300,        // 300ms базовое значение
        max: 10000,       // 10 секунд максимум
        current: 300,    // Текущее значение
        lastErrorTime: null
    };

    /**
     * Очередь запросов
     */
    const requestQueue = {
        queue: [],
        processing: false
    };

    /**
     * Увеличить таймаут (при получении 429 ошибки)
     */
    function increaseTimeout() {
        adaptiveTimeout.current = Math.min(adaptiveTimeout.current * 2, adaptiveTimeout.max);
        adaptiveTimeout.lastErrorTime = Date.now();
        console.log(`rate-limiter: таймаут увеличен до ${adaptiveTimeout.current}ms`);
    }

    /**
     * Уменьшить таймаут (при успешных запросах)
     */
    function decreaseTimeout() {
        // Уменьшаем только если прошло более 5 секунд без ошибок
        if (adaptiveTimeout.lastErrorTime && Date.now() - adaptiveTimeout.lastErrorTime > 5000) {
            adaptiveTimeout.current = Math.max(adaptiveTimeout.current * 0.8, adaptiveTimeout.base);
            console.log(`rate-limiter: таймаут уменьшен до ${adaptiveTimeout.current}ms`);
        }
    }

    /**
     * Сбросить таймаут к базовому значению
     */
    function resetTimeout() {
        adaptiveTimeout.current = adaptiveTimeout.base;
        adaptiveTimeout.lastErrorTime = null;
        console.log('rate-limiter: таймаут сброшен к базовому значению');
    }

    /**
     * Получить текущий таймаут
     * @returns {number} - таймаут в миллисекундах
     */
    function getTimeout() {
        return adaptiveTimeout.current;
    }

    /**
     * Выполнить задержку перед следующим запросом
     * @returns {Promise}
     */
    async function waitBeforeRequest() {
        await new Promise(resolve => setTimeout(resolve, adaptiveTimeout.current));
    }

    /**
     * Добавить запрос в очередь
     * @param {Function} requestFn - функция запроса
     * @param {number} priority - приоритет (меньше = выше приоритет)
     * @returns {Promise<any>} - результат запроса
     */
    async function queueRequest(requestFn, priority = 5) {
        return new Promise((resolve, reject) => {
            requestQueue.queue.push({
                fn: requestFn,
                priority,
                resolve,
                reject
            });

            // Сортировка по приоритету
            requestQueue.queue.sort((a, b) => a.priority - b.priority);

            // Запуск обработки очереди, если не запущена
            if (!requestQueue.processing) {
                processQueue();
            }
        });
    }

    /**
     * Обработать очередь запросов
     */
    async function processQueue() {
        if (requestQueue.processing || requestQueue.queue.length === 0) {
            return;
        }

        requestQueue.processing = true;

        while (requestQueue.queue.length > 0) {
            const request = requestQueue.queue.shift();

            try {
                // Задержка перед запросом
                await waitBeforeRequest();

                // Выполнение запроса
                const result = await request.fn();
                request.resolve(result);

                // Уменьшение таймаута при успехе
                decreaseTimeout();
            } catch (error) {
                // Увеличение таймаута при 429 ошибке
                if (error.status === 429 || error.type === 'api_rate_limit') {
                    increaseTimeout();
                }

                request.reject(error);
            }
        }

        requestQueue.processing = false;
    }

    // Экспорт в глобальную область
    window.rateLimiter = {
        increaseTimeout,
        decreaseTimeout,
        resetTimeout,
        getTimeout,
        waitBeforeRequest,
        queueRequest
    };

    console.log('rate-limiter.js: инициализирован');
})();

