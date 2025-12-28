/**
 * ================================================================================================
 * BUTTON TEMPLATE - Шаблон компонента кнопки
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для универсального компонента кнопки (cmp-button) с поддержкой иконки, текста и суффикса.
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="button-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="button-template"
 * - Компонент использует шаблон через template: '#button-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * - Поддержка состояния loading (спиннер вместо иконки/текста)
 * - Множественные суффиксы через массив suffixArray
 * - Раздельные события кликов по зонам (иконка, текст, суффикс)
 * - Паддинги перенесены на внутренний контейнер (p-0 на button, padding на внутреннем span)
 * - Автоматическое добавление chevron для dropdown-toggle через suffixArray
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент button")
 * - Адаптивность: docs/doc-guide-ii.md (раздел "Компоненты" → "Адаптивность компонентов")
 * - Выравнивание высоты: docs/doc-guide-ii.md (раздел "Макет и выравнивание" → "Выравнивание высоты элементов")
 */

(function() {
    'use strict';

    const TEMPLATE = `<button :type="type"
        :class="buttonClasses"
        :disabled="disabled || loading"
        @click="handleClick"
        v-bind="buttonAttrs">
    <span :class="containerClasses">
        <!-- Спиннер загрузки -->
        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>

        <!-- Левая иконка -->
        <span v-else-if="icon"
              :class="iconClasses"
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
              :class="labelClasses"
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
              :class="suffixClasses">
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
</button>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'button-template';
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

