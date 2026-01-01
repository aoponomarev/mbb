/**
 * ================================================================================================
 * CACHE CONFIG - Конфигурация кэширования
 * ================================================================================================
 *
 * ЦЕЛЬ: Централизованное управление TTL, версиями схем и стратегиями кэширования.
 * Единый источник правды — запрещено дублировать значения TTL в компонентах.
 *
 * TTL (Time To Live) — объяснение значений:
 * - icons-cache: 1 час — иконки меняются редко, но могут обновиться (новые монеты, обновление дизайна)
 * - coins-list: 1 день — список монет стабилен, обновляется раз в день через API
 * - market-metrics: 1 час — метрики обновляются часто (цены меняются постоянно)
 * - api-cache: 5 минут — кэш API-ответов, быстрое устаревание для актуальности
 * - time-series: 1 час — временные ряды обновляются регулярно, час — баланс актуальности/производительности
 * - history: 1 день — история изменяется реже, день достаточен
 * - crypto-news-cache-max-age: 24 часа — максимальный возраст состояния новостей (не самих новостей)
 * - market-update-fallback: 3 часа — fallback при ошибке расчета времени обновления
 * - market-update-delay-max: 24 часа — максимальная задержка обновления метрик
 *
 * Без TTL (null) — постоянное хранение:
 * - Пользовательские данные (portfolios, strategies) — должны сохраняться
 * - Настройки (settings, theme, timezone) — пользователь не должен терять настройки
 * - API ключи и провайдеры — чувствительные данные, хранятся без срока
 *
 * СТРАТЕГИИ КЭШИРОВАНИЯ:
 * - cache-first: icons-cache, coins-list — данные стабильны, важна скорость доступа
 * - network-first: market-metrics, api-cache — актуальность критична, сначала запрос к сети
 * - stale-while-revalidate: time-series, history — показываем кэш, обновляем в фоне
 * - cache-only: portfolios, strategies, settings, API ключи — только локальные данные, нет источника обновления
 *
 * ВЕРСИИ СХЕМ:
 * Версионирование структуры данных пользовательских ключей (portfolios, strategies и т.д.).
 * При изменении структуры создается миграция в cache-migrations.js.
 * Версионирование схем отличается от версионирования приложения (префикс v:{hash}:).
 *
 * ИСПОЛЬЗОВАНИЕ:
 * cacheConfig.getTTL('coins-list') // 86400000 (1 день)
 * cacheConfig.getStrategy('icons-cache') // 'cache-first'
 * cacheConfig.getVersion('portfolios') // '1.0.0'
 *
 * ССЫЛКА: Общие принципы кэширования: docs/doc-cache.md
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
        'ai-provider': null,                      // Без TTL (текущий провайдер: 'yandex' | 'perplexity')
        'perplexity-api-key': null,               // Без TTL (чувствительные данные)
        'perplexity-model': null,                 // Без TTL
        'yandex-api-key': null,                   // Без TTL (чувствительные данные)
        'yandex-folder-id': null,                 // Без TTL
        'yandex-model': null,                     // Без TTL
        'yandex-proxy-type': null,                // Без TTL (тип прокси для YandexGPT: 'yandex' и т.д.)
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
        'cache-only': ['portfolios', 'strategies', 'settings', 'theme', 'timezone', 'favorites', 'ui-state', 'ai-provider', 'perplexity-api-key', 'perplexity-model', 'yandex-api-key', 'yandex-folder-id', 'yandex-model', 'yandex-proxy-type', 'translation-language']
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

