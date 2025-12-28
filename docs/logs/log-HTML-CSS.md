# Тематический лог: HTML-CSS

Лог изменений, связанных с оформлением: разметка, стили.

<!-- ПРАВИЛА ФОРМАТИРОВАНИЯ ЗАПИСЕЙ
**КРИТИЧЕСКИ ВАЖНО**: При упоминании HTML-тегов в записях **ЗАПРЕЩЕНО** использовать обычные угловые скобки `<script>`, `<div>`, `<style>` и т.п. — они блокируют Markdown-превью. **ОБЯЗАТЕЛЬНО** использовать математические угловые скобки: ⟨script⟩, ⟨div⟩, ⟨style⟩ (U+27E8/U+27E9). Для скрытых комментариев используйте HTML-комментарии -->

## Добавление CSS правил для всех брейкпоинтов вертикальной ориентации button-group
28.12.2025 ◆ Добавлены CSS правила для всех брейкпоинтов адаптивной вертикальной ориентации ▶ В responsive-breakpoints.css добавлены правила для брейкпоинтов md (768px), lg (992px), xl (1200px), xxl (1400px) аналогично существующему sm (576px). Для каждого брейкпоинта: вертикальная ориентация на мобильных (< breakpoint), горизонтальная на десктопе (>= breakpoint). Исправлен баг: validator prop verticalBreakpoint принимал все брейкпоинты, но CSS правила существовали только для sm ◉ Обеспечить корректную работу prop verticalBreakpoint для всех поддерживаемых брейкпоинтов @components @button-group @css @responsive @breakpoints @fix

## Исправления шаблона button-group и добавление примеров адаптивности
28.12.2025 ◆ Исправлены ошибки в шаблоне button-group и добавлены примеры адаптивности ▶ В button-group-template.js исправлены три ошибки: добавлен префикс btn- для variant классов в checkbox и radio labels (было outline-primary, стало btn-outline-primary), добавлен 'checked' в omit для input элементов (защита от переопределения :checked binding), исправлена логика слотов button-{index} (теперь слоты переопределяют кнопки вместо добавления). В index.html добавлена секция "Примеры компонента группы кнопок с разными вариантами адаптивности" с 7 примерами: без адаптивности, адаптивность с checkbox/radio/наследованием стилей/размерами dropdown/смешанными типами/кастомным dropdown ◉ Исправить ошибки рендеринга checkbox/radio и слотов, добавить демонстрацию всех вариантов адаптивности компонента @components @button-group @fix @templates @examples @adaptivity

## Добавление группы кнопок в визуальный контроль высоты
28.12.2025 ◆ Добавлена группа радиокнопок в секцию визуального контроля высоты элементов ▶ В index.html в секции "Визуальный контроль высоты элементов" добавлена группа из двух радиокнопок (Опция 1, Опция 2) между одиночной кнопкой и dropdown. Обновлены стили для корректного отображения группы кнопок встык с другими элементами: добавлены правила для cmp-button-group с убиранием border-radius и промежуточных границ ◉ Добавить пример использования компонента button-group в визуальном контроле для проверки выравнивания высоты элементов @components @button-group @alignment @visual-control

## Выравнивание высоты элементов через вертикальный padding
27.12.2025:5cc7037 ◆ Реализовано выравнивание высоты элементов через CSS на основе классов размеров Bootstrap ▶ В responsive-breakpoints.css добавлены правила для вертикального padding внутреннего контейнера кнопки (.btn-responsive > .d-flex) на основе классов размеров: btn-sm (0.25rem), default (0.375rem), btn-lg (0.5rem). Значения соответствуют нативным значениям Bootstrap для form-control-sm, form-control, form-control-lg. Горизонтальный padding остаётся нативным Bootstrap. В index.html подключён shared/utils/pluralize.js ◉ Обеспечить консистентную высоту элементов одного размера (кнопки, поля ввода, dropdown) через централизованное управление вертикальным padding @alignment @height @css @bootstrap @responsive

## Исправление шаблона dropdown: добавление dropdownClasses и защита от undefined
26.12.2025:7e0bc9a ◆ Исправлен шаблон dropdown для корректной работы адаптивности и защиты от ошибок ▶ В dropdown-template корневой div использует :class="dropdownClasses" вместо class="dropdown" для применения адаптивных классов и instanceHash. Добавлена проверка filteredItems && перед обращением к .length в условии отображения пустого состояния поиска (v-if="searchable && filteredItems && filteredItems.length === 0 && searchQuery") ◉ Обеспечить корректное применение CSS классов адаптивности и предотвратить ошибку при отсутствии filteredItems @templates @dropdown @fix @adaptivity

