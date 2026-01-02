/**
 * ================================================================================================
 * APP HEADER TEMPLATE - Шаблон компонента хедера приложения
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для компонента хедера приложения (app-header) с кнопками меню и настроек.
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="app-header-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="app-header-template"
 * - Компонент использует шаблон через template: '#app-header-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * Структура HTML:
 * - Корневой элемент: ⟨header⟩ с классами fixed-top, bg-dark, bg-opacity-90, clearfix, data-bs-theme="dark"
 * - Кнопка меню (гамбургер) слева через cmp-dropdown
 * - Кнопка настроек (шестеренка) справа через cmp-dropdown
 * Layout и CSS-классы:
 * - Фиксированное позиционирование: fixed-top
 * - Темная тема: bg-dark bg-opacity-90, data-bs-theme="dark" (фиксированная, не переключается)
 * - Многослойная тень направленная вниз с белым inset для осветления фона
 * - Кнопки используют link variant с text-white text-decoration-none для белого цвета без подчеркивания
 * - Меню настроек выровнено по правому краю через text-end
 * Слоты:
 * - #menu-items — элементы меню (гамбургер) слева
 * - #settings-items — элементы меню настроек справа
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Компонент: app/components/app-header.js
 * - Стили: styles/layout/header.css
 */

(function() {
    'use strict';

    const TEMPLATE = `<header class="fixed-top bg-dark bg-opacity-90 clearfix app-header" data-bs-theme="dark">
    <!-- Кнопка меню (гамбургер) - слева -->
    <cmp-dropdown
        button-text=""
        button-icon="fas fa-bars"
        button-variant="link"
        :menu-offset="-8"
        :classes-add="{ root: 'float-start', button: 'hide-suffix rounded-0 icon-only border-0 text-white text-decoration-none', buttonIcon: 'text-white', buttonContainer: 'py-3' }">
        <template #items>
            <slot name="menu-items"></slot>
        </template>
    </cmp-dropdown>
    <!-- Кнопка авторизации - справа, перед настройками -->
    <div class="float-end py-3 pe-2">
        <slot name="auth-button"></slot>
    </div>
    <!-- Кнопка настроек (шестеренка) - справа -->
    <cmp-dropdown
        button-text=""
        button-icon="fas fa-cog"
        button-variant="link"
        :menu-offset="-8"
        :classes-add="{ root: 'float-end', button: 'hide-suffix rounded-0 icon-only border-0 text-white text-decoration-none', buttonIcon: 'text-white', buttonContainer: 'py-3', menu: 'text-end' }">
        <template #items>
            <slot name="settings-items"></slot>
        </template>
    </cmp-dropdown>
</header>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'app-header-template';
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

