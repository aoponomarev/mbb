/**
 * ================================================================================================
 * CLOUDFLARE CONFIG - Конфигурация Cloudflare Workers API
 * ================================================================================================
 *
 * ЦЕЛЬ: Единый источник правды для всех параметров Cloudflare Workers API.
 * Base URL, endpoints для portfolios, datasets, auth.
 *
 * ПРИНЦИПЫ:
 * - Все endpoints определяются здесь и используются везде
 * - Запрещено дублировать значения в компонентах или API клиентах
 * - Использовать функции-геттеры вместо прямого доступа к CONFIG
 * - Проверка наличия конфигурации при инициализации
 *
 * СТРУКТУРА:
 * {
 *   workers: {
 *     baseUrl: '...',
 *     endpoints: {
 *       auth: {...},
 *       portfolios: {...},
 *       datasets: {...}
 *     }
 *   }
 * }
 *
 * ССЫЛКИ:
 * - Принципы единого источника правды: docs/doc-comp-principles.md
 * - План интеграции: docs/doc-cloudflare-integration-plan.md
 * - Cloudflare инфраструктура: docs/doc-cloudflare.md
 */

(function() {
    'use strict';

    /**
     * Конфигурация Cloudflare Workers
     */
    const CONFIG = {
        workers: {
            // Base URL Cloudflare Worker
            baseUrl: 'https://mbb-api.ponomarev-ux.workers.dev',

            // Endpoints для различных API
            endpoints: {
                // Auth endpoints
                auth: {
                    google: '/auth/google',              // Инициация Google OAuth
                    callback: '/auth/callback',           // OAuth callback
                    logout: '/auth/logout',              // Выход
                    me: '/auth/me'                       // Получение текущего пользователя
                },

                // Portfolios API endpoints
                portfolios: {
                    list: '/api/portfolios',             // GET - список портфелей
                    get: '/api/portfolios',               // GET /api/portfolios/:id - получение портфеля
                    create: '/api/portfolios',           // POST - создание портфеля
                    update: '/api/portfolios',           // PUT /api/portfolios/:id - обновление портфеля
                    delete: '/api/portfolios'            // DELETE /api/portfolios/:id - удаление портфеля
                },

                // Datasets API endpoints
                datasets: {
                    timeSeries: '/api/datasets/time-series',      // GET/POST - временные ряды
                    metrics: '/api/datasets/metrics',             // GET/POST - метрики
                    snapshots: '/api/datasets/snapshots'          // GET/POST - снимки данных
                },

                // Health check
                health: '/health'                         // GET - проверка работоспособности Worker
            }
        }
    };

    /**
     * Получить base URL Cloudflare Worker
     * @returns {string} Base URL
     */
    function getWorkersBaseUrl() {
        return CONFIG.workers.baseUrl;
    }

    /**
     * Получить полный URL для endpoint
     * @param {string} endpoint - Путь endpoint (например, '/auth/google')
     * @returns {string} Полный URL
     */
    function getEndpointUrl(endpoint) {
        const baseUrl = getWorkersBaseUrl();
        // Убираем ведущий слэш, если есть
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return `${baseUrl}/${cleanEndpoint}`;
    }

    /**
     * Получить URL для auth endpoints
     * @param {string} action - Действие ('google', 'callback', 'logout', 'me')
     * @returns {string} Полный URL для endpoint
     */
    function getAuthEndpoint(action) {
        const endpoint = CONFIG.workers.endpoints.auth[action];
        if (!endpoint) {
            console.warn(`cloudflare-config.getAuthEndpoint: неизвестное действие "${action}"`);
            return null;
        }
        return getEndpointUrl(endpoint);
    }

    /**
     * Получить URL для portfolios endpoints
     * @param {string} action - Действие ('list', 'get', 'create', 'update', 'delete')
     * @param {string|number} id - ID портфеля (опционально, для get, update, delete)
     * @returns {string} Полный URL для endpoint
     */
    function getPortfoliosEndpoint(action, id = null) {
        const endpoint = CONFIG.workers.endpoints.portfolios[action];
        if (!endpoint) {
            console.warn(`cloudflare-config.getPortfoliosEndpoint: неизвестное действие "${action}"`);
            return null;
        }

        let url = getEndpointUrl(endpoint);
        // Для get, update, delete добавляем ID в путь
        if (id && (action === 'get' || action === 'update' || action === 'delete')) {
            url = `${url}/${id}`;
        }

        return url;
    }

    /**
     * Получить URL для datasets endpoints
     * @param {string} type - Тип данных ('timeSeries', 'metrics', 'snapshots')
     * @param {Object} params - Параметры запроса (coin, date и т.д.)
     * @returns {string} Полный URL для endpoint
     */
    function getDatasetsEndpoint(type, params = {}) {
        const endpoint = CONFIG.workers.endpoints.datasets[type];
        if (!endpoint) {
            console.warn(`cloudflare-config.getDatasetsEndpoint: неизвестный тип "${type}"`);
            return null;
        }

        let url = getEndpointUrl(endpoint);

        // Добавляем параметры в путь, если указаны
        if (params.coin && params.date) {
            url = `${url}/${params.coin}/${params.date}`;
        } else if (params.coin) {
            url = `${url}/${params.coin}`;
        }

        // Добавляем query параметры, если есть
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (key !== 'coin' && key !== 'date' && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });

        if (queryParams.toString()) {
            url = `${url}?${queryParams.toString()}`;
        }

        return url;
    }

    /**
     * Получить URL для health check endpoint
     * @returns {string} Полный URL для health check
     */
    function getHealthEndpoint() {
        return getEndpointUrl(CONFIG.workers.endpoints.health);
    }

    /**
     * Проверить, что конфигурация инициализирована корректно
     * @returns {boolean} true если конфигурация валидна
     */
    function isValid() {
        return !!(
            CONFIG.workers.baseUrl &&
            CONFIG.workers.endpoints.auth &&
            CONFIG.workers.endpoints.portfolios &&
            CONFIG.workers.endpoints.datasets
        );
    }

    // Проверка при инициализации
    if (!isValid()) {
        console.error('cloudflare-config.js: Конфигурация невалидна! Проверьте параметры.');
    }

    // Экспорт в глобальную область
    window.cloudflareConfig = {
        CONFIG,
        getWorkersBaseUrl,
        getEndpointUrl,
        getAuthEndpoint,
        getPortfoliosEndpoint,
        getDatasetsEndpoint,
        getHealthEndpoint,
        isValid
    };

    console.log('cloudflare-config.js: инициализирован');
})();
