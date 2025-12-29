/**
 * ================================================================================================
 * APP FOOTER TEMPLATE - Шаблон компонента футера приложения
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для компонента футера приложения (app-footer).
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="app-footer-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="app-footer-template"
 * - Компонент использует шаблон через template: '#app-footer-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * Структура HTML:
 * - Корневой элемент: ⟨footer⟩ с классами fixed-bottom, bg-body, py-3
 * - Внутренний контейнер: ⟨div class="container-fluid"⟩
 * Layout и CSS-классы:
 * - Фиксированное позиционирование: fixed-bottom
 * - Фон: bg-body (наследует тему от body, переключается вместе с темой)
 * - Многослойная тень направленная вверх с холодными стальными оттенками
 * Слоты:
 * - default — содержимое футера
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Компонент: app/components/app-footer.js
 * - Стили: styles/layout/footer.css
 */

(function() {
    'use strict';

    const TEMPLATE = `<footer class="fixed-bottom bg-body py-3 app-footer">
    <div class="container-fluid">
        <slot></slot>
    </div>
</footer>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'app-footer-template';
        templateScript.textContent = TEMPLATE;
        document.body.appendChild(templateScript);
    }

    // Вставляем шаблон при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertTemplate);
    } else {
        insertTemplate();
    }
})();

