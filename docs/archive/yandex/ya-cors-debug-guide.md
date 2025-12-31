# Отладка проблемы CORS в Cloud Function

## Проблема

Ошибка: "Response to preflight request doesn't pass access control check: It does not have HTTP ok status"

Это означает, что браузер отправляет OPTIONS запрос (preflight), но не получает корректный ответ.

## Гипотезы

1. **HTTP-триггер не настроен на метод OPTIONS** - триггер принимает только POST
2. **Формат события в Yandex Cloud Functions отличается** - `event.httpMethod` может отсутствовать или быть в другом формате
3. **Функция падает при обработке OPTIONS** - ошибка выполнения, не видна в коде

## Шаг 1: Проверить настройки HTTP-триггера

1. В Yandex Cloud Console откройте функцию `yandexgpt-proxy`
2. Перейдите в раздел **"Триггеры"** или **"Triggers"** (в левом меню или на странице функции)
3. Найдите HTTP-триггер
4. Проверьте, какие методы поддерживаются:
   - Должны быть: **POST** и **OPTIONS**
   - Если только POST - добавьте OPTIONS

## Шаг 2: Добавить логирование в функцию

Добавьте логирование в начало функции, чтобы понять, что приходит в event:

1. Откройте редактор функции
2. Добавьте в самое начало функции (после `exports.handler = async (event, context) => {`):

```javascript
// Логирование для отладки
console.log('=== Function called ===');
console.log('Event:', JSON.stringify(event, null, 2));
console.log('Event keys:', Object.keys(event));
console.log('httpMethod:', event.httpMethod);
console.log('requestContext:', event.requestContext);
```

3. Сохраните функцию (это создаст новую версию)

## Шаг 3: Проверить логи функции

1. Откройте раздел **"Логи"** (Logs) в левом меню функции
2. Отправьте тестовый запрос через `ya-cors.html`
3. Проверьте логи - должны быть записи о вызове функции
4. Посмотрите, что содержится в event

## Шаг 4: Проверить через curl (обход CORS в браузере)

Проверьте, работает ли функция напрямую:

```bash
# Проверка OPTIONS запроса
curl -X OPTIONS https://functions.yandexcloud.net/d4erd8d1pttbufs126s1 \
  -H "Origin: file://" \
  -v

# Проверка POST запроса
curl -X POST https://functions.yandexcloud.net/d4erd8d1pttbufs126s1 \
  -H "Content-Type: application/json" \
  -d '{"modelUri":"gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest","messages":[{"role":"user","text":"Привет"}],"completionOptions":{"temperature":0.6,"maxTokens":2000},"apiKey":"YOUR_API_KEY"}'
```

## Возможные решения

### Решение 1: Если формат event отличается

В Yandex Cloud Functions для HTTP-триггера формат может быть другим. Попробуйте:

```javascript
// Проверка разных вариантов получения метода
const httpMethod = event.httpMethod ||
                   event.requestContext?.httpMethod ||
                   event.method ||
                   event.request?.method ||
                   (event.headers && event.headers['X-Request-Method']);
```

### Решение 2: Если триггер не поддерживает OPTIONS

Создайте отдельный HTTP-триггер для OPTIONS или измените настройки существующего триггера.

### Решение 3: Использовать API Gateway вместо прямого HTTP-триггера

API Gateway может лучше обрабатывать CORS на уровне конфигурации.

## ССЫЛКИ

- Документация Cloud Functions: https://yandex.cloud/ru/docs/functions/
- Решение проблем с CORS: https://yandex.cloud/docs/troubleshooting/functions/known-issues/cors-error-when-querying-api-fron-webapp-frontend
