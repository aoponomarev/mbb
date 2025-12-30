/**
 * ================================================================================================
 * CACHE CONFIG - Конфигурация кэширования
 * ================================================================================================
 *
 * ЦЕЛЬ: Централизованное управление TTL, версиями и стратегиями кэширования.
 *
 * ПРИНЦИПЫ:
 * - Все TTL в одном месте
 * - Версионирование схем данных
 * - Стратегии кэширования по типам данных
 * - Единый источник правды для всех значений TTL (запрещено дублировать в компонентах)
 *
 * ИСТОРИЯ ИЗМЕНЕНИЙ:
 * - Добавлены TTL для новостей и обновления метрик (вынесены из app-footer.js):
 *   - crypto-news-cache-max-age: 24 часа
 *   - market-update-fallback: 3 часа
 *   - market-update-delay-max: 24 часа
 *
 * ССЫЛКА: Принципы кэширования описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    // TTL в миллисекундах
    const TTL = {
        'icons-cache': 60 * 60 * 1000,           // 1 час
        'coins-list': 24 * 60 * 60 * 1000,       // 1 день
        'market-metrics': 60 * 60 * 1000,        // 1 час
        'api-cache': 5 * 60 * 1000,              // 5 минут
        'time-series': 60 * 60 * 1000,           // 1 час
        'history': 24 * 60 * 60 * 1000,          // 1 день
        'portfolios': null,                       // Без TTL (локальные данные)
        'strategies': null,                       // Без TTL (локальные данные)
        'settings': null,                         // Без TTL
        'theme': null,                            // Без TTL
        'timezone': null,                         // Без TTL
        'favorites': null,                        // Без TTL
        'ui-state': null,                         // Без TTL
        'perplexity-api-key': null,               // Без TTL (чувствительные данные)
        'perplexity-model': null,                 // Без TTL
        'translation-language': null,              // Без TTL
        'crypto-news-cache-max-age': 24 * 60 * 60 * 1000,  // 24 часа - максимальный возраст кэша новостей
        'market-update-fallback': 3 * 60 * 60 * 1000,        // 3 часа - fallback при ошибке расчета времени обновления
        'market-update-delay-max': 24 * 60 * 60 * 1000      // 24 часа - максимальная задержка обновления метрик
    };

    // Версии схем данных
    const VERSIONS = {
        'icons-cache': '1.0.0',
        'coins-list': '1.0.0',
        'market-metrics': '1.0.0',
        'portfolios': '1.0.0',
        'strategies': '1.0.0',
        'time-series': '1.0.0',
        'history': '1.0.0'
    };

    // Стратегии кэширования
    const STRATEGIES = {
        'cache-first': ['icons-cache', 'coins-list'],
        'network-first': ['market-metrics', 'api-cache'],
        'stale-while-revalidate': ['time-series', 'history'],
        'cache-only': ['portfolios', 'strategies', 'settings', 'theme', 'timezone', 'favorites', 'ui-state', 'perplexity-api-key', 'perplexity-model', 'translation-language']
    };

    /**
     * Получить TTL для ключа
     * @param {string} key - ключ кэша
     * @returns {number|null} - TTL в миллисекундах или null
     */
    function getTTL(key) {
        return TTL[key] || null;
    }

    /**
     * Получить версию схемы для ключа
     * @param {string} key - ключ кэша
     * @returns {string} - версия
     */
    function getVersion(key) {
        return VERSIONS[key] || '1.0.0';
    }

    /**
     * Получить стратегию кэширования для ключа
     * @param {string} key - ключ кэша
     * @returns {string} - стратегия
     */
    function getStrategy(key) {
        for (const [strategy, keys] of Object.entries(STRATEGIES)) {
            if (keys.includes(key)) {
                return strategy;
            }
        }
        return 'network-first'; // По умолчанию
    }

    // Экспорт в глобальную область
    window.cacheConfig = {
        TTL,
        VERSIONS,
        STRATEGIES,
        getTTL,
        getVersion,
        getStrategy
    };

    console.log('cache-config.js: инициализирован');
})();

