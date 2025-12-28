# Компоненты приложения

> Оглавление `docs/doc-components.md`
- § Принципы работы с компонентами
  - *Приоритет библиотек* — использование готовых библиотек перед кастомными компонентами.
  - *Использование Bootstrap* — нативные компоненты Bootstrap вместо кастомных обёрток.
  - *Запрет кастомных стилей* — использование только Bootstrap классов и утилит.
  - *Универсальный механизм добавления CSS классов* — пропы `classesAdd` и `classesRemove` для управления классами на различных элементах компонентов.
  - *Важные замечания по реализации* — типичные проблемы при разработке Vue-компонентов и их решения.
- § Компонент dropdown
  - *Назначение* — Vue-обёртка над Bootstrap dropdown с поддержкой поиска и прокрутки.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — максимальная совместимость с Bootstrap JS API, поиск, прокрутка, использование cmp-button для кнопки триггера.
  - *Размещение* — структура файлов компонента.
- § Компонент combobox
  - *Назначение* — Vue-обёртка над Bootstrap input-group + dropdown с автодополнением.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — максимальная совместимость с Bootstrap JS API, крестик через CSS псевдоэлемент, режим простого input, структура для расширений.
  - *Размещение* — структура файлов компонента.
- § Компонент dropdown-menu-item
  - *Назначение* — универсальный компонент пункта выпадающего меню.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — Bootstrap-совместимость, tooltips, анимация chevron.
  - *Размещение* — структура файлов компонента.
- § Компонент button
  - *Назначение* — универсальный компонент кнопки с иконкой, текстом и суффиксом.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — Bootstrap-совместимость, адаптивность, множественные суффиксы, использование в комплексных компонентах.
  - *Размещение* — структура файлов компонента.
- § Компонент button-group
  - *Назначение* — Vue-обёртка над Bootstrap .btn-group с поддержкой кнопок, checkbox и radio.
  - *API компонента* — входные параметры (props) и выходные события (emits).
  - *Особенности реализации* — максимальная совместимость с Bootstrap JS API, наследование стилей, адаптивное схлопывание в dropdown, синхронизация состояния.
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

## Универсальный механизм добавления CSS классов

Все компоненты поддерживают универсальный механизм управления CSS классами через пропы `classesAdd` и `classesRemove`, который позволяет гибко управлять классами на различных внутренних элементах компонентов.

### Реализация

**Пропы `classesAdd` и `classesRemove`:**
- Тип: `Object`
- По умолчанию: `{}`
- Структура: объект с ключами, соответствующими элементам компонента (например, `root`, `icon`, `label`, `suffix`, `menu`, `button`)

**Обработка в computed свойствах:**
Все компоненты используют утилиту `window.classManager.processClassesToString()` для обработки классов:

```javascript
return window.classManager.processClassesToString(
    baseClasses,
    this.classesAdd?.root,
    this.classesRemove?.root
);
```

**Порядок обработки:**
1. Базовые классы компонента добавляются в массив
2. Классы из `classesRemove` удаляются из базовых классов
3. Классы из `classesAdd` добавляются к результату

### Порядок объединения классов

Классы объединяются в следующем порядке:
1. **Базовые классы** компонента (например, `'dropdown'`, `'btn-group'`, `'btn'`)
2. **Классы адаптивности** (например, `'dropdown-responsive'`, `'btn-responsive'`)
3. **Детерминированный хэш экземпляра** (`instanceHash`)
4. **Условные классы** для адаптивности (например, `'has-icon'`, `'has-text-short'`) — добавляются автоматически на основе пропсов
5. **Классы из `classesRemove`** — удаляются из базовых классов
6. **Классы из `classesAdd`** — добавляются к результату

**Важно:** Порядок обработки (сначала удаление, потом добавление) позволяет сначала убрать базовые классы, а затем добавить новые, что обеспечивает предсказуемое поведение.

### Примеры использования

```html
<!-- Добавление классов к корневому элементу -->
<cmp-dropdown
    button-text="Меню"
    :classes-add="{ root: 'float-start' }">
</cmp-dropdown>

<!-- Управление классами на разных элементах (cmp-button) -->
<cmp-button
    label="Кнопка"
    icon="fas fa-save"
    :classes-add="{ root: 'my-custom-class', icon: 'custom-icon', suffix: 'hide-suffix' }">
</cmp-button>

<!-- Удаление классов -->
<cmp-button
    label="Кнопка"
    :classes-remove="{ root: 'btn-primary' }">
</cmp-button>

<!-- Комбинация добавления и удаления -->
<cmp-dropdown
    button-text="Меню"
    :classes-add="{ root: 'float-start', button: 'hide-suffix' }"
    :classes-remove="{ root: 'some-class' }">
</cmp-dropdown>
```

### Элементы компонентов, поддерживающие управление классами

**`cmp-button`:**
- `root` — корневой элемент `<button>`
- `icon` — обертка иконки `<span class="icon">`
- `label` — обертка текста `<span class="text-nowrap">`
- `suffix` — обертка суффикса `<span class="suffix-container">`

**`cmp-dropdown`:**
- `root` — корневой элемент `<div class="dropdown">`
- `button` — кнопка триггера (передается в `cmp-button` как `root`)
- `buttonIcon` — иконка кнопки (передается в `cmp-button` как `icon`)
- `buttonLabel` — текст кнопки (передается в `cmp-button` как `label`)
- `buttonSuffix` — суффикс кнопки (передается в `cmp-button` как `suffix`)
- `menu` — выпадающее меню `<ul class="dropdown-menu">`

**`cmp-dropdown-menu-item`:**
- `root` — корневой элемент `<li class="dropdown-item">`
- `icon` — обертка иконки `<span class="icon">`
- `subtitle` — подзаголовок `<small class="subtitle">`
- `suffix` — обертка суффикса `<span>`

**`cmp-combobox`:**
- `root` — корневой элемент (`<div class="input-group">` или `<div class="position-relative">` в зависимости от режима)
- `menu` — выпадающее меню `<ul class="dropdown-menu">`

**`cmp-button-group`:**
- `root` — корневой элемент группы `<div class="btn-group">`
- `dropdown` — корневой элемент dropdown (передается в `cmp-dropdown` как `root`)
- `dropdownButton` — кнопка dropdown (передается в `cmp-dropdown` как `button`)
- `dropdownMenu` — меню dropdown (передается в `cmp-dropdown` как `menu`)

