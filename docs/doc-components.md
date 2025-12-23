# Компоненты приложения

> Оглавление `docs/doc-components.md`
- § Принципы работы с компонентами
  - *Приоритет библиотек* — использование готовых библиотек перед кастомными компонентами.
  - *Использование Bootstrap* — нативные компоненты Bootstrap вместо кастомных обёрток.
  - *Запрет кастомных стилей* — использование только Bootstrap классов и утилит.
- § Компонент dropdown
  - *Назначение* — Vue-обёртка над Bootstrap dropdown с поддержкой поиска и прокрутки.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — максимальная совместимость с Bootstrap JS API, поиск, прокрутка.
  - *Размещение* — структура файлов компонента.
- § Компонент dropdown-menu-item
  - *Назначение* — универсальный компонент пункта выпадающего меню.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — Bootstrap-совместимость, tooltips, анимация chevron.
  - *Размещение* — структура файлов компонента.
- § Компонент button
  - *Назначение* — универсальный компонент кнопки с иконкой, текстом и суффиксом.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — Bootstrap-совместимость, адаптивность, множественные суффиксы.
  - *Размещение* — структура файлов компонента.

> § <br> ПРИНЦИПЫ РАБОТЫ С КОМПОНЕНТАМИ

## Приоритет библиотек
Перед созданием кастомного компонента **обязательно** проверь наличие подходящих Vue-библиотек с расширяемым API. Приоритет библиотекам, которые имеют плагины, composables, возможность кастомизации. Кастомные компоненты создаются только если библиотека не существует, слишком тяжёлая или требуется специфичная бизнес-логика. Подробности в `docs/doc-lib-vue.md`.

## Использование Bootstrap

### Базовый принцип
Нативные компоненты Bootstrap 5 (dropdown, modal, tooltip, popover и т.п.) используются напрямую через классы и JavaScript API без создания кастомных Vue-обёрток. Bootstrap предоставляет полный функционал: клавиатурную навигацию, позиционирование через Popper.js, управление через JavaScript API, поддержку тем.

### Когда создавать Vue-обёртки
Кастомные Vue-компоненты-обёртки над Bootstrap создаются **только** если требуется дополнительная функциональность, которой нет в нативном Bootstrap:
- Поиск по элементам (например, в dropdown)
- Прокрутка для длинных списков
- Кастомная логика фильтрации/сортировки
- Динамическая загрузка элементов

**Важно:** Кастомные компоненты создаются только для элементов внутри нативных Bootstrap-компонентов (например, пункты меню внутри `dropdown-menu`). Контейнеры Bootstrap (`<div class="dropdown">`, `<div class="modal">` и т.п.) остаются под управлением Bootstrap без Vue-обёрток, **кроме случаев**, когда требуется расширенная функциональность.

### Стратегия максимальной совместимости с Bootstrap (обязательное требование)
При создании Vue-обёрток над Bootstrap-компонентами **обязательно** соблюдать следующие принципы:

1. **Инициализация через Bootstrap JavaScript API:**
   - Использовать `new bootstrap.Dropdown()`, `new bootstrap.Modal()` и т.п.
   - Сохранять ссылку на экземпляр Bootstrap в `data()` или `ref`
   - Инициализировать в `mounted()` через `$nextTick()`

2. **Подписка на события Bootstrap:**
   - Подписываться на события Bootstrap (`show.bs.dropdown`, `hide.bs.dropdown`, `shown.bs.modal` и т.п.)
   - Синхронизировать состояние Vue с состоянием Bootstrap
   - Эмитить события Vue на основе событий Bootstrap

3. **Программный доступ к Bootstrap API:**
   - Предоставлять методы для программного управления (`show()`, `hide()`, `toggle()`)
   - Предоставлять метод `getBootstrapInstance()` для прямого доступа к экземпляру Bootstrap
   - Не блокировать стандартные способы управления Bootstrap

4. **Уничтожение экземпляров:**
   - Вызывать `instance.dispose()` в `beforeUnmount()` для предотвращения утечек памяти
   - Очищать подписки на события

