/**
 * ================================================================================================
 * BUTTON GROUP TEMPLATE - Шаблон компонента группы кнопок
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для Vue-обёртки над Bootstrap .btn-group (cmp-button-group).
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="button-group-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="button-group-template"
 * - Компонент использует шаблон через template: '#button-group-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * - Двойной рендер: группа кнопок (>= breakpoint) и dropdown (< breakpoint)
 * - Поддержка type="button" через cmp-button
 * - Поддержка type="checkbox" и type="radio" через нативный HTML
 * - Наследование variant и size от группы
 * - Слоты для переопределения кнопок
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент button-group")
 * - Стратегия совместимости с Bootstrap: docs/doc-components.md (раздел "Стратегия максимальной совместимости с Bootstrap")
 */

(function() {
    'use strict';

    const TEMPLATE = `<div>
    <!-- Режим 1: Группа кнопок (видна >= breakpoint) -->
    <div :class="groupClasses" v-bind="groupAttrs" ref="groupContainer">
        <template v-for="(button, index) in buttonStates" :key="index">
            <!-- Action кнопка через cmp-button -->
            <cmp-button
                v-if="button.type === 'button'"
                :variant="button.variant || variant || 'secondary'"
                :size="button.size || size"
                :label="button.label"
                :label-short="button.labelShort"
                :icon="button.icon"
                :suffix="button.suffix"
                :disabled="button.disabled"
                :loading="button.loading"
                :tooltip-icon="button.tooltipIcon"
                :tooltip-text="button.tooltipText"
                :tooltip-suffix="button.tooltipSuffix"
                :button-attributes="omit(button, ['type', 'label', 'labelShort', 'icon', 'variant', 'size', 'disabled', 'loading', 'active', 'responsive', 'suffix', 'tooltipIcon', 'tooltipText', 'tooltipSuffix', 'tooltipIconBootstrap', 'tooltipTextBootstrap', 'tooltipSuffixBootstrap', 'class'])"
                :class="['flex-grow-0', button.class]"
                @click="handleButtonClick($event, button, index)"
                @click-icon="handleButtonClickIcon($event, button, index)"
                @click-text="handleButtonClickText($event, button, index)"
                @click-suffix="handleButtonClickSuffix($event, button, index)">
            </cmp-button>

            <!-- Checkbox -->
            <template v-else-if="button.type === 'checkbox'">
                <input
                    :id="getButtonId(index)"
                    class="btn-check"
                    type="checkbox"
                    :checked="buttonStates[index]?.active || false"
                    :disabled="button.disabled || false"
                    v-bind="omit(button, ['type', 'label', 'labelShort', 'icon', 'variant', 'size', 'active', 'disabled', 'responsive', 'suffix', 'tooltipIcon', 'tooltipText', 'tooltipSuffix', 'tooltipIconBootstrap', 'tooltipTextBootstrap', 'tooltipSuffixBootstrap', 'class'])"
                    @change="handleButtonChange($event, button, index)">
                <label
                    :for="getButtonId(index)"
                    class="btn"
                    :class="[
                        button.variant || variant || 'outline-secondary',
                        button.size || size ? \`btn-\${button.size || size}\` : '',
                        buttonStates[index]?.active ? 'active' : '',
                        button.disabled ? 'disabled' : '',
                        button.class
                    ]"
                    :title="button.tooltip || button.tooltipText"
                    v-bind="omit(button, ['type', 'label', 'labelShort', 'icon', 'variant', 'size', 'active', 'disabled', 'responsive', 'suffix', 'tooltipIcon', 'tooltipText', 'tooltipSuffix', 'tooltipIconBootstrap', 'tooltipTextBootstrap', 'tooltipSuffixBootstrap', 'class', 'checked'])">
                    <span v-if="button.icon" :class="button.icon"></span>
                    {{ button.label || button.labelShort }}
                </label>
            </template>

            <!-- Radio -->
            <template v-else-if="button.type === 'radio'">
                <input
                    :id="getButtonId(index)"
                    class="btn-check"
                    type="radio"
                    :name="getRadioName()"
                    :checked="buttonStates[index]?.active || false"
                    :disabled="button.disabled || false"
                    v-bind="omit(button, ['type', 'label', 'labelShort', 'icon', 'variant', 'size', 'active', 'disabled', 'responsive', 'suffix', 'tooltipIcon', 'tooltipText', 'tooltipSuffix', 'tooltipIconBootstrap', 'tooltipTextBootstrap', 'tooltipSuffixBootstrap', 'class', 'name'])"
                    @change="handleButtonChange($event, button, index)">
                <label
                    :for="getButtonId(index)"
                    class="btn"
                    :class="[
                        button.variant || variant || 'outline-secondary',
                        button.size || size ? \`btn-\${button.size || size}\` : '',
                        buttonStates[index]?.active ? 'active' : '',
                        button.disabled ? 'disabled' : '',
                        button.class
                    ]"
                    :title="button.tooltip || button.tooltipText"
                    v-bind="omit(button, ['type', 'label', 'labelShort', 'icon', 'variant', 'size', 'active', 'disabled', 'responsive', 'suffix', 'tooltipIcon', 'tooltipText', 'tooltipSuffix', 'tooltipIconBootstrap', 'tooltipTextBootstrap', 'tooltipSuffixBootstrap', 'class', 'checked', 'name'])">
                    <span v-if="button.icon" :class="button.icon"></span>
                    {{ button.label || button.labelShort }}
                </label>
            </template>
        </template>

        <!-- Слоты для кастомных кнопок -->
        <slot name="default"></slot>
        <template v-for="(button, index) in buttonStates" :key="\`slot-\${index}\`">
            <slot :name="\`button-\${index}\`" :button="button" :index="index"></slot>
        </template>
    </div>

    <!-- Режим 2: Dropdown (виден < breakpoint) -->
    <div v-if="collapseBreakpoint" :class="dropdownClasses">
        <cmp-dropdown
            :button-text="dropdownLabel"
            :button-icon="dropdownIcon"
            :button-variant="computedDropdownVariant"
            :button-size="size">
            <template #items>
                <li v-for="(menuItem, index) in menuItems" :key="index">
                    <cmp-dropdown-menu-item
                        :title="menuItem.title"
                        :icon="menuItem.icon"
                        :suffix="menuItem.suffix"
                        :active="menuItem.active"
                        :disabled="menuItem.disabled"
                        :tooltip-text="menuItem.tooltipText"
                        :tooltip-icon="menuItem.tooltipIcon"
                        :tooltip-suffix="menuItem.tooltipSuffix"
                        @click="handleMenuClick(menuItem)">
                    </cmp-dropdown-menu-item>
                </li>
            </template>
        </cmp-dropdown>
    </div>
</div>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'button-group-template';
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