## Адаптивность компонентов

Адаптивность компонентов (видимость иконок, текста, коротких текстов) управляется через CSS классы компонентов с вложенными селекторами. Подробности в `docs/doc-guide-ii.md` (раздел "Компоненты" → "Адаптивность компонентов").

## Важные замечания по реализации Vue-компонентов

### Работа с `this.$el` в Vue 3

**Проблема:** При использовании `x-template` шаблонов в Vue 3, `this.$el` может быть не DOM элементом, а Comment node. Это происходит из-за того, что Vue 3 использует фрагменты (fragments) для компонентов.

**Решение:** При доступе к DOM в `mounted()` или `computed` свойствах всегда проверяйте тип `this.$el`:

```javascript
// ❌ НЕПРАВИЛЬНО - может упасть, если $el это Comment node
mounted() {
    this.$el.querySelector('button');
}

// ✅ ПРАВИЛЬНО - проверка типа и поиск реального элемента
mounted() {
    this.$nextTick(() => {
        let rootEl = this.$el;

        // Если $el это Comment node, ищем реальный элемент
        if (rootEl.nodeType === Node.COMMENT_NODE) {
            // Стратегия 1: поиск в следующих элементах
            rootEl = rootEl.nextSibling;
            // Стратегия 2: поиск в родителе
            if (!rootEl || !rootEl.querySelector) {
                rootEl = rootEl?.parentElement?.querySelector('button');
            }
        }

        if (rootEl && rootEl.querySelector) {
            const button = rootEl.querySelector('button');
        }
    });
}
```

**Альтернативный подход:** Используйте `ref` для прямого доступа к элементам:

```javascript
// В шаблоне
<button ref="buttonElement">...</button>

// В компоненте
mounted() {
    if (this.$refs.buttonElement) {
        // Прямой доступ к элементу
    }
}
```

### Размещение методов в компоненте

**Проблема:** Методы, вызываемые из `computed` свойств, должны быть определены в секции `methods`, а не в `computed`.

**Решение:** Всегда размещайте методы в секции `methods`:

```javascript
// ❌ НЕПРАВИЛЬНО - метод в computed
computed: {
    instanceHash() {
        const context = this.getParentContext(); // Ошибка: getParentContext не найден
        // ...
    },
    getParentContext() { // Это computed, а не method!
        // ...
    }
}

// ✅ ПРАВИЛЬНО - метод в methods
computed: {
    instanceHash() {
        const context = this.getParentContext(); // Работает
        // ...
    }
},
methods: {
    getParentContext() { // Метод в правильном месте
        // ...
    }
}
```

**Важно:** Методы, вызываемые из `computed`, должны быть чистыми функциями без побочных эффектов и не должны зависеть от DOM (так как `computed` может вызываться до монтирования).

### Проверка доступности утилит

**Проблема:** Утилиты (`window.classManager`, `window.hashGenerator` и т.д.) могут быть недоступны на момент выполнения кода, если модули загружаются асинхронно.

**Решение:** Всегда проверяйте доступность утилит перед использованием:

```javascript
// ❌ НЕПРАВИЛЬНО - может упасть, если утилита не загружена
computed: {
    buttonClasses() {
        return window.classManager.processClassesToString(baseClasses, ...);
    }
}

// ✅ ПРАВИЛЬНО - проверка с fallback
computed: {
    buttonClasses() {
        if (!window.classManager) {
            console.error('classManager not found in buttonClasses');
            return baseClasses.join(' ');
        }
        return window.classManager.processClassesToString(baseClasses, ...);
    }
}
```

**Порядок загрузки:** Убедитесь, что утилиты загружаются до Vue-компонентов в `core/modules-config.js` (раздел `utilities`).

### Вызов методов из computed свойств

**Проблема:** Вызов методов из `computed` свойств может привести к проблемам, если метод зависит от DOM или имеет побочные эффекты.

**Решение:**
- Методы, вызываемые из `computed`, должны быть чистыми функциями
- Не используйте DOM-зависимые методы в `computed` (используйте `mounted()` или `watch`)
- Если метод зависит от `this.$el`, добавьте проверки на доступность:

```javascript
// ✅ ПРАВИЛЬНО - метод с проверками для использования в computed
methods: {
    getParentContext() {
        // Проверяем доступность DOM элемента
        if (!this.$el) {
            return 'root'; // Fallback
        }

        // Проверяем тип элемента
        if (this.$el.nodeType === Node.COMMENT_NODE) {
            return 'root'; // Fallback для Comment node
        }

        // Безопасная работа с DOM
        if (!this.$el.parentElement) {
            return 'root';
        }

        // ...
    }
}
```

### Важные замечания по реализации механизма classesAdd/classesRemove

**Проблема 1: Жестко заданные классы в шаблонах**
**Проблема:** Жестко заданные классы в шаблонах (например, `class="p-0"` на кнопке) конфликтуют с механизмом `classesAdd`/`classesRemove` и не могут быть переопределены.

**Решение:** Все классы должны управляться через computed свойства и механизм `classesAdd`/`classesRemove`. Удалите все жестко заданные классы из шаблонов, кроме базовых Bootstrap классов.

```javascript
// ❌ НЕПРАВИЛЬНО - жестко заданный класс в шаблоне
const TEMPLATE = `<button class="p-0" :class="buttonClasses">...</button>`;

// ✅ ПРАВИЛЬНО - классы управляются через computed
const TEMPLATE = `<button :class="buttonClasses">...</button>`;
```

**Проблема 2: Старый проп `:class` вместо `:classes-add`**
**Проблема:** Использование старого пропа `:class` в шаблонах для передачи классов дочерним компонентам конфликтует с новым механизмом `classesAdd`/`classesRemove`.

**Решение:** Замените все `:class` на `:classes-add` и `:classes-remove` для дочерних компонентов.

```javascript
// ❌ НЕПРАВИЛЬНО - старый проп :class
<cmp-button :class="['flex-grow-0', button.class]"></cmp-button>

// ✅ ПРАВИЛЬНО - новый механизм
<cmp-button :classes-add="{ root: button.class ? \`flex-grow-0 \${button.class}\` : 'flex-grow-0' }"></cmp-button>
```

