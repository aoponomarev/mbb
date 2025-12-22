/**
 * ================================================================================================
 * LIB LOADER - Загрузчик библиотек с fallback-механизмом
 * ================================================================================================
 *
 * ЦЕЛЬ: Загружать внешние библиотеки с автоматическим fallback при недоступности источников.
 * Обеспечить надёжность загрузки библиотек независимо от доступности CDN.
 *
 * ПРИНЦИПЫ:
 * - Приоритет GitHub Pages CDN (https://aoponomarev.github.io/libs/)
 * - Fallback на внешние CDN (jsdelivr, cdnjs)
 * - Локальное хранение для критичных библиотек
 * - Кэширование загруженных библиотек
 *
 * ССЫЛКА: Библиотеки и зависимости описаны в docs/doc-architect.md и docs/doc-vue-lib.md
 */

(function() {
    'use strict';

    /**
     * Кэш загруженных библиотек
     */
    const loadedLibs = new Set();

    /**
     * Источники загрузки для каждой библиотеки
     * Формат: { libName: [{ url, type }, ...] }
     */
    const LIB_SOURCES = {
        vue: [
            { url: 'https://aoponomarev.github.io/libs/vue/3.4.0/vue.global.js', type: 'github' },
            { url: 'https://cdn.jsdelivr.net/npm/vue@3.4.0/dist/vue.global.js', type: 'jsdelivr' },
            { url: 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.0/vue.global.js', type: 'cdnjs' },
            { url: './libs/vue@3.4.0.js', type: 'local' }
        ],
        chartjs: [
            { url: 'https://aoponomarev.github.io/libs/chartjs/4.4.0/chart.umd.js', type: 'github' },
            { url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js', type: 'jsdelivr' },
            { url: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js', type: 'cdnjs' },
            { url: './libs/chartjs@4.4.0.js', type: 'local' }
        ],
        'vue-chartjs': [
            // Примечание: vue-chartjs не имеет официальной UMD сборки
            // Требуется сборка из исходников или использование альтернативы
            { url: 'https://aoponomarev.github.io/libs/vue-chartjs/5.2.0/vue-chartjs.umd.js', type: 'github' },
            { url: './libs/vue-chartjs@5.2.0.js', type: 'local' }
        ],
        numeral: [
            { url: 'https://aoponomarev.github.io/libs/numeral/2.0.6/numeral.min.js', type: 'github' },
            { url: 'https://cdn.jsdelivr.net/npm/numeral@2.0.6/min/numeral.min.js', type: 'jsdelivr' },
            { url: 'https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js', type: 'cdnjs' },
            { url: './libs/numeral@2.0.6.js', type: 'local' }
        ],
        'vueuse': [
            // Примечание: @vueuse/core не имеет официальной UMD сборки
            // Требуется сборка из исходников или использование отдельных composables
            { url: 'https://aoponomarev.github.io/libs/vueuse/10.7.0/index.umd.js', type: 'github' },
            { url: './libs/vueuse@10.7.0.js', type: 'local' }
        ],
        'vuedraggable': [
            { url: 'https://aoponomarev.github.io/libs/vuedraggable/4.1.0/vuedraggable.umd.js', type: 'github' },
            { url: 'https://cdn.jsdelivr.net/npm/vuedraggable@4.1.0/dist/vuedraggable.umd.js', type: 'jsdelivr' },
            { url: './libs/vuedraggable@4.1.0.js', type: 'local' }
        ],
        'dayjs': [
            // Альтернатива date-fns (который не имеет UMD сборки)
            { url: 'https://aoponomarev.github.io/libs/dayjs/1.11.10/dayjs.min.js', type: 'github' },
            { url: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js', type: 'jsdelivr' },
            { url: 'https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js', type: 'cdnjs' },
            { url: './libs/dayjs@1.11.10.js', type: 'local' }
        ]
    };

    /**
     * Загрузить скрипт по URL
     * @param {string} url - URL скрипта
     * @returns {Promise<boolean>} - успех загрузки
     */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            // Проверка, не загружен ли уже скрипт с таким URL
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                resolve(true);
            };

            script.onerror = () => {
                reject(new Error(`Не удалось загрузить скрипт: ${url}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Загрузить библиотеку с fallback
     * @param {string} libName - имя библиотеки
     * @param {string} version - версия (опционально, используется latest если не указана)
     * @returns {Promise<boolean>} - успех загрузки
     */
    async function load(libName, version = null) {
        // Проверка кэша
        const cacheKey = version ? `${libName}@${version}` : libName;
        if (loadedLibs.has(cacheKey)) {
            console.log(`lib-loader: библиотека ${cacheKey} уже загружена`);
            return true;
        }

        const sources = LIB_SOURCES[libName];
        if (!sources) {
            throw new Error(`lib-loader: библиотека ${libName} не найдена в конфигурации`);
        }

        // Попытка загрузки из каждого источника по порядку
        let lastError = null;
        for (const source of sources) {
            try {
                await loadScript(source.url);
                loadedLibs.add(cacheKey);
                console.log(`lib-loader: библиотека ${libName} загружена из ${source.type}`);
                return true;
            } catch (error) {
                lastError = error;
                console.warn(`lib-loader: не удалось загрузить ${libName} из ${source.type}, пробуем следующий источник...`);
                continue;
            }
        }

        // Все источники недоступны
        throw new Error(`lib-loader: не удалось загрузить библиотеку ${libName} ни из одного источника. Последняя ошибка: ${lastError?.message}`);
    }

    /**
     * Загрузить несколько библиотек
     * @param {Array} libs - массив объектов { name, version }
     * @returns {Promise<boolean>} - успех загрузки всех библиотек
     */
    async function loadMultiple(libs) {
        const results = await Promise.allSettled(
            libs.map(lib => load(lib.name, lib.version))
        );

        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            console.error('lib-loader: не удалось загрузить некоторые библиотеки:', failed);
            return false;
        }

        return true;
    }

    /**
     * Проверить, загружена ли библиотека
     * @param {string} libName - имя библиотеки
     * @param {string} version - версия (опционально)
     * @returns {boolean}
     */
    function isLoaded(libName, version = null) {
        const cacheKey = version ? `${libName}@${version}` : libName;
        return loadedLibs.has(cacheKey);
    }

    /**
     * Добавить источник для библиотеки
     * @param {string} libName - имя библиотеки
     * @param {string} url - URL источника
     * @param {string} type - тип источника (github, jsdelivr, cdnjs, local)
     * @param {number} priority - приоритет (меньше = выше приоритет, по умолчанию добавляется в конец)
     */
    function addSource(libName, url, type, priority = null) {
        if (!LIB_SOURCES[libName]) {
            LIB_SOURCES[libName] = [];
        }

        const source = { url, type };
        if (priority !== null && priority < LIB_SOURCES[libName].length) {
            LIB_SOURCES[libName].splice(priority, 0, source);
        } else {
            LIB_SOURCES[libName].push(source);
        }
    }

    // Экспорт в глобальную область
    window.libLoader = {
        load,
        loadMultiple,
        isLoaded,
        addSource,
        LIB_SOURCES
    };

    console.log('lib-loader.js: инициализирован');
})();