5. **Использование нативных атрибутов Bootstrap:**
   - Сохранять `data-bs-toggle`, `data-bs-target` и другие data-атрибуты
   - Не переопределять стандартное поведение Bootstrap без необходимости

6. **Совместимость с темами:**
   - Использовать только Bootstrap классы и CSS-переменные
   - Не добавлять кастомные стили, которые могут конфликтовать с темами

**Пример правильной реализации:**
```javascript
mounted() {
    this.$nextTick(() => {
        if (window.bootstrap && window.bootstrap.Dropdown) {
            this.dropdownInstance = new window.bootstrap.Dropdown(toggleElement);

            // Подписка на события Bootstrap
            container.addEventListener('show.bs.dropdown', () => {
                this.isOpen = true;
                this.$emit('show');
            });
        }
    });
},

beforeUnmount() {
    if (this.dropdownInstance) {
        this.dropdownInstance.dispose();
    }
},

methods: {
    show() {
        if (this.dropdownInstance) {
            this.dropdownInstance.show();
        }
    },

    getBootstrapInstance() {
        return this.dropdownInstance;
    }
}
```

## Запрет кастомных стилей
Все компоненты используют только Bootstrap классы и утилиты. Кастомный CSS, inline-стили и `<style>`-блоки запрещены, кроме минимальных исключений (например, inline `transition` для анимации chevron в `dropdown-menu-item`). Подробности в `docs/doc-architect.md` (раздел "Фреймворки и UI").

> § <br> КОМПОНЕНТ DROPDOWN

## Назначение
Vue-обёртка над Bootstrap dropdown с поддержкой поиска по элементам и прокрутки для длинных списков. Компонент обеспечивает **максимальную совместимость с Bootstrap JavaScript API**, позволяя использовать все стандартные возможности Bootstrap (позиционирование через Popper.js, клавиатурная навигация, программное управление) с дополнительной функциональностью.

## API компонента

### Входные параметры (props)