**Проблема 3: Объекты с разной структурой в computed свойствах**
**Проблема:** Computed свойства, которые передают объекты с классами дочерним компонентам, возвращают объекты с разной структурой (то `{}`, то `{icon: "p-0"}`), что нарушает реактивность Vue.

**Решение:** Всегда возвращайте объекты с фиксированной структурой (все ключи присутствуют, даже если значение `undefined`).

```javascript
// ❌ НЕПРАВИЛЬНО - объект с разной структурой
buttonClassesForDropdown() {
    const result = {};
    if (this.classesAdd?.button) result.root = this.classesAdd.button;
    if (this.classesAdd?.buttonIcon) result.icon = this.classesAdd.buttonIcon;
    return result; // Может быть {} или {root: "...", icon: "..."}
}

// ✅ ПРАВИЛЬНО - фиксированная структура
buttonClassesForDropdown() {
    return {
        root: this.classesAdd?.button || undefined,
        container: this.classesAdd?.buttonContainer || undefined,
        icon: this.classesAdd?.buttonIcon || undefined,
        label: this.classesAdd?.buttonLabel || undefined,
        suffix: this.classesAdd?.buttonSuffix || undefined
    };
}
```

**Проблема 4: Порядок обработки классов**
**Проблема:** Если сначала добавлять классы, а потом удалять, базовые классы могут конфликтовать с новыми.

**Решение:** Сначала удалять классы из `classesRemove`, затем добавлять классы из `classesAdd`.

```javascript
// ✅ ПРАВИЛЬНО - сначала удаление, потом добавление
function processClasses(baseClasses, classesAdd, classesRemove) {
    let classes = [...baseClasses];

    // Сначала удаляем
    if (classesRemove) {
        const removeClasses = Array.isArray(classesRemove)
            ? classesRemove
            : classesRemove.split(' ').filter(c => c);
        classes = classes.filter(c => !removeClasses.includes(c));
    }

    // Затем добавляем
    if (classesAdd) {
        const addClasses = Array.isArray(classesAdd)
            ? classesAdd
            : classesAdd.split(' ').filter(c => c);
        classes.push(...addClasses);
    }

    return [...new Set(classes.filter(c => c))];
}
```

**Проблема 5: Отсутствие классов выравнивания в нативных элементах**
**Проблема:** Нативные HTML элементы (например, `<label>` для checkbox/radio) не имеют классов выравнивания, которые есть в Vue-компонентах.

**Решение:** Добавьте классы выравнивания (`d-flex align-items-center`) к нативным элементам для консистентности.

```javascript
// ✅ ПРАВИЛЬНО - классы выравнивания для label
<label class="btn d-flex align-items-center" :class="[...]">
    <span v-if="button.icon" :class="button.icon"></span>
    {{ button.label }}
</label>
```

### CSS селекторы с динамическими классами

**Проблема:** При использовании `instanceHash` в CSS селекторах через `querySelector` или `querySelectorAll`, специальные символы в именах классов требуют экранирования.

**Решение:** Используйте экранирование для специальных символов или предпочитайте поиск по другим атрибутам:

```javascript
// ❌ НЕПРАВИЛЬНО - может не найти элемент, если в классе есть специальные символы
const element = document.querySelector(`.${this.instanceHash}`);

// ✅ ПРАВИЛЬНО - экранирование специальных символов
function escapeCSSSelector(selector) {
    return selector.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
const element = document.querySelector(`.${escapeCSSSelector(this.instanceHash)}`);

// ✅ АЛЬТЕРНАТИВА - использование data-атрибутов
// В шаблоне: <button :data-instance-hash="instanceHash">
const element = document.querySelector(`[data-instance-hash="${this.instanceHash}"]`);
```

### Ревизия компонентов на правильное использование механизма

**Проверенные компоненты:**
- ✅ `cmp-button` — использует `classesAdd`/`classesRemove` для `root`, `container`, `icon`, `label`, `suffix`
- ✅ `cmp-dropdown` — использует `classesAdd`/`classesRemove` для `root`, `button`, `menu`; передает классы в `cmp-button` через `buttonClassesForDropdown` с фиксированной структурой
- ✅ `cmp-combobox` — использует `classesAdd`/`classesRemove` для `root`, `menu`
- ✅ `cmp-dropdown-menu-item` — использует `classesAdd`/`classesRemove` для `root`, `icon`, `subtitle`, `suffix`
- ✅ `cmp-button-group` — использует `classesAdd`/`classesRemove` для `root`, `dropdown`, `dropdownButton`, `dropdownMenu`; передает классы в `cmp-dropdown` через `dropdownClassesForGroup` с фиксированной структурой

**Проверенные шаблоны:**
- ✅ Все шаблоны используют `:classes-add` и `:classes-remove` вместо старого пропа `:class` для дочерних компонентов
- ✅ Жестко заданные классы удалены из шаблонов (кроме базовых Bootstrap классов)
- ✅ Нативные элементы (checkbox/radio label) имеют классы выравнивания (`d-flex align-items-center`)

**Проверенные computed свойства:**
- ✅ Все computed свойства, возвращающие объекты для передачи в дочерние компоненты, имеют фиксированную структуру (все ключи присутствуют, даже если значение `undefined`)
- ✅ Порядок обработки классов: сначала удаление (`classesRemove`), затем добавление (`classesAdd`)

> § <br> КОМПОНЕНТ DROPDOWN

## Назначение
Vue-обёртка над Bootstrap dropdown с поддержкой поиска по элементам и прокрутки для длинных списков. Компонент обеспечивает **максимальную совместимость с Bootstrap JavaScript API**, позволяя использовать все стандартные возможности Bootstrap (позиционирование через Popper.js, клавиатурная навигация, программное управление) с дополнительной функциональностью. Кнопка триггера реализована через компонент `cmp-button` для единообразия и переиспользования.

## API компонента

### Входные параметры (props)

