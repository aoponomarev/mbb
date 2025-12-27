/**
 * ================================================================================================
 * COMBOBOX TEMPLATE - Шаблон компонента комбобокса
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для Vue-обёртки над Bootstrap input-group + dropdown (cmp-combobox)
 * с поддержкой автодополнения, фильтрации и клавиатурной навигации.
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="combobox-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="combobox-template"
 * - Компонент использует шаблон через template: '#combobox-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * - Два режима работы: 'input' (простое текстовое поле) и 'combobox' (с dropdown)
 * - Крестик для очистки через CSS псевдоэлемент (combobox-clear) в режиме combobox
 * - Крестик через Font Awesome иконку в режиме input
 * - Поддержка виртуального скроллинга (структура заложена, рендеринг через v-if="!virtualScrolling")
 * - Подсветка найденного текста через v-html и highlightItemText (структура заложена)
 * - Группировка элементов (структура заложена для будущей реализации)
 * - Слоты для элементов списка с ограниченной областью видимости (visibleItems, searchQuery, highlightText, selectedIndex)
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент combobox")
 * - Стратегия совместимости с Bootstrap: docs/doc-components.md (раздел "Стратегия максимальной совместимости с Bootstrap")
 */

(function() {
    'use strict';

    const TEMPLATE = `<!-- Режим простого текстового поля -->
<div v-if="mode === 'input'" class="position-relative">
    <input type="text"
           :class="[inputClasses, { 'pe-5': clearable && modelValue }]"
           :placeholder="placeholder"
           :value="modelValue"
           :disabled="disabled"
           :required="required"
           :pattern="pattern"
           @input="handleInput"
           @keydown="handleKeydown"
           ref="inputElement">
    <!-- Крестик для очистки в режиме input (только Bootstrap классы + Font Awesome) -->
    <i v-if="clearable && modelValue"
       class="fas fa-times position-absolute end-0 top-50 translate-middle-y text-secondary"
       style="cursor: pointer; z-index: 10; padding-right: 0.5rem;"
       @click="handleClear"
       @mousedown.prevent
       title="Очистить">
    </i>
</div>

<!-- Режим комбобокса -->
<div v-else
     class="input-group"
     :class="inputGroupClasses"
     ref="comboboxContainer">
    <!-- Иконка слева (опционально) -->
    <span v-if="icon" class="input-group-text">
        <i :class="icon"></i>
    </span>

    <!-- Поле ввода -->
    <input type="text"
           :class="inputClasses"
           :placeholder="placeholder"
           :value="displayValue"
           :disabled="disabled"
           :required="required"
           :pattern="pattern"
           @input="handleInput"
           @keydown="handleKeydown"
           @focus="handleFocus"
           @blur="handleBlur"
           ref="inputElement">

    <!-- Крестик для очистки (через CSS псевдоэлемент) -->
    <span v-if="clearable && displayValue"
          class="input-group-text combobox-clear"
          @click="handleClear"
          @mousedown.prevent
          title="Очистить">
    </span>

    <!-- Кнопка dropdown -->
    <button class="btn btn-outline-secondary dropdown-toggle"
            type="button"
            :id="dropdownId"
            data-bs-toggle="dropdown"
            :aria-expanded="isOpen"
            :disabled="disabled"
            @click="handleToggle">
    </button>

    <!-- Выпадающее меню -->
    <ul class="dropdown-menu dropdown-menu-end"
        :class="[
            { 'show': isOpen },
            menuClasses
        ]"
        :style="menuStyle">
        <!-- Прокручиваемая область для виртуального скроллинга -->
        <div v-if="scrollable || virtualScrolling"
             class="dropdown-menu-scrollable"
             :style="scrollableStyle"
             @scroll="handleScroll"
             ref="scrollContainer">
            <slot name="items"
                  :filteredItems="visibleItems"
                  :searchQuery="searchQuery"
                  :highlightText="highlightText"
                  :selectedIndex="selectedIndex">
                <!-- Дефолтный рендеринг элементов (обычная прокрутка) -->
                <template v-if="!virtualScrolling">
                    <li v-for="(item, index) in visibleItems"
                        :key="getItemKey(item, index)"
                        :class="{ 'active': index === selectedIndex }">
                        <a class="dropdown-item"
                           :class="{ 'active': isItemSelected(item) }"
                           href="#"
                           @click.prevent="handleItemSelect(item, $event)"
                           @mouseenter="selectedIndex = index">
                            <slot name="item"
                                  :item="item"
                                  :index="index"
                                  :highlightedText="highlightText ? highlightItemText(item) : null">
                                <span v-html="highlightText ? highlightItemText(item) : getItemLabel(item)"></span>
                            </slot>
                        </a>
                    </li>
                </template>
                <!-- Виртуальный скроллинг (рендерим только видимые) -->
                <template v-else>
                    <li v-for="(item, index) in virtualVisibleItems"
                        :key="getItemKey(item, index)"
                        :class="{ 'active': index === selectedIndex }"
                        :style="{ height: virtualItemHeight + 'px' }">
                        <a class="dropdown-item"
                           :class="{ 'active': isItemSelected(item) }"
                           href="#"
                           @click.prevent="handleItemSelect(item, $event)"
                           @mouseenter="selectedIndex = index">
                            <slot name="item"
                                  :item="item"
                                  :index="index"
                                  :highlightedText="highlightText ? highlightItemText(item) : null">
                                <span v-html="highlightText ? highlightItemText(item) : getItemLabel(item)"></span>
                            </slot>
                        </a>
                    </li>
                </template>
            </slot>
        </div>

        <!-- Обычный список (если не прокручиваемый) -->
        <slot v-else
              name="items"
              :filteredItems="visibleItems"
              :searchQuery="searchQuery"
              :highlightText="highlightText"
              :selectedIndex="selectedIndex">
            <li v-for="(item, index) in visibleItems"
                :key="getItemKey(item, index)"
                :class="{ 'active': index === selectedIndex }">
                <a class="dropdown-item"
                   :class="{ 'active': isItemSelected(item) }"
                   href="#"
                   @click.prevent="handleItemSelect(item, $event)"
                   @mouseenter="selectedIndex = index">
                    <slot name="item"
                          :item="item"
                          :index="index"
                          :highlightedText="highlightText ? highlightItemText(item) : null">
                        <span v-html="highlightText ? highlightItemText(item) : getItemLabel(item)"></span>
                    </slot>
                </a>
            </li>
        </slot>

        <!-- Пустое состояние при поиске -->
        <li v-if="visibleItems.length === 0 && searchQuery" class="px-3 py-2 text-muted text-center">
            {{ emptySearchText }}
        </li>

        <!-- Группировка элементов (структура заложена для будущей реализации) -->
        <template v-if="groupBy">
            <!-- Логика группировки будет реализована в computed groupedItems -->
        </template>
    </ul>
</div>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'combobox-template';
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

