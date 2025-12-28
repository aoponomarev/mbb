/**
 * ================================================================================================
 * DROPDOWN-MENU-ITEM TEMPLATE - Шаблон компонента пункта выпадающего меню
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для универсального компонента пункта выпадающего меню (cmp-dropdown-menu-item)
 * с поддержкой иконки, текста, подзаголовка и суффикса.
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="dropdown-menu-item-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="dropdown-menu-item-template"
 * - Компонент использует шаблон через template: '#dropdown-menu-item-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * - Поддержка подзаголовка (subtitle) через отдельный элемент
 * - Адаптивность через классы .icon, .subtitle (управляется CSS)
 * - Раздельные события кликов по зонам (иконка, текст, суффикс)
 * - Поддержка нативных и Bootstrap tooltips через условные атрибуты
 * - Анимация chevron через Font Awesome класс fa-rotate-90 и inline transition
 * - Перенос текста через text-break и text-wrap для длинных заголовков
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент dropdown-menu-item")
 * - Адаптивность: docs/doc-guide-ii.md (раздел "Компоненты" → "Адаптивность компонентов")
 */

(function() {
    'use strict';

    const TEMPLATE = `<li class="dropdown-item p-0"
    :class="[itemClasses, { 'active': active, 'disabled': disabled }]"
    @click="handleClick">
    <div class="d-flex align-items-start px-2 py-2">
        <!-- Левая иконка -->
        <span v-if="icon"
              :class="iconClasses"
              :style="iconOpacity !== 0.5 && iconOpacity !== 1 ? { opacity: iconOpacity } : {}"
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
                   :class="subtitleClasses"
                   :style="subtitleOpacity !== 0.5 && subtitleOpacity !== 1 ? { opacity: subtitleOpacity } : {}">{{ subtitle }}</small>
        </div>

        <!-- Суффикс (badge/icon/indicator/chevron/info) -->
        <span v-if="suffix"
              :class="suffixClasses"
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
</li>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'dropdown-menu-item-template';
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

