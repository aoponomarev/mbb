# Тематический лог: HTML-CSS

Лог изменений, связанных с оформлением: разметка, стили.

## Обновление шаблонов и примеров для адаптивности
23.12.2025 ◆ Обновлены шаблоны компонентов и примеры в index.html для поддержки адаптивности на мобильных устройствах ▶ В core/templates-inline.js обновлён шаблон button-template: добавлена логика условного отображения labelShort на мобильных (d-inline d-md-none) при отсутствии иконки, полный label отображается на десктопе (d-none d-md-inline) или если нет labelShort. Обновлён шаблон dropdown-template: добавлена логика отображения buttonIcon только на мобильных (d-inline d-md-none), buttonTextShort на мобильных при отсутствии иконки, полный buttonText на десктопе. Обновлены примеры в index.html для демонстрации адаптивности: добавлены примеры button с labelShort, dropdown с buttonIcon и buttonTextShort @templates @adaptivity @responsive @mobile @button @dropdown @index

## Вынос шаблонов компонентов из index.html
23.12.2025 ◆ Вынесены встроенные шаблоны компонентов из index.html в core/templates-inline.js, удалены встроенные шаблоны (~370 строк) из разметки, добавлены подключения новых модулей @templates @refactoring @index @modularity

## Встраивание шаблонов компонентов в index.html
23.12.2025 ◆ Встроены все шаблоны компонентов (dropdown-menu-item, button, dropdown, combobox) в index.html как x-template элементы для работы с file:// протоколом, удалена загрузка шаблонов через fetch, добавлены стили для combobox-clear @templates @file-protocol @index @bootstrap
23.12.2025 ◆ Исправлено позиционирование крестика очистки в режиме input: возвращено абсолютное позиционирование внутри поля с padding справа для input, добавлен z-index для отображения поверх input. Исправлен обработчик handleInput для режима input: добавлено немедленное обновление modelValue через emit update:modelValue для корректной работы v-model @combobox @input-mode @fix @bootstrap

## Настроена минимальная высота контейнера через Bootstrap flexbox
22.12.2025:7214a3a ◆ Добавлены Bootstrap flexbox классы для адаптации `div.container` под минимальную высоту страницы ▶ Применены `d-flex flex-column` на `body` и `#app`, `flex-grow-1` на цепочке контейнеров (`#app`, `container-fluid`, `main`, `container`) для растягивания контейнера на оставшееся пространство viewport ◉ Обеспечить минимальную высоту контейнера, равную доступному пространству между фиксированными header и footer, используя только Bootstrap классы @layout @bootstrap @flexbox @responsive

## Исправлено потоковое расположение квадратных блоков
22.12.2025:4c805b3 ◆ Заменён `d-inline-block d-flex` на `d-inline-flex` для корректного потокового расположения блоков (inline-flex вместо конфликтующих классов) @layout @bootstrap @fix

## Добавлены пронумерованные квадратные блоки для тестирования layout
22.12.2025:6acd619 ◆ Заменён длинный текст на 48 пронумерованных квадратных блоков (100x100px) с разными цветами Bootstrap для визуального тестирования фиксированного header и footer @layout @testing @bootstrap
