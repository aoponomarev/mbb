/**
 * ================================================================================================
 * CACHE MANAGER - Единый интерфейс для работы с кэшем
 * ================================================================================================
 *
 * ЦЕЛЬ: Предоставить единую точку доступа к кэшу для всех компонентов приложения.
 * Абстракция над localStorage и IndexedDB, скрывающая детали реализации.
 *
 * ПРИНЦИПЫ:
 * - Единый интерфейс для всех типов данных
 * - Автоматическое определение слоя хранения (hot/warm/cold)
 * - Версионирование данных и автоматические миграции
 * - Версионирование приложения и автоматическая инвалидация кэша при обновлении
 * - Обработка ошибок с fallback на загрузку из сети
 * - Поддержка TTL и автоматической инвалидации
 *
 * ВЕРСИОНИРОВАНИЕ ПРИЛОЖЕНИЯ:
 * - Ключи кэша, зависящие от структуры данных, автоматически версионируются префиксом v:{hash}:{key}
 * - При смене версии приложения старые ключи автоматически удаляются через clearOldVersions()
 * - Версионируемые ключи: icons-cache, coins-list, api-cache, market-metrics, crypto-news-state
 * - Невersionируемые ключи: settings, portfolios, strategies (пользовательские данные)
 *
 * ИСПОЛЬЗОВАНИЕ:
 * window.cacheManager.get('coins-list', { strategy: 'cache-first' })
 * window.cacheManager.set('coins-list', data, { ttl: 3600000 })
 * window.cacheManager.has('coins-list')
 * window.cacheManager.delete('coins-list')
 * window.cacheManager.clearOldVersions() // Очистить кэш старых версий
 */

