/**
 * ================================================================================================
 * CACHE INDEXES - Индексы для IndexedDB
 * ================================================================================================
 *
 * ЦЕЛЬ: Определить индексы для быстрого поиска данных в IndexedDB.
 *
 * ПРИНЦИПЫ:
 * - Индексы для временных рядов (coinId + timestamp)
 * - Индексы для портфелей (userId + createdAt)
 * - Индексы для стратегий (type + isActive)
 *
 * ПРИМЕЧАНИЕ: Реализация индексов будет добавлена при реализации IndexedDB.
 * Пока файл содержит только конфигурацию.
 *
 * ССЫЛКА: Принципы кэширования описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Конфигурация индексов для каждой таблицы IndexedDB
     */
    const INDEXES = {
        'time-series': [
            { name: 'coinId', keyPath: 'coinId', unique: false },
            { name: 'timestamp', keyPath: 'timestamp', unique: false },
            { name: 'coinId_timestamp', keyPath: ['coinId', 'timestamp'], unique: false }
        ],
        'portfolios': [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
            { name: 'userId_createdAt', keyPath: ['userId', 'createdAt'], unique: false }
        ],
        'strategies': [
            { name: 'type', keyPath: 'type', unique: false },
            { name: 'isActive', keyPath: 'isActive', unique: false },
            { name: 'type_isActive', keyPath: ['type', 'isActive'], unique: false }
        ],
        'history': [
            { name: 'timestamp', keyPath: 'timestamp', unique: false },
            { name: 'type', keyPath: 'type', unique: false }
        ]
    };

    /**
     * Получить индексы для таблицы
     * @param {string} tableName - имя таблицы
     * @returns {Array} - массив конфигураций индексов
     */
    function getIndexes(tableName) {
        return INDEXES[tableName] || [];
    }

    // Экспорт в глобальную область
    window.cacheIndexes = {
        INDEXES,
        getIndexes
    };

    console.log('cache-indexes.js: инициализирован');
})();

