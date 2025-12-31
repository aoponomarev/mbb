# Cloudflare Workers Proxy для Yandex API

## Проблема
Yandex API блокирует CORS-запросы из браузера. GitHub Pages - статический хостинг, серверной части нет.

## Решение: Cloudflare Workers

Cloudflare Workers - бесплатный serverless сервис, который может работать как прокси для API запросов.

## Настройка Cloudflare Workers

### Шаг 1: Создание аккаунта Cloudflare
1. Зарегистрируйся на https://workers.cloudflare.com/
2. Создай бесплатный аккаунт (до 100,000 запросов в день бесплатно)

### Шаг 2: Создание Worker
**ВАЖНО:** Для прокси нужен отдельный Worker, созданный напрямую в Dashboard, а не через интеграцию с GitHub репозиторием.

1. В Dashboard Cloudflare перейди в **Workers & Pages**
2. Нажми **"Create application"**
3. Выбери вкладку **"Create Worker"** (НЕ "Pages")
4. В поле "Name" введи: `yandex-api-proxy` (или любое другое имя)
5. Выбери план: **Free** (бесплатный план достаточен)
6. Нажми **"Deploy"** (сначала создастся пустой Worker)

### Шаг 3: Редактирование кода Worker
1. После создания Worker'а нажми **"Edit code"** или **"Configure Worker"**
2. Откроется редактор кода
3. Замени весь код в редакторе на следующий:

```javascript
export default {
  async fetch(request, env) {
    // ВАЖНО: Сначала обрабатываем CORS preflight (OPTIONS запросы)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400', // Кэшируем preflight на 24 часа
        },
      });
    }

    // Разрешаем только POST запросы
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Получаем тело запроса
      const body = await request.json();

      // Извлекаем folderId из modelUri (формат: gpt://folderId/model/latest)
      const folderIdMatch = body.modelUri?.match(/gpt:\/\/([^\/]+)\//);
      const folderId = folderIdMatch ? folderIdMatch[1] : null;

      // Формируем заголовки запроса
      const headers = {
        'Authorization': `Api-Key ${body.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Добавляем заголовок x-folder-id, если folderId найден
      if (folderId) {
        headers['x-folder-id'] = folderId;
      }

      // Формируем тело запроса
      // Если completionOptions уже есть в теле запроса - используем их
      // Иначе формируем из temperature и maxTokens (для обратной совместимости)
      const requestBody = {
        modelUri: body.modelUri,
        messages: body.messages,
      };

      // Если completionOptions уже переданы - используем их
      if (body.completionOptions) {
        requestBody.completionOptions = body.completionOptions;
      } else if (body.temperature !== undefined || body.maxTokens) {
        // Для обратной совместимости: формируем completionOptions из temperature и maxTokens
        requestBody.completionOptions = {};
        if (body.temperature !== undefined) {
          requestBody.completionOptions.temperature = body.temperature;
        }
        if (body.maxTokens) {
          requestBody.completionOptions.maxTokens = typeof body.maxTokens === 'string'
            ? parseInt(body.maxTokens, 10)
            : body.maxTokens;
        }
      }

      // Формируем запрос к Yandex API
      const yandexResponse = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      const data = await yandexResponse.json();

      // Возвращаем ответ с CORS заголовками
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
```

### Шаг 4: Деплой Worker
1. После вставки кода нажми **"Save and deploy"** (или кнопку "Deploy")
2. Дождись успешного деплоя (появится сообщение "Deployed successfully")
3. **ВАЖНО:** Запомни URL worker'а - он отображается в верхней части страницы Worker'а
   - Формат: `https://yandex-api-proxy.your-username.workers.dev`
   - Или: `https://yandex-api-proxy.your-subdomain.workers.dev`
   - Этот URL нужно будет добавить в конфигурацию проекта

### Шаг 5: Настройка в проекте MBB
1. Открой файл `core/config/app-config.js` в проекте MBB
2. Найди секцию `yandex` в `defaults`:
```javascript
yandex: {
    folderId: 'b1gv03a122le5a934cqj',
    model: 'gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest',
    models: [...],
    proxyUrl: null // <-- здесь
}
```

3. Замени `null` на URL твоего Worker'а:
```javascript
proxyUrl: 'https://yandex-api-proxy.your-username.workers.dev'
```

4. Сохрани файл и закоммить изменения

**Готово!** Теперь все запросы к Yandex API будут идти через прокси, и CORS ошибки исчезнут.

## Безопасность

**ВАЖНО:** API ключ передается через прокси. Cloudflare Workers шифрует трафик, но:
- Используй HTTPS для worker'а (по умолчанию включен)
- Не логируй API ключи в worker'е
- Рассмотри вариант хранения API ключа в секретах Cloudflare (для продакшена)

## Альтернатива: Vercel/Netlify Functions

Если не хочешь использовать Cloudflare, можно использовать:
- Vercel Functions (бесплатно, легко интегрируется с GitHub)
- Netlify Functions (бесплатно, легко интегрируется с GitHub)

Оба сервиса поддерживают serverless функции и могут работать как прокси.

