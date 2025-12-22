/**
 * ================================================================================================
 * LOGGER - Структурированное логирование
 * ================================================================================================
 *
 * ЦЕЛЬ: Единообразное логирование с уровнями и контекстом.
 * Упрощение отладки и мониторинга приложения.
 *
 * ПРИНЦИПЫ:
 * - Уровни логирования (debug, info, warn, error)
 * - Контекст (компонент, действие)
 * - Единый формат логов
 * - Возможность отправки на сервер (если понадобится)
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Уровни логирования
     */
    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    /**
     * Текущий уровень логирования (по умолчанию INFO в production, DEBUG в development)
     */
    let currentLogLevel = LOG_LEVELS.INFO;

    /**
     * Определить уровень логирования по окружению
     */
    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
        currentLogLevel = LOG_LEVELS.DEBUG;
    }

    /**
     * Форматировать лог
     * @param {string} level - уровень
     * @param {string} message - сообщение
     * @param {Object} context - контекст
     * @returns {string} - отформатированное сообщение
     */
    function formatLog(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0
            ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join(', ')}]`
            : '';
        return `[${timestamp}] [${level}]${contextStr} ${message}`;
    }

    /**
     * Логировать сообщение
     * @param {string} level - уровень
     * @param {string} message - сообщение
     * @param {Object} context - контекст
     */
    function log(level, message, context = {}) {
        const levelNum = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;

        if (levelNum < currentLogLevel) {
            return; // Не логируем, если уровень ниже текущего
        }

        const formatted = formatLog(level, message, context);

        switch (levelNum) {
            case LOG_LEVELS.DEBUG:
                console.debug(formatted);
                break;
            case LOG_LEVELS.INFO:
                console.info(formatted);
                break;
            case LOG_LEVELS.WARN:
                console.warn(formatted);
                break;
            case LOG_LEVELS.ERROR:
                console.error(formatted);
                break;
        }

        // Эмит события через eventBus (если доступен)
        if (window.eventBus && levelNum >= LOG_LEVELS.WARN) {
            window.eventBus.emit('log', { level, message, context, timestamp: Date.now() });
        }
    }

    /**
     * Установить уровень логирования
     * @param {string} level - уровень (debug, info, warn, error)
     */
    function setLogLevel(level) {
        const levelNum = LOG_LEVELS[level.toUpperCase()];
        if (levelNum !== undefined) {
            currentLogLevel = levelNum;
        }
    }

    // Методы для каждого уровня
    const logger = {
        debug: (message, context) => log('debug', message, context),
        info: (message, context) => log('info', message, context),
        warn: (message, context) => log('warn', message, context),
        error: (message, context) => log('error', message, context),
        setLogLevel
    };

    // Экспорт в глобальную область
    window.logger = logger;

    console.log('logger.js: инициализирован');
})();