**Кнопка триггера:**
- `buttonText` (String, default: 'Dropdown') — текст кнопки (отображается на десктопе, если задана иконка или укороченный текст).
- `buttonTextShort` (String) — укороченная версия текста для мобильных (используется, если `buttonIcon` не задан).
- `buttonIcon` (String) — иконка для мобильной версии (Font Awesome класс, отображается только на мобильных).
- `buttonVariant` (String, default: 'primary') — вариант кнопки Bootstrap (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`, `outline-*`, `link`). Передается в компонент `cmp-button` как prop `variant`.
- `buttonSize` (String) — размер кнопки (`sm`, `lg`). Передается в компонент `cmp-button` как prop `size`.
- `dropdownId` (String) — ID для кнопки триггера (используется в `buttonAttributes.id` для Bootstrap).

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
- `classesAdd` (Object, default: `{}`) — классы для добавления на различные элементы компонента. Структура: `{ root: 'классы', button: 'классы', menu: 'классы' }`. См. раздел "Универсальный механизм добавления CSS классов".
- `classesRemove` (Object, default: `{}`) — классы для удаления с различных элементов компонента. Структура: `{ root: 'классы', button: 'классы', menu: 'классы' }`.
- `menuClasses` (String) — дополнительные CSS классы для `dropdown-menu` (для обратной совместимости, рекомендуется использовать `classesAdd.menu`).
- `menuStyle` (Object) — дополнительные inline стили для `dropdown-menu`.

### Выходные события (emits)

- `show` — событие открытия dropdown (синхронизировано с `show.bs.dropdown`).
- `hide` — событие закрытия dropdown (синхронизировано с `hide.bs.dropdown`).
- `search` — событие поиска (эмитится при изменении `searchQuery`).
- `item-select` — событие выбора элемента (эмитится из слота `items`).

### Слоты

- `button` — кастомная кнопка триггера (с ограниченной областью видимости: `isOpen`, `toggle`). Если используется, стандартная кнопка через `cmp-button` не отображается.
- `items` — элементы списка (с ограниченной областью видимости: `filteredItems`, `searchQuery`).

### Методы (ref API)

- `show()` — программное открытие dropdown через Bootstrap API.
- `hide()` — программное закрытие dropdown через Bootstrap API.
- `toggle()` — программное переключение dropdown через Bootstrap API.
- `getBootstrapInstance()` — получение экземпляра Bootstrap Dropdown для прямого доступа к API.

## Особенности реализации

### Максимальная совместимость с Bootstrap JS API

Компонент реализует стратегию максимальной совместимости с Bootstrap. Общие принципы см. раздел "Стратегия максимальной совместимости с Bootstrap" выше.

**Специфичное для dropdown:**
- Использование компонента cmp-button для кнопки триггера:
   - Кнопка триггера реализована через компонент `cmp-button` для единообразия
   - Атрибуты Bootstrap передаются через prop `buttonAttributes` компонента `cmp-button`
   - Доступ к реальному DOM-элементу через `$refs.dropdownButton.$el` для инициализации Bootstrap
   - Полная совместимость с Bootstrap API: Bootstrap работает с реальным DOM-элементом, а не с Vue-компонентом

### Поиск

- Встроенная фильтрация по строке (ищет в значениях объектов или строках).
- Поддержка кастомной функции поиска через prop `searchFunction`.
- Автофокус на поле поиска при открытии dropdown (если `searchable === true`).
- Очистка поиска при закрытии dropdown.

### Прокрутка

- Прокручиваемая область с `overflow-y: auto` и настраиваемой `max-height`.
- Использование только Bootstrap классов для стилизации.

### Адаптивность

Компонент поддерживает адаптивное отображение кнопки триггера для мобильных устройств через компонент `cmp-button`:

- **С иконкой на мобильных:** если задан `buttonIcon`, на мобильных отображается только иконка, на десктопе — только текст `buttonText`.
- **С укороченным текстом на мобильных:** если `buttonIcon` не задан, но задан `buttonTextShort`, на мобильных отображается укороченный текст, на десктопе — полный `buttonText`.
- **Без адаптивности:** если не заданы ни `buttonIcon`, ни `buttonTextShort`, всегда отображается полный `buttonText`.

Адаптивность реализована через CSS классы компонента `.dropdown-responsive` и `.btn-responsive` с вложенными селекторами. Подробности в `docs/doc-guide-ii.md` (раздел "Компоненты" → "Адаптивность компонентов").

**Примеры:**
```html
<!-- С иконкой на мобильных -->
<cmp-dropdown
    button-text="Выбрать пункт"
    button-icon="fas fa-chevron-down">
</cmp-dropdown>

<!-- С укороченным текстом на мобильных -->
<cmp-dropdown
    button-text="Выбрать пункт"
    button-text-short="Выбрать">
</cmp-dropdown>

<!-- Без адаптивности -->
<cmp-dropdown
    button-text="Выбрать пункт">
</cmp-dropdown>
```

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
- Шаблон: `shared/templates/dropdown-template.js` (ID: `dropdown-template`)
- Зависимости: Bootstrap 5, Vue.js

> § <br> КОМПОНЕНТ COMBOBOX

## Назначение
Vue-обёртка над Bootstrap `input-group` + `dropdown` с поддержкой автодополнения, фильтрации, клавиатурной навигации, произвольного ввода и валидации. Полностью совместим с Bootstrap JS API.

## API компонента

### Props

#### Базовые
- `modelValue` (`String | Array`) — значение компонента (v-model). Для множественного выбора — массив значений.
- `items` (`Array`) — массив элементов для выбора. Может быть массивом строк или объектов с полями `label`, `value`, `id`.
- `placeholder` (`String`, default: `'Выберите или введите...'`) — плейсхолдер для поля ввода.

#### Режимы
- `mode` (`String`, default: `'combobox'`) — режим работы: `'combobox'` (комбобокс) или `'input'` (простое текстовое поле).
- `multiple` (`Boolean`, default: `false`) — режим множественного выбора (структура заложена для будущей реализации).

#### Поведение
- `allowCustom` (`Boolean`, default: `true`) — разрешить произвольный ввод (не только из списка).
- `strict` (`Boolean`, default: `false`) — только значения из списка (запрет произвольного ввода).
- `autocomplete` (`Boolean`, default: `true`) — включить автодополнение и фильтрацию.
- `clearable` (`Boolean`, default: `true`) — показывать крестик для очистки (реализовано через CSS псевдоэлемент `::before`).

#### Фильтрация и поиск
- `filterFunction` (`Function`, default: `null`) — кастомная функция фильтрации `(items, query) => filteredItems`.
- `debounce` (`Number`, default: `300`) — задержка для debounce поиска (мс).
- `highlightMatches` (`Boolean`, default: `false`) — подсветка найденного текста (структура заложена для будущей реализации).
- `itemLabel` (`String | Function`, default: `null`) — поле для label или функция получения label.
- `itemValue` (`String | Function`, default: `null`) — поле для value или функция получения value.

#### Прокрутка
- `scrollable` (`Boolean`, default: `false`) — включить прокрутку для длинных списков.
- `maxHeight` (`String`, default: `'300px'`) — максимальная высота прокручиваемой области.
- `virtualScrolling` (`Boolean`, default: `false`) — виртуальный скроллинг (структура заложена для будущей реализации).
- `virtualItemHeight` (`Number`, default: `38`) — высота элемента для виртуального скроллинга (px).

#### Группировка
- `groupBy` (`String | Function`, default: `null`) — поле для группировки или функция (структура заложена для будущей реализации).

#### Валидация
- `required` (`Boolean`, default: `false`) — обязательное поле.
- `pattern` (`String`, default: `null`) — паттерн для валидации (HTML5).
- `disabled` (`Boolean`, default: `false`) — отключить компонент.

#### UI
- `size` (`String`, default: `null`) — размер: `'sm'` или `'lg'`.
- `variant` (`String`, default: `'outline-secondary'`) — вариант кнопки dropdown (Bootstrap button variants).
- `icon` (`String`, default: `null`) — иконка слева (Font Awesome класс).

#### Дополнительные
- `classesAdd` (Object, default: `{}`) — классы для добавления на различные элементы компонента. Структура: `{ root: 'классы', menu: 'классы' }`. См. раздел "Универсальный механизм добавления CSS классов".
- `classesRemove` (Object, default: `{}`) — классы для удаления с различных элементов компонента. Структура: `{ root: 'классы', menu: 'классы' }`.
- `menuClasses` (`String`, default: `''`) — дополнительные классы для dropdown-menu (для обратной совместимости, рекомендуется использовать `classesAdd.menu`).
- `menuStyle` (`Object`, default: `{}`) — дополнительные стили для dropdown-menu.
- `dropdownId` (`String`, default: `null`) — ID для кнопки dropdown (для Bootstrap).
- `emptySearchText` (`String`, default: `'Ничего не найдено'`) — текст при пустом результате поиска.

### Emits
- `update:modelValue` — обновление значения (v-model).
- `select` — выбор элемента: `{ value, label, item }`.
- `input` — ввод текста: `value`.
- `focus` — фокус на поле ввода.
- `blur` — потеря фокуса.
- `clear` — очистка значения.
- `show` — открытие dropdown.
- `hide` — закрытие dropdown.

### Методы (через ref)
- `show()` — программное открытие dropdown.
- `hide()` — программное закрытие dropdown.
- `toggle()` — программное переключение dropdown.
- `getBootstrapInstance()` — получение экземпляра Bootstrap Dropdown для прямого доступа к API.

## Особенности реализации

### Максимальная совместимость с Bootstrap
Компонент реализует стратегию максимальной совместимости с Bootstrap. Общие принципы см. раздел "Стратегия максимальной совместимости с Bootstrap" выше.

### Крестик для очистки
Реализован через CSS псевдоэлемент `::before` с Font Awesome иконкой (`\f00d`). Условный рендеринг через `v-if="clearable && displayValue"`.

### Режим простого текстового поля
При `mode="input"` компонент рендерится как простой `<input>`, без dropdown и дополнительных элементов.

### Клавиатурная навигация
- `ArrowDown` / `ArrowUp` — навигация по элементам.
- `Enter` — выбор элемента или принятие произвольного значения.
- `Escape` — закрытие dropdown.
- `Tab` — закрытие dropdown при переходе.

### Структура для будущих расширений
- **Подсветка найденного текста** (пункт 6): метод `highlightItemText()`, computed `highlightText`, слот `item` с `highlightedText`.
- **Виртуальный скроллинг** (пункт 8): computed `visibleItems`, `virtualVisibleItems`, обработчик `handleScroll()`, props `virtualScrolling`, `virtualItemHeight`.
- **Множественный выбор** (пункт 10): prop `multiple`, логика в `handleItemSelect()`, computed `isMultiple`.
- **Группировка** (пункт 9): prop `groupBy`, структура в шаблоне.

## Примеры использования

```html
<!-- Базовый комбобокс -->
<cmp-combobox
    v-model="value"
    :items="items"
    placeholder="Выберите или введите...">
</cmp-combobox>

<!-- С иконкой и автодополнением -->
<cmp-combobox
    v-model="value"
    :items="items"
    icon="fas fa-search"
    :highlight-matches="true"
    placeholder="Начните вводить...">
</cmp-combobox>

<!-- С прокруткой для длинного списка -->
<cmp-combobox
    v-model="value"
    :items="longList"
    :scrollable="true"
    max-height="200px">
</cmp-combobox>

<!-- Только из списка (strict) -->
<cmp-combobox
    v-model="value"
    :items="items"
    :strict="true"
    :allow-custom="false">
</cmp-combobox>

<!-- Режим простого текстового поля -->
<cmp-combobox
    v-model="value"
    mode="input"
    placeholder="Простое поле...">
</cmp-combobox>

<!-- С кастомной фильтрацией -->
<cmp-combobox
    v-model="value"
    :items="items"
    :filter-function="customFilter">
</cmp-combobox>
```

## Размещение
- Компонент: `shared/components/combobox.js`
- Шаблон: `shared/templates/combobox-template.js` (ID: `combobox-template`)
- Зависимости: Bootstrap 5, Font Awesome 6, Vue.js

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
- `tooltipIcon` (String) — всплывающая подсказка для иконки слева (по умолчанию нативная через `title`, можно переключить на Bootstrap через `tooltipIconBootstrap`).
- `tooltipText` (String) — всплывающая подсказка для текстовой области (по умолчанию нативная через `title`, можно переключить на Bootstrap через `tooltipTextBootstrap`).
- `tooltipSuffix` (String) — всплывающая подсказка для суффикса (приоритет над `suffix.tooltip`, по умолчанию нативная через `title`, можно переключить на Bootstrap через `tooltipSuffixBootstrap`).
- `tooltipIconBootstrap` (Boolean, default: false) — использовать Bootstrap tooltip для иконки вместо нативной подсказки.
- `tooltipTextBootstrap` (Boolean, default: false) — использовать Bootstrap tooltip для текста вместо нативной подсказки.
- `tooltipSuffixBootstrap` (Boolean, default: false) — использовать Bootstrap tooltip для суффикса вместо нативной подсказки.
- `active` (Boolean) — активное состояние пункта меню.
- `disabled` (Boolean) — отключённое состояние пункта меню.
- `iconOpacity` (Number, default: 0.5) — прозрачность иконки слева (0-1).
- `subtitleOpacity` (Number, default: 0.5) — прозрачность подзаголовка (0-1).
- `classesAdd` (Object, default: `{}`) — классы для добавления на различные элементы компонента. Структура: `{ root: 'классы', icon: 'классы', subtitle: 'классы', suffix: 'классы' }`. См. раздел "Универсальный механизм добавления CSS классов".
- `classesRemove` (Object, default: `{}`) — классы для удаления с различных элементов компонента. Структура: `{ root: 'классы', icon: 'классы', subtitle: 'классы', suffix: 'классы' }`.

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

### Подсказки (tooltips)
- **По умолчанию:** нативные подсказки браузера через атрибут `title` (не требуют инициализации).
- **Опционально:** Bootstrap tooltips через props `tooltipIconBootstrap`, `tooltipTextBootstrap`, `tooltipSuffixBootstrap` (Boolean, default: false).
- Если соответствующий prop = `true`, используется Bootstrap tooltip с инициализацией через `window.bootstrap.Tooltip`.
- Bootstrap tooltips уничтожаются в `beforeUnmount()` для предотвращения утечек памяти.
- Раздельные подсказки для иконки (`tooltipIcon`), текста (`tooltipText`) и суффикса (`tooltipSuffix` или `suffix.tooltip`).

**Примеры использования:**
```html
<!-- Нативные подсказки (по умолчанию) -->
<dropdown-menu-item
  title="Пункт меню"
  icon="fas fa-cog"
  tooltip-icon="Настройки"
  tooltip-text="Основной текст"
  :suffix="{ type: 'badge', value: 5, tooltip: '5 новых' }">
</dropdown-menu-item>

<!-- Bootstrap tooltips (опционально) -->
<dropdown-menu-item
  title="Пункт меню"
  icon="fas fa-cog"
  tooltip-icon="Настройки"
  tooltip-text="Основной текст"
  :tooltip-icon-bootstrap="true"
  :tooltip-text-bootstrap="true"
  :suffix="{ type: 'badge', value: 5, tooltip: '5 новых' }"
  :tooltip-suffix-bootstrap="true">
</dropdown-menu-item>
```

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
- Шаблон: `shared/templates/dropdown-menu-item-template.js` (ID: `dropdown-menu-item-template`)
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
- `label` (String) — текст кнопки (отображается на десктопе, если задана иконка или укороченный текст).
- `labelShort` (String) — укороченная версия текста для мобильных (используется, если `icon` не задан).
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
- `buttonId` (String) — идентификатор экземпляра для генерации детерминированного хэша (instanceHash).
- `classesAdd` (Object, default: `{}`) — классы для добавления на различные элементы компонента. Структура: `{ root: 'классы', icon: 'классы', label: 'классы', suffix: 'классы' }`. См. раздел "Универсальный механизм добавления CSS классов".
- `classesRemove` (Object, default: `{}`) — классы для удаления с различных элементов компонента. Структура: `{ root: 'классы', icon: 'классы', label: 'классы', suffix: 'классы' }`.
- `buttonAttributes` (Object, default: {}) — произвольные атрибуты для передачи на корневой `<button>` элемент. Используется для интеграции с Bootstrap API (dropdown, modal и т.д.). Пример:
  ```javascript
  {
    'data-bs-toggle': 'dropdown',
    'aria-expanded': false,
    'id': 'dropdown-button',
    'class': 'dropdown-toggle' // дополнительные классы (объединяются с buttonClasses)
  }
  ```
  **Важно:** Атрибут `class` из `buttonAttributes` объединяется с классами из `buttonClasses`. Остальные атрибуты передаются напрямую на корневой элемент через `v-bind`.

### Выходные события (emits)

- `click` — общее событие клика по кнопке (эмитится всегда при клике на любую зону).
- `click-icon` — клик по иконке слева (эмитится вместе с `click`).
- `click-text` — клик по текстовой области (эмитится вместе с `click`).
- `click-suffix` — клик по элементу суффикса (эмитится вместе с `click`, передаёт элемент суффикса как второй аргумент).

**Примечание:** Все зоны (иконка, текст, суффикс) эмитят общее событие `click` по умолчанию. Раздельные события (`click-icon`, `click-text`, `click-suffix`) срабатывают только если назначены явно в родительском компоненте.

## Особенности реализации

### Использование в комплексных компонентах (dropdown, modal и т.д.)
Компонент `cmp-button` может использоваться в других компонентах (например, `cmp-dropdown`) для кнопок триггеров Bootstrap. Для этого используется prop `buttonAttributes`:

**Пример использования в dropdown:**
```html
<cmp-button
    :label="buttonText"
    :icon="buttonIcon"
    :variant="buttonVariant"
    :button-attributes="{
        'data-bs-toggle': 'dropdown',
        'aria-expanded': isOpen,
        'id': dropdownId,
        'class': 'dropdown-toggle'
    }">
