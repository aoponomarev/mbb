/**
 * ================================================================================================
 * APP FOOTER COMPONENT - Компонент футера приложения
 * ================================================================================================
 *
 * ЦЕЛЬ: Vue-компонент футера приложения с метриками рынка.
 *
 * ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
 * - Наследует тему от body (bg-body), переключается вместе с темой приложения
 * - Фиксированное позиционирование внизу страницы
 * - Отображение метрик рынка (FGI, VIX, BTC Dominance, OI, FR, LSR)
 * - Отображение времени в выбранной таймзоне (кликабельно для выбора таймзоны)
 * - Обновление метрик 3 раза в день (09:00, 12:00, 18:00 МСК)
 * - Отображение главной новости крипты через Perplexity AI (кликабельно для переключения)
 *
 * ДАННЫЕ:
 * - Метрики рынка: fgi, vix, btcDom, oi, fr, lsr (строковые значения)
 * - Числовые значения: fgiValue, vixValue, btcDomValue, oiValue, frValue, lsrValue
 * - Таймзона: timezone (по умолчанию 'Europe/Moscow')
 * - Время: timeDisplay (формат "ABBR hh:mm", где ABBR — аббревиатура таймзоны)
 * - Новости крипты: currentNewsIndex (0-4), currentNews (текст), currentNewsTranslated (перевод)
 *
 * МЕТОДЫ:
 * - fetchMarketIndices() — загрузка всех метрик через window.marketMetrics
 * - getTime() — получение текущего времени в выбранной таймзоне
 * - getTimezoneAbbr() — получение аббревиатуры таймзоны
 * - updateTime() — обновление отображаемого времени
 * - loadTimezone() — загрузка таймзоны из кэша
 * - saveTimezone(timezone) — сохранение таймзоны в кэш
 * - openTimezoneModal() — открытие модального окна выбора таймзоны (эмитит событие)
 * - getNextUpdateTime() — расчет следующего времени обновления (09:00, 12:00, 18:00 МСК)
 * - scheduleNextUpdate() — планирование следующего обновления
 * - formatOIMobile() — форматирование OI для мобильной версии (компактный формат с буквенным обозначением миллиарда, например "8.4B")
 * - formatValueMobile() — форматирование значения для мобильной версии (округление до десятых долей, кроме FR)
 * - loadPerplexitySettings() — загрузка настроек Perplexity из кэша
 * - fetchSingleCryptoNews(index) — запрос одной новости крипты через Perplexity AI (с переводом, по индексу 0-4)
 * - parseSingleNews(response) — парсинг одной новости с переводом по явным маркерам
 * - saveCurrentNewsState() — сохранение индекса текущей новости в кэш
 * - loadNewsState() — загрузка индекса последней новости из кэша
 * - switchToNextNews() — переключение на следующую (менее значимую) новость (асинхронно, загружает по требованию)
 *
 * СОБЫТИЯ:
 * - open-timezone-modal — эмитируется при клике на время в футере для открытия модального окна выбора таймзоны
 *
 * ССЫЛКИ:
 * - Шаблон: app/templates/app-footer-template.js
 * - Стили: styles/layout/footer.css
 * - API метрик: core/api/market-metrics.js
 */

