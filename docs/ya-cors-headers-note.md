# Замечание о CORS заголовках в ответе

## Ситуация

При тестировании функции через `ya-cors.html` видно, что:
- ✅ Запрос проходит успешно (status 200)
- ✅ Ответ получен корректно
- ⚠️ CORS заголовки не видны в `response.headers.get()`

## Объяснение

Это **нормальное поведение** браузера:

1. **Браузер скрывает CORS заголовки из JavaScript API** - это стандартное поведение для безопасности
2. **Заголовки присутствуют на сетевом уровне** - если запрос проходит без ошибок CORS, значит заголовки есть
3. **Preflight OPTIONS работает** - иначе браузер заблокировал бы запрос еще до отправки POST

## Как проверить заголовки

### Способ 1: DevTools Network
1. Откройте DevTools (F12)
2. Перейдите на вкладку **Network**
3. Отправьте запрос
4. Найдите запрос к функции в списке
5. Откройте его → вкладка **Headers**
6. В разделе **Response Headers** должны быть видны:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`

### Способ 2: Проверка через curl
```bash
curl -X POST https://functions.yandexcloud.net/d4erd8d1pttbufsl26s1 \
  -H "Content-Type: application/json" \
  -H "Origin: file://" \
  -d '{"modelUri":"gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest","messages":[{"role":"user","text":"Привет"}],"completionOptions":{"temperature":0.6,"maxTokens":2000},"apiKey":"YOUR_API_KEY"}' \
  -v
```

В выводе должны быть заголовки в секции `< HTTP/`.

## Вывод

**Интеграция работает корректно.** Если запрос проходит без ошибок CORS, значит всё настроено правильно. Отсутствие заголовков в JavaScript API - это нормально и не влияет на работу.

## ССЫЛКИ

- Код функции: `docs/ya-cloud-function-code.md`
- Тестовая страница: `ya-cors.html`