</cmp-button>
```

**Совместимость с Bootstrap API:**
- Атрибуты из `buttonAttributes` передаются на реальный DOM-элемент `<button>` через `v-bind`
- Bootstrap API работает напрямую с реальным DOM-элементом (не с Vue-компонентом)
- Доступ к реальному DOM-элементу через `$refs.componentName.$el` для инициализации Bootstrap
- События Bootstrap генерируются на реальном DOM-элементе и всплывают корректно
- Программный доступ к Bootstrap API через экземпляр работает без изменений

**Обработка классов:**
- Классы из `buttonAttributes.class` объединяются с классами из `buttonClasses`
- Поддерживается как строка (`'dropdown-toggle'`), так и массив (`['dropdown-toggle', 'custom-class']`)

### Bootstrap-совместимость
- Компонент использует классы `btn`, `btn-{variant}`, `btn-{size}` Bootstrap для базовой стилизации.
- Состояния `disabled` и `loading` применяются через атрибут `disabled` и классы Bootstrap.
- Все стили реализованы через Bootstrap утилиты (`d-flex`, `align-items-center`, `text-break`, `text-wrap`, `px-2`, `py-2`, `opacity-50` и т.п.).
- Поддержка тем Bootstrap через CSS-переменные (`var(--bs-body-color)`, `var(--bs-secondary-color)` и т.п.).
- **Полная обратная совместимость:** компонент — обёртка над нативной Bootstrap кнопкой, все стандартные классы и атрибуты Bootstrap работают корректно.

### Паддинги на тап-зонах
- Паддинги переносятся с кнопки (`p-0`) на внутренний контейнер (вертикальный padding управляется через CSS в зависимости от размера кнопки).
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
- Адаптивность управляется через CSS классы компонента `.btn-responsive` с вложенными селекторами. Подробности в `docs/doc-guide-ii.md` (раздел "Компоненты" → "Адаптивность компонентов").
- **С иконкой на мобильных:** если задан `icon`, на мобильных отображается только иконка, на десктопе — только текст `label`.
- **С укороченным текстом на мобильных:** если `icon` не задан, но задан `labelShort`, на мобильных отображается укороченный текст, на десктопе — полный `label`.
- **Без адаптивности:** если не заданы ни `icon`, ни `labelShort`, всегда отображается полный `label`.

**Примеры:**
```html
<!-- С иконкой на мобильных -->
<cmp-button
    label="Сохранить"
    icon="fas fa-save">
