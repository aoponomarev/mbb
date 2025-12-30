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
 * - Единый источник правды для всех дефолтных значений (запрещено дублировать в компонентах)
 *
 * ИСТОРИЯ ИЗМЕНЕНИЙ:
 * - Добавлены дефолтные значения (вынесены из app-footer.js и perplexity-settings.js):
 *   - defaults.timezone: 'Europe/Moscow'
 *   - defaults.translationLanguage: 'ru'
 *   - defaults.perplexity.model: 'sonar-pro'
 *   - defaults.perplexity.models: массив моделей Perplexity
 *   - defaults.marketUpdates.times: [9, 12, 18] — времена обновления метрик (МСК)
 *   - defaults.marketUpdates.timezone: 'Europe/Moscow' — таймзона для расчета времени обновления
 *   - defaults.timezoneAbbreviations: объект с маппингом таймзон на аббревиатуры (MCK, LON, NYC и т.д.)
 *   - getTimezoneAbbr(timezone): функция для получения аббревиатуры таймзоны из конфигурации
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
            timezone: 'Europe/Moscow', // Таймзона по умолчанию
            translationLanguage: 'ru', // Язык перевода новостей по умолчанию
            cacheTTL: {
                icons: 3600000,      // 1 час
                coinsList: 86400000, // 1 день
                metrics: 3600000     // 1 час
            },
            // AI провайдер по умолчанию
            aiProvider: 'yandex', // 'yandex' | 'perplexity'
            perplexity: {
                model: 'sonar-pro', // Модель Perplexity по умолчанию
                models: [
                    { value: 'sonar-pro', label: 'sonar-pro' },
                    { value: 'sonar', label: 'sonar' },
                    { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
                    { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
                ]
            },
            yandex: {
                folderId: 'b1gv03a122le5a934cqj', // Folder ID для Yandex Cloud
                model: 'gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest', // Модель YandexGPT по умолчанию
                models: [
                    { value: 'gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest', label: 'YandexGPT Lite' },
                    { value: 'gpt://b1gv03a122le5a934cqj/yandexgpt/latest', label: 'YandexGPT' }
                ]
            },
            marketUpdates: {
                times: [9, 12, 18], // Часы обновления метрик (МСК)
                timezone: 'Europe/Moscow' // Таймзона для расчета времени обновления
            },
            timezoneAbbreviations: {
                'Europe/Moscow': 'MCK',
                'Europe/London': 'LON',
                'America/New_York': 'NYC',
                'America/Los_Angeles': 'LAX',
                'Asia/Tokyo': 'TYO',
                'Asia/Shanghai': 'SHA',
                'Europe/Berlin': 'BER',
                'America/Chicago': 'CHI',
                'UTC': 'UTC'
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
     * Получить аббревиатуру таймзоны
     * @param {string} timezone - таймзона (например, 'Europe/Moscow')
     * @returns {string} - аббревиатура (например, 'MCK') или автоматически сгенерированная
     */
    function getTimezoneAbbr(timezone) {
        const abbreviations = CONFIG.defaults.timezoneAbbreviations || {};
        if (abbreviations[timezone]) {
            return abbreviations[timezone];
        }
        // Fallback: генерируем аббревиатуру из последней части таймзоны
        return timezone.split('/').pop().substring(0, 3).toUpperCase();
    }

    /**
     * Получить хэш версии приложения
     * Используется для:
     * - CSS-класса на body (app-version-{hash})
     * - Версионирования ключей кэша (для инвалидации при смене версии)
     * - Отладки (видно версию приложения в DOM)
     * @returns {string} - Base58 хэш версии (8 символов) или 'unknown'
     */
    function getVersionHash() {
        if (!window.hashGenerator) {
            console.warn('app-config.getVersionHash: hashGenerator не загружен, используется fallback');
            return 'unknown';
        }
        // Генерируем детерминированный хэш из версии приложения
        // Один и тот же номер версии всегда дает один и тот же хэш
        return window.hashGenerator.generateHash(CONFIG.version, 8);
    }

    /**
     * Получить полное имя CSS-класса версии для body
     * @returns {string} - класс вида 'app-version-{hash}'
     */
    function getVersionClass() {
        return `app-version-${getVersionHash()}`;
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
        isFeatureEnabled,
        getTimezoneAbbr,
        getVersionHash,
        getVersionClass
    };

    console.log('app-config.js: инициализирован');
})();

