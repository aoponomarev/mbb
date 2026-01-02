/**
 * ================================================================================================
 * MAIN ROUTER - Главный роутер для Cloudflare Workers API
 * ================================================================================================
 *
 * ЦЕЛЬ: Обработка всех входящих запросов и маршрутизация к соответствующим handlers.
 *
 * МАРШРУТЫ:
 * - /auth/* → OAuth endpoints (auth.js)
 * - /api/portfolios/* → Portfolios API (portfolios.js)
 * - /api/datasets/* → Datasets API (datasets.js)
 * - /health → Health check endpoint
 *
 * @param {Request} request - Входящий HTTP запрос
 * @param {Object} env - Переменные окружения и bindings (DB, STORAGE, secrets)
 * @returns {Promise<Response>} HTTP ответ
 */

import { handleAuth } from './auth.js';
import { handlePortfolios } from './portfolios.js';
import { handleDatasets } from './datasets.js';
import { jsonResponse, handleOptions } from './utils/cors.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Обработка preflight OPTIONS запросов
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    try {
      let response;

      // Маршрутизация по путям
      if (path.startsWith('/auth/')) {
        // OAuth endpoints
        response = await handleAuth(request, env, path);
      } else if (path.startsWith('/api/portfolios')) {
        // Portfolios API
        response = await handlePortfolios(request, env, path);
      } else if (path.startsWith('/api/datasets')) {
        // Datasets API
        response = await handleDatasets(request, env, path);
      } else if (path === '/' || path === '/health') {
        // Health check endpoint
        response = jsonResponse({
          status: 'ok',
          service: 'MBB Dataset Integration API',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        });
      } else {
        // 404 Not Found
        response = jsonResponse(
          {
            error: 'Not Found',
            message: `Endpoint ${path} not found`,
          },
          { status: 404 }
        );
      }

      return response;
    } catch (error) {
      // Обработка ошибок
      console.error('Worker error:', error);
      return jsonResponse(
        {
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  },
};
