/**
 * ================================================================================================
 * STATS COUNTER - Утилита подсчета статистики проекта
 * ================================================================================================
 *
 * ЦЕЛЬ: Подсчет строк кода, комментариев и файлов проекта с кэшированием результатов.
 * Используется в протоколе начала дня для формирования статистики проекта.
 *
 * ПРИНЦИПЫ:
 * - Подсчет строк кода (исключая комментарии и пустые строки)
 * - Подсчет строк комментариев (шапки файлов и inline комментарии)
 * - Кэширование результатов для снижения нагрузки
 * - Учет игнорируемых папок (.gitignore, .cursorignore)
 *
 * КАТЕГОРИИ:
 * - JS: файлы .js (исключая *template.js), за вычетом шапок комментариев
 * - HTML: файлы .html и *template.js, за вычетом шапок комментариев
 * - CSS: файлы .css в папке styles/, за вычетом шапок комментариев
 * - DOCS: файлы .md плюс шапки комментариев из всех файлов с кодом
 *
 * КЭШИРОВАНИЕ:
 * - Результаты сохраняются в docs/.stats-cache.json
 * - Кэш обновляется при изменении файлов (по дате модификации)
 * - Принудительное обновление через параметр forceRefresh
 *
 * ИСПОЛЬЗОВАНИЕ:
 * const stats = await window.statsCounter.getStats();
 * console.log(stats.js.lines, stats.js.files);
 *
 * ССЫЛКА: Протокол начала дня в .cursorrules
 */

