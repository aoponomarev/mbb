/**
 * ================================================================================================
 * ERROR HANDLER - Единая система обработки ошибок
 * ================================================================================================
 *
 * ЦЕЛЬ: Централизованная обработка всех ошибок приложения.
 * Классификация, логирование, пользовательские сообщения, повторные попытки.
 *
 * ПРИНЦИПЫ:
 * - Все ошибки проходят через единый обработчик
 * - Автоматическая классификация ошибок
 * - Логирование через logger
 * - Пользовательские сообщения
 * - Автоматические повторные попытки для сетевых ошибок
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    // Зависимости (загружаются до этого скрипта)
    // - core/errors/error-types.js (window.errorTypes)
    // - core/logging/logger.js (window.logger)

    if (typeof window.errorTypes === 'undefined') {
        console.error('error-handler.js: errorTypes не загружен');
        return;
    }

    /**
     * Классифицировать ошибку по типу
     * @param {Error|Object} error - ошибка
     * @returns {string} - тип ошибки
     */
    function classifyError(error) {
        // HTTP ошибки
        if (error.status === 429) {
            return window.errorTypes.ERROR_TYPES.API_RATE_LIMIT;
        }
        if (error.status === 408 || error.name === 'TimeoutError') {
            return window.errorTypes.ERROR_TYPES.API_TIMEOUT;
        }
        if (error.status >= 400 && error.status < 500) {
            return window.errorTypes.ERROR_TYPES.API_ERROR;
        }
        if (error.status >= 500 || error.name === 'NetworkError') {
            return window.errorTypes.ERROR_TYPES.API_NETWORK;
        }

        // Валидация
        if (error.type === 'validation' || error.name === 'ValidationError') {
            return window.errorTypes.ERROR_TYPES.VALIDATION_ERROR;
        }
        if (error.type === 'schema') {
            return window.errorTypes.ERROR_TYPES.SCHEMA_ERROR;
        }

        // Вычисления
        if (error.type === 'calculation' || error.name === 'CalculationError') {
            return window.errorTypes.ERROR_TYPES.CALCULATION_ERROR;
        }
        if (error.type === 'math' || (typeof error.value === 'number' && (isNaN(error.value) || !isFinite(error.value)))) {
            return window.errorTypes.ERROR_TYPES.MATH_ERROR;
        }

        // Хранилище
        if (error.name === 'QuotaExceededError') {
            return window.errorTypes.ERROR_TYPES.STORAGE_QUOTA;
        }
        if (error.name === 'StorageError') {
            return window.errorTypes.ERROR_TYPES.STORAGE_ERROR;
        }

        return window.errorTypes.ERROR_TYPES.UNKNOWN_ERROR;
    }

    /**
     * Обработать ошибку
     * @param {Error|Object} error - ошибка
     * @param {Object} context - контекст (компонент, действие)
     * @returns {Object} - обработанная ошибка { type, severity, message, userMessage, context }
     */
    function handleError(error, context = {}) {
        const errorType = classifyError(error);
        const severity = window.errorTypes.getSeverity(errorType);
        const userMessage = window.errorTypes.getUserMessage(errorType);

        const processedError = {
            type: errorType,
            severity,
            message: error.message || String(error),
            userMessage,
            context: {
                component: context.component || 'unknown',
                action: context.action || 'unknown',
                ...context
            },
            originalError: error,
            timestamp: Date.now()
        };

        // Логирование через logger (если доступен)
        if (window.logger) {
            const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
            window.logger[logLevel](processedError.message, processedError.context);
        } else {
            console.error('Error:', processedError);
        }

        // Эмит события через eventBus (если доступен)
        if (window.eventBus) {
            window.eventBus.emit('error-occurred', processedError);
        }

        return processedError;
    }

    /**
     * Выполнить операцию с автоматическими повторными попытками
     * @param {Function} operation - асинхронная операция
     * @param {Object} options - опции { maxRetries, retryDelay, retryableErrors }
     * @returns {Promise<any>} - результат операции
     */
    async function withRetry(operation, options = {}) {
        const {
            maxRetries = 3,
            retryDelay = 1000,
            retryableErrors = [
                window.errorTypes.ERROR_TYPES.API_NETWORK,
                window.errorTypes.ERROR_TYPES.API_TIMEOUT,
                window.errorTypes.ERROR_TYPES.API_RATE_LIMIT
            ]
        } = options;

        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                const processedError = handleError(error, { action: 'retry', attempt });

                // Проверка, можно ли повторить
                if (attempt < maxRetries && retryableErrors.includes(processedError.type)) {
                    const delay = retryDelay * Math.pow(2, attempt); // Экспоненциальная задержка
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                throw processedError;
            }
        }

        throw lastError;
    }

    // Экспорт в глобальную область
    window.errorHandler = {
        handleError,
        withRetry,
        classifyError
    };

    console.log('error-handler.js: инициализирован');
})();

