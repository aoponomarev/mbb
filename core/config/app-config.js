/**
 * ================================================================================================
 * APP CONFIG - Конфигурация приложения
 * ================================================================================================
 *
 * ЦЕЛЬ: Централизованная конфигурация приложения.
 * API endpoints, лимиты, таймауты, настройки по умолчанию, версия, feature flags.
 *
 * ПРИНЦИПЫ:
 * - Все настройки в одном месте
 * - Версионирование конфигурации
 * - Feature flags для включения/выключения функций
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Конфигурация приложения
     */
    const CONFIG = {
        // Версия приложения
        version: '1.0.0',

        // API endpoints
        api: {
            coingecko: {
                baseUrl: 'https://api.coingecko.com/api/v3',
                timeout: 30000, // 30 секунд
                rateLimit: {
                    requestsPerMinute: 50,
                    requestsPerSecond: 10
                }
            },
            marketMetrics: {
                baseUrl: 'https://api.alternative.me',
                timeout: 15000
            }
        },

        // Лимиты и таймауты
        limits: {
            maxPortfolioAssets: 100,
            maxTimeSeriesPoints: 10000,
            maxHistoryDays: 365
        },

        // Настройки по умолчанию
        defaults: {
            theme: 'light',
            currency: 'usd',
            updateInterval: 60000, // 1 минута
            cacheTTL: {
                icons: 3600000,      // 1 час
                coinsList: 86400000, // 1 день
                metrics: 3600000     // 1 час
            }
        },

        // Feature flags
        features: {
            timeSeries: false,      // Временные ряды (пока не реализовано)
            portfolios: false,      // Портфели (пока не реализовано)
            strategies: false,      // Стратегии (пока не реализовано)
            correlations: false,    // Корреляции (пока не реализовано)
            offlineMode: false     // Офлайн-режим (пока не реализовано)
        }
    };

    /**
     * Получить значение конфигурации по пути
     * @param {string} path - путь через точку (например, 'api.coingecko.baseUrl')
     * @param {any} defaultValue - значение по умолчанию
     * @returns {any}
     */
    function get(path, defaultValue = undefined) {
        const parts = path.split('.');
        let value = CONFIG;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Установить значение конфигурации (только для runtime изменений)
     * @param {string} path - путь через точку
     * @param {any} value - значение
     */
    function set(path, value) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        let target = CONFIG;

        for (const part of parts) {
            if (!target[part] || typeof target[part] !== 'object') {
                target[part] = {};
            }
            target = target[part];
        }

        target[lastPart] = value;
    }

    /**
     * Проверить, включён ли feature
     * @param {string} featureName - имя feature
     * @returns {boolean}
     */
    function isFeatureEnabled(featureName) {
        return CONFIG.features[featureName] === true;
    }

    // Экспорт в глобальную область
    window.appConfig = {
        CONFIG,
        get,
        set,
        isFeatureEnabled
    };

    console.log('app-config.js: инициализирован');
})();

