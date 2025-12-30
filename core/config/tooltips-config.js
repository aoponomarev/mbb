/**
 * ================================================================================================
 * TOOLTIPS CONFIG - Конфигурация всплывающих подсказок
 * ================================================================================================
 *
 * ЦЕЛЬ: Единый источник правды для всех tooltips в приложении.
 * Исходные тексты на русском языке (базовый язык).
 *
 * ПРИНЦИПЫ:
 * - Все tooltips хранятся в одном месте
 * - Исходные тексты на русском (базовый язык)
 * - При смене языка на другой (en, es, fr и т.д.) - перевод через Perplexity
 * - При языке 'ru' - используются исходные тексты без перевода
 * - Переводы кэшируются в localStorage с ключом tooltips-{versionHash}-{language}
 *
 * СТРУКТУРА КЛЮЧЕЙ:
 * - button.{action}.{type} - tooltips для кнопок (icon, text, suffix.{variant})
 * - dropdown.{action}.{type} - tooltips для пунктов меню (icon, text, suffix.{variant})
 *
 * ИСПОЛЬЗОВАНИЕ:
 * window.tooltipsConfig.getTooltip('button.save.text')
 * window.tooltipsConfig.getTooltip('button.notifications.suffix.badge')
 *
 * ССЫЛКИ:
 * - Принципы единого источника правды: docs/doc-comp-principles.md
 * - Модуль перевода: core/api/tooltips-translator.js
 */

