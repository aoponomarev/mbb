#!/usr/bin/env node
/**
 * ================================================================================================
 * STATS COUNTER (Node.js) - Утилита подсчета статистики проекта для протокола начала дня
 * ================================================================================================
 *
 * ЦЕЛЬ: Подсчет строк кода, комментариев и файлов проекта с кэшированием результатов.
 * Используется в протоколе начала дня для формирования статистики проекта.
 *
 * ИСПОЛЬЗОВАНИЕ:
 * node scripts/stats-counter-node.js [--force-refresh]
 *
 * ВЫВОД:
 * JSON объект со статистикой проекта
 */

const fs = require('fs');
const path = require('path');

class StatsCounter {
    constructor() {
        this.cachePath = 'docs/.stats-cache.json';
        this.ignoredDirs = ['node_modules', '.git', 'do-overs', 'drafts'];
        this.ignoredFiles = ['.stats-cache.json'];
    }

    /**
     * Получить статистику проекта
     * @param {boolean} forceRefresh - Принудительное обновление кэша
     * @returns {Promise<Object>} Статистика проекта
     */
    async getStats(forceRefresh = false) {
        try {
            // Попытка загрузить кэш
            let cache = null;
            if (!forceRefresh && fs.existsSync(this.cachePath)) {
                try {
                    const cacheData = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
                    cache = cacheData;
                } catch (e) {
                    // Кэш поврежден - пересчитаем
                }
            }

            // Подсчет статистики
            const stats = await this._calculateStats(cache);

            // Сохранение кэша
            this._saveCache(stats);

            return stats;
        } catch (error) {
            console.error('statsCounter.getStats error:', error);
            throw error;
        }
    }

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
        const jsFiles = this._findFiles('.', file => file.endsWith('.js') && !file.includes('template.js'));
        const htmlFiles = this._findFiles('.', file => file.endsWith('.html'));
        const templateFiles = this._findFiles('.', file => file.includes('template.js'));
        const cssFiles = this._findFiles('styles', file => file.endsWith('.css'));
        // DOCS: только .md файлы, исключая docs/logs и docs/archive
        const allMdFiles = this._findFiles('docs', file => file.endsWith('.md'));
        const mdFiles = allMdFiles.filter(file =>
            !file.startsWith('docs/logs/') && !file.startsWith('docs/archive/')
        );

        // Подсчет JS файлов
        for (const file of jsFiles) {
            const fileStats = this._analyzeFile(file, 'js');
            stats.js.lines += fileStats.lines;
            stats.js.comments += fileStats.comments;
            stats.js.totalLines += fileStats.totalLines;
            stats.js.files++;
        }

        // Подсчет HTML файлов
        for (const file of htmlFiles) {
            const fileStats = this._analyzeFile(file, 'html');
            stats.html.lines += fileStats.lines;
            stats.html.comments += fileStats.comments;
            stats.html.totalLines += fileStats.totalLines;
            stats.html.files++;
        }

        // Подсчет template файлов
        for (const file of templateFiles) {
            const fileStats = this._analyzeFile(file, 'html');
            stats.html.lines += fileStats.lines;
            stats.html.comments += fileStats.comments;
            stats.html.totalLines += fileStats.totalLines;
            stats.html.files++;
        }

        // Подсчет CSS файлов
        for (const file of cssFiles) {
            const fileStats = this._analyzeFile(file, 'css');
            stats.css.lines += fileStats.lines;
            stats.css.comments += fileStats.comments;
            stats.css.totalLines += fileStats.totalLines;
            stats.css.files++;
        }

        // Подсчет DOCS файлов
        for (const file of mdFiles) {
            const fileStats = this._analyzeFile(file, 'md');
            stats.docs.lines += fileStats.lines;
            stats.docs.comments += fileStats.comments;
            stats.docs.totalLines += fileStats.totalLines;
            stats.docs.files++;
        }

