/**
 * Загрузчик шаблонов компонентов
 *
 * ЦЕЛЬ: Загружать x-template шаблоны из отдельных файлов и вставлять их в DOM
 *
 * ПРОБЛЕМА: fetch() не работает с file:// протоколом из-за CORS ограничений
 *
 * РЕШЕНИЕ: Использование синхронного XMLHttpRequest для работы с file:// протоколом
 * - Синхронный XMLHttpRequest работает с локальными файлами
 * - Шаблоны загружаются ДО инициализации Vue.js
 * - Шаблоны вставляются в DOM как <script type="text/x-template"> элементы
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Функция loadTemplate() использует синхронный XMLHttpRequest для загрузки файла
 * - Функция loadTemplates() загружает все шаблоны из конфигурации
 * - Шаблоны вставляются в document.body перед закрывающим тегом
 *
 * ПРЕИМУЩЕСТВА:
 * - Работает с file:// протоколом (локальные файлы)
 * - Работает с HTTP/HTTPS (GitHub Pages)
 * - Централизованное управление шаблонами
 * - Легко добавлять новые шаблоны
 */

(function() {
    'use strict';

    /**
     * Проверяет, используется ли file:// протокол
     * @returns {boolean} - true если file://, false если HTTP/HTTPS
     */
    function isFileProtocol() {
        return window.location.protocol === 'file:';
    }

    /**
     * Загружает один шаблон из файла через XMLHttpRequest (для HTTP/HTTPS)
     * @param {string} templatePath - путь к файлу шаблона
     * @param {string} templateId - ID шаблона (соответствует id в x-template)
     * @returns {boolean} - true если успешно, false если ошибка
     */
    function loadTemplateViaXHR(templatePath, templateId) {
        try {
            const xhr = new XMLHttpRequest();
            // Асинхронный режим для HTTP/HTTPS
            xhr.open('GET', templatePath, false);
            xhr.send(null);

            if (xhr.status === 200 || xhr.status === 0) {
                // Файл шаблона уже содержит обёртку <script type="text/x-template" id="...">
                // Вставляем содержимое файла в DOM перед закрывающим тегом body
                document.body.insertAdjacentHTML('beforeend', xhr.responseText);
                return true;
            } else {
                console.error(`Ошибка загрузки шаблона ${templateId}: HTTP ${xhr.status}`);
                return false;
            }
        } catch (error) {
            console.error(`Ошибка загрузки шаблона ${templateId}:`, error);
            return false;
        }
    }

    /**
     * Загружает один шаблон через динамическое создание <script> тега (для file://)
     * @param {string} templatePath - путь к файлу шаблона
     * @param {string} templateId - ID шаблона (соответствует id в x-template)
     * @returns {Promise<boolean>} - Promise, который резолвится в true если успешно, false если ошибка
     */
    function loadTemplateViaScript(templatePath, templateId) {
        return new Promise(function(resolve) {
            const script = document.createElement('script');
            script.type = 'text/x-template';
            script.id = templateId;
            script.src = templatePath;

            script.onload = function() {
                // Содержимое загружено, но нужно извлечь его из script тега
                // Для file:// протокола script.src не работает, поэтому используем fallback
                resolve(false);
            };

            script.onerror = function() {
                console.error(`Ошибка загрузки шаблона ${templateId} через script тег`);
                resolve(false);
            };

            document.head.appendChild(script);

            // Для file:// протокола script.src не работает, поэтому сразу возвращаем false
            // и используем встроенные шаблоны
            setTimeout(function() {
                resolve(false);
            }, 100);
        });
    }

    /**
     * Загружает все шаблоны из конфигурации
     * @param {Array} templatesConfig - массив объектов { path: string, id: string }
     */
    function loadTemplates(templatesConfig) {
        let loadedCount = 0;
        let failedCount = 0;

        templatesConfig.forEach(function(template) {
            if (loadTemplate(template.path, template.id)) {
                loadedCount++;
            } else {
                failedCount++;
            }
        });

        console.log(`Загружено шаблонов: ${loadedCount}, ошибок: ${failedCount}`);

        if (failedCount > 0) {
            console.warn('Некоторые шаблоны не загружены. Приложение может работать некорректно.');
        }
    }

    // Конфигурация шаблонов для загрузки
    const TEMPLATES_CONFIG = [
        { path: 'shared/templates/dropdown-menu-item-template.html', id: 'dropdown-menu-item-template' },
        { path: 'shared/templates/button-template.html', id: 'button-template' },
        { path: 'shared/templates/dropdown-template.html', id: 'dropdown-template' },
        { path: 'shared/templates/combobox-template.html', id: 'combobox-template' }
    ];

    // Загружаем шаблоны при инициализации
    // Шаблоны должны быть загружены ДО Vue.js
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadTemplates(TEMPLATES_CONFIG);
        });
    } else {
        // DOM уже загружен
        loadTemplates(TEMPLATES_CONFIG);
    }

    // Экспортируем функции для использования в других модулях
    window.templateLoader = {
        loadTemplate: loadTemplate,
        loadTemplates: loadTemplates
    };
})();