**Кнопка триггера:**
- `buttonText` (String, default: 'Dropdown') — текст кнопки.
- `buttonVariant` (String, default: 'primary') — вариант кнопки Bootstrap (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`, `outline-*`, `link`).
- `buttonSize` (String) — размер кнопки (`sm`, `lg`).

**Поиск:**
- `searchable` (Boolean, default: false) — включить поиск по элементам.
- `searchPlaceholder` (String, default: 'Поиск...') — placeholder для поля поиска.
- `emptySearchText` (String, default: 'Ничего не найдено') — текст при отсутствии результатов.
- `searchFunction` (Function) — кастомная функция поиска. Если не указана, используется встроенная фильтрация по строке.

**Прокрутка:**
- `scrollable` (Boolean, default: false) — включить прокрутку для длинных списков.
- `maxHeight` (String, default: '300px') — максимальная высота прокручиваемой области.

**Элементы списка:**
- `items` (Array, default: []) — массив элементов для встроенной фильтрации (опционально, если используется слот).

**Дополнительные:**
- `menuClasses` (String) — дополнительные CSS классы для `dropdown-menu`.
- `menuStyle` (Object) — дополнительные inline стили для `dropdown-menu`.
- `dropdownId` (String) — ID для кнопки триггера (для Bootstrap).

### Выходные события (emits)

- `show` — событие открытия dropdown (синхронизировано с `show.bs.dropdown`).
- `hide` — событие закрытия dropdown (синхронизировано с `hide.bs.dropdown`).
- `search` — событие поиска (эмитится при изменении `searchQuery`).
- `item-select` — событие выбора элемента (эмитится из слота `items`).

### Слоты

- `button` — кастомная кнопка триггера (с ограниченной областью видимости: `isOpen`, `toggle`).
- `button-content` — содержимое стандартной кнопки (если не используется слот `button`).
- `items` — элементы списка (с ограниченной областью видимости: `filteredItems`, `searchQuery`).

### Методы (ref API)

- `show()` — программное открытие dropdown через Bootstrap API.
- `hide()` — программное закрытие dropdown через Bootstrap API.
- `toggle()` — программное переключение dropdown через Bootstrap API.
- `getBootstrapInstance()` — получение экземпляра Bootstrap Dropdown для прямого доступа к API.

## Особенности реализации

### Максимальная совместимость с Bootstrap JS API (обязательное требование)

Компонент реализует стратегию максимальной совместимости с Bootstrap:

1. **Инициализация через Bootstrap JavaScript API:**
   ```javascript
   this.dropdownInstance = new window.bootstrap.Dropdown(toggleElement);
   ```

2. **Подписка на события Bootstrap:**
   - `show.bs.dropdown` → синхронизация `isOpen = true`, эмит `show`
   - `hide.bs.dropdown` → синхронизация `isOpen = false`, эмит `hide`
   - `shown.bs.dropdown`, `hidden.bs.dropdown` — для дополнительной логики

3. **Программный доступ:**
   - Методы `show()`, `hide()`, `toggle()` используют Bootstrap API
   - Метод `getBootstrapInstance()` предоставляет прямой доступ к экземпляру Bootstrap

4. **Уничтожение экземпляров:**
   - `dropdownInstance.dispose()` в `beforeUnmount()` для предотвращения утечек памяти

5. **Использование нативных атрибутов:**
   - Сохранение `data-bs-toggle="dropdown"` для стандартного поведения Bootstrap
   - Сохранение `aria-expanded` для доступности

### Поиск

- Встроенная фильтрация по строке (ищет в значениях объектов или строках).
- Поддержка кастомной функции поиска через prop `searchFunction`.
- Автофокус на поле поиска при открытии dropdown (если `searchable === true`).
- Очистка поиска при закрытии dropdown.

### Прокрутка

- Прокручиваемая область с `overflow-y: auto` и настраиваемой `max-height`.
- Использование только Bootstrap классов для стилизации.

### Использование слотов

Компонент поддерживает гибкое использование через слоты:

```html
<!-- С встроенной фильтрацией через items -->
<cmp-dropdown
    button-text="Выбрать элемент"
    :searchable="true"
    :items="['Элемент 1', 'Элемент 2', 'Элемент 3']">
    <template #items="{ filteredItems }">
        <li v-for="(item, index) in filteredItems" :key="index">
            <dropdown-menu-item :title="item" @click="handleSelect(item)"></dropdown-menu-item>
        </li>
    </template>
</cmp-dropdown>

<!-- С кастомной логикой через слот -->
<cmp-dropdown
    button-text="Меню"
    :searchable="true"
    :search-function="customSearch">
    <template #items="{ filteredItems, searchQuery }">
        <li v-for="item in filteredItems" :key="item.id">
            <dropdown-menu-item :title="item.name" @click="handleSelect(item)"></dropdown-menu-item>
        </li>
    </template>
</cmp-dropdown>

<!-- С кастомной кнопкой -->
<cmp-dropdown :searchable="true">
    <template #button="{ isOpen, toggle }">
        <cmp-button
            :label="isOpen ? 'Закрыть' : 'Открыть'"
            @click="toggle">
        </cmp-button>
    </template>
    <template #items="{ filteredItems }">
        <!-- элементы -->
    </template>
</cmp-dropdown>
```

## Размещение
- Компонент: `shared/components/dropdown.js`
- Шаблон: `shared/templates/dropdown-template.html`
- Зависимости: Bootstrap 5, Vue.js

## Использование

```html
<!-- Базовый dropdown -->
<cmp-dropdown button-text="Меню">
    <template #items>
        <li><dropdown-menu-item title="Пункт 1" @click="handleClick"></dropdown-menu-item></li>
        <li><dropdown-menu-item title="Пункт 2" @click="handleClick"></dropdown-menu-item></li>
    </template>
</cmp-dropdown>

<!-- С поиском -->
<cmp-dropdown
    button-text="Поиск элементов"
    :searchable="true"
    :items="items">
    <template #items="{ filteredItems }">
        <li v-for="item in filteredItems" :key="item.id">
            <dropdown-menu-item :title="item.name" @click="handleSelect(item)"></dropdown-menu-item>
        </li>
    </template>
</cmp-dropdown>

<!-- С прокруткой -->
<cmp-dropdown
    button-text="Длинный список"
    :scrollable="true"
    max-height="400px">
    <template #items>
        <li v-for="item in longList" :key="item.id">
            <dropdown-menu-item :title="item.name" @click="handleSelect(item)"></dropdown-menu-item>
        </li>
    </template>
</cmp-dropdown>

<!-- Программное управление через ref -->
<cmp-dropdown
    ref="myDropdown"
    button-text="Управляемый dropdown"
    @show="handleShow"
    @hide="handleHide">
    <template #items>
        <!-- элементы -->
    </template>
</cmp-dropdown>

<script>
// В методах компонента:
this.$refs.myDropdown.show(); // открыть
this.$refs.myDropdown.hide(); // закрыть
this.$refs.myDropdown.toggle(); // переключить
const bootstrapInstance = this.$refs.myDropdown.getBootstrapInstance(); // прямой доступ к Bootstrap API
</script>
```

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

> § <br> КОМПОНЕНТ BUTTON

## Назначение
Универсальный компонент кнопки с поддержкой иконки, текста и суффикса (badge, icon, indicator, chevron, info). Обёртка над нативной Bootstrap кнопкой для единообразного отображения кнопок в приложении.

## API компонента

### Входные параметры (props)

**Опциональные:**
- `label` (String) — текст кнопки.
- `icon` (String) — CSS класс иконки слева (Font Awesome, Material Symbols).
- `suffix` (Object | Array) — суффикс справа. Может быть одиночным объектом или массивом элементов. Формат элемента:
  ```javascript
  {
    type: 'badge' | 'icon' | 'indicator' | 'chevron' | 'info',
    value: String | Number, // CSS класс для icon/indicator/info/chevron, текст для badge, число для badge
    variant: String, // для badge: 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
    expanded: Boolean, // для chevron: состояние раскрытия (поворот на 90°)
    tooltip: String // всплывающая подсказка для элемента суффикса
  }
  ```
- `tooltipIcon` (String) — всплывающая подсказка для иконки слева.
- `tooltipText` (String) — всплывающая подсказка для текстовой области.
- `tooltipSuffix` (String) — всплывающая подсказка для суффикса (приоритет над `suffix.tooltip`, работает только для одиночного suffix).
- `variant` (String, default: 'primary') — вариант Bootstrap: 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark', 'link'.
- `size` (String) — размер кнопки: 'sm', 'lg' или null (по умолчанию).
- `disabled` (Boolean) — отключённое состояние кнопки.
- `loading` (Boolean) — состояние загрузки (показывает спиннер вместо иконки/текста).
- `type` (String, default: 'button') — тип кнопки: 'button', 'submit', 'reset'.
- `iconOpacity` (Number, default: 1) — прозрачность иконки слева (0-1).
- `responsive` (Object) — настройки адаптивности:
  ```javascript
  {
    hideTextOnMobile: true,  // скрывать текст на мобильных, если есть иконка
    mobilePadding: 'px-2 py-2',  // паддинги на мобильных
    desktopPadding: 'px-md-3 py-md-2'  // паддинги на десктопе
  }
  ```

### Выходные события (emits)

- `click` — общее событие клика по кнопке (эмитится всегда при клике на любую зону).
- `click-icon` — клик по иконке слева (эмитится вместе с `click`).
- `click-text` — клик по текстовой области (эмитится вместе с `click`).
- `click-suffix` — клик по элементу суффикса (эмитится вместе с `click`, передаёт элемент суффикса как второй аргумент).

**Примечание:** Все зоны (иконка, текст, суффикс) эмитят общее событие `click` по умолчанию. Раздельные события (`click-icon`, `click-text`, `click-suffix`) срабатывают только если назначены явно в родительском компоненте.

## Особенности реализации

### Bootstrap-совместимость
- Компонент использует классы `btn`, `btn-{variant}`, `btn-{size}` Bootstrap для базовой стилизации.
- Состояния `disabled` и `loading` применяются через атрибут `disabled` и классы Bootstrap.
- Все стили реализованы через Bootstrap утилиты (`d-flex`, `align-items-center`, `text-break`, `text-wrap`, `px-2`, `py-2`, `opacity-50` и т.п.).
- Поддержка тем Bootstrap через CSS-переменные (`var(--bs-body-color)`, `var(--bs-secondary-color)` и т.п.).
- **Полная обратная совместимость:** компонент — обёртка над нативной Bootstrap кнопкой, все стандартные классы и атрибуты Bootstrap работают корректно.

### Паддинги на тап-зонах
- Паддинги переносятся с кнопки (`p-0`) на внутренний контейнер (`px-2 py-2` или через `responsive` prop).
- Это обеспечивает корректную работу tooltips и раздельных событий кликов по зонам.
- Паттерн проверен в `dropdown-menu-item` и безопасен для использования.

### Подсказки (tooltips)
- **Нативные подсказки браузера** через атрибут `title` (не Bootstrap Tooltip).
- Не требуют инициализации и уничтожения — работают автоматически через браузер.
- Раздельные подсказки для иконки (`tooltipIcon`), текста (`tooltipText`) и каждого элемента суффикса (если `suffix` — массив, каждый элемент может иметь свой `tooltip`).
- Преимущества: простота, отсутствие зависимостей от Bootstrap JS, автоматическая работа на всех устройствах.

### Анимация chevron
- Поворот chevron на 90° через Font Awesome класс `fa-rotate-90` (при `suffix.expanded === true`).
- Плавная анимация через inline `style="transition: transform 0.3s ease;"` (единственное исключение из запрета inline-стилей).

### Адаптивность
- Базовое поведение через Bootstrap responsive utilities в шаблоне (`d-none d-md-inline` для скрытия текста на мобильных).
- Опциональный prop `responsive` для переопределения поведения адаптивности.
- По умолчанию текст скрывается на мобильных устройствах, если есть иконка (для экономии места).
- Если иконки нет, текст всегда виден.

### Множественные суффиксы
- `suffix` может быть массивом элементов для поддержки нескольких badge/icon/indicator одновременно.
- Каждый элемент массива может иметь свой `tooltip`.
- Элементы разделяются отступом `ms-1` (кроме первого).

## Размещение
- Компонент: `shared/components/button.js`
- Шаблон: `shared/templates/button-template.html`
- Зависимости: Bootstrap 5, Font Awesome 6, Vue.js

## Использование

**Базовые примеры:**
```html
<!-- Простая кнопка -->
<cmp-button label="Сохранить" @click="handleSave"></cmp-button>

<!-- С иконкой и вариантом -->
<cmp-button
    label="Удалить"
    icon="fas fa-trash"
    variant="danger"
    @click="handleDelete">
</cmp-button>

<!-- С суффиксом badge -->
<cmp-button
    label="Уведомления"
    icon="fas fa-bell"
    :suffix="{ type: 'badge', value: 5, variant: 'secondary', tooltip: '5 новых уведомлений' }"
    @click="handleNotifications">
</cmp-button>

<!-- Множественные badge -->
<cmp-button
    label="Уведомления"
    icon="fas fa-bell"
    :suffix="[
        { type: 'badge', value: 5, variant: 'secondary', tooltip: '5 новых уведомлений' },
        { type: 'badge', value: 'New', variant: 'primary', tooltip: 'Новая функция' }
    ]"
    @click="handleNotifications">
</cmp-button>

<!-- Состояние loading -->
<cmp-button
    label="Загрузка..."
    :loading="true"
    disabled>
</cmp-button>

<!-- С chevron -->
<cmp-button
    label="Меню"
    :suffix="{ type: 'chevron', value: 'fas fa-chevron-down', expanded: isExpanded }"
    @click="toggleMenu">
</cmp-button>
```
