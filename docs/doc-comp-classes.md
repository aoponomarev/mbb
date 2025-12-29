# Механизм управления CSS классами

> Оглавление `docs/doc-comp-classes.md`
- § *Универсальный механизм добавления CSS классов* — пропы `classesAdd` и `classesRemove` для управления классами на различных элементах компонентов.
- § *Важные замечания по реализации механизма classesAdd/classesRemove* — типичные проблемы и их решения.
- § *CSS селекторы с динамическими классами* — экранирование специальных символов.
- § *Ревизия компонентов на правильное использование механизма* — результаты проверки всех компонентов.

> § <br> УНИВЕРСАЛЬНЫЙ МЕХАНИЗМ ДОБАВЛЕНИЯ CSS КЛАССОВ

Все компоненты поддерживают универсальный механизм управления CSS классами через пропы `classesAdd` и `classesRemove`, который позволяет гибко управлять классами на различных внутренних элементах компонентов.

## Реализация

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

## Порядок объединения классов

Классы объединяются в следующем порядке:
1. **Базовые классы** компонента (например, `'dropdown'`, `'btn-group'`, `'btn'`)
2. **Классы адаптивности** (например, `'dropdown-responsive'`, `'btn-responsive'`)
3. **Детерминированный хэш экземпляра** (`instanceHash`)
4. **Условные классы** для адаптивности (например, `'has-icon'`, `'has-text-short'`) — добавляются автоматически на основе пропсов
5. **Классы из `classesRemove`** — удаляются из базовых классов
6. **Классы из `classesAdd`** — добавляются к результату

**Важно:** Порядок обработки (сначала удаление, потом добавление) позволяет сначала убрать базовые классы, а затем добавить новые, что обеспечивает предсказуемое поведение.

## Примеры использования

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

## Элементы компонентов, поддерживающие управление классами

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

> § <br> ВАЖНЫЕ ЗАМЕЧАНИЯ ПО РЕАЛИЗАЦИИ МЕХАНИЗМА CLASSESADD/CLASSESREMOVE

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

> § <br> CSS СЕЛЕКТОРЫ С ДИНАМИЧЕСКИМИ КЛАССАМИ

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

> § <br> РЕВИЗИЯ КОМПОНЕНТОВ НА ПРАВИЛЬНОЕ ИСПОЛЬЗОВАНИЕ МЕХАНИЗМА

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

