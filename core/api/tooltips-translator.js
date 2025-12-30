/**
 * ================================================================================================
 * TOOLTIPS TRANSLATOR - Модуль перевода tooltips через Perplexity AI
 * ================================================================================================
 *
 * ЦЕЛЬ: Перевод всех tooltips из конфига на указанный язык через Perplexity API.
 * Используется единый запрос с парсингом ответа по разделителям.
 *
 * ПРИНЦИПЫ:
 * - Единый запрос для всех tooltips (экономия API квоты)
 * - Парсинг ответа по разделителям (---TOOLTIP:ключ---)
 * - Кэширование переводов в localStorage с ключом tooltips-{versionHash}-{language}
 * - Версионирование кэша (при смене версии старые ключи удаляются)
 *
 * ИСПОЛЬЗОВАНИЕ:
 * await window.tooltipsTranslator.translateAllTooltips('en');
 *
 * ССЫЛКИ:
 * - Конфигурация tooltips: core/config/tooltips-config.js
 * - Perplexity API: core/api/perplexity.js
 * - Кэш-менеджер: core/cache/cache-manager.js
 */

(function() {
    'use strict';

    /**
     * Получить название языка для промпта
     * @param {string} languageCode - код языка ('ru', 'en', 'es', etc.)
     * @returns {string} - название языка на английском
     */
    function getLanguageName(languageCode) {
        const languageNames = {
            'ru': 'Russian',
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean'
        };
        return languageNames[languageCode] || 'English';
    }

    /**
     * Распарсить ответ от Perplexity с переводами tooltips
     * Формат ответа:
     * ---TOOLTIP:ключ---
     * переведённый текст
     * ---TOOLTIP:следующий_ключ---
     * следующий переведённый текст
     * ---END---
     * @param {string} response - ответ от Perplexity
     * @returns {Object} - объект с переводами { ключ: переведённый_текст }
     */
    function parseTooltipsResponse(response) {
        const translations = {};

        if (!response || typeof response !== 'string') {
            console.warn('tooltips-translator.parseTooltipsResponse: пустой или некорректный ответ');
            return translations;
        }

        // Регулярное выражение для поиска блоков с переводами
        // Формат: ---TOOLTIP:ключ---\nпереведённый_текст
        const regex = /---TOOLTIP:([^---]+)---\s*\n([^---]+?)(?=\n---TOOLTIP:|---END---|$)/gs;
        let match;

        while ((match = regex.exec(response)) !== null) {
            const key = match[1].trim();
            const translation = match[2].trim();

            if (key && translation) {
                translations[key] = translation;
            }
        }

        // Если парсинг не дал результатов, пробуем альтернативный формат
        if (Object.keys(translations).length === 0) {
            console.warn('tooltips-translator.parseTooltipsResponse: альтернативный парсинг');
            // Альтернативный формат: просто ключ и перевод на отдельных строках
            const lines = response.split('\n');
            let currentKey = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('---TOOLTIP:') && line.endsWith('---')) {
                    currentKey = line.replace('---TOOLTIP:', '').replace('---', '').trim();
                } else if (currentKey && line && !line.startsWith('---')) {
                    translations[currentKey] = line;
                    currentKey = null;
                }
            }
        }

        return translations;
    }

    /**
     * Перевести все tooltips на указанный язык
     * Отправляет единый запрос к Perplexity со всеми tooltips и парсит ответ
     * @param {string} language - код языка ('en', 'es', 'fr', etc.)
     * @returns {Promise<Object>} - объект с переводами { ключ: переведённый_текст }
     * @throws {Error} При ошибке запроса или отсутствии настроек Perplexity
     */
    async function translateAllTooltips(language) {
        if (!window.tooltipsConfig || !window.tooltipsConfig.TOOLTIPS) {
            throw new Error('tooltips-translator: tooltipsConfig не загружен');
        }

        if (!window.perplexityAPI || !window.perplexityAPI.sendPerplexityRequest) {
            throw new Error('tooltips-translator: perplexityAPI не загружен');
        }

        if (!window.cacheManager) {
            throw new Error('tooltips-translator: cacheManager не загружен');
        }

        if (!window.appConfig) {
            throw new Error('tooltips-translator: appConfig не загружен');
        }

        // Получаем настройки Perplexity
        let apiKey, model;
        try {
            apiKey = await window.cacheManager.get('perplexity-api-key');
            model = await window.cacheManager.get('perplexity-model') ||
                    window.appConfig.get('defaults.perplexity.model', 'sonar-pro');
        } catch (error) {
            console.error('tooltips-translator: ошибка загрузки настроек Perplexity:', error);
            throw new Error('Не удалось загрузить настройки Perplexity');
        }

        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            throw new Error('API ключ Perplexity не настроен');
        }

        // Получаем все tooltips из конфига
        const allTooltips = window.tooltipsConfig.TOOLTIPS;
        const tooltipsEntries = Object.entries(allTooltips);

        if (tooltipsEntries.length === 0) {
            console.warn('tooltips-translator: нет tooltips для перевода');
            return {};
        }

        // Формируем список tooltips для промпта
        const tooltipsList = tooltipsEntries.map(([key, text]) => {
            return `---TOOLTIP:${key}---\n${text}`;
        }).join('\n\n');

        // Получаем название языка для промпта
        const targetLanguage = getLanguageName(language);

        // Формируем промпт
        const prompt = `Translate the following Russian tooltips to ${targetLanguage}.
Keep the same format and structure. Translate each tooltip separately, preserving the meaning and context.

${tooltipsList}

---END---

Format: each translation on a new line after its marker (---TOOLTIP:ключ---).
Do not translate the markers themselves, only the text after each marker.`;

        try {
            // Отправляем запрос к Perplexity
            const response = await window.perplexityAPI.sendPerplexityRequest(
                apiKey,
                model,
                [{ role: 'user', content: prompt }]
            );

            // Проверяем на ошибки/ограничения
            if (response && (
                response.toLowerCase().includes('cannot provide') ||
                response.toLowerCase().includes('limited') ||
                response.toLowerCase().includes('error') ||
                response.toLowerCase().includes('unable')
            )) {
                console.warn('tooltips-translator: Perplexity вернул сообщение об ошибке/ограничении');
                throw new Error('Perplexity API вернул ошибку или ограничение');
            }

            // Парсим ответ
            const translations = parseTooltipsResponse(response);

            if (Object.keys(translations).length === 0) {
                console.warn('tooltips-translator: не удалось распарсить ответ от Perplexity');
                throw new Error('Не удалось распарсить ответ от Perplexity');
            }

            // Сохраняем переводы в кэш
            const versionHash = window.appConfig.getVersionHash();
            const cacheKey = `tooltips-${versionHash}-${language}`;

            await window.cacheManager.set(cacheKey, translations, {
                useVersioning: false // Ключ уже содержит версию в имени
            });

            console.log(`tooltips-translator: переведено ${Object.keys(translations).length} tooltips на ${targetLanguage}`);

            // Обновляем кэш в tooltipsConfig
            if (window.tooltipsConfig && typeof window.tooltipsConfig.refreshCache === 'function') {
                await window.tooltipsConfig.refreshCache(language);
            }

            return translations;
        } catch (error) {
            console.error('tooltips-translator.translateAllTooltips:', error);
            throw error;
        }
    }

    // Экспорт в глобальную область
    window.tooltipsTranslator = {
        translateAllTooltips,
        parseTooltipsResponse,
        getLanguageName
    };

    console.log('tooltips-translator.js: инициализирован');
})();

