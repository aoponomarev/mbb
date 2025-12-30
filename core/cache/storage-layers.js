/**
 * ================================================================================================
 * STORAGE LAYERS - Разделение данных по слоям хранения
 * ================================================================================================
 *
 * ЦЕЛЬ: Определить, какие данные хранить в localStorage, а какие в IndexedDB,
 * в зависимости от объёма и частоты доступа.
 *
 * ПРИНЦИПЫ:
 * - Hot (localStorage): небольшие данные, частый доступ
 * - Warm (IndexedDB): средний объём, частый доступ
 * - Cold (IndexedDB): большие объёмы, редкий доступ
 *
 * ССЫЛКА: Принципы кэширования описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    const LAYERS = {
        hot: {
            type: 'localStorage',
            maxSize: 5 * 1024 * 1024, // 5MB
            keys: [
                'settings',
                'favorites',
                'ui-state',
                'active-tab',
                'theme',
                'icons-cache' // Иконки монет (объект {coinId: url})
            ]
        },
        warm: {
            type: 'indexedDB',
            maxSize: 50 * 1024 * 1024, // 50MB
            keys: [
                'coins-list',
                'market-metrics',
                'api-cache' // Кэш API-ответов
            ]
        },
        cold: {
            type: 'indexedDB',
            maxSize: 500 * 1024 * 1024, // 500MB
            keys: [
                'time-series',
                'history',
                'portfolios',
                'strategies',
                'correlations'
            ]
        }
    };

    /**
     * Получить конфигурацию слоя для ключа
     * @param {string} key - ключ кэша
     * @returns {Object|null} - конфигурация слоя или null
     */
    function getLayerForKey(key) {
        for (const [layerName, config] of Object.entries(LAYERS)) {
            if (config.keys.includes(key)) {
                return { layer: layerName, ...config };
            }
        }
        // По умолчанию hot для неизвестных ключей
        return { layer: 'hot', ...LAYERS.hot };
    }

    /**
     * Получить объект хранилища для слоя
     * @param {string} layer - 'hot', 'warm' или 'cold'
     * @returns {Object|null} - объект хранилища с методами get/set/has/delete/clear
     */
    function getStorage(layer) {
        const config = LAYERS[layer];
        if (!config) {
            return null;
        }

        if (config.type === 'localStorage') {
            return {
                get: async (key) => {
                    try {
                        const item = localStorage.getItem(key);
                        return item ? JSON.parse(item) : null;
                    } catch (error) {
                        console.error(`localStorage.get(${key}):`, error);
                        return null;
                    }
                },
                set: async (key, value) => {
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                        return true;
                    } catch (error) {
                        // Переполнение localStorage
                        console.error(`localStorage.set(${key}):`, error);
                        return false;
                    }
                },
                has: async (key) => {
                    return localStorage.getItem(key) !== null;
                },
                delete: async (key) => {
                    localStorage.removeItem(key);
                    return true;
                },
                clear: async () => {
                    // Очистить только ключи этого слоя
                    for (const key of config.keys) {
                        localStorage.removeItem(key);
                    }
                    return true;
                },
                keys: async () => {
                    // Получить все ключи из localStorage
                    const allKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key) {
                            allKeys.push(key);
                        }
                    }
                    return allKeys;
                }
            };
        } else if (config.type === 'indexedDB') {
            // IndexedDB будет реализован позже
            // Пока возвращаем заглушку
            return {
                get: async (key) => {
                    console.warn(`IndexedDB для ${layer} ещё не реализован, используем localStorage`);
                    try {
                        const item = localStorage.getItem(`idb_${layer}_${key}`);
                        return item ? JSON.parse(item) : null;
                    } catch (error) {
                        return null;
                    }
                },
                set: async (key, value) => {
                    console.warn(`IndexedDB для ${layer} ещё не реализован, используем localStorage`);
                    try {
                        localStorage.setItem(`idb_${layer}_${key}`, JSON.stringify(value));
                        return true;
                    } catch (error) {
                        return false;
                    }
                },
                has: async (key) => {
                    return localStorage.getItem(`idb_${layer}_${key}`) !== null;
                },
                delete: async (key) => {
                    localStorage.removeItem(`idb_${layer}_${key}`);
                    return true;
                },
                clear: async () => {
                    for (const key of config.keys) {
                        localStorage.removeItem(`idb_${layer}_${key}`);
                    }
                    return true;
                },
                keys: async () => {
                    // Получить все ключи для этого слоя из localStorage (fallback для IndexedDB)
                    const prefix = `idb_${layer}_`;
                    const allKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(prefix)) {
                            // Убираем префикс
                            allKeys.push(key.substring(prefix.length));
                        }
                    }
                    return allKeys;
                }
            };
        }

        return null;
    }

    // Экспорт в глобальную область
    window.storageLayers = {
        LAYERS,
        getLayerForKey,
        getStorage
    };

    console.log('storage-layers.js: инициализирован');
})();