</cmp-button>

<!-- С укороченным текстом на мобильных -->
<cmp-button
    label="Сохранить изменения"
    label-short="Сохранить">
</cmp-button>

<!-- Без адаптивности -->
<cmp-button
    label="Сохранить">
</cmp-button>
```

### Множественные суффиксы
- `suffix` может быть массивом элементов для поддержки нескольких badge/icon/indicator одновременно.
- Каждый элемент массива может иметь свой `tooltip`.
- Элементы разделяются отступом `ms-1` (кроме первого).

## Размещение
- Компонент: `shared/components/button.js`
- Шаблон: `shared/templates/button-template.js` (ID: `button-template`)
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

> § <br> КОМПОНЕНТ BUTTON-GROUP

## Назначение
Vue-обёртка над Bootstrap `.btn-group` с поддержкой трёх типов кнопок: `button` (через компонент `cmp-button`), `checkbox` и `radio` (нативный HTML). Компонент обеспечивает **максимальную совместимость с Bootstrap JavaScript API**, наследование стилей от группы, адаптивное схлопывание в dropdown при достижении брейкпоинта и синхронизацию состояния между кнопками и пунктами меню.

## API компонента

### Входные параметры (props)

**Базовые свойства группы:**
- `size` (String) — размер группы: `'sm'`, `'lg'` или `''` (по умолчанию). Применяется ко всем кнопкам, если не переопределено в конфигурации кнопки.
- `variant` (String, default: `'secondary'`) — базовый вариант Bootstrap для всех кнопок. Если кнопка не имеет собственного `variant`, наследует от группы.
- `vertical` (Boolean, default: `false`) — вертикальная ориентация группы (добавляет класс `btn-group-vertical`).
- `role` (String, default: `'group'`) — ARIA-роль группы.
- `ariaLabel` (String) — ARIA-метка для группы.
- `classesAdd` (Object, default: `{}`) — классы для добавления на различные элементы компонента. Структура: `{ root: 'классы', dropdown: 'классы', dropdownButton: 'классы', dropdownMenu: 'классы' }`. См. раздел "Универсальный механизм добавления CSS классов".
- `classesRemove` (Object, default: `{}`) — классы для удаления с различных элементов компонента. Структура: `{ root: 'классы', dropdown: 'классы', dropdownButton: 'классы', dropdownMenu: 'классы' }`.

**Адаптивность (схлопывание в dropdown):**
- `collapseBreakpoint` (String) — брейкпоинт для схлопывания группы в dropdown: `'sm'`, `'md'`, `'lg'`, `'xl'`, `'xxl'`. Если не указан, группа всегда отображается как группа кнопок.
- `dropdownLabel` (String, default: `'Действия'`) — текст кнопки dropdown при схлопывании.
- `dropdownIcon` (String) — иконка кнопки dropdown (Font Awesome класс).
- `dropdownVariant` (String) — вариант кнопки dropdown. Если не указан, наследует от `variant` группы.

**Конфигурация кнопок:**
- `buttons` (Array, required) — массив конфигураций кнопок. Каждый элемент — объект `ButtonConfig`:

**ButtonConfig:**
- `type` (String, required) — тип кнопки: `'button'`, `'checkbox'` или `'radio'`.
- `label` (String) — текст кнопки (для всех типов).
- `labelShort` (String) — укороченная версия текста для мобильных (только для `type="button"`).
- `icon` (String) — CSS класс иконки (Font Awesome, Material Symbols).
- `variant` (String) — вариант Bootstrap (переопределяет групповой).
- `size` (String) — размер кнопки (переопределяет групповой).
- `disabled` (Boolean) — отключённое состояние.
- `loading` (Boolean) — состояние загрузки (только для `type="button"`).
- `active` (Boolean) — активное состояние (для checkbox/radio).
- `suffix` (Object | Array) — суффикс справа (только для `type="button"`). Формат аналогичен `cmp-button`.
- `tooltip` (String) — общая подсказка.
- `tooltipIcon` (String) — подсказка для иконки (только для `type="button"`).
- `tooltipText` (String) — подсказка для текста (только для `type="button"`).
- `tooltipSuffix` (String) — подсказка для суффикса (только для `type="button"`).
- `[key: data-bs-${string}]` (any) — произвольные Bootstrap data-атрибуты для прозрачности JS API.
- `[key: string]` (any) — любые другие атрибуты.

### Выходные события (emits)

- `button-click` — клик по кнопке (`type="button"`). Параметры: `(event, { button, index, type })`.
- `button-click-icon` — клик по иконке кнопки (`type="button"`). Параметры: `(event, { button, index, type })`.
- `button-click-text` — клик по тексту кнопки (`type="button"`). Параметры: `(event, { button, index, type })`.
- `button-click-suffix` — клик по суффиксу кнопки (`type="button"`). Параметры: `(event, { button, index, type })`.
- `button-change` — изменение состояния checkbox/radio. Параметры: `(event, { button, index, active, type })`.
- `button-toggle` — переключение состояния checkbox/radio. Параметры: `({ button, index, active, type })`.

### Слоты

- `default` — содержимое кнопок (fallback для кастомных кнопок).
- `button-{index}` — переопределение конкретной кнопки по индексу. Параметры слота: `{ button, index }`.

## Особенности реализации

### Максимальная совместимость с Bootstrap JS API

Компонент реализует стратегию максимальной совместимости с Bootstrap. Общие принципы см. раздел "Стратегия максимальной совместимости с Bootstrap" выше.

**Специфичное для button-group:**
- Использование компонента `cmp-button` для `type="button"`:
   - Все пропсы `cmp-button` поддерживаются через `ButtonConfig`
   - Адаптивность через CSS классы `.btn-responsive` работает автоматически
   - Suffix и tooltips поддерживаются полностью
- Нативный HTML для checkbox/radio:
   - Используется стандартная Bootstrap структура: `<input class="btn-check">` + `<label class="btn">`
   - Состояние синхронизируется через внутреннее состояние компонента
   - Для radio автоматически сбрасываются все остальные radio в группе при выборе

### Наследование стилей

Компонент поддерживает наследование `variant` и `size` от группы к кнопкам:

- Если кнопка не имеет собственного `variant`, наследует от `variant` группы
- Если кнопка не имеет собственного `size`, наследует от `size` группы
- Кнопка может переопределить групповые стили, указав собственные `variant` или `size`

**Пример:**
```html
<cmp-button-group variant="success" size="lg" :buttons="[
    { type: 'button', label: 'Кнопка 1' },           // success lg
    { type: 'button', label: 'Кнопка 2', variant: 'danger' },  // danger lg
    { type: 'checkbox', label: 'Чекбокс' }           // success lg
]">
</cmp-button-group>
```

### Адаптивное схлопывание в dropdown

При указании `collapseBreakpoint` компонент рендерит две версии:

1. **Группа кнопок** (видна ≥ breakpoint):
   - Классы: `btn-group d-none d-{breakpoint}-inline-flex`
   - Внутри: цикл по `buttons` с рендером через `cmp-button` или нативный HTML

2. **Dropdown** (виден < breakpoint):
   - Классы: `dropdown d-{breakpoint}-none`
   - Компонент: `<cmp-dropdown>` с маппингом `buttons[]` в `<cmp-dropdown-menu-item>`

**Маппинг ButtonConfig → DropdownMenuItem:**
- `label` → `title`
- `icon` → `icon`
- `suffix` → `suffix`
- `type="checkbox/radio" + active` → `active: true`
- `disabled` → `disabled`
- `tooltip` → `tooltipText`

**Преимущества:**
- Мгновенное переключение через CSS (без JS resize listener)
- Использование стандартных Bootstrap utilities (`d-none`, `d-md-inline-flex`)
- Оба режима независимы и совместимы с Bootstrap JS API
- События синхронизируются между кнопками и пунктами меню

### Синхронизация состояния

Компонент использует внутреннее состояние `buttonStates` для синхронизации:

- При создании компонента состояние инициализируется из props
- При изменении checkbox/radio состояние обновляется в `buttonStates`
- Для radio автоматически сбрасываются все остальные radio в группе
- Состояние синхронизируется с dropdown при схлопывании

### Использование слотов

Компонент поддерживает гибкое использование через слоты:

```html
<!-- Кастомная кнопка вместо стандартной -->
<cmp-button-group :buttons="buttons">
    <template #button-0="{ button, index }">
        <cmp-button :label="button.label" variant="custom">
        </cmp-button>
    </template>
