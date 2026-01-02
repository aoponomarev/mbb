/**
 * ================================================================================================
 * AUTH ENDPOINTS - OAuth endpoints для авторизации через Google
 * ================================================================================================
 *
 * ЦЕЛЬ: Обработка OAuth flow на сервере: обмен code на токен, сохранение пользователя, выдача JWT.
 *
 * ENDPOINTS:
 * - GET /auth/google — редирект на Google OAuth (не используется, делается на клиенте)
 * - POST /auth/callback — обмен authorization code на JWT токен, сохранение пользователя в D1
 * - GET /auth/me — получение текущего пользователя по JWT токену
 * - POST /auth/logout — выход (опционально, можно делать на клиенте)
 *
 * ИСПОЛЬЗОВАНИЕ:
 * import { handleAuth } from './auth.js';
 *
 * if (path.startsWith('/auth/')) {
 *   return await handleAuth(request, env, path);
 * }
 */

import { jsonResponse, handleOptions } from './utils/cors.js';
import { requireAuth, createToken } from './utils/auth.js';
import { createUser, getUserByGoogleId, getUser } from './utils/d1-helpers.js';

/**
 * Обработка OAuth callback от Google
 * Обмен authorization code на JWT токен и сохранение пользователя в D1
 * @param {Request} request - HTTP запрос
 * @param {Object} env - Переменные окружения (DB, GOOGLE_CLIENT_SECRET, JWT_SECRET)
 * @returns {Promise<Response>} JSON ответ с токеном и данными пользователя
 */
async function handleCallback(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse(
      { error: 'Method Not Allowed' },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { code, redirect_uri } = body;

    if (!code) {
      return jsonResponse(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Обмен code на access token от Google
    const googleTokenResponse = await exchangeCodeWithGoogle(code, redirect_uri, env.GOOGLE_CLIENT_SECRET);

    if (!googleTokenResponse.access_token) {
      return jsonResponse(
        { error: 'Failed to exchange code for token' },
        { status: 401 }
      );
    }

    // Получение данных пользователя от Google
    const userInfo = await getUserInfoFromGoogle(googleTokenResponse.access_token);

    if (!userInfo || !userInfo.id) {
      return jsonResponse(
        { error: 'Failed to get user info from Google' },
        { status: 401 }
      );
    }

    // Сохранение или обновление пользователя в D1
    let user = await getUserByGoogleId(env.DB, userInfo.id);

    if (!user) {
      user = await createUser(env.DB, {
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || null,
        picture: userInfo.picture || null,
      });
    }

    if (!user) {
      return jsonResponse(
        { error: 'Failed to create or get user' },
        { status: 500 }
      );
    }

    // Создание JWT токена
    const jwtToken = await createToken(
      {
        user_id: user.id,
        email: user.email,
        google_id: user.google_id,
      },
      env.JWT_SECRET,
      3600 // 1 час
    );

    // Возврат токена и данных пользователя
    return jsonResponse({
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('auth.handleCallback error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Обмен authorization code на access token от Google
 * @param {string} code - Authorization code
 * @param {string} redirectUri - Redirect URI
 * @param {string} clientSecret - Google OAuth Client Secret
 * @returns {Promise<Object>} Токен от Google
 */
async function exchangeCodeWithGoogle(code, redirectUri, clientSecret) {
  const GOOGLE_CLIENT_ID = '926359695878-hr94rhkq1s30c3nqgkcbfcpr0537kt7i.apps.googleusercontent.com';
  const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code');
  }

  return await response.json();
}

/**
 * Получение данных пользователя от Google
 * @param {string} accessToken - Access token от Google
 * @returns {Promise<Object>} Данные пользователя
 */
async function getUserInfoFromGoogle(accessToken) {
  const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  return await response.json();
}

/**
 * Получение текущего пользователя по JWT токену
 * @param {Request} request - HTTP запрос
 * @param {Object} env - Переменные окружения (DB, JWT_SECRET)
 * @returns {Promise<Response>} JSON ответ с данными пользователя
 */
async function handleMe(request, env) {
  if (request.method !== 'GET') {
    return jsonResponse(
      { error: 'Method Not Allowed' },
      { status: 405 }
    );
  }

  const userId = await requireAuth(request, env);
  if (!userId) {
    return jsonResponse(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = await getUser(env.DB, userId);
  if (!user) {
    return jsonResponse(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return jsonResponse({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    created_at: user.created_at,
  });
}

/**
 * Главный обработчик auth endpoints
 * @param {Request} request - HTTP запрос
 * @param {Object} env - Переменные окружения
 * @param {string} path - Путь запроса
 * @returns {Promise<Response>} HTTP ответ
 */
export async function handleAuth(request, env, path) {
  // Обработка preflight OPTIONS запросов
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Маршрутизация по путям
  if (path === '/auth/callback') {
    return await handleCallback(request, env);
  } else if (path === '/auth/me') {
    return await handleMe(request, env);
  } else {
    return jsonResponse(
      { error: 'Not Found', message: `Auth endpoint ${path} not found` },
      { status: 404 }
    );
  }
}