        // Добавление шапок комментариев из файлов кода в DOCS
        const codeFiles = [...jsFiles, ...htmlFiles, ...templateFiles, ...cssFiles];
        for (const file of codeFiles) {
            const fileStats = this._analyzeFile(file, 'header-only');
            stats.docs.comments += fileStats.comments;
        }

        return stats;
    }

    /**
     * Поиск файлов в директории
     * @param {string} dir - Директория для поиска
     * @param {Function} filter - Функция фильтрации файлов
     * @returns {Array<string>} Список путей к файлам
     */
    _findFiles(dir, filter) {
        const files = [];

        function walkDir(currentDir) {
            if (!fs.existsSync(currentDir)) return;

            const entries = fs.readdirSync(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relPath = path.relative('.', fullPath).replace(/\\/g, '/');

                // Пропуск игнорируемых директорий
                if (entry.isDirectory()) {
                    const dirName = entry.name;
                    if (this.ignoredDirs.includes(dirName)) continue;
                    walkDir.call(this, fullPath);
                    continue;
                }

                // Пропуск игнорируемых файлов
                if (this.ignoredFiles.includes(entry.name)) continue;

                // Применение фильтра
                if (filter(relPath)) {
                    files.push(relPath);
                }
            }
        }

        walkDir.call(this, dir);
        return files;
    }

    /**
     * Анализ файла: подсчет строк кода и комментариев
     * @param {string} filePath - Путь к файлу
     * @param {string} type - Тип файла (js, html, css, md, header-only)
     * @returns {Object} Статистика файла
     */
    _analyzeFile(filePath, type) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return this._parseFile(content, type);
        } catch (error) {
            console.warn(`statsCounter: не удалось прочитать файл ${filePath}:`, error.message);
            return { lines: 0, comments: 0, totalLines: 0 };
        }
    }

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
                // HTML комментарии
                if (line.includes('<!--')) {
                    commentLines++;
                    if (!line.includes('-->')) {
                        inBlockComment = true;
                    } else {
                        // Однострочный комментарий, проверяем есть ли еще код в строке
                        const beforeComment = line.substring(0, line.indexOf('<!--')).trim();
                        const afterComment = line.substring(line.indexOf('-->') + 3).trim();
                        if (beforeComment || afterComment) {
                            codeLines++;
                        }
                    }
                    continue;
                }
                if (inBlockComment) {
                    commentLines++;
                    if (line.includes('-->')) {
                        inBlockComment = false;
                        // После закрытия комментария может быть код
                        const afterComment = line.substring(line.indexOf('-->') + 3).trim();
                        if (afterComment) {
                            codeLines++;
                        }
                    }
                    continue;
                }
                // Проверка на конец шапки комментариев (для HTML шапка обычно в начале)
                if (inHeaderComment && !isEmpty && !line.includes('<!--')) {
                    inHeaderComment = false;
                }
                if (inHeaderComment && line.includes('<!--')) {
                    commentLines++;
                    continue;
                }
            } else if (type === 'css') {
                // CSS комментарии
                if (line.startsWith('/*')) {
                    inBlockComment = true;
                    commentLines++;
                    if (line.includes('*/')) {
                        inBlockComment = false;
                        // После закрытия комментария может быть код
                        const afterComment = line.substring(line.indexOf('*/') + 2).trim();
                        if (afterComment) {
                            codeLines++;
                        }
                    }
                    continue;
                }
                if (inBlockComment) {
                    commentLines++;
                    if (line.includes('*/')) {
                        inBlockComment = false;
                        // После закрытия комментария может быть код
                        const afterComment = line.substring(line.indexOf('*/') + 2).trim();
                        if (afterComment) {
                            codeLines++;
                        }
                    }
                    continue;
                }
                // Проверка на конец шапки комментариев
                if (inHeaderComment && !isEmpty && !line.startsWith('/*')) {
                    inHeaderComment = false;
                }
                if (inHeaderComment && line.startsWith('/*')) {
                    commentLines++;
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
    }

    /**
     * Сохранение кэша статистики
     * @param {Object} stats - Статистика для сохранения
     */
    _saveCache(stats) {
        try {
            const cacheDir = path.dirname(this.cachePath);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            fs.writeFileSync(this.cachePath, JSON.stringify(stats, null, 2), 'utf8');
        } catch (error) {
            console.warn('statsCounter: не удалось сохранить кэш:', error.message);
        }
    }

    /**
     * Форматирование статистики для отображения с визуализацией
     * @param {Object} stats - Статистика проекта
     * @returns {string} Отформатированная строка статистики
     */
    formatStats(stats) {
        const totalCodeLines = stats.js.lines + stats.html.lines + stats.css.lines + stats.docs.lines;
        const totalCommentLines = stats.js.comments + stats.html.comments + stats.css.comments + stats.docs.comments;
        const totalFiles = stats.js.files + stats.html.files + stats.css.files + stats.docs.files;

        // Расчет долей
        const jsPercent = (stats.js.lines / totalCodeLines) * 100;
        const htmlPercent = (stats.html.lines / totalCodeLines) * 100;
        const cssPercent = (stats.css.lines / totalCodeLines) * 100;
        const docsPercent = (stats.docs.lines / totalCodeLines) * 100;

        // Символы для визуализации (Unicode блоки)
        const blocks = {
            js: '█',
            html: '▓',
            css: '▒',
            docs: '░'
        };

        // ANSI коды цветов (если поддерживается терминалом)
        const colors = {
            js: '\x1b[36m',      // Cyan
            html: '\x1b[33m',    // Yellow
            css: '\x1b[35m',     // Magenta
            docs: '\x1b[32m',    // Green
            reset: '\x1b[0m',    // Reset
            bold: '\x1b[1m',
            dim: '\x1b[2m'
        };

        // Вертикальная таблица (категории - столбцы, метрики - строки)
        const table = `
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│              │ ${colors.js}${blocks.js} JS${colors.reset}          │ ${colors.html}${blocks.html} HTML${colors.reset}        │ ${colors.css}${blocks.css} CSS${colors.reset}          │ ${colors.docs}${blocks.docs} DOCS${colors.reset}         │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Строк кода   │ ${stats.js.lines.toLocaleString().padStart(12)} │ ${stats.html.lines.toLocaleString().padStart(12)} │ ${stats.css.lines.toLocaleString().padStart(12)} │ ${stats.docs.lines.toLocaleString().padStart(12)} │
│ Комментариев │ ${stats.js.comments.toLocaleString().padStart(12)} │ ${stats.html.comments.toLocaleString().padStart(12)} │ ${stats.css.comments.toLocaleString().padStart(12)} │ ${stats.docs.comments.toLocaleString().padStart(12)} │
│ Файлов       │ ${stats.js.files.toString().padStart(12)} │ ${stats.html.files.toString().padStart(12)} │ ${stats.css.files.toString().padStart(12)} │ ${stats.docs.files.toString().padStart(12)} │
│ Доля         │ ${jsPercent.toFixed(1).padStart(10)}% │ ${htmlPercent.toFixed(1).padStart(10)}% │ ${cssPercent.toFixed(1).padStart(10)}% │ ${docsPercent.toFixed(1).padStart(10)}% │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ ${colors.bold}Итого${colors.reset}         │ ${totalCodeLines.toLocaleString().padStart(12)} │ ${totalCommentLines.toLocaleString().padStart(12)} │ ${totalFiles.toString().padStart(12)} │ ${'---'.padStart(10)} │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘`.trim();

        // Создание диаграммы 25x5 блоков
        const diagramWidth = 25;
        const diagramHeight = 5;
        const totalBlocks = diagramWidth * diagramHeight; // 125 блоков

        // Расчет количества блоков для каждой категории (пропорционально)
        const jsBlocks = Math.round((stats.js.lines / totalCodeLines) * totalBlocks);
        const htmlBlocks = Math.round((stats.html.lines / totalCodeLines) * totalBlocks);
        const cssBlocks = Math.round((stats.css.lines / totalCodeLines) * totalBlocks);
        const docsBlocks = totalBlocks - jsBlocks - htmlBlocks - cssBlocks; // Остаток для точности

        // Создание массива блоков (пропорциональное распределение секторами)
        const blockArray = [];

        // Заполнение массива блоками в порядке: JS -> HTML -> CSS -> DOCS
        for (let i = 0; i < jsBlocks; i++) {
            blockArray.push(colors.js + blocks.js + colors.reset);
        }
        for (let i = 0; i < htmlBlocks; i++) {
            blockArray.push(colors.html + blocks.html + colors.reset);
        }
        for (let i = 0; i < cssBlocks; i++) {
            blockArray.push(colors.css + blocks.css + colors.reset);
        }
        for (let i = 0; i < docsBlocks; i++) {
            blockArray.push(colors.docs + blocks.docs + colors.reset);
        }

        // Формирование диаграммы 25x5 (построчно)
        let diagram = colors.bold + 'Распределение кода (25×5):' + colors.reset + '\n';
        for (let row = 0; row < diagramHeight; row++) {
            const rowStart = row * diagramWidth;
            const rowEnd = rowStart + diagramWidth;
            diagram += blockArray.slice(rowStart, rowEnd).join('') + '\n';
        }

        return `
${colors.bold}📊 Статистика проекта${colors.reset}

${table}

${diagram}${colors.dim}Кэш обновлен: ${new Date(stats.timestamp).toLocaleString('ru-RU')}${colors.reset}
        `.trim();
    }

    /**
     * Форматирование статистики для JSON вывода (без визуализации)
     * @param {Object} stats - Статистика проекта
     * @returns {string} Простой текстовый формат
     */
    formatStatsSimple(stats) {
        const totalCodeLines = stats.js.lines + stats.html.lines + stats.css.lines + stats.docs.lines;
        const totalCommentLines = stats.js.comments + stats.html.comments + stats.css.comments + stats.docs.comments;
        const totalFiles = stats.js.files + stats.html.files + stats.css.files + stats.docs.files;

        return `JS: ${stats.js.lines.toLocaleString()} строк кода, ${stats.js.comments.toLocaleString()} комментариев (${stats.js.files} файлов) | Всего: ${stats.js.totalLines.toLocaleString()}
HTML: ${stats.html.lines.toLocaleString()} строк кода, ${stats.html.comments.toLocaleString()} комментариев (${stats.html.files} файлов) | Всего: ${stats.html.totalLines.toLocaleString()}
CSS: ${stats.css.lines.toLocaleString()} строк кода, ${stats.css.comments.toLocaleString()} комментариев (${stats.css.files} файлов) | Всего: ${stats.css.totalLines.toLocaleString()}
DOCS: ${stats.docs.lines.toLocaleString()} строк контента, ${stats.docs.comments.toLocaleString()} шапок (${stats.docs.files} файлов) | Всего: ${stats.docs.totalLines.toLocaleString()}
Итого: ${totalCodeLines.toLocaleString()} строк кода, ${totalCommentLines.toLocaleString()} комментариев, ${totalFiles} файлов`;
    }
}

// CLI интерфейс
if (require.main === module) {
    const forceRefresh = process.argv.includes('--force-refresh');
    const jsonOnly = process.argv.includes('--json');
    const simple = process.argv.includes('--simple');
    const counter = new StatsCounter();

    counter.getStats(forceRefresh)
        .then(stats => {
            if (jsonOnly) {
                // JSON вывод для программной обработки
                console.log(JSON.stringify(stats, null, 2));
            } else if (simple) {
                // Простой текстовый формат
                console.log(counter.formatStatsSimple(stats));
            } else {
                // Красивый формат с визуализацией (по умолчанию)
                console.log(counter.formatStats(stats));
            }
        })
        .catch(error => {
            console.error('Ошибка подсчета статистики:', error);
            process.exit(1);
        });
}

module.exports = StatsCounter;