(function() {
    'use strict';

    /**
     * Исходные тексты tooltips на русском языке (базовый язык)
     * Структура: ключ -> текст
     */
    const TOOLTIPS = {
        // === Кнопки (buttons) ===
        'button.save.icon': 'Иконка: Сохранить',
        'button.save.text': 'Основной текст: Сохранить изменения',
        'button.delete.icon': 'Иконка: Удалить',
        'button.delete.text': 'Основной текст: Удалить элемент',
        'button.load.icon': 'Иконка: Загрузить',
        'button.load.text': 'Основной текст: Загрузить файл',
        'button.settings.icon': 'Иконка: Настройки',
        'button.settings.text': 'Основной текст: Открыть настройки',
        'button.save-all.text': 'Основной текст: Сохранить все изменения',
        'button.settings-app.text': 'Основной текст: Открыть настройки приложения',
        'button.notifications.icon': 'Иконка: Уведомления',
        'button.notifications.text': 'Основной текст: Просмотр уведомлений',
        'button.notifications.suffix.badge': 'Суффикс: 5 новых уведомлений',
        'button.notifications.suffix.badge1': 'Суффикс 1: 5 новых уведомлений',
        'button.notifications.suffix.badge2': 'Суффикс 2: Новая функция',
        'button.export.icon': 'Иконка: Экспорт',
        'button.export.text': 'Основной текст: Экспорт данных',
        'button.export.suffix.icon': 'Суффикс: Открыть в новой вкладке',
        'button.connection.icon': 'Иконка: Соединение',
        'button.connection.text': 'Основной текст: Статус подключения',
        'button.connection.suffix.indicator': 'Суффикс: Статус: Активен',
        'button.menu.text': 'Основной текст: Раскрыть меню',
        'button.menu.suffix.chevron': 'Суффикс: Раскрыть/свернуть меню',
        'button.help.icon': 'Иконка: Справка',
        'button.help.text': 'Основной текст: Открыть справку',
        'button.help.suffix.info': 'Суффикс: Открыть справку',

        // === Пункты выпадающего меню (dropdown-menu-item) ===
        'dropdown.market-analytics.icon': 'Иконка: Аналитика рынков',
        'dropdown.market-analytics.text': 'Основной текст: Просмотр статистики',
        'dropdown.notifications.suffix.badge': 'Количество уведомлений',
        'dropdown.notifications.icon': 'Иконка: Уведомления',
        'dropdown.notifications.text': 'Основной текст: Просмотр уведомлений',
        'dropdown.system-settings.icon': 'Иконка: Настройки системы',
        'dropdown.system-settings.text': 'Основной текст: Конфигурация системы',
        'dropdown.export.suffix.icon': 'Открыть в новой вкладке',
        'dropdown.export.icon': 'Иконка: Экспорт',
        'dropdown.export.text': 'Основной текст: Экспорт данных',
        'dropdown.connection.suffix.indicator': 'Статус: Активен',
        'dropdown.connection.icon': 'Иконка: Соединение',
        'dropdown.connection.text': 'Основной текст: Статус подключения',
        'dropdown.settings.suffix.chevron.expand': 'Раскрыть подменю',
        'dropdown.settings.icon': 'Иконка: Настройки',
        'dropdown.settings.text': 'Основной текст: Настройки',
        'dropdown.settings.suffix.chevron.collapse': 'Свернуть подменю',
        'dropdown.analytics.suffix.info': 'Открыть справку',
        'dropdown.analytics.icon': 'Иконка: Аналитика',
        'dropdown.analytics.text': 'Основной текст: Расширенная аналитика',
        'dropdown.blocked.icon': 'Иконка: Заблокировано',
        'dropdown.blocked.text': 'Основной текст: Функция недоступна',
        'dropdown.document.suffix.badge': 'Новая функция',
        'dropdown.document.icon': 'Иконка: Документ',
        'dropdown.document.text': 'Основной текст: Длинный текст'
    };

    /**
     * Кэш переводов (заполняется при инициализации)
     * Структура: { [key]: translatedText }
     */
    let translationsCache = null;
    let currentLanguage = 'ru';
    let currentVersionHash = null;

    /**
     * Загрузить кэш переводов для текущей версии и языка
     * @param {string} language - язык ('ru', 'en', 'es', etc.)
     * @returns {Promise<Object|null>} - кэш переводов или null
     */
    async function loadTranslationsCache(language) {
        if (!window.appConfig || !window.cacheManager) {
            return null;
        }

        try {
            const versionHash = window.appConfig.getVersionHash();
            const cacheKey = `tooltips-${versionHash}-${language}`;
            const cached = await window.cacheManager.get(cacheKey);

            if (cached && typeof cached === 'object') {
                currentLanguage = language;
                currentVersionHash = versionHash;
                translationsCache = cached;
                return cached;
            }
        } catch (error) {
            console.error('tooltips-config.loadTranslationsCache:', error);
        }

        return null;
    }

    /**
     * Получить tooltip по ключу
     * Если язык = 'ru' - возвращает исходный текст из конфига
     * Если язык ≠ 'ru' - возвращает переведённый текст из кэша или исходный (fallback)
     * @param {string} key - ключ tooltip
     * @returns {string} - текст tooltip
     */
    function getTooltip(key) {
        if (!key || !TOOLTIPS[key]) {
            console.warn(`tooltips-config.getTooltip: ключ "${key}" не найден`);
            return '';
        }

        // Если язык = 'ru' (базовый) → возвращаем исходный текст
        if (currentLanguage === 'ru') {
            return TOOLTIPS[key];
        }

        // Если язык ≠ 'ru' → проверяем кэш переводов
        if (translationsCache && translationsCache[key]) {
            return translationsCache[key];
        }

        // Fallback: возвращаем исходный текст, если перевода нет
        return TOOLTIPS[key];
    }

    /**
     * Инициализировать tooltips для указанного языка
     * Вызывается при запуске приложения или смене языка
     * @param {string} language - язык ('ru', 'en', 'es', etc.)
     * @returns {Promise<void>}
     */
    async function init(language) {
        if (!language) {
            language = 'ru';
        }

        // Если язык = 'ru' - устанавливаем currentLanguage, но не загружаем кэш (исходные тексты уже в конфиге)
        if (language === 'ru') {
            currentLanguage = 'ru';
            translationsCache = null; // Очищаем кэш для русского языка
            return;
        }

        // Загружаем кэш переводов для языков ≠ 'ru'
        const cacheLoaded = await loadTranslationsCache(language);

        // Если кэш не загружен, устанавливаем currentLanguage вручную
        if (!cacheLoaded) {
            currentLanguage = language;
            translationsCache = null;
        }

        // Если язык ≠ 'ru' и кэша нет - запускаем перевод (через tooltips-translator)
        if (!translationsCache && window.tooltipsTranslator) {
            try {
                await window.tooltipsTranslator.translateAllTooltips(language);
                // Перезагружаем кэш после перевода
                await loadTranslationsCache(language);
            } catch (error) {
                console.error('tooltips-config.init: ошибка перевода tooltips:', error);
                // При ошибке перевода всё равно устанавливаем currentLanguage, чтобы tooltips показывали исходные тексты
                if (currentLanguage !== language) {
                    currentLanguage = language;
                    translationsCache = null;
                }
            }
        }
    }

    /**
     * Обновить кэш переводов (вызывается после перевода)
     * @param {string} language - язык
     * @returns {Promise<void>}
     */
    async function refreshCache(language) {
        await loadTranslationsCache(language);
    }

    /**
     * Получить текущий язык tooltips (для синхронизации с Vue компонентом)
     * @returns {string} - текущий язык ('ru', 'en', etc.)
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }

    // Экспорт в глобальную область
    window.tooltipsConfig = {
        TOOLTIPS,
        getTooltip,
        init,
        refreshCache,
        loadTranslationsCache,
        getCurrentLanguage
    };

    console.log('tooltips-config.js: инициализирован');
})();