</cmp-button-group>
```

## Размещение
- Компонент: `shared/components/button-group.js`
- Шаблон: `shared/templates/button-group-template.js` (ID: `button-group-template`)
- Зависимости: Bootstrap 5, Vue.js, `cmp-button`, `cmp-dropdown`, `cmp-dropdown-menu-item`

## Использование

**Базовые примеры:**
```html
<!-- Группа кнопок -->
<cmp-button-group
    :buttons="[
        { type: 'button', label: 'Сохранить', variant: 'primary' },
        { type: 'button', label: 'Отмена', variant: 'secondary' },
        { type: 'button', label: 'Удалить', variant: 'danger' }
    ]"
    @button-click="handleClick">
</cmp-button-group>

<!-- Группа с checkbox -->
<cmp-button-group
    :buttons="[
        { type: 'checkbox', label: 'Фильтр 1', variant: 'outline-primary' },
        { type: 'checkbox', label: 'Фильтр 2', variant: 'outline-primary', active: true }
    ]"
    @button-change="handleChange">
</cmp-button-group>

<!-- Группа с radio -->
<cmp-button-group
    :buttons="[
        { type: 'radio', label: 'Вариант 1', variant: 'outline-success' },
        { type: 'radio', label: 'Вариант 2', variant: 'outline-success', active: true },
        { type: 'radio', label: 'Вариант 3', variant: 'outline-success' }
    ]"
    @button-change="handleChange">
