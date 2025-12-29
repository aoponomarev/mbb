/**
 * ================================================================================================
 * BUTTON COMPONENT - Компонент кнопки
 * ================================================================================================
 *
 * ЦЕЛЬ: Переиспользуемый компонент кнопки с поддержкой иконки, текста, суффикса, вариантов Bootstrap,
 * размеров, состояний, адаптивности и детерминированных хэшей экземпляров.
 *
 * ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
 * - Анимация chevron через Font Awesome классы (fa-rotate-90) + inline transition (единственное исключение из запрета inline-стилей)
 * - Условный рендеринг всех опциональных элементов
 * - Нативные подсказки браузера через атрибут title (не Bootstrap Tooltip)
 * - Паддинги переносятся на внутренний контейнер для корректной работы подсказок
 * - По умолчанию все зоны (иконка, текст, суффикс) эмитят общее событие 'click'
 * - Поддержка множественных суффиксов через массив
 * - Использование в комплексных компонентах (dropdown, modal) через prop buttonAttributes
 *
 * ССЫЛКИ:
 * - Общие принципы работы с компонентами: docs/doc-components.md (раздел "Принципы работы с компонентами")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент button")
 * - Адаптивность: docs/doc-guide-ii.md (раздел "Компоненты" → "Адаптивность компонентов")
 * - Выравнивание высоты: docs/doc-guide-ii.md (раздел "Макет и выравнивание" → "Выравнивание высоты элементов")
 * - Детерминированные хэши: docs/doc-architect.md (раздел "Детерминированные хэши компонентов")
 * - Шаблон: shared/templates/button-template.js
 */