window.appFooter = {
    template: '#app-footer-template',

    data() {
        return {
            // Строковые значения метрик
            fgi: '—',
            vix: '—',
            btcDom: '—',
            oi: '—',
            fr: '—',
            lsr: '—',

            // Числовые значения для расчетов
            fgiValue: null,
            vixValue: null,
            btcDomValue: null,
            oiValue: null,
            frValue: null,
            lsrValue: null,

            // Время
            timezone: 'Europe/Moscow', // Таймзона по умолчанию
            timeDisplay: 'MCK --:--',

            // Таймеры
            updateTimer: null,
            timeUpdateTimer: null,

            // Новости крипты
            currentNewsIndex: 0, // Индекс текущей новости (0-4)
            currentNews: '', // Текущая отображаемая новость
            currentNewsTranslated: '', // Перевод текущей новости для tooltip
            perplexityApiKey: '', // API ключ Perplexity
            perplexityModel: 'sonar-pro' // Модель Perplexity
        };
    },

    methods: {
        // Загрузка метрик рынка
        async fetchMarketIndices() {
            if (!window.marketMetrics) {
                console.error('marketMetrics module not loaded');
                return;
            }

            try {
                const metrics = await window.marketMetrics.fetchAll();

                // Сохраняем строковые значения
                this.fgi = metrics.fgi;
                this.vix = metrics.vix;
                this.btcDom = metrics.btcDom;
                this.oi = metrics.oi;
                this.fr = metrics.fr;
                this.lsr = metrics.lsr;

                // Парсим числовые значения
                this.fgiValue = metrics.fgi !== '—' ? parseFloat(metrics.fgi) : null;
                this.vixValue = metrics.vix !== '—' ? parseFloat(metrics.vix) : null;
                if (metrics.btcDom !== '—') {
                    this.btcDomValue = parseFloat(metrics.btcDom.replace('%', ''));
                } else {
                    this.btcDomValue = null;
                }
                if (metrics.oi !== '—') {
                    this.oiValue = parseFloat(metrics.oi.replace('$', ''));
                } else {
                    this.oiValue = null;
                }
                if (metrics.fr !== '—') {
                    this.frValue = parseFloat(metrics.fr.replace('%', ''));
                } else {
                    this.frValue = null;
                }
                this.lsrValue = metrics.lsr !== '—' ? parseFloat(metrics.lsr) : null;
            } catch (error) {
                console.error('Market indices fetch error:', error);
            }
        },

        // Получение текущего времени в выбранной таймзоне
        getTime() {
            try {
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: this.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const parts = formatter.formatToParts(now);
                const hours = parts.find(p => p.type === 'hour').value;
                const minutes = parts.find(p => p.type === 'minute').value;

                // Получаем аббревиатуру таймзоны
                const tzAbbr = this.getTimezoneAbbr();
                return `${tzAbbr} ${hours}:${minutes}`;
            } catch (error) {
                // Fallback на системное время
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                return `SYS ${hours}:${minutes}`;
            }
        },

        // Получение аббревиатуры таймзоны
        getTimezoneAbbr() {
            const tzMap = {
                'Europe/Moscow': 'MCK',
                'Europe/London': 'LON',
                'America/New_York': 'NYC',
                'America/Los_Angeles': 'LAX',
                'Asia/Tokyo': 'TYO',
                'Asia/Shanghai': 'SHA',
                'Europe/Berlin': 'BER',
                'America/Chicago': 'CHI',
                'UTC': 'UTC'
            };
            return tzMap[this.timezone] || this.timezone.split('/').pop().substring(0, 3).toUpperCase();
        },

        // Обновление времени
        updateTime() {
            this.timeDisplay = this.getTime();
        },

        // Загрузка таймзоны из кэша
        async loadTimezone() {
            try {
                if (window.cacheManager) {
                    const savedTimezone = await window.cacheManager.get('timezone');
                    if (savedTimezone && typeof savedTimezone === 'string') {
                        this.timezone = savedTimezone;
                    }
                } else {
                    const savedTimezone = localStorage.getItem('timezone');
                    if (savedTimezone) {
                        this.timezone = savedTimezone;
                    }
                }
            } catch (error) {
                console.error('Failed to load timezone:', error);
            }
        },

        // Обновление таймзоны (вызывается извне после сохранения в кэш)
        async saveTimezone(timezone) {
            this.timezone = timezone;
            this.updateTime();
        },

        // Открытие модального окна выбора таймзоны
        openTimezoneModal() {
            this.$emit('open-timezone-modal');
        },

        // Расчет следующего времени обновления (09:00, 12:00, 18:00 МСК)
        getNextUpdateTime() {
            const updateHours = [9, 12, 18]; // МСК
            const now = new Date();

            try {
                // Получаем текущее время в МСК через Intl.DateTimeFormat
                const mskFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Moscow',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const mskParts = mskFormatter.formatToParts(now);
                const mskYear = parseInt(mskParts.find(p => p.type === 'year').value);
                const mskMonth = parseInt(mskParts.find(p => p.type === 'month').value) - 1;
                const mskDay = parseInt(mskParts.find(p => p.type === 'day').value);
                const mskHour = parseInt(mskParts.find(p => p.type === 'hour').value);
                const mskMinute = parseInt(mskParts.find(p => p.type === 'minute').value);

                // Находим следующее время обновления в МСК
                let nextHour = updateHours.find(h => h > mskHour);
                let nextDay = mskDay;
                if (!nextHour) {
                    // Если уже прошло 18:00, следующий обновление завтра в 09:00
                    nextHour = 9;
                    nextDay = mskDay + 1;
                }

                // Вычисляем разницу в миллисекундах между текущим временем МСК и следующим обновлением
                const currentMSKTime = mskHour * 60 + mskMinute; // Текущее время в минутах от начала дня
                const nextMSKTime = nextHour * 60; // Следующее время обновления в минутах
                const minutesDiff = (nextDay - mskDay) * 24 * 60 + (nextMSKTime - currentMSKTime);
                const delay = minutesDiff * 60 * 1000; // Конвертируем в миллисекунды

                return delay > 0 ? delay : delay + 24 * 60 * 60 * 1000; // Если отрицательно, добавляем сутки
            } catch (error) {
                // Fallback: обновление через 3 часа
                return 3 * 60 * 60 * 1000;
            }
        },

        // Планирование следующего обновления
        scheduleNextUpdate() {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }

            const delay = this.getNextUpdateTime();
            this.updateTimer = setTimeout(() => {
                this.fetchMarketIndices();
                this.scheduleNextUpdate(); // Планируем следующее
            }, delay);
        },

        // Форматирование OI для мобильной версии (компактный формат с буквенным обозначением миллиарда)
        formatOIMobile() {
            if (this.oiValue === null || this.oi === '—') {
                return '—';
            }
            // Конвертируем в миллиарды
            const billions = this.oiValue / 1000000000;
            return '$' + billions.toFixed(1) + 'B';
        },

        // Форматирование значения для мобильной версии (округление до десятых, кроме FR)
        formatValueMobile(value, originalValue) {
            if (value === null || originalValue === '—') {
                return '—';
            }
            return value.toFixed(1);
        },

        // Загрузка настроек Perplexity из кэша
        async loadPerplexitySettings() {
            try {
                const defaultApiKey = ''; // API ключ должен быть настроен пользователем через модальное окно настроек

                if (window.cacheManager) {
                    const savedApiKey = await window.cacheManager.get('perplexity-api-key');
                    const savedModel = await window.cacheManager.get('perplexity-model');

                    if (savedApiKey) {
                        this.perplexityApiKey = savedApiKey;
                    } else {
                        // Используем ключ по умолчанию
                        this.perplexityApiKey = defaultApiKey;
                    }

                    if (savedModel) {
                        this.perplexityModel = savedModel;
                    }
                } else {
                    const savedApiKey = localStorage.getItem('perplexity-api-key');
                    const savedModel = localStorage.getItem('perplexity-model');

                    if (savedApiKey) {
                        this.perplexityApiKey = savedApiKey;
                    } else {
                        // Используем ключ по умолчанию
                        this.perplexityApiKey = defaultApiKey;
                    }

                    if (savedModel) {
                        this.perplexityModel = savedModel;
                    }
                }
            } catch (error) {
                console.error('Failed to load Perplexity settings:', error);
            }
        },

        // Запрос одной новости крипты через Perplexity AI (с переводом)
        async fetchSingleCryptoNews(index) {
            if (!this.perplexityApiKey || !window.perplexityAPI) {
                return null;
            }

            try {
                const priority = ['most important', 'second most important', 'third most important', 'fourth most important', 'fifth most important'];
                const prompt = `What is the ${priority[index]} cryptocurrency news today? Provide exactly one news item with the following structure:
- One headline sentence (concise summary)
- Two sentences that explain the details and context

Format the response as follows:
---NEWS---
[Headline sentence. Detail sentence 1. Detail sentence 2.]
---TRANSLATION---
[Russian translation: Заголовочное предложение. Первое предложение с деталями. Второе предложение с деталями.]
---END---`;

                const response = await window.perplexityAPI.sendPerplexityRequest(
                    this.perplexityApiKey,
                    this.perplexityModel,
                    [{ role: 'user', content: prompt }]
                );

                // Проверяем на ошибки/ограничения
                if (response && (response.toLowerCase().includes('cannot provide') || response.toLowerCase().includes('limited') || response.toLowerCase().includes('error'))) {
                    console.warn('Perplexity API returned error/limitation message for index', index);
                    return null;
                }

                // Парсим ответ
                const newsItem = this.parseSingleNews(response);
                return newsItem;
            } catch (error) {
                console.error('Failed to fetch crypto news for index', index, error);
                return null;
            }
        },

        // Парсинг одной новости с переводом по явным маркерам
        parseSingleNews(response) {
            if (!response) return null;

            // Ищем маркеры
            const newsIndex = response.indexOf('---NEWS---');
            const translationIndex = response.indexOf('---TRANSLATION---');
            const endIndex = response.indexOf('---END---');

            if (newsIndex === -1 || translationIndex === -1) {
                console.warn('News markers not found in response');
                return null;
            }

            // Извлекаем английскую новость
            const newsText = response
                .substring(newsIndex + '---NEWS---'.length, translationIndex)
                .trim();

            // Извлекаем перевод
            const translationText = endIndex !== -1
                ? response.substring(translationIndex + '---TRANSLATION---'.length, endIndex).trim()
                : response.substring(translationIndex + '---TRANSLATION---'.length).trim();

            if (!newsText || !translationText) {
                return null;
            }

            return {
                news: this.cleanMarkdown(newsText),
                translation: this.cleanMarkdown(translationText)
            };
        },

        // Очистка микроразметки из новости
        cleanMarkdown(text) {
            if (!text) return '';
            return text
                .replace(/\*\*/g, '') // Убираем двойные звездочки (жирный текст)
                .replace(/\*/g, '') // Убираем одинарные звездочки
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Убираем markdown ссылки [текст](url) -> текст
                .replace(/\[([^\]]+)\]/g, '$1') // Убираем квадратные скобки [текст] -> текст
                .replace(/\([^\)]+\)/g, '') // Убираем скобки с содержимым (текст)
                .replace(/#{1,6}\s+/g, '') // Убираем заголовки markdown
                .replace(/`([^`]+)`/g, '$1') // Убираем код в обратных кавычках
                .replace(/~~([^~]+)~~/g, '$1') // Убираем зачеркнутый текст
                .replace(/\.(\d+)/g, '.') // Убираем цифры-сноски после точек (например, ".1" -> ".")
                .replace(/\.\s*[\d\[\]]+(?=\s|$)/g, '.') // Убираем сноски после точек с пробелом (например, ". 1" или ". [1]" -> ".")
                .trim();
        },

        // Сохранение состояния текущей новости в кэш (только индекс и timestamp)
        async saveCurrentNewsState() {
            try {
                const dataToSave = {
                    index: this.currentNewsIndex,
                    timestamp: Date.now()
                };
                if (window.cacheManager) {
                    await window.cacheManager.set('crypto-news-state', dataToSave);
                } else {
                    localStorage.setItem('crypto-news-state', JSON.stringify(dataToSave));
                }
            } catch (error) {
                console.error('Failed to save crypto news state:', error);
            }
        },

        // Загрузка состояния новостей из кэша
        async loadNewsState() {
            try {
                let savedData = null;

                if (window.cacheManager) {
                    savedData = await window.cacheManager.get('crypto-news-state');
                } else {
                    const saved = localStorage.getItem('crypto-news-state');
                    if (saved) {
                        savedData = JSON.parse(saved);
                    }
                }

                // Проверяем, что состояние не старше 24 часов
                if (savedData && typeof savedData.index === 'number') {
                    const age = Date.now() - (savedData.timestamp || 0);
                    const maxAge = 24 * 60 * 60 * 1000; // 24 часа

                    if (age < maxAge) {
                        return savedData.index;
                    }
                }
            } catch (error) {
                console.error('Failed to load crypto news state:', error);
            }
            return null;
        },

        // Переключение на следующую (менее значимую) новость
        async switchToNextNews() {
            // Переключаемся на следующую новость циклично (0-4)
            const nextIndex = (this.currentNewsIndex + 1) % 5;

            // Загружаем новую новость
            const newsItem = await this.fetchSingleCryptoNews(nextIndex);

            if (newsItem) {
                this.currentNewsIndex = nextIndex;
                this.currentNews = newsItem.news;
                this.currentNewsTranslated = newsItem.translation;
                await this.saveCurrentNewsState();
            } else {
                // Если не удалось загрузить, показываем сообщение
                console.warn('Failed to load next news item');
            }
        }
    },

    async mounted() {
        // Загрузка таймзоны из кэша
        await this.loadTimezone();

        // Загрузка настроек Perplexity
        await this.loadPerplexitySettings();

        // Инициализация времени
        this.updateTime();
        // Обновляем время каждую минуту
        this.timeUpdateTimer = setInterval(() => {
            this.updateTime();
        }, 60 * 1000);

        // Загрузка метрик при разблокировке приложения
        // Если window.appUnlocked не определен, считаем приложение разблокированным
        const isUnlocked = window.appUnlocked !== undefined ? window.appUnlocked : true;

        if (isUnlocked) {
            this.fetchMarketIndices();
            this.scheduleNextUpdate();

            // Проверяем, есть ли сохраненный индекс (не старше 24 часов)
            const savedIndex = await this.loadNewsState();
            const startIndex = savedIndex !== null ? savedIndex : 0;

            // Загружаем новость по индексу
            const newsItem = await this.fetchSingleCryptoNews(startIndex);
            if (newsItem) {
                this.currentNewsIndex = startIndex;
                this.currentNews = newsItem.news;
                this.currentNewsTranslated = newsItem.translation;
                await this.saveCurrentNewsState();
            }
        } else {
            const checkUnlocked = async () => {
                if (window.appUnlocked) {
                    this.fetchMarketIndices();
                    this.scheduleNextUpdate();

                    // Проверяем, есть ли сохраненный индекс (не старше 24 часов)
                    const savedIndex = await this.loadNewsState();
                    const startIndex = savedIndex !== null ? savedIndex : 0;

                    // Загружаем новость по индексу
                    const newsItem = await this.fetchSingleCryptoNews(startIndex);
                    if (newsItem) {
                        this.currentNewsIndex = startIndex;
                        this.currentNews = newsItem.news;
                        this.currentNewsTranslated = newsItem.translation;
                        await this.saveCurrentNewsState();
                    }
                } else {
                    setTimeout(checkUnlocked, 100);
                }
            };
            checkUnlocked();
        }
    },

    beforeUnmount() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        if (this.timeUpdateTimer) {
            clearInterval(this.timeUpdateTimer);
        }
    }
};

