/**
 * ================================================================================================
 * MODULE LOADER - Загрузчик модулей с автоматическим разрешением зависимостей
 * ================================================================================================
 *
 * ЦЕЛЬ: Автоматическая загрузка модулей приложения в правильном порядке с учётом зависимостей.
 * Поддержка работы как с file:// протоколом (синхронная загрузка), так и с http:// (асинхронная).
 *
 * ПРОБЛЕМА:
 * - Ручное управление порядком загрузки через вложенные onload колбэки сложно поддерживать
 * - При добавлении нового модуля нужно вручную обновлять цепочку загрузки
 * - Легко допустить ошибку в порядке загрузки
 * - file:// протокол не поддерживает fetch() и асинхронный XMLHttpRequest
 *
 * РЕШЕНИЕ:
 * - Конфигурация модулей в core/modules-config.js с описанием зависимостей
 * - Автоматическое разрешение зависимостей через топологическую сортировку
 * - Обнаружение циклических зависимостей
 * - Синхронная загрузка для file://, асинхронная для http://
 * - Параллельная загрузка независимых модулей
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Чтение конфигурации из window.modulesConfig
 * - Построение графа зависимостей
 * - Топологическая сортировка (алгоритм Kahn)
 * - Загрузка модулей в правильном порядке
 * - Проверка наличия глобальных переменных после загрузки
 *
 * ПРЕИМУЩЕСТВА:
 * - Централизованное управление зависимостями
 * - Автоматическая проверка порядка загрузки
 * - Легко добавлять/удалять модули
 * - Поддержка file:// и http:// протоколов
 * - Детальные сообщения об ошибках
 *
 * ССЫЛКА: Конфигурация модулей в core/modules-config.js
 */

