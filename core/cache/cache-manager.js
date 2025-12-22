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
 * - Обработка ошибок с fallback на загрузку из сети
 * - Поддержка TTL и автоматической инвалидации
 *
 * ИСПОЛЬЗОВАНИЕ:
 * window.cacheManager.get('coins-list', { strategy: 'cache-first' })
 * window.cacheManager.set('coins-list', data, { ttl: 3600000 })
 * window.cacheManager.has('coins-list')
 * window.cacheManager.delete('coins-list')
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
     * Определяет слой хранения для ключа
     * @param {string} key - ключ кэша
     * @returns {string} - 'hot', 'warm' или 'cold'
     */
    function getStorageLayer(key) {
        const layerConfig = window.storageLayers.getLayerForKey(key);
        return layerConfig ? layerConfig.layer : 'hot';
    }

    /**
     * Получить значение из кэша
     * @param {string} key - ключ
     * @param {Object} options - опции (strategy, ttl)
     * @returns {Promise<any>} - значение или null
     */
    async function get(key, options = {}) {
        try {
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return null;
            }

            const cached = await storage.get(key);

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
     * @param {Object} options - опции (ttl, version)
     * @returns {Promise<boolean>} - успех операции
     */
    async function set(key, value, options = {}) {
        try {
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

            await storage.set(key, cached);
            return true;
        } catch (error) {
            console.error(`cache-manager.set(${key}):`, error);
            return false;
        }
    }

    /**
     * Проверить наличие ключа в кэше
     * @param {string} key - ключ
     * @returns {Promise<boolean>}
     */
    async function has(key) {
        try {
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return false;
            }

            return await storage.has(key);
        } catch (error) {
            console.error(`cache-manager.has(${key}):`, error);
            return false;
        }
    }

    /**
     * Удалить значение из кэша
     * @param {string} key - ключ
     * @returns {Promise<boolean>}
     */
    async function deleteKey(key) {
        try {
            const layer = getStorageLayer(key);
            const storage = window.storageLayers.getStorage(layer);

            if (!storage) {
                return false;
            }

            await storage.delete(key);
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
    window.cacheManager = {
        get,
        set,
        has,
        delete: deleteKey,
        clear
    };

    console.log('cache-manager.js: инициализирован');
})();

