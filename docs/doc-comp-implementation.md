# Практические аспекты реализации Vue-компонентов

> Оглавление `docs/doc-comp-implementation.md`
- § *Работа с `this.$el` в Vue 3* — проблема Comment node при x-template шаблонах.
- § *Размещение методов в компоненте* — методы должны быть в `methods`, а не в `computed`.
- § *Проверка доступности утилит* — проверка `window.classManager` и других утилит перед использованием.
- § *Вызов методов из computed свойств* — правила для безопасного использования методов в `computed`.
- § *Работа с отступами (gaps) в составных компонентах* — систематизация работы с gaps (отступами между дочерними элементами) в flexbox-контейнерах.
- § *Порядок загрузки стилей компонентов* — принципы организации CSS файлов компонентов и порядок их загрузки.

> § <br> РАБОТА С `this.$el` В VUE 3

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

> § <br> РАЗМЕЩЕНИЕ МЕТОДОВ В КОМПОНЕНТЕ

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

> § <br> ПРОВЕРКА ДОСТУПНОСТИ УТИЛИТ

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

> § <br> ВЫЗОВ МЕТОДОВ ИЗ COMPUTED СВОЙСТВ

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

> § <br> РАБОТА С ОТСТУПАМИ (GAPS) В СОСТАВНЫХ КОМПОНЕНТАХ

**Проблема:** Flexbox-контейнеры с несколькими дочерними элементами (иконка, текст, суффикс) требуют отступов между элементами. Bootstrap предоставляет утилиту `gap-*`, но она создает критическую проблему: gap применяется между **всеми дочерними элементами**, даже если они скрыты через `visibility: hidden` или имеют `width: 0`.

**Критическая проблема с `gap`:**
```html
<!-- Контейнер с gap-1 (4px) -->
<span class="d-flex gap-1">
    <span class="icon" style="width: 16px">...</span>
    <span class="label" style="visibility: hidden; width: 0">...</span> <!-- Скрыт, но gap все равно применяется! -->
</span>
```

**Результат:** Иконка смещена влево на 2px от центра кнопки (gap создает 4px справа от иконки, даже если текст скрыт).

## Решение: CSS margin вместо gap

**Принцип:** Отступы между элементами управляются через `margin-right` и `margin-left` в CSS, применяемые к конкретным элементам через селекторы `:not(:last-child)` и `:not(:first-child)`.

**Базовая структура:**
```css
/* Отступ справа от иконки (только если есть соседний элемент справа) */
.btn-responsive .icon:not(:last-child) {
  margin-right: 0.5rem; /* 8px - эквивалент gap-2 */
}

/* Отступ справа от текста (только если есть соседний элемент справа) */
.btn-responsive .label:not(:last-child),
.btn-responsive .label-short:not(:last-child) {
  margin-right: 0.5rem; /* 8px - эквивалент gap-2 */
}

/* Отступ слева от суффикса (только если есть предыдущий элемент) */
.btn-responsive .suffix-container:not(:first-child) {
  margin-left: 0.5rem; /* 8px - эквивалент gap-2 */
}
```

**Важно:** Размещайте эти правила **внутри media queries** для desktop (>= 576px), если на мобильных элементы скрываются через `visibility: hidden` (адаптивное поведение).

## Обработка особых случаев

**Проблема:** Для кнопок **только с иконкой** (без текста и суффикса) правило `:not(:last-child)` не сработает корректно, если в DOM есть скрытые элементы (например, суффикс с `display: none`).

**Решение:** Специальный класс `icon-only` для переопределения отступов:

```css
/* Убираем отступ справа от иконки для кнопок только с иконкой */
.btn-responsive.icon-only .icon {
  margin-right: 0 !important;
}
```

**Применение:**
```html
<cmp-dropdown
    button-icon="fas fa-bars"
    :classes-add="{ button: 'icon-only' }">
</cmp-dropdown>
```

## Систематизация для всех составных компонентов