window.cmpButton = {
    template: '#button-template',

    props: {
        // === Текст кнопки ===
        label: {
            type: String,
            default: null
        },
        labelShort: {
            type: String,
            default: null // укороченная версия текста для мобильных (если нет иконки)
        },

        // === Опциональные ===
        icon: {
            type: String,
            default: null
        },

        // === Суффикс (правый элемент) - может быть объектом или массивом ===
        suffix: {
            type: [Object, Array],
            default: null,
            validator: (value) => {
                if (!value) return true;
                // Если массив - проверяем каждый элемент
                if (Array.isArray(value)) {
                    return value.every(item => {
                        const validTypes = ['badge', 'icon', 'indicator', 'chevron', 'info'];
                        return validTypes.includes(item.type) && item.value;
                    });
                }
                // Если объект - проверяем как одиночный элемент
                const validTypes = ['badge', 'icon', 'indicator', 'chevron', 'info'];
                if (!validTypes.includes(value.type)) return false;
                if (!value.value) return false;
                return true;
            }
        },

        // === Подсказки для тап-зон ===
        tooltipIcon: {
            type: String,
            default: null
        },
        tooltipText: {
            type: String,
            default: null
        },
        tooltipSuffix: {
            type: String,
            default: null
        },

        // === Bootstrap варианты и размеры ===
        variant: {
            type: String,
            default: 'primary',
            validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark', 'link'].includes(value)
        },
        size: {
            type: String,
            default: null,
            validator: (value) => !value || ['sm', 'lg'].includes(value)
        },

        // === Состояния ===
        disabled: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: 'button',
            validator: (value) => ['button', 'submit', 'reset'].includes(value)
        },
        buttonId: {
            type: String,
            default: null
        }, // Для instanceHash (идентификация экземпляра)

        // === Произвольные атрибуты для использования в комплексных компонентах ===
        buttonAttributes: {
            type: Object,
            default: () => ({})
            // Пример: { 'data-bs-toggle': 'dropdown', 'aria-expanded': false, 'id': 'dropdown-button', 'class': 'dropdown-toggle' }
            // Используется для передачи data-атрибутов, aria-атрибутов и дополнительных классов
            // для интеграции с Bootstrap API (dropdown, modal и т.д.)
        },

        // === Стилизация ===
        iconOpacity: {
            type: Number,
            default: 1,
            validator: (value) => value >= 0 && value <= 1
        },

        // === Управление классами ===
        classesAdd: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'float-start', icon: 'custom-icon', label: 'custom-label', suffix: 'hide-suffix' }
        },
        classesRemove: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'some-class', icon: 'another-class' }
        }

    },

    emits: ['click', 'click-icon', 'click-text', 'click-suffix'],

    computed: {
        // Нормализация suffix в массив
        suffixArray() {
            const baseSuffix = this.suffix ? (Array.isArray(this.suffix) ? this.suffix : [this.suffix]) : [];

            // Автоматически добавляем chevron для dropdown-toggle
            if (this.buttonAttributes?.class?.includes('dropdown-toggle') ||
                (typeof this.buttonAttributes?.class === 'string' && this.buttonAttributes.class.includes('dropdown-toggle'))) {
                // Проверяем, нет ли уже chevron в suffix
                const hasChevron = baseSuffix.some(item =>
                    (typeof item === 'object' && item.type === 'chevron') ||
                    item === 'chevron'
                );
                if (!hasChevron) {
                    return [...baseSuffix, { type: 'chevron', value: 'fas fa-chevron-down' }];
                }
            }

            return baseSuffix;
        },

        // CSS классы для корневого элемента (root)
        buttonClasses() {
            const baseClasses = ['btn', 'btn-responsive', this.instanceHash];

            // Условные классы для адаптивности
            if (this.icon) baseClasses.push('has-icon');
            if (this.labelShort) baseClasses.push('has-label-short');

            // Если disabled и не loading - используем нейтральные цвета (без цвета из темы)
            if (this.disabled && !this.loading) {
                baseClasses.push('btn-secondary', 'text-secondary', 'bg-secondary', 'bg-opacity-10', 'border-secondary');
            } else {
                // Обычный вариант из темы
                baseClasses.push(`btn-${this.variant}`);
            }

            if (this.size) baseClasses.push(`btn-${this.size}`);
            if (this.disabled) baseClasses.push('disabled');

            // Добавить дополнительные классы из buttonAttributes (если есть)
            if (this.buttonAttributes.class) {
                const extraClasses = Array.isArray(this.buttonAttributes.class)
                    ? this.buttonAttributes.class
                    : this.buttonAttributes.class.split(' ').filter(c => c);
                baseClasses.push(...extraClasses);
            }

            // Управление классами через classesAdd и classesRemove
            if (!window.classManager) {
                console.error('classManager not found in buttonClasses');
                return baseClasses.join(' ');
            }

            const result = window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.root,
                this.classesRemove?.root
            );
            return result;
        },

        // CSS классы для обертки иконки (icon)
        iconClasses() {
            // Flexbox для центрирования иконки внутри квадратной обертки
            const baseClasses = ['icon', 'd-flex', 'align-items-center', 'justify-content-center'];
            if (this.iconOpacity === 0.5) baseClasses.push('opacity-50');

            if (!window.classManager) {
                console.error('classManager not found in iconClasses');
                return baseClasses.join(' ');
            }

            const classesAddIcon = this.classesAdd?.icon;
            const classesRemoveIcon = this.classesRemove?.icon;
            return window.classManager.processClassesToString(
                baseClasses,
                classesAddIcon,
                classesRemoveIcon
            );
        },

        // CSS классы для обертки текста (label)
        labelClasses() {
            const baseClasses = ['text-nowrap'];

            if (!window.classManager) {
                console.error('classManager not found in labelClasses');
                return baseClasses.join(' ');
            }

            const result = window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.label,
                this.classesRemove?.label
            );
            return result;
        },

        // CSS классы для обертки суффиксов (suffix)
        suffixClasses() {
            const baseClasses = ['d-flex', 'align-items-center', 'suffix-container'];

            if (!window.classManager) {
                console.error('classManager not found in suffixClasses');
                return baseClasses.join(' ');
            }

            const result = window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.suffix,
                this.classesRemove?.suffix
            );
            return result;
        },

        // Атрибуты для передачи на корневой элемент (исключая class, который обрабатывается отдельно)
        buttonAttrs() {
            const attrs = { ...this.buttonAttributes };
            // Удаляем class из копии, так как он обрабатывается в buttonClasses
            delete attrs.class;
            return attrs;
        },

        // CSS классы для внутреннего контейнера
        // ВАЖНО: Вертикальный padding (py-*) управляется через CSS в зависимости от размера кнопки
        // Горизонтальный padding (px-2) задан по умолчанию, может быть переопределен через classesAdd.container
        // ВАЖНО: gap НЕ используется, так как flexbox gap применяется между ВСЕМИ дочерними элементами,
        // даже если они скрыты через visibility:hidden или имеют width:0. Это вызывает смещение иконки.
        // Отступы между элементами управляются через CSS для дочерних элементов.
        containerClasses() {
            const baseClasses = ['d-flex', 'align-items-center', 'justify-content-center', 'px-2'];

            if (!window.classManager) {
                console.error('classManager not found in containerClasses');
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.container,
                this.classesRemove?.container
            );
        },

        // Детерминированный хэш экземпляра на основе родительского контекста и props
        // Стабилен между сессиями - один и тот же контекст + идентификатор всегда дает один и тот же хэш
        instanceHash() {
            if (!window.hashGenerator) {
                console.warn('hashGenerator not found, using fallback');
                return 'avto-00000000';
            }

            // Родительский контекст (стабильный маркер родителя)
            const parentContext = this.getParentContext();

            // Идентификатор экземпляра из props
            const instanceId = this.buttonId || this.label || this.icon || 'button';

            // Комбинация для уникальности
            const uniqueId = `${parentContext}:${instanceId}`;
            return window.hashGenerator.generateMarkupClass(uniqueId);
        }
    },

    methods: {
    },

    mounted() {
        // Компонент смонтирован, Vue автоматически применит классы через :class в шаблоне
    },

    methods: {
        // Получить родительский контекст (класс avto-* или ID родителя)
        // Вызывается из computed, поэтому $el может быть еще не доступен
        getParentContext() {
            // Проверяем доступность DOM элемента
            if (!this.$el) {
                return 'root';
            }

            // Проверяем наличие родителя
            if (!this.$el.parentElement) {
                return 'root';
            }

            // Ищем родительский элемент с классом avto-* или ID
            let parent = this.$el.parentElement;
            let depth = 0;
            const maxDepth = 5; // Ограничение глубины поиска

            while (parent && depth < maxDepth) {
                // Проверяем классы avto-*
                const avtoClass = Array.from(parent.classList).find(cls => cls.startsWith('avto-'));
                if (avtoClass) {
                    return avtoClass;
                }

                // Проверяем ID
                if (parent.id) {
                    return `#${parent.id}`;
                }

                parent = parent.parentElement;
                depth++;
            }

            return 'root'; // fallback
        },

        // Обработчик клика по кнопке
        handleClick(event) {
            if (this.disabled || this.loading) return;
            this.$emit('click', event);
        },

        // Обработчик клика по иконке
        handleIconClick(event) {
            if (this.disabled || this.loading) return;
            this.$emit('click', event);
            this.$emit('click-icon', event);
        },

        // Обработчик клика по тексту
        handleTextClick(event) {
            if (this.disabled || this.loading) return;
            this.$emit('click', event);
            this.$emit('click-text', event);
        },

        // Обработчик клика по элементу суффикса
        handleSuffixClick(event, item) {
            if (this.disabled || this.loading) return;
            this.$emit('click', event);
            this.$emit('click-suffix', event, item);
        }
    },


    // Примечание: подсказки реализованы через нативный атрибут title браузера,
    // не требуют инициализации и уничтожения
};