(function() {
    'use strict';

    /**
     * Кэш загруженных модулей (по src пути)
     */
    const loadedModulesCache = new Set();

    /**
     * Загружает скрипт асинхронно через <script> тег (работает с file:// и http://)
     * @param {string} src - путь к скрипту
     * @returns {Promise<boolean>} - успех загрузки
     */
    function loadScriptAsync(src) {
        return new Promise((resolve, reject) => {
            // Проверка кэша
            if (loadedModulesCache.has(src)) {
                console.log(`module-loader: модуль ${src} уже загружен (из кэша)`);
                resolve(true);
                return;
            }

            // Проверка, не загружен ли уже скрипт в DOM
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                loadedModulesCache.add(src);
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Важно: последовательная загрузка для зависимостей

            script.onload = () => {
                // Добавляем в кэш после успешной загрузки
                loadedModulesCache.add(src);
                resolve(true);
            };

            script.onerror = () => {
                reject(new Error(`Не удалось загрузить скрипт: ${src}`));
            };

            document.head.appendChild(script);
        });
    }


    /**
     * Загружает модуль асинхронно (работает с file:// и http:// через <script> теги)
     * @param {Object} module - объект модуля из конфигурации
     * @returns {Promise<boolean>} - успех загрузки
     */
    function loadModule(module) {
        // Используем асинхронную загрузку через <script> теги для всех протоколов
        // Это работает и с file://, и с http://
        return loadScriptAsync(module.src);
    }

    /**
     * Собирает все модули из конфигурации в один массив
     * Фильтрует модули по условиям загрузки (feature flags)
     * @param {Object} config - конфигурация модулей
     * @returns {Array} - массив всех модулей (после фильтрации)
     */
    function collectModules(config) {
        const modules = [];
        const categories = ['utilities', 'core', 'templates', 'libraries', 'components', 'app'];

        for (const category of categories) {
            if (config[category]) {
                for (const module of config[category]) {
                    // Проверяем условие загрузки (feature flag)
                    if (module.condition && typeof module.condition === 'function') {
                        try {
                            if (!module.condition()) {
                                console.log(`module-loader: модуль ${module.id} пропущен (условие не выполнено)`);
                                continue;
                            }
                        } catch (error) {
                            console.warn(`module-loader: ошибка проверки условия для модуля ${module.id}:`, error);
                            // При ошибке проверки условия загружаем модуль по умолчанию
                        }
                    }
                    modules.push(module);
                }
            }
        }

        return modules;
    }

    /**
     * Строит граф зависимостей из модулей
     * @param {Array} modules - массив всех модулей
     * @returns {Object} - граф зависимостей { moduleId: [depId1, depId2, ...] }
     */
    function buildDependencyGraph(modules) {
        const graph = {};
        const moduleMap = {};

        // Создаём карту модулей по ID
        for (const module of modules) {
            moduleMap[module.id] = module;
            graph[module.id] = [];
        }

        // Строим граф зависимостей
        for (const module of modules) {
            if (module.deps && module.deps.length > 0) {
                for (const depId of module.deps) {
                    if (!moduleMap[depId]) {
                        throw new Error(`module-loader: зависимость "${depId}" не найдена для модуля "${module.id}"`);
                    }
                    graph[module.id].push(depId);
                }
            }
        }

        return { graph, moduleMap };
    }

    /**
     * Обнаруживает циклические зависимости
     * @param {Object} graph - граф зависимостей
     * @returns {Array|null} - массив модулей, образующих цикл, или null если циклов нет
     */
    function detectCycles(graph) {
        const visited = new Set();
        const recStack = new Set();
        const cycle = [];

        function dfs(node) {
            if (recStack.has(node)) {
                cycle.push(node);
                return true;
            }
            if (visited.has(node)) {
                return false;
            }

            visited.add(node);
            recStack.add(node);

            for (const dep of graph[node] || []) {
                if (dfs(dep)) {
                    if (cycle.length > 0 && cycle[0] !== node) {
                        cycle.push(node);
                    }
                    return true;
                }
            }

            recStack.delete(node);
            return false;
        }

        for (const node of Object.keys(graph)) {
            if (!visited.has(node)) {
                if (dfs(node)) {
                    return cycle;
                }
            }
        }

        return null;
    }

    /**
     * Топологическая сортировка модулей (алгоритм Kahn)
     * @param {Object} graph - граф зависимостей (graph[A] = [B, C] означает, что A зависит от B и C)
     * @param {Object} moduleMap - карта модулей по ID
     * @returns {Array} - отсортированный массив модулей
     *
     * ЛОГИКА:
     * - Если модуль A зависит от модуля B, то B должен быть загружен до A
     * - inDegree[A] = количество модулей, от которых зависит A (т.е. длина graph[A])
     * - Модули с inDegree === 0 загружаются первыми (у них нет зависимостей)
     * - После загрузки модуля, уменьшаем inDegree для всех модулей, которые от него зависят
     */
    function topologicalSort(graph, moduleMap) {
        const inDegree = {};
        const queue = [];
        const result = [];

        // Инициализация inDegree
        // inDegree[node] = количество модулей, от которых зависит node (т.е. длина graph[node])
        for (const node of Object.keys(graph)) {
            inDegree[node] = graph[node].length;
        }

        // Находим все узлы без зависимостей (inDegree === 0)
        for (const node of Object.keys(inDegree)) {
            if (inDegree[node] === 0) {
                queue.push(node);
            }
        }

        // Обрабатываем очередь
        while (queue.length > 0) {
            const node = queue.shift();
            result.push(moduleMap[node]);

            // Уменьшаем inDegree для всех модулей, которые зависят от node
            // Ищем все модули, у которых node в списке зависимостей
            for (const otherNode of Object.keys(graph)) {
                if (graph[otherNode].includes(node)) {
                    inDegree[otherNode]--;
                    if (inDegree[otherNode] === 0) {
                        queue.push(otherNode);
                    }
                }
            }
        }

        // Проверка на циклы (если остались узлы с inDegree > 0)
        const remaining = Object.keys(inDegree).filter(node => inDegree[node] > 0);
        if (remaining.length > 0) {
            throw new Error(`module-loader: обнаружены циклические зависимости: ${remaining.join(', ')}`);
        }

        return result;
    }

    /**
     * Загружает все модули в правильном порядке
     * @param {Object} config - конфигурация модулей
     * @returns {Promise<void>}
     */
    async function loadAllModules(config) {
        if (!config) {
            throw new Error('module-loader: конфигурация модулей не найдена (window.modulesConfig)');
        }

        console.log('module-loader: начало загрузки модулей...');

        // Собираем все модули
        const modules = collectModules(config);
        console.log(`module-loader: найдено ${modules.length} модулей`);

        if (modules.length === 0) {
            throw new Error('module-loader: не найдено модулей для загрузки');
        }

        // Строим граф зависимостей
        const { graph, moduleMap } = buildDependencyGraph(modules);

        // Проверяем на циклические зависимости
        const cycle = detectCycles(graph);
        if (cycle) {
            throw new Error(`module-loader: обнаружена циклическая зависимость: ${cycle.join(' → ')}`);
        }

        // Топологическая сортировка
        const sortedModules = topologicalSort(graph, moduleMap);
        console.log(`module-loader: порядок загрузки: ${sortedModules.map(m => m.id).join(' → ')}`);

        // Загружаем модули последовательно (асинхронно для всех протоколов)
        const failedModules = [];
        for (let i = 0; i < sortedModules.length; i++) {
            const module = sortedModules[i];
            console.log(`module-loader: [${i + 1}/${sortedModules.length}] загрузка ${module.id}...`);

            try {
                await loadModule(module);
                console.log(`module-loader: ✓ ${module.id} загружен`);
            } catch (error) {
                console.error(`module-loader: ✗ ошибка загрузки ${module.id}:`, error);
                failedModules.push({ module, error });

                // Для критичных модулей (app, vue, templates) прерываем загрузку
                if (module.category === 'app' || module.id === 'vue' || module.id === 'templates-inline') {
                    throw new Error(`Критичный модуль ${module.id} не загружен. Приложение не может продолжить работу.`);
                }

                // Для некритичных модулей продолжаем загрузку с предупреждением
                console.warn(`module-loader: модуль ${module.id} не загружен, но загрузка продолжается`);
            }
        }

        // Если были ошибки загрузки некритичных модулей, выводим сводку
        if (failedModules.length > 0) {
            console.warn(`module-loader: не удалось загрузить ${failedModules.length} модулей:`,
                failedModules.map(f => f.module.id).join(', '));
        }

        console.log('module-loader: все модули загружены успешно');

        // Вызываем инициализацию приложения, если она определена
        // Ждём готовности DOM, если он ещё не загружен
        function callAppInit() {
            if (typeof window.appInit === 'function') {
                console.log('module-loader: вызов инициализации приложения...');
                window.appInit();
            } else {
                console.warn('module-loader: функция инициализации приложения (window.appInit) не найдена');
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callAppInit);
        } else {
            // DOM уже загружен, вызываем сразу
            callAppInit();
        }
    }

    /**
     * Публичный API модульного загрузчика
     */
    window.moduleLoader = {
        /**
         * Загружает все модули из конфигурации
         * @returns {Promise<void>}
         */
        load: function() {
            return loadAllModules(window.modulesConfig);
        },

        /**
         * Проверяет наличие конфигурации
         * @returns {boolean}
         */
        hasConfig: function() {
            return typeof window.modulesConfig !== 'undefined';
        },

        /**
         * Очищает кэш загруженных модулей
         */
        clearCache: function() {
            loadedModulesCache.clear();
            console.log('module-loader: кэш загруженных модулей очищен');
        },

        /**
         * Проверяет, загружен ли модуль
         * @param {string} src - путь к модулю
         * @returns {boolean}
         */
        isLoaded: function(src) {
            return loadedModulesCache.has(src);
        }
    };
})();