**Правило 1:** **НИКОГДА не используйте `gap-*` в контейнерах**, где есть элементы, скрываемые через `visibility: hidden` или условно рендерящиеся (`v-if`).

**Правило 2:** Для каждого составного компонента с flexbox-контейнером:
1. Определите базовый размер отступа (например, `0.5rem` для gap-2).
2. Добавьте `margin-right: <размер>` для всех элементов через `:not(:last-child)`.
3. Добавьте `margin-left: <размер>` для суффиксов/правых элементов через `:not(:first-child)`.
4. Размещайте правила внутри media queries, если отступы нужны только на desktop.

**Правило 3:** Для компонентов, которые могут быть "только иконка" или "только текст", создайте вспомогательные классы (`icon-only`, `text-only`) для переопределения отступов.

**Правило 4:** Комментируйте в CSS, что отступ эквивалентен `gap-*` для понимания:
```css
margin-right: 0.5rem; /* 8px - эквивалент gap-2 */
```

## Примеры из проекта

**Компонент button:**
- Контейнер: `d-flex align-items-center justify-content-center` (БЕЗ gap)
- Отступы: через CSS `margin-right: 0.5rem` для `.icon`, `.label`, `.label-short`
- Отступы суффикса: через CSS `margin-left: 0.5rem` для `.suffix-container`
- Особые случаи: класс `icon-only` для кнопок только с иконкой

**Компонент dropdown-menu-item:**
- Аналогичная структура с иконкой, текстом (title/subtitle), суффиксом
- Отступы через CSS margin вместо gap

**Компонент button-group:**
- Внутренние кнопки: отступы между кнопками через Bootstrap `.btn-group` (нативное поведение)
- Внутри каждой кнопки: отступы через механизм button компонента

> § <br> ПОРЯДОК ЗАГРУЗКИ СТИЛЕЙ КОМПОНЕНТОВ

Стили компонентов разбиты на отдельные CSS файлы в папке `app/styles/components/`. **Порядок загрузки критически важен** для корректной работы компонентов, так как составные компоненты зависят от базовых.

**Принцип организации:**
Стили организованы по принципу "от простого к сложному": сначала базовые независимые компоненты, затем составные компоненты, которые их используют.

**Порядок загрузки:**

1. **`button.css`** — базовый компонент кнопки
   - Независимый компонент
   - Используется в: `cmp-button`, `cmp-dropdown` (кнопка триггера), `cmp-button-group`
   - Содержит правила для отступов (gaps), которые используются другими компонентами

2. **`dropdown-menu-item.css`** — базовый элемент пункта меню
   - Независимый компонент (порядок с `button.css` не важен)
   - Используется в: `cmp-dropdown` (пункты меню), `cmp-button-group` (при схлопывании в dropdown)

3. **`dropdown.css`** — составной компонент выпадающего меню
   - Зависит от: `button.css` (кнопка триггера использует `.btn-responsive`), `dropdown-menu-item.css` (пункты меню)
   - Используется в: `cmp-dropdown`, `cmp-button-group` (при схлопывании)

4. **`button-group.css`** — составной компонент группы кнопок
   - Зависит от: `button.css` (кнопки внутри группы), `dropdown.css` (при схлопывании в dropdown)
   - Используется в: `cmp-button-group`

**Реализация в `index.html`:**
```html
<!-- Стили компонентов (порядок загрузки важен!) -->
<!-- 1. Базовые компоненты (независимые) -->
<link rel="stylesheet" href="app/styles/components/button.css">
<link rel="stylesheet" href="app/styles/components/dropdown-menu-item.css">
<!-- 2. Составные компоненты (зависят от базовых) -->
<link rel="stylesheet" href="app/styles/components/dropdown.css">
<link rel="stylesheet" href="app/styles/components/button-group.css">
```

**Важно:**
- Не изменяйте порядок загрузки без проверки зависимостей
- При добавлении нового компонента определите его зависимости и разместите файл в правильной позиции
- Каждый файл содержит подробную шапку с описанием зависимостей и порядка загрузки

