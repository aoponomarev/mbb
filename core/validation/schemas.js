/**
 * ================================================================================================
 * VALIDATION SCHEMAS - Схемы валидации данных
 * ================================================================================================
 *
 * ЦЕЛЬ: Определить структуру и типы данных для всех источников данных приложения.
 * Валидация API-ответов, временных рядов, портфелей и стратегий.
 *
 * ПРИНЦИПЫ:
 * - Строгая валидация финансовых данных
 * - Нормализация к единому формату
 * - Проверка типов и диапазонов значений
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Схемы валидации для разных типов данных
     */
    const SCHEMAS = {
        // CoinGecko API ответы
        coinGeckoCoin: {
            id: { type: 'string', required: true },
            symbol: { type: 'string', required: true },
            name: { type: 'string', required: true },
            image: { type: 'string', required: false },
            market_cap_rank: { type: 'number', required: false, min: 1 }
        },

        coinGeckoMarketData: {
            current_price: { type: 'number', required: false, min: 0 },
            market_cap: { type: 'number', required: false, min: 0 },
            total_volume: { type: 'number', required: false, min: 0 },
            price_change_percentage_24h: { type: 'number', required: false }
        },

        // Временные ряды
        timeSeriesPoint: {
            timestamp: { type: 'number', required: true, min: 0 },
            value: { type: 'number', required: true },
            coinId: { type: 'string', required: true }
        },

        // Портфели
        portfolio: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            assets: {
                type: 'array',
                required: true,
                itemSchema: {
                    coinId: { type: 'string', required: true },
                    weight: { type: 'number', required: true, min: 0, max: 1 }
                }
            },
            createdAt: { type: 'number', required: true },
            updatedAt: { type: 'number', required: false }
        },

        // Стратегии
        strategy: {
            id: { type: 'string', required: true },
            type: { type: 'string', required: true, enum: ['rebalance', 'filter', 'weight-limit'] },
            rules: { type: 'object', required: true },
            isActive: { type: 'boolean', required: true }
        },

        // Метрики рынка
        marketMetric: {
            name: { type: 'string', required: true },
            value: { type: 'number', required: true },
            timestamp: { type: 'number', required: true }
        }
    };

    /**
     * Получить схему по имени
     * @param {string} schemaName - имя схемы
     * @returns {Object|null} - схема или null
     */
    function getSchema(schemaName) {
        return SCHEMAS[schemaName] || null;
    }

    // Экспорт в глобальную область
    window.validationSchemas = {
        SCHEMAS,
        getSchema
    };

    console.log('validation-schemas.js: инициализирован');
})();

