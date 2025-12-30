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
 * - Отображение времени МСК
 * - Обновление метрик 3 раза в день (09:00, 12:00, 18:00 МСК)
 *
 * ДАННЫЕ:
 * - Метрики рынка: fgi, vix, btcDom, oi, fr, lsr (строковые значения)
 * - Числовые значения: fgiValue, vixValue, btcDomValue, oiValue, frValue, lsrValue
 * - Время МСК: mskTime (формат "MCK hh:mm")
 *
 * МЕТОДЫ:
 * - fetchMarketIndices() — загрузка всех метрик через window.marketMetrics
 * - getMSKTime() — получение текущего времени МСК в формате "MCK hh:mm"
 * - getNextUpdateTime() — расчет следующего времени обновления (09:00, 12:00, 18:00 МСК)
 * - scheduleNextUpdate() — планирование следующего обновления
 * - formatOIMobile() — форматирование OI для мобильной версии (компактный формат с буквенным обозначением миллиарда, например "8.4B")
 * - formatValueMobile() — форматирование значения для мобильной версии (округление до десятых долей, кроме FR)
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

            // Время МСК
            mskTime: 'MCK --:--',

            // Таймеры
            updateTimer: null,
            timeUpdateTimer: null
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

        // Получение текущего времени МСК в формате "MCK hh:mm"
        getMSKTime() {
            try {
                const now = new Date();
                // Получаем время в МСК через Intl.DateTimeFormat
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Moscow',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const parts = formatter.formatToParts(now);
                const hours = parts.find(p => p.type === 'hour').value;
                const minutes = parts.find(p => p.type === 'minute').value;
                return `MCK ${hours}:${minutes}`;
            } catch (error) {
                // Fallback на системное время
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                return `MCK ${hours}:${minutes}`;
            }
        },

        // Обновление времени МСК
        updateMSKTime() {
            this.mskTime = this.getMSKTime();
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
        }
    },

    mounted() {
        // Инициализация времени МСК
        this.updateMSKTime();
        // Обновляем время каждую минуту
        this.timeUpdateTimer = setInterval(() => {
            this.updateMSKTime();
        }, 60 * 1000);

        // Загрузка метрик при разблокировке приложения
        // Если window.appUnlocked не определен, считаем приложение разблокированным
        const isUnlocked = window.appUnlocked !== undefined ? window.appUnlocked : true;

        if (isUnlocked) {
            this.fetchMarketIndices();
            this.scheduleNextUpdate();
        } else {
            const checkUnlocked = () => {
                if (window.appUnlocked) {
                    this.fetchMarketIndices();
                    this.scheduleNextUpdate();
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

