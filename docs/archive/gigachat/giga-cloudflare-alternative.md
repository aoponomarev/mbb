# Альтернативное решение: Cloudflare Workers вместо Yandex Cloud Functions

## Проблема с Yandex Cloud Functions

- ❌ GigaChat API отвечает очень медленно (45+ секунд)
- ❌ Максимальный таймаут Yandex Cloud Functions: 10 минут
- ❌ Даже с максимальным таймаутом запросы могут не укладываться в лимит
- ❌ Некомфортно ждать несколько минут для ответа

## Решение: Cloudflare Workers

### Преимущества Cloudflare Workers для GigaChat API:

1. **Лучшая производительность с внешними API:**
   - Оптимизированы для работы с внешними сервисами
   - Глобальная сеть CDN - близость к API серверам
   - Меньшая латентность при работе с внешними запросами

2. **Гибкие таймауты:**
   - Free тариф: 30 секунд CPU time + 50ms для каждого дополнительного I/O
   - Paid тариф: 30 секунд CPU time
   - Но важнее - лучше работает с медленными API за счет оптимизации сети

3. **Бесплатный тариф:**
   - До 100,000 запросов в день бесплатно
   - Идеально для тестирования и небольших проектов

4. **Простота развертывания:**
   - Создание через веб-интерфейс
   - Или через Wrangler CLI

## Быстрый старт с Cloudflare Workers

### Шаг 1: Создание Worker

1. Войдите в Cloudflare Dashboard: https://dash.cloudflare.com
2. Выберите ваш аккаунт
3. Перейдите в раздел **Workers & Pages**
4. Нажмите **"Create application"** → **"Create Worker"**
5. Заполните:
   - Имя: `gigachat-proxy` (или другое)
   - Описание: "Прокси для GigaChat API с поддержкой CORS и OAuth"
6. Нажмите **"Deploy"**

### Шаг 2: Вставка кода

1. Откройте созданный Worker в редакторе
2. Откройте файл `docs/archive/gigachat/giga-oauth-proxy-code.md`
3. Скопируйте код из раздела **"Вариант 1: Cloudflare Workers"**
4. Замените код в редакторе Cloudflare Workers
5. Нажмите **"Save and deploy"**

### Шаг 3: Настройка переменных окружения

1. В настройках Worker найдите раздел **"Settings"** → **"Variables"**
2. Перейдите на вкладку **"Environment Variables"**
3. Нажмите **"Add variable"**
4. Заполните:
   - **Variable name:** `GIGACHAT_AUTH_KEY`
   - **Value:** ваш Authorization Key (Base64) из `giga-get-api-key.md`
   - **Type:** Secret (рекомендуется) или Plain text
5. Нажмите **"Save"**
6. Нажмите **"Save and deploy"** для применения изменений

### Шаг 4: Получение URL Worker

1. В разделе **"Settings"** → **"Triggers"** найдите URL Worker
2. Формат: `https://your-worker-name.your-subdomain.workers.dev`
3. Скопируйте этот URL

### Шаг 5: Обновление конфигурации

1. Откройте `core/config/app-config.js`
2. Обновите URL прокси для GigaChat:
   ```javascript
   gigachat: {
       proxyType: 'cloudflare',
       proxies: {
           cloudflare: {
               url: 'https://your-worker-name.your-subdomain.workers.dev',
               label: 'Cloudflare Workers',
               description: 'Бесплатный тариф, глобальная CDN'
           },
           // ...
       }
   }
   ```

### Шаг 6: Тестирование

1. Откройте `docs/archive/gigachat/giga-cors.html` в браузере
2. Введите URL Worker: `https://your-worker-name.your-subdomain.workers.dev`
3. Введите тестовый запрос
4. Нажмите **"Отправить запрос"**
5. Проверьте результат - должен быть быстрее, чем через Yandex Cloud Functions

## Сравнение производительности

| Параметр | Yandex Cloud Functions | Cloudflare Workers |
|----------|------------------------|-------------------|
| Таймаут | 10 минут (600 сек) | 30 сек CPU + I/O |
| Латентность к внешним API | Высокая | Низкая (CDN) |
| Производительность | Средняя | Высокая |
| Бесплатный тариф | Ограниченный | 100k запросов/день |
| Сложность настройки | Средняя | Простая |

## Рекомендация

**Для GigaChat API рекомендуется использовать Cloudflare Workers**, так как:
- Лучше работает с медленными внешними API
- Меньшая латентность за счет глобальной сети
- Бесплатный тариф достаточен для тестирования
- Проще настройка и развертывание

## ССЫЛКИ

- Код для Cloudflare Workers: `giga-oauth-proxy-code.md` (раздел "Вариант 1")
- Получение API ключа: `giga-get-api-key.md`
- Тестовая страница: `giga-cors.html`
- План интеграции: `giga-integration-mbb-plan.md`
