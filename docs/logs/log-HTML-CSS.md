# Тематический лог: HTML-CSS

Лог изменений, связанных с оформлением: разметка, стили.

## Встраивание шаблонов компонентов в index.html
23.12.2025 ◆ Встроены все шаблоны компонентов (dropdown-menu-item, button, dropdown, combobox) в index.html как x-template элементы для работы с file:// протоколом, удалена загрузка шаблонов через fetch, добавлены стили для combobox-clear @templates @file-protocol @index @bootstrap
23.12.2025 ◆ Исправлено позиционирование крестика очистки в режиме input: возвращено абсолютное позиционирование внутри поля с padding справа для input, добавлен z-index для отображения поверх input. Исправлен обработчик handleInput для режима input: добавлено немедленное обновление modelValue через emit update:modelValue для корректной работы v-model @combobox @input-mode @fix @bootstrap

## Настроена минимальная высота контейнера через Bootstrap flexbox
22.12.2025:7214a3a ◆ Добавлены Bootstrap flexbox классы для адаптации `div.container` под минимальную высоту страницы ▶ Применены `d-flex flex-column` на `body` и `#app`, `flex-grow-1` на цепочке контейнеров (`#app`, `container-fluid`, `main`, `container`) для растягивания контейнера на оставшееся пространство viewport ◉ Обеспечить минимальную высоту контейнера, равную доступному пространству между фиксированными header и footer, используя только Bootstrap классы @layout @bootstrap @flexbox @responsive

## Исправлено потоковое расположение квадратных блоков
22.12.2025:4c805b3 ◆ Заменён `d-inline-block d-flex` на `d-inline-flex` для корректного потокового расположения блоков (inline-flex вместо конфликтующих классов) @layout @bootstrap @fix

## Добавлены пронумерованные квадратные блоки для тестирования layout
22.12.2025:6acd619 ◆ Заменён длинный текст на 48 пронумерованных квадратных блоков (100x100px) с разными цветами Bootstrap для визуального тестирования фиксированного header и footer @layout @testing @bootstrap