## Автоматическая маркировка элементов DOM через классы avto-{hash}
26.12.2025:39b3a5e ◆ Реализована автоматическая маркировка значимых элементов DOM через классы avto-{hash} ▶ Создан shared/utils/auto-markup.js с MutationObserver для автоматической маркировки элементов при загрузке и при добавлении новых элементов. Правила маркировки: основные секции (main, section, article, aside, header, footer, nav), заголовки (h1-h6), контейнеры (.container, .container-fluid), функциональные блоки (.card, .card-body, .card-header, .card-footer), элементы с data-markup. Исключения: элементы внутри Vue компонентов, мелкие обертки (.row, .col-*), элементы с data-no-markup, элементы с ID, служебные элементы (script, style, noscript). Хэш генерируется на основе пути элемента в DOM (tagName, позиция среди siblings, классы) для детерминированности. Батчинг через requestAnimationFrame для производительности. Ручной вызов markupContainer() для асинхронно загружаемых блоков ◉ Обеспечить автоматическую маркировку всех значимых элементов DOM для навигации в коде через DevTools и указания агенту места в разметке @markup @dom @automation @mutation-observer

## Рефакторинг адаптивности: переход на CSS классы компонентов
26.12.2025:90b50ff ◆ Переписана система адаптивности компонентов с пропсов на CSS классы ▶ Создан app/styles/responsive-breakpoints.css с классами компонентов (.btn-responsive, .dropdown-responsive, .dropdown-menu-item-responsive) и вложенными селекторами для элементов (.icon, .label, .label-short, .suffix, .button-text, .button-text-short, .subtitle). Удалены все классы d-collapse-* и CSS-переменные через data-атрибуты. Логика видимости управляется через @media queries с брейкпоинтом 576px (mobile-first подход). Обновлены шаблоны в core/templates-inline.js: добавлены классы элементов, убраны d-collapse-* классы и data-атрибуты. Обновлены примеры в index.html: убраны все responsive prop ◉ Перенести всю логику адаптивности из JavaScript в CSS, использовать классы компонентов с вложенными селекторами для управления видимостью элементов @adaptivity @responsive @css @refactoring @mobile @breakpoints

## Обновление шаблонов и примеров для адаптивности
23.12.2025:a4dc95b ◆ Обновлены шаблоны компонентов и примеры в index.html для поддержки адаптивности на мобильных устройствах ▶ В core/templates-inline.js обновлён шаблон button-template: добавлена логика условного отображения labelShort на мобильных (d-inline d-md-none) при отсутствии иконки, полный label отображается на десктопе (d-none d-md-inline) или если нет labelShort. Обновлён шаблон dropdown-template: добавлена логика отображения buttonIcon только на мобильных (d-inline d-md-none), buttonTextShort на мобильных при отсутствии иконки, полный buttonText на десктопе. Обновлены примеры в index.html для демонстрации адаптивности: добавлены примеры button с labelShort, dropdown с buttonIcon и buttonTextShort @templates @adaptivity @responsive @mobile @button @dropdown @index

## Вынос шаблонов компонентов из index.html
23.12.2025:8559968 ◆ Вынесены встроенные шаблоны компонентов из index.html в core/templates-inline.js, удалены встроенные шаблоны (~370 строк) из разметки, добавлены подключения новых модулей @templates @refactoring @index @modularity

## Встраивание шаблонов компонентов в index.html
23.12.2025:ca794ba ◆ Встроены все шаблоны компонентов (dropdown-menu-item, button, dropdown, combobox) в index.html как x-template элементы для работы с file:// протоколом, удалена загрузка шаблонов через fetch, добавлены стили для combobox-clear @templates @file-protocol @index @bootstrap

## Исправление позиционирования крестика очистки в combobox
23.12.2025:0756216 ◆ Исправлено позиционирование крестика очистки в режиме input: возвращено абсолютное позиционирование внутри поля с padding справа для input, добавлен z-index для отображения поверх input. Исправлен обработчик handleInput для режима input: добавлено немедленное обновление modelValue через emit update:modelValue для корректной работы v-model @combobox @input-mode @fix @bootstrap

## Настроена минимальная высота контейнера через Bootstrap flexbox
22.12.2025:7214a3a ◆ Добавлены Bootstrap flexbox классы для адаптации `div.container` под минимальную высоту страницы ▶ Применены `d-flex flex-column` на `body` и `#app`, `flex-grow-1` на цепочке контейнеров (`#app`, `container-fluid`, `main`, `container`) для растягивания контейнера на оставшееся пространство viewport ◉ Обеспечить минимальную высоту контейнера, равную доступному пространству между фиксированными header и footer, используя только Bootstrap классы @layout @bootstrap @flexbox @responsive

## Исправлено потоковое расположение квадратных блоков
22.12.2025:4c805b3 ◆ Заменён `d-inline-block d-flex` на `d-inline-flex` для корректного потокового расположения блоков (inline-flex вместо конфликтующих классов) @layout @bootstrap @fix

## Добавлены пронумерованные квадратные блоки для тестирования layout
22.12.2025:6acd619 ◆ Заменён длинный текст на 48 пронумерованных квадратных блоков (100x100px) с разными цветами Bootstrap для визуального тестирования фиксированного header и footer @layout @testing @bootstrap