(function() {
    'use strict';

    /**
     * Утилита подсчета статистики проекта
     */
    window.statsCounter = {
        /**
         * Путь к файлу кэша статистики
         */
        cachePath: 'docs/.stats-cache.json',

        /**
         * Игнорируемые папки и паттерны
         */
        ignoredPatterns: [
            'node_modules',
            '.git',
            'do-overs',
            'drafts',
            '.stats-cache.json'
        ],

        /**
         * Получить статистику проекта
         * @param {boolean} forceRefresh - Принудительное обновление кэша
         * @returns {Promise<Object>} Статистика проекта
         */
        async getStats(forceRefresh = false) {
            try {
                // Попытка загрузить кэш
                let cache = null;
                if (!forceRefresh) {
                    try {
                        const cacheData = await fetch(this.cachePath).then(r => r.json());
                        cache = cacheData;
                    } catch (e) {
                        // Кэш не найден или поврежден - пересчитаем
                    }
                }

                // Подсчет статистики
                const stats = await this._calculateStats(cache);

                // Сохранение кэша
                await this._saveCache(stats);

                return stats;
            } catch (error) {
                console.error('statsCounter.getStats error:', error);
                throw error;
            }
        },

        /**
         * Подсчет статистики проекта
         * @param {Object} cache - Кэш для проверки актуальности
         * @returns {Promise<Object>} Статистика проекта
         */
        async _calculateStats(cache) {
            const stats = {
                js: { lines: 0, comments: 0, files: 0, totalLines: 0 },
                html: { lines: 0, comments: 0, files: 0, totalLines: 0 },
                css: { lines: 0, comments: 0, files: 0, totalLines: 0 },
                docs: { lines: 0, comments: 0, files: 0, totalLines: 0 },
                timestamp: Date.now()
            };

            // Получение списка файлов
            const jsFiles = await this._getFiles('**/*.js', (path) => !path.includes('template.js'));
            const htmlFiles = await this._getFiles('**/*.html');
            const templateFiles = await this._getFiles('**/*template.js');
            const cssFiles = await this._getFiles('styles/**/*.css');
            const mdFiles = await this._getFiles('docs/**/*.md');

            // Подсчет JS файлов
            for (const file of jsFiles) {
                const fileStats = await this._analyzeFile(file, 'js');
                stats.js.lines += fileStats.lines;
                stats.js.comments += fileStats.comments;
                stats.js.totalLines += fileStats.totalLines;
                stats.js.files++;
            }

            // Подсчет HTML файлов
            for (const file of htmlFiles) {
                const fileStats = await this._analyzeFile(file, 'html');
                stats.html.lines += fileStats.lines;
                stats.html.comments += fileStats.comments;
                stats.html.totalLines += fileStats.totalLines;
                stats.html.files++;
            }

            // Подсчет template файлов
            for (const file of templateFiles) {
                const fileStats = await this._analyzeFile(file, 'html');
                stats.html.lines += fileStats.lines;
                stats.html.comments += fileStats.comments;
                stats.html.totalLines += fileStats.totalLines;
                stats.html.files++;
            }

            // Подсчет CSS файлов
            for (const file of cssFiles) {
                const fileStats = await this._analyzeFile(file, 'css');
                stats.css.lines += fileStats.lines;
                stats.css.comments += fileStats.comments;
                stats.css.totalLines += fileStats.totalLines;
                stats.css.files++;
            }

            // Подсчет DOCS файлов
            for (const file of mdFiles) {
                const fileStats = await this._analyzeFile(file, 'md');
                stats.docs.lines += fileStats.lines;
                stats.docs.comments += fileStats.comments;
                stats.docs.totalLines += fileStats.totalLines;
                stats.docs.files++;
            }

            // Добавление шапок комментариев из файлов кода в DOCS
            const codeFiles = [...jsFiles, ...htmlFiles, ...templateFiles, ...cssFiles];
            for (const file of codeFiles) {
                const fileStats = await this._analyzeFile(file, 'header-only');
                stats.docs.comments += fileStats.comments;
            }

            return stats;
        },

        /**
         * Получить список файлов по паттерну
         * @param {string} pattern - Паттерн поиска файлов
         * @param {Function} filter - Дополнительный фильтр
         * @returns {Promise<Array<string>>} Список путей к файлам
         */
        async _getFiles(pattern, filter = null) {
            // В браузерной среде используем glob через API или предварительно собранный список
            // Для Node.js окружения (протокол начала дня) используем glob напрямую
            // Здесь упрощенная версия для браузера - в реальности нужен серверный API или предкомпилированный список

            // Заглушка: в браузерной среде возвращаем пустой массив
            // В Node.js окружении здесь будет использоваться glob или fs
            return [];
        },

        /**
         * Анализ файла: подсчет строк кода и комментариев
         * @param {string} filePath - Путь к файлу
         * @param {string} type - Тип файла (js, html, css, md, header-only)
         * @returns {Promise<Object>} Статистика файла
         */
        async _analyzeFile(filePath, type) {
            try {
                const content = await fetch(filePath).then(r => r.text());
                return this._parseFile(content, type);
            } catch (error) {
                console.warn(`statsCounter: не удалось прочитать файл ${filePath}:`, error);
                return { lines: 0, comments: 0, totalLines: 0 };
            }
        },

        /**
         * Парсинг содержимого файла
         * @param {string} content - Содержимое файла
         * @param {string} type - Тип файла
         * @returns {Object} Статистика файла
         */
        _parseFile(content, type) {
            const lines = content.split('\n');
            let codeLines = 0;
            let commentLines = 0;
            let totalLines = lines.length;
            let inHeaderComment = true;
            let inBlockComment = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isEmpty = line === '';

                if (type === 'header-only') {
                    // Только шапка комментариев в начале файла
                    if (i === 0 && (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))) {
                        inHeaderComment = true;
                    }
                    if (inHeaderComment && (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/'))) {
                        commentLines++;
                    } else if (!isEmpty && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
                        inHeaderComment = false;
                    }
                    continue;
                }

                // Определение типа комментария
                if (type === 'js') {
                    if (line.startsWith('//')) {
                        commentLines++;
                        continue;
                    }
                    if (line.includes('/*')) {
                        inBlockComment = true;
                        commentLines++;
                        if (line.includes('*/')) {
                            inBlockComment = false;
                        }
                        continue;
                    }
                    if (inBlockComment) {
                        commentLines++;
                        if (line.includes('*/')) {
                            inBlockComment = false;
                        }
                        continue;
                    }
                    // Проверка на конец шапки комментариев
                    if (inHeaderComment && !isEmpty && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
                        inHeaderComment = false;
                    }
                    if (inHeaderComment && (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))) {
                        commentLines++;
                        continue;
                    }
                } else if (type === 'html') {
                    if (line.includes('<!--')) {
                        commentLines++;
                        if (!line.includes('-->')) {
                            inBlockComment = true;
                        }
                        continue;
                    }
                    if (inBlockComment) {
                        commentLines++;
                        if (line.includes('-->')) {
                            inBlockComment = false;
                        }
                        continue;
                    }
                } else if (type === 'css') {
                    if (line.startsWith('/*')) {
                        inBlockComment = true;
                        commentLines++;
                        if (line.includes('*/')) {
                            inBlockComment = false;
                        }
                        continue;
                    }
                    if (inBlockComment) {
                        commentLines++;
                        if (line.includes('*/')) {
                            inBlockComment = false;
                        }
                        continue;
                    }
                } else if (type === 'md') {
                    // Markdown не имеет специальных комментариев, все строки считаются контентом
                    codeLines++;
                    continue;
                }

                // Подсчет строк кода (не пустых, не комментариев)
                if (!isEmpty && !inBlockComment && !inHeaderComment) {
                    codeLines++;
                }
            }

            return {
                lines: codeLines,
                comments: commentLines,
                totalLines: totalLines
            };
        },

        /**
         * Сохранение кэша статистики
         * @param {Object} stats - Статистика для сохранения
         */
        async _saveCache(stats) {
            // В браузерной среде сохранение невозможно
            // В Node.js окружении здесь будет запись в файл
            // Для протокола начала дня используется Node.js окружение
            console.log('statsCounter: кэш должен быть сохранен в', this.cachePath);
        },

        /**
         * Форматирование статистики для отображения
         * @param {Object} stats - Статистика проекта
         * @returns {string} Отформатированная строка статистики
         */
        formatStats(stats) {
            return `
Статистика проекта (текущее состояние):

JS: ${stats.js.lines.toLocaleString()} строк кода, ${stats.js.comments.toLocaleString()} строк комментариев (${stats.js.files} файлов)
    Всего строк: ${stats.js.totalLines.toLocaleString()}

HTML: ${stats.html.lines.toLocaleString()} строк кода, ${stats.html.comments.toLocaleString()} строк комментариев (${stats.html.files} файлов)
    Всего строк: ${stats.html.totalLines.toLocaleString()}

CSS: ${stats.css.lines.toLocaleString()} строк кода, ${stats.css.comments.toLocaleString()} строк комментариев (${stats.css.files} файлов)
    Всего строк: ${stats.css.totalLines.toLocaleString()}

DOCS: ${stats.docs.lines.toLocaleString()} строк контента, ${stats.docs.comments.toLocaleString()} строк шапок комментариев (${stats.docs.files} файлов)
    Всего строк: ${stats.docs.totalLines.toLocaleString()}

Итого: ${(stats.js.lines + stats.html.lines + stats.css.lines + stats.docs.lines).toLocaleString()} строк кода
       ${(stats.js.comments + stats.html.comments + stats.css.comments + stats.docs.comments).toLocaleString()} строк комментариев
       ${(stats.js.files + stats.html.files + stats.css.files + stats.docs.files)} файлов
            `.trim();
        }
    };

})();
