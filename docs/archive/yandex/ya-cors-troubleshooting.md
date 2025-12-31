# Устранение проблемы CORS - шаги проверки

## Проблема
Ошибка: "Response to preflight request doesn't pass access control check: It does not have HTTP ok status"

## Шаг 1: Проверка публичного доступа

**ВАЖНО:** Убедитесь, что функция публичная:

1. Откройте функцию `yandexgpt-proxy` в Yandex Cloud Console
2. На странице обзора найдите переключатель **"Публичная функция"**
3. Переключатель должен быть **ВКЛЮЧЕН** (зеленый/активный)
4. Если выключен - включите его и сохраните изменения

## Шаг 2: Проверка логов функции

Проверьте, доходит ли запрос до функции:

1. Откройте раздел **"Логи"** (Logs) в левом меню функции
2. Отправьте тестовый запрос через `ya-cors.html`
3. Обновите страницу логов
4. Проверьте наличие новых записей:

**Что искать в логах:**
- `=== Function called ===` - означает, что запрос дошел до функции
- `Detected HTTP method: OPTIONS` - означает, что OPTIONS обрабатывается
- `OPTIONS preflight request handled` - означает, что OPTIONS обработан успешно
- Ошибки выполнения функции

**Если логов нет:**
- Запрос не доходит до функции (возможно, функция не публичная)
- Проблема с сетью или URL

**Если логи есть, но метод не OPTIONS:**
- Проверьте формат event в логах
- Возможно, нужно изменить способ определения метода

## Шаг 3: Тестирование через curl (обход CORS)

Протестируйте функцию напрямую, минуя браузер:

### Тест OPTIONS (preflight):
```bash
curl -X OPTIONS https://functions.yandexcloud.net/d4eu3vt3fa6sssm0o244 \
  -H "Origin: file://" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Ожидаемый результат:**
- Status: `200 OK`
- Заголовки должны содержать:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`

### Тест POST:
```bash
curl -X POST https://functions.yandexcloud.net/d4eu3vt3fa6sssm0o244 \
  -H "Content-Type: application/json" \
  -H "Origin: file://" \
  -d '{
    "modelUri": "gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest",
    "messages": [{"role": "user", "text": "Привет"}],
    "completionOptions": {"temperature": 0.6, "maxTokens": 2000},
    "apiKey": "YOUR_API_KEY_HERE"
  }' \
  -v
```

**Ожидаемый результат:**
- Status: `200 OK` (если API ключ правильный)
- Заголовки должны содержать `Access-Control-Allow-Origin: *`
- Тело ответа должно содержать ответ от YandexGPT API

## Шаг 4: Проверка формата event

Если в логах видно, что запрос доходит, но метод определяется неправильно:

1. Скопируйте из логов строку `Full event (first 500 chars):`
2. Проверьте структуру event
3. Возможно, нужно изменить способ определения HTTP метода в коде

## Возможные решения

### Если функция не публичная:
- Включите переключатель "Публичная функция"

### Если OPTIONS не обрабатывается:
- Проверьте логи функции
- Убедитесь, что код функции содержит обработку OPTIONS
- Проверьте формат определения метода в коде

### Если функция падает на OPTIONS:
- Проверьте логи на наличие ошибок
- Убедитесь, что код функции синтаксически корректен
- Проверьте, что формат возвращаемого значения правильный

## ССЫЛКИ

- Код функции: `ya-cloud-function-code.md`
- План интеграции: `ya-integration-mbb-plan.md`