</cmp-button-group>

<!-- Смешанный состав -->
<cmp-button-group
    variant="secondary"
    size="sm"
    :buttons="[
        { type: 'button', label: 'Действие', variant: 'primary' },
        { type: 'checkbox', label: 'Фильтр' },
        { type: 'radio', label: 'Опция 1' },
        { type: 'radio', label: 'Опция 2', active: true }
    ]">
</cmp-button-group>

<!-- Адаптивное схлопывание -->
<cmp-button-group
    collapse-breakpoint="md"
    dropdown-label="Действия"
    dropdown-icon="fas fa-bars"
    :buttons="[
        { type: 'button', label: 'Сохранить', variant: 'primary', icon: 'fas fa-save' },
        { type: 'button', label: 'Редактировать', variant: 'secondary', icon: 'fas fa-edit' },
        { type: 'button', label: 'Удалить', variant: 'danger', icon: 'fas fa-trash' }
    ]"
    @button-click="handleClick">
</cmp-button-group>
```

**С иконками и суффиксами:**
```html
<cmp-button-group
    :buttons="[
        {
            type: 'button',
            label: 'Уведомления',
            icon: 'fas fa-bell',
            suffix: { type: 'badge', value: 5, variant: 'secondary' }
        },
        {
            type: 'button',
            label: 'Настройки',
            icon: 'fas fa-cog'
        }
    ]">
</cmp-button-group>
```