(function() {
    'use strict';

    // Зависимости (загружаются до этого скрипта)
    // - core/cache/storage-layers.js (window.storageLayers)
    // - core/cache/cache-config.js (window.cacheConfig)
    // - core/cache/cache-migrations.js (window.cacheMigrations)

    if (typeof window.storageLayers === 'undefined') {
        console.error('cache-manager.js: storageLayers не загружен');
        return;
    }

    if (typeof window.cacheConfig === 'undefined') {
        console.error('cache-manager.js: cacheConfig не загружен');
        return;
    }

    /**
     * Получить хэш версии приложения для версионирования кэша
     * @returns {string} - хэш версии или 'default'
     */
    function getAppVersionHash() {
        if (window.appConfig && typeof window.appConfig.getVersionHash === 'function') {
            return window.appConfig.getVersionHash();
        }
        return 'default';
    }

    /**
     * Определяет слой хранения для ключа
     * @param {string} key - ключ кэша
     * @returns {string} - 'hot', 'warm' или 'cold'
     */
    function getStorageLayer(key) {
        const layerConfig = window.storageLayers.getLayerForKey(key);
        return layerConfig ? layerConfig.layer : 'hot';
    }

    /**
     * Получить версионированный ключ кэша
     * Добавляет префикс версии для ключей, которые должны инвалидироваться при смене версии
     * @param {string} key - исходный ключ
     * @param {boolean} useVersioning - использовать ли версионирование (по умолчанию определяется автоматически)
     * @returns {string} - версионированный ключ вида 'v:{hash}:{key}' или исходный ключ
     */
    function getVersionedKey(key, useVersioning = null) {
        // Автоматическое определение необходимости версионирования
        if (useVersioning === null) {
            // Версионируем ключи, которые зависят от структуры данных приложения
            // Критерии: данные из внешних API, структура может измениться, парсинг зависит от формата
            const versionedKeys = [
                'icons-cache',        // Иконки монет (структура CoinGecko API)
                'coins-list',         // Список монет (структура CoinGecko API)
                'api-cache',          // Кэш API-ответов (структура внешних API)
                'market-metrics',     // Метрики рынка (структура внешних API)
                'crypto-news-state'   // Состояние новостей (структура зависит от промпта Perplexity)
            ];
            useVersioning = versionedKeys.includes(key);
        }

        if (!useVersioning) {
            return key;
        }

        const versionHash = getAppVersionHash();
        return `v:${versionHash}:${key}`;
    }

    /**
     * Получить значение из кэша
     * @param {string} key - ключ
     * @param {Object} options - опции (strategy, ttl, useVersioning)
     * @returns {Promise<any>} - значение или null
     */
    async function get(key, options = {}) {
        try {
            const versionedKey = getVersionedKey(key, options.useVersioning);
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return null;
            }

            const cached = await storage.get(versionedKey);

            if (!cached) {
                return null;
            }

            // Проверка TTL
            if (cached.expiresAt && cached.expiresAt < Date.now()) {
                await storage.delete(key);
                return null;
            }

            // Миграция данных при необходимости
            if (cached.version && window.cacheMigrations) {
                const migrated = await window.cacheMigrations.migrate(key, cached);
                if (migrated !== cached) {
                    await storage.set(key, migrated);
                }
            }

            return cached.data;
        } catch (error) {
            console.error(`cache-manager.get(${key}):`, error);
            return null;
        }
    }

    /**
     * Сохранить значение в кэш
     * @param {string} key - ключ
     * @param {any} value - значение
     * @param {Object} options - опции (ttl, version, useVersioning)
     * @returns {Promise<boolean>} - успех операции
     */
    async function set(key, value, options = {}) {
        try {
            const versionedKey = getVersionedKey(key, options.useVersioning);
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return false;
            }

            const ttl = options.ttl || window.cacheConfig.getTTL(key);
            const version = options.version || window.cacheConfig.getVersion(key);

            const cached = {
                data: value,
                version: version,
                timestamp: Date.now(),
                expiresAt: ttl ? Date.now() + ttl : null
            };

            await storage.set(versionedKey, cached);
            return true;
        } catch (error) {
            console.error(`cache-manager.set(${key}):`, error);
            return false;
        }
    }

    /**
     * Проверить наличие ключа в кэше
     * @param {string} key - ключ
     * @param {Object} options - опции (useVersioning)
     * @returns {Promise<boolean>}
     */
    async function has(key, options = {}) {
        try {
            const versionedKey = getVersionedKey(key, options.useVersioning);
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return false;
            }

            return await storage.has(versionedKey);
        } catch (error) {
            console.error(`cache-manager.has(${key}):`, error);
            return false;
        }
    }

    /**
     * Удалить значение из кэша
     * @param {string} key - ключ
     * @param {Object} options - опции (useVersioning)
     * @returns {Promise<boolean>}
     */
    async function deleteKey(key, options = {}) {
        try {
            const versionedKey = getVersionedKey(key, options.useVersioning);
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return false;
            }

            await storage.delete(versionedKey);
            return true;
        } catch (error) {
            console.error(`cache-manager.delete(${key}):`, error);
            return false;
        }
    }

    /**
     * Очистить весь кэш или слой
     * @param {string} layer - слой ('hot', 'warm', 'cold') или null для всех
     * @returns {Promise<boolean>}
     */
    async function clear(layer = null) {
        try {
            if (layer) {
                const storage = window.storageLayers.getStorage(layer);
                if (storage) {
                    await storage.clear();
                }
            } else {
                // Очистить все слои
                for (const layerName of ['hot', 'warm', 'cold']) {
                    const storage = window.storageLayers.getStorage(layerName);
                    if (storage) {
                        await storage.clear();
                    }
                }
            }
            return true;
        } catch (error) {
            console.error(`cache-manager.clear(${layer}):`, error);
            return false;
        }
    }

    // Экспорт в глобальную область
    /**
     * Очистить кэш старых версий приложения
     * Удаляет все ключи с префиксом версии, кроме текущей
     * @returns {Promise<number>} - количество удаленных ключей
     */
    async function clearOldVersions() {
        try {
            const currentVersionHash = getAppVersionHash();
            let deletedCount = 0;

            // Проходим по всем слоям хранения
            const layers = ['hot', 'warm', 'cold'];
            for (const layerName of layers) {
                const storage = window.storageLayers.getStorage(layerName);
                if (!storage) continue;

                // Получаем все ключи из слоя
                const allKeys = await storage.keys();

                // Фильтруем ключи с версионным префиксом
                for (const key of allKeys) {
                    if (key.startsWith('v:') && !key.startsWith(`v:${currentVersionHash}:`)) {
                        await storage.delete(key);
                        deletedCount++;
                    }
                }
            }

            console.log(`cache-manager: очищено ${deletedCount} ключей старых версий`);
            return deletedCount;
        } catch (error) {
            console.error('cache-manager.clearOldVersions:', error);
            return 0;
        }
    }

    window.cacheManager = {
        get,
        set,
        has,
        delete: deleteKey,
        clear,
        clearOldVersions,
        getVersionedKey,
        getAppVersionHash
    };

    console.log('cache-manager.js: инициализирован');
})();

