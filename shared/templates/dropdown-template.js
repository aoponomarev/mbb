/**
 * ================================================================================================
 * DROPDOWN TEMPLATE - Шаблон компонента выпадающего меню
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для Vue-обёртки над Bootstrap dropdown (cmp-dropdown) с поддержкой поиска и прокрутки.
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="dropdown-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="dropdown-template"
 * - Компонент использует шаблон через template: '#dropdown-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * - Использование компонента cmp-button для кнопки триггера (через <cmp-button>)
 * - Поддержка кастомной кнопки через слот #button
 * - Поисковое поле с условным рендерингом (v-if="searchable")
 * - Прокручиваемая область для длинных списков (v-if="scrollable")
 * - Слоты для элементов списка с ограниченной областью видимости (filteredItems, searchQuery)
 * - Пустое состояние при поиске с проверкой filteredItems && filteredItems.length
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент dropdown")
 * - Адаптивность: docs/doc-guide-ii.md (раздел "Компоненты" → "Адаптивность компонентов")
 * - Стратегия совместимости с Bootstrap: docs/doc-components.md (раздел "Стратегия максимальной совместимости с Bootstrap")
 */

(function() {
    'use strict';

    const TEMPLATE = `<div :class="dropdownClasses" ref="dropdownContainer">
    <!-- Кнопка триггера через cmp-button -->
    <cmp-button
        v-if="!$slots.button"
        ref="dropdownButton"
        :label="buttonText"
        :label-short="buttonTextShort"
        :icon="buttonIcon"
        :variant="buttonVariant"
        :size="buttonSize"
        :button-attributes="buttonAttributes"
        :classes-add="buttonClassesForDropdown"
        :classes-remove="buttonClassesRemoveForDropdown">
    </cmp-button>

    <!-- Кастомная кнопка через слот -->
    <slot name="button" :isOpen="isOpen" :toggle="handleToggle"></slot>

    <!-- Выпадающее меню -->
    <ul
        :class="[
            menuClassesComputed,
            { 'show': isOpen }
        ]"
        :style="menuStyle">
        <!-- Поисковое поле -->
        <li v-if="searchable" class="px-3 py-2 border-bottom">
            <input
                type="text"
                class="form-control form-control-sm"
                v-model="searchQuery"
                :placeholder="searchPlaceholder"
                @input="handleSearch"
                @keydown.esc="handleEscape"
                ref="searchInput">
        </li>

        <!-- Прокручиваемая область для длинных списков -->
        <template v-if="scrollable">
            <div
                class="dropdown-menu-scrollable"
                :style="{ maxHeight: maxHeight, overflowY: 'auto' }">
                <slot name="items" :filteredItems="filteredItems" :searchQuery="searchQuery"></slot>
            </div>
        </template>

        <!-- Обычный список (если не прокручиваемый) -->
        <template v-else>
            <slot name="items" :filteredItems="filteredItems" :searchQuery="searchQuery"></slot>
        </template>

        <!-- Пустое состояние при поиске -->
        <li v-if="searchable && filteredItems && filteredItems.length === 0 && searchQuery" class="px-3 py-2 text-muted text-center">
            {{ emptySearchText }}
        </li>
    </ul>
</div>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'dropdown-template';
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

