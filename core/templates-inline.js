/**
 * Встроенные шаблоны компонентов
 *
 * ЦЕЛЬ: Хранить шаблоны как строки для работы с file:// протоколом
 *
 * ПРОБЛЕМА: XMLHttpRequest не работает с file:// из-за CORS ограничений
 *
 * РЕШЕНИЕ: Шаблоны хранятся как строки в JavaScript файле
 * - Файл загружается через обычный <script> тег (работает с file://)
 * - Шаблоны вставляются в DOM при загрузке файла
 *
 * ПРЕИМУЩЕСТВА:
 * - Работает с file:// протоколом
 * - Работает с HTTP/HTTPS
 * - Шаблоны вынесены из index.html
 */

(function() {
    'use strict';

    // Шаблоны компонентов как строки
    const TEMPLATES = {
        'dropdown-menu-item-template': `<li class="dropdown-item p-0"
    :class="[itemClasses, { 'active': active, 'disabled': disabled }]"
    @click="handleClick">
    <div class="d-flex align-items-start px-2 py-2">
        <!-- Левая иконка -->
        <span v-if="icon"
              class="icon d-flex align-items-center me-2 pt-1"
              :class="iconOpacity === 0.5 ? 'opacity-50' : ''"
              :style="iconOpacity !== 0.5 ? { opacity: iconOpacity } : {}"
              :data-bs-toggle="tooltipIconBootstrap && tooltipIcon ? 'tooltip' : null"
              :data-bs-title="tooltipIconBootstrap && tooltipIcon ? tooltipIcon : null"
              :title="!tooltipIconBootstrap && tooltipIcon ? tooltipIcon : null"
              @click.stop="handleIconClick">
            <i :class="icon"></i>
        </span>

        <!-- Текстовая область -->
        <div class="flex-grow-1 text-break text-wrap"
             style="min-width: 0;"
             :data-bs-toggle="tooltipTextBootstrap && tooltipText ? 'tooltip' : null"
             :data-bs-title="tooltipTextBootstrap && tooltipText ? tooltipText : null"
             :title="!tooltipTextBootstrap && tooltipText ? tooltipText : null"
             @click.stop="handleTextClick">
            <div class="lh-sm text-wrap">{{ title }}</div>
            <small v-if="subtitle"
                   class="subtitle d-block mt-1 lh-sm"
                   :class="subtitleOpacity === 0.5 ? 'opacity-50' : ''"
                   :style="subtitleOpacity !== 0.5 ? { opacity: subtitleOpacity } : {}">{{ subtitle }}</small>
        </div>

        <!-- Суффикс (badge/icon/indicator/chevron/info) -->
        <span v-if="suffix"
              class="d-flex align-items-center ms-2 pt-1"
              :data-bs-toggle="tooltipSuffixBootstrap && suffixTooltip ? 'tooltip' : null"
              :data-bs-title="tooltipSuffixBootstrap && suffixTooltip ? suffixTooltip : null"
              :title="!tooltipSuffixBootstrap && suffixTooltip ? suffixTooltip : null"
              @click.stop="handleSuffixClick">
            <!-- Badge -->
            <span v-if="suffix.type === 'badge'"
                  :class="['badge', \`bg-\${suffix.variant || 'secondary'}\`]">
                {{ suffix.value }}
            </span>

            <!-- Icon / Indicator / Info -->
            <i v-else-if="['icon', 'indicator', 'info'].includes(suffix.type)"
               :class="suffix.value"></i>

            <!-- Chevron с анимацией -->
            <i v-else-if="suffix.type === 'chevron'"
               :class="[suffix.value, { 'fa-rotate-90': suffix.expanded }]"
               style="transition: transform 0.3s ease;"></i>
        </span>
    </div>
</li>`,

        'button-template': `<button :type="type"
        :class="buttonClasses"
        :disabled="disabled || loading"
        @click="handleClick"
        class="p-0">
    <span :class="containerClasses">
        <!-- Спиннер загрузки -->
        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>

        <!-- Левая иконка -->
        <span v-else-if="icon"
              class="icon d-inline-block text-center"
              :class="iconOpacity === 0.5 ? 'opacity-50' : ''"
              :style="{
                  width: '1.6em',
                  marginRight: '0em',
                  ...(iconOpacity !== 0.5 && iconOpacity !== 1 ? { opacity: iconOpacity } : {})
              }"
              :title="tooltipIcon"
              @click.stop="handleIconClick">
            <i :class="icon"></i>
        </span>

        <!-- Текстовая область -->
        <span v-if="label || labelShort"
              class="text-nowrap"
              :title="tooltipText"
              @click.stop="handleTextClick">
            <!-- Укороченный текст (только на мобильных, если нет иконки, но есть labelShort) -->
            <span v-if="!icon && labelShort"
                  class="label-short">
                {{ labelShort }}
            </span>

            <!-- Полный текст -->
            <span v-if="label"
                  class="label">
                {{ label }}
            </span>
        </span>

        <!-- Суффикс (массив элементов) -->
        <span v-if="suffixArray.length > 0 && !loading"
              class="d-flex align-items-center ms-1">
            <template v-for="(item, index) in suffixArray" :key="index">
                <!-- Badge -->
                <span v-if="item.type === 'badge'"
                      :class="['badge', \`bg-\${item.variant || 'secondary'}\`, index > 0 ? 'ms-1' : '']"
                      :title="item.tooltip"
                      @click.stop="handleSuffixClick($event, item)">
                    {{ item.value }}
                </span>

                <!-- Icon / Indicator / Info -->
                <i v-else-if="['icon', 'indicator', 'info'].includes(item.type)"
                   :class="[item.value, index > 0 ? 'ms-1' : '']"
                   :title="item.tooltip"
                   @click.stop="handleSuffixClick($event, item)"></i>

                <!-- Chevron с анимацией -->
                <i v-else-if="item.type === 'chevron'"
                   :class="[item.value, { 'fa-rotate-90': item.expanded }, index > 0 ? 'ms-1' : '']"
                   style="transition: transform 0.3s ease;"
                   :title="item.tooltip"
                   @click.stop="handleSuffixClick($event, item)"></i>
            </template>
        </span>
    </span>
</button>`,

        'dropdown-template': `<div :class="dropdownClasses" ref="dropdownContainer">
    <!-- Кнопка триггера -->
    <button
        v-if="!$slots.button"
        :class="buttonClasses"
        type="button"
        :id="dropdownId"
        data-bs-toggle="dropdown"
        :aria-expanded="isOpen"
        @click="handleToggle">
        <slot name="button-content">
            <!-- Иконка (только на мобильных, если задана) -->
            <i v-if="buttonIcon"
               :class="[buttonIcon, 'icon']"></i>

            <!-- Укороченный текст (только на мобильных, если нет иконки, но есть buttonTextShort) -->
            <span v-if="!buttonIcon && buttonTextShort"
                  class="button-text-short">
                {{ buttonTextShort }}
            </span>

            <!-- Полный текст -->
            <span v-if="buttonText"
                  class="button-text">
                {{ buttonText }}
            </span>
        </slot>
    </button>

    <!-- Кастомная кнопка через слот -->
    <slot name="button" :isOpen="isOpen" :toggle="handleToggle"></slot>

    <!-- Выпадающее меню -->
    <ul
        class="dropdown-menu"
        :class="[
            { 'show': isOpen },
            menuClasses
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
</div>`,

        'combobox-template': `<!-- Режим простого текстового поля -->
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
</div>`
    };

    /**
     * Вставляет шаблоны в DOM
     */
    function insertTemplates() {
        Object.keys(TEMPLATES).forEach(function(templateId) {
            const templateScript = document.createElement('script');
            templateScript.type = 'text/x-template';
            templateScript.id = templateId;
            templateScript.textContent = TEMPLATES[templateId];
            document.body.appendChild(templateScript);
        });

        console.log(`Загружено шаблонов: ${Object.keys(TEMPLATES).length}`);
    }

    // Вставляем шаблоны при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertTemplates);
    } else {
        insertTemplates();
    }
})();

