# Компоненты приложения

> Оглавление `docs/doc-components.md`
- § Принципы работы с компонентами
  - *Приоритет библиотек* — использование готовых библиотек перед кастомными компонентами.
  - *Использование Bootstrap* — нативные компоненты Bootstrap вместо кастомных обёрток.
  - *Запрет кастомных стилей* — использование только Bootstrap классов и утилит.
- § Компонент dropdown-menu-item
  - *Назначение* — универсальный компонент пункта выпадающего меню.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — Bootstrap-совместимость, tooltips, анимация chevron.
  - *Размещение* — структура файлов компонента.

> § <br> ПРИНЦИПЫ РАБОТЫ С КОМПОНЕНТАМИ

## Приоритет библиотек
Перед созданием кастомного компонента **обязательно** проверь наличие подходящих Vue-библиотек с расширяемым API. Приоритет библиотекам, которые имеют плагины, composables, возможность кастомизации. Кастомные компоненты создаются только если библиотека не существует, слишком тяжёлая или требуется специфичная бизнес-логика. Подробности в `docs/doc-lib-vue.md`.

## Использование Bootstrap
Нативные компоненты Bootstrap 5 (dropdown, modal, tooltip, popover и т.п.) используются напрямую через классы и JavaScript API без создания кастомных Vue-обёрток. Bootstrap предоставляет полный функционал: клавиатурную навигацию, позиционирование через Popper.js, управление через JavaScript API, поддержку тем. Кастомные компоненты создаются только для элементов внутри нативных Bootstrap-компонентов (например, пункты меню внутри `dropdown-menu`). Контейнеры Bootstrap (`<div class="dropdown">`, `<div class="modal">` и т.п.) остаются под управлением Bootstrap без Vue-обёрток.

## Запрет кастомных стилей
Все компоненты используют только Bootstrap классы и утилиты. Кастомный CSS, inline-стили и `<style>`-блоки запрещены, кроме минимальных исключений (например, inline `transition` для анимации chevron в `dropdown-menu-item`). Подробности в `docs/doc-architect.md` (раздел "Фреймворки и UI").

> § <br> КОМПОНЕНТ DROPDOWN-MENU-ITEM

## Назначение
Универсальный компонент пункта выпадающего меню с поддержкой иконки, текста, подзаголовка и суффикса (badge, icon, indicator, chevron, info). Используется внутри нативного Bootstrap `dropdown-menu` для единообразного отображения пунктов меню.

## API компонента

### Входные параметры (props)

**Обязательные:**
- `title` (String, required) — заголовок пункта меню.

**Опциональные:**
- `icon` (String) — CSS класс иконки слева (Font Awesome, Material Symbols).
- `subtitle` (String) — подзаголовок (вторая строка текста).
- `suffix` (Object) — суффикс справа. Формат:
  ```javascript
  {
    type: 'badge' | 'icon' | 'indicator' | 'chevron' | 'info',
    value: String | Number, // CSS класс для icon/indicator/info/chevron, текст для badge, число для badge
    variant: String, // для badge: 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
    expanded: Boolean, // для chevron: состояние раскрытия (поворот на 90°)
    tooltip: String // всплывающая подсказка для суффикса
  }
  ```
- `tooltipIcon` (String) — всплывающая подсказка для иконки слева.
- `tooltipText` (String) — всплывающая подсказка для текстовой области.
- `tooltipSuffix` (String) — всплывающая подсказка для суффикса (приоритет над `suffix.tooltip`).
- `active` (Boolean) — активное состояние пункта меню.
- `disabled` (Boolean) — отключённое состояние пункта меню.
- `iconOpacity` (Number, default: 0.5) — прозрачность иконки слева (0-1).
- `subtitleOpacity` (Number, default: 0.5) — прозрачность подзаголовка (0-1).

### Выходные события (emits)

- `click` — общее событие клика по пункту меню (эмитится всегда при клике на любую зону).
- `click-icon` — клик по иконке слева (эмитится вместе с `click`).
- `click-text` — клик по текстовой области (эмитится вместе с `click`).
- `click-suffix` — клик по суффиксу справа (эмитится вместе с `click`).

**Примечание:** Все зоны (иконка, текст, суффикс) эмитят общее событие `click` по умолчанию. Раздельные события (`click-icon`, `click-text`, `click-suffix`) срабатывают только если назначены явно в родительском компоненте.

## Особенности реализации

### Bootstrap-совместимость
- Компонент использует класс `dropdown-item` Bootstrap для базовой стилизации.
- Состояния `active` и `disabled` применяются через классы Bootstrap.
- Все стили реализованы через Bootstrap утилиты (`d-flex`, `align-items-start`, `text-break`, `text-wrap`, `lh-sm`, `mt-1`, `opacity-50` и т.п.).
- Поддержка тем Bootstrap через CSS-переменные (`var(--bs-body-color)`, `var(--bs-secondary-color)` и т.п.).

### Tooltips
- Инициализация Bootstrap tooltips через `data-bs-toggle="tooltip"` и `data-bs-title`.
- Tooltips инициализируются в `mounted()` через `window.bootstrap.Tooltip`.
- Tooltips уничтожаются в `beforeUnmount()` для предотвращения утечек памяти.
- Раздельные tooltips для иконки, текста и суффикса.

### Анимация chevron
- Поворот chevron на 90° через Font Awesome класс `fa-rotate-90` (при `suffix.expanded === true`).
- Плавная анимация через inline `style="transition: transform 0.3s ease;"` (единственное исключение из запрета inline-стилей).

### Перенос текста
- Текстовая область использует `text-break` и `text-wrap` для переноса длинного текста.
- `min-width: 0` на flex-элементе для корректного обрезания текста.
- Подзаголовок отображается через `<small>` с классом `mt-1` для отступа.

### Выравнивание элементов
- Иконка и суффикс выровнены по первой строке текста через `align-items-start` и `pt-1`.
- Текстовая область растягивается через `flex-grow-1`.

## Размещение
- Компонент: `shared/components/dropdown-menu-item.js`
- Шаблон: `shared/templates/dropdown-menu-item-template.html`
- Зависимости: Bootstrap 5, Font Awesome 6, Vue.js

## Использование нативного Bootstrap dropdown-menu

**Важно:** Кастомный компонент `dropdown-menu` (контейнер выпадающего меню) **не создаётся**. Используется нативный Bootstrap `dropdown-menu` через классы и JavaScript API.

**Причины:**
- Bootstrap 5 уже предоставляет полный функционал: клавиатурную навигацию (стрелки, Escape, Tab), позиционирование через Popper.js, управление через JavaScript API (`Dropdown.getInstance()`), поддержку тем через `data-bs-theme`, закрытие при клике вне меню.
- Кастомный компонент добавляет избыточную логику, которую Bootstrap уже покрывает.

**Пример использования:**
```html
<div class="dropdown">
  <button class="btn dropdown-toggle" data-bs-toggle="dropdown">Меню</button>
  <ul class="dropdown-menu">
    <dropdown-menu-item
      title="Пункт меню"
      icon="fas fa-icon"
      :suffix="{ type: 'badge', value: 5, variant: 'secondary' }"
      @click="handleClick">
    </dropdown-menu-item>
  </ul>
</div>
```

