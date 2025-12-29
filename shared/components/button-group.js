/**
 * ================================================================================================
 * BUTTON GROUP COMPONENT - Компонент группы кнопок
 * ================================================================================================
 *
 * ЦЕЛЬ: Vue-обёртка над Bootstrap .btn-group с поддержкой:
 * - Трёх типов кнопок: button (через cmp-button), checkbox, radio (нативный HTML)
 * - Наследования стилей (variant, size) от группы к кнопкам
 * - Адаптивного схлопывания в dropdown при брейкпоинте
 * - 100% совместимости с Bootstrap JS API
 *
 * ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
 * - Двойной рендер: группа кнопок (>= breakpoint) и dropdown (< breakpoint)
 * - CSS-переключение через Bootstrap utilities (d-none, d-md-inline-flex)
 * - Маппинг buttons[] в DropdownMenuItem при схлопывании
 * - Синхронизация событий между кнопками и пунктами меню
 * - Детерминированные хэши экземпляров (instanceHash)
 *
 * ССЫЛКИ:
 * - Общие принципы работы с компонентами: docs/doc-components.md (раздел "Принципы работы с компонентами")
 * - Описание компонента: docs/doc-components.md (раздел "Компонент button-group")
 * - Стратегия совместимости с Bootstrap: docs/doc-components.md (раздел "Стратегия максимальной совместимости с Bootstrap")
 * - Адаптивность: docs/doc-guide-ii.md (раздел "Компоненты" → "Адаптивность компонентов")
 * - Шаблон: shared/templates/button-group-template.js
 */

window.cmpButtonGroup = {
    template: '#button-group-template',
    components: {
        'cmp-button': window.cmpButton,
        'cmp-dropdown': window.cmpDropdown,
        'cmp-dropdown-menu-item': window.cmpDropdownMenuItem
    },

    props: {
        // === Базовые свойства группы ===
        size: {
            type: String,
            default: '',
            validator: (value) => !value || ['sm', 'lg'].includes(value)
        },
        variant: {
            type: String,
            default: 'secondary' // базовый variant для всех кнопок
        },
        vertical: {
            type: Boolean,
            default: false
        },
        verticalBreakpoint: {
            type: String,
            default: null,
            validator: (value) => !value || value === 'sm'
        },
        role: {
            type: String,
            default: 'group'
        },
        ariaLabel: {
            type: String,
            default: null
        },
        // === Управление классами ===
        classesAdd: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'custom-root', dropdown: 'custom-dropdown' }
        },
        classesRemove: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'some-class', dropdown: 'another-class' }
        },

        // === Адаптивность (схлопывание в dropdown) ===
        collapseBreakpoint: {
            type: String,
            default: null,
            validator: (value) => !value || ['sm', 'md', 'lg', 'xl', 'xxl'].includes(value)
        },
        dropdownLabel: {
            type: String,
            default: 'Действия'
        },
        dropdownIcon: {
            type: String,
            default: null
        },
        dropdownVariant: {
            type: String,
            default: null // если не указан, наследует от variant группы
        },
        dropdownSize: {
            type: String,
            default: null, // если не указан, наследует от size группы
            validator: (value) => !value || ['sm', 'lg'].includes(value)
        },

        // === Конфигурация кнопок ===
        buttons: {
            type: Array,
            required: true,
            validator: (buttons) => {
                if (!Array.isArray(buttons)) return false;
                return buttons.every(btn =>
                    btn && typeof btn === 'object' && ['button', 'checkbox', 'radio'].includes(btn.type)
                );
            }
        }
    },

    emits: ['button-click', 'button-click-icon', 'button-click-text', 'button-click-suffix', 'button-toggle', 'button-change'],

    data() {
        return {
            buttonStates: [] // состояние кнопок (для checkbox/radio)
        };
    },

    created() {
        // Генерируем уникальный ID для группы при создании компонента
        this._groupId = `btn-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Инициализируем внутреннее состояние кнопок из props
        this.buttonStates = this.buttons.map((btn, index) => ({
            ...btn,
            active: btn.active || false
        }));
    },

    watch: {
        // Синхронизируем внутреннее состояние при изменении props
        buttons: {
            handler(newButtons) {
                this.buttonStates = newButtons.map((btn, index) => ({
                    ...btn,
                    active: btn.active || false
                }));
            },
            deep: true
        }
    },

    computed: {
        // CSS классы для группы кнопок
        groupClasses() {
            const baseClasses = ['btn-group'];
            if (this.size) baseClasses.push(`btn-group-${this.size}`);

            // Проверяем, есть ли адаптивный класс для вертикальной ориентации в classesAdd.root
            const classesAddRoot = this.classesAdd?.root;
            const hasAdaptiveVertical = classesAddRoot && (
                (typeof classesAddRoot === 'string' && classesAddRoot.includes('btn-group-responsive-vertical')) ||
                (Array.isArray(classesAddRoot) && classesAddRoot.some(c => typeof c === 'string' && c.includes('btn-group-responsive-vertical')))
            );

            // Если задан verticalBreakpoint, автоматически добавляем адаптивный класс
            if (this.verticalBreakpoint && !hasAdaptiveVertical) {
                baseClasses.push(`btn-group-responsive-vertical-${this.verticalBreakpoint}`);
            }

            // Добавляем btn-group-vertical только если vertical=true И нет адаптивного класса
            if (this.vertical && !hasAdaptiveVertical && !this.verticalBreakpoint) {
                baseClasses.push('btn-group-vertical');
            }

            if (this.instanceHash) baseClasses.push(this.instanceHash);

            // Классы видимости для адаптивного схлопывания
            if (this.collapseBreakpoint) {
                baseClasses.push(`d-none`, `d-${this.collapseBreakpoint}-inline-flex`);
            }

            // Управление классами через classesAdd и classesRemove
            if (!window.classManager) {
                console.error('classManager not found in groupClasses');
                return baseClasses.join(' ');
            }

            const result = window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.root,
                this.classesRemove?.root
            );
            return result;
        },

        // Атрибуты для группы
        groupAttrs() {
            return {
                role: this.role,
                'aria-label': this.ariaLabel || undefined
            };
        },

        // Классы для dropdown (для передачи в cmp-dropdown)
        dropdownClassesForGroup() {
            // ВАЖНО: Возвращаем объект с undefined вместо пропуска свойств
            // Это обеспечивает стабильную структуру объекта для Vue реактивности
            return {
                root: this.classesAdd?.dropdown || undefined,
                button: this.classesAdd?.dropdownButton || undefined,
                menu: this.classesAdd?.dropdownMenu || undefined
            };
        },
        dropdownClassesRemoveForGroup() {
            return {
                root: this.classesRemove?.dropdown || undefined,
                button: this.classesRemove?.dropdownButton || undefined,
                menu: this.classesRemove?.dropdownMenu || undefined
            };
        },

        // Классы для dropdown контейнера
        dropdownClasses() {
            if (!this.collapseBreakpoint) return '';
            return `d-${this.collapseBreakpoint}-none`;
        },

        // Детерминированный хэш экземпляра
        instanceHash() {
            if (!window.hashGenerator) {
                console.warn('hashGenerator not found, using fallback');
                return 'avto-00000000';
            }

            const parentContext = this.getParentContext();
            const instanceId = this.ariaLabel || 'button-group';
            return window.hashGenerator.generateMarkupClass(`${parentContext}:${instanceId}`);
        },

        // Маппинг buttons в menuItems для dropdown
        menuItems() {
            if (!this.collapseBreakpoint) return [];

            return this.buttonStates.map((btn, index) => ({
                title: btn.label || btn.labelShort || '',
                icon: btn.icon || null,
                suffix: btn.suffix || null,
                active: btn.active && (btn.type === 'checkbox' || btn.type === 'radio'),
                disabled: btn.disabled || false,
                tooltipText: btn.tooltip || btn.tooltipText || null,
                tooltipIcon: btn.tooltipIcon || null,
                tooltipSuffix: btn.tooltipSuffix || (btn.suffix?.tooltip) || null,
                // Сохраняем оригинальные данные для событий
                _originalButton: btn,
                _originalIndex: index
            }));
        },

        // Variant для dropdown кнопки
        computedDropdownVariant() {
            return this.dropdownVariant || this.variant;
        },

        // Size для dropdown кнопки
        computedDropdownSize() {
            return this.dropdownSize || this.size;
        }
    },

    methods: {
        // Получить родительский контекст (класс avto-* или ID родителя)
        getParentContext() {
            if (!this.$el?.parentElement) return 'root';

            let parent = this.$el.parentElement;
            let depth = 0;
            const maxDepth = 5;

            while (parent && depth < maxDepth) {
                const avtoClass = Array.from(parent.classList).find(cls => cls.startsWith('avto-'));
                if (avtoClass) return avtoClass;
                if (parent.id) return `#${parent.id}`;
                parent = parent.parentElement;
                depth++;
            }

            return 'root';
        },

        // Утилита для исключения свойств из объекта
        omit(obj, keys) {
            const result = { ...obj };
            keys.forEach(key => delete result[key]);
            return result;
        },

        // Генерация уникального ID для checkbox/radio
        getButtonId(index) {
            return `${this._groupId}-${index}`;
        },

        // Имя для radio группы
        getRadioName() {
            return `${this._groupId}-radio`;
        },

        // Обработчик клика по кнопке (type="button")
        handleButtonClick(event, button, index) {
            const state = this.buttonStates[index] || button;
            this.$emit('button-click', event, { button: state, index, type: state.type });
        },

        handleButtonClickIcon(event, button, index) {
            const state = this.buttonStates[index] || button;
            this.$emit('button-click-icon', event, { button: state, index, type: state.type });
        },

        handleButtonClickText(event, button, index) {
            const state = this.buttonStates[index] || button;
            this.$emit('button-click-text', event, { button: state, index, type: state.type });
        },

        handleButtonClickSuffix(event, button, index) {
            const state = this.buttonStates[index] || button;
            this.$emit('button-click-suffix', event, { button: state, index, type: state.type });
        },

        // Обработчик изменения checkbox/radio
        handleButtonChange(event, button, index) {
            const newActive = event.target.checked;
            const state = this.buttonStates[index];

            if (!state) return;

            // Обновляем внутреннее состояние
            state.active = newActive;

            // Для radio: сбрасываем все остальные radio в группе
            if (state.type === 'radio' && newActive) {
                this.buttonStates.forEach((s, i) => {
                    if (i !== index && s.type === 'radio') {
                        s.active = false;
                    }
                });
            }

            // Консистентный порядок эмиссии: button-change → button-toggle
            this.$emit('button-change', event, { button: state, index, active: newActive, type: state.type });
            this.$emit('button-toggle', { button: state, index, active: newActive, type: state.type });
        },

        // Обработчик клика по пункту меню (при схлопывании)
        handleMenuClick(menuItem) {
            const { _originalButton: button, _originalIndex: index } = menuItem;
            const state = this.buttonStates[index] || button;

            if (state.type === 'checkbox') {
                // Эмулируем переключение checkbox
                const newActive = !state.active;
                state.active = newActive;

                // Консистентный порядок эмиссии: button-change → button-toggle
                this.$emit('button-change', new Event('change'), { button: state, index, active: newActive, type: state.type });
                this.$emit('button-toggle', { button: state, index, active: newActive, type: state.type });
            } else if (state.type === 'radio') {
                // Для radio: если уже активна, ничего не делаем (radio нельзя деактивировать кликом)
                // Если неактивна, активируем её и деактивируем все остальные radio в группе
                if (!state.active) {
                    state.active = true;

                    // Сбрасываем все остальные radio в группе
                    this.buttonStates.forEach((s, i) => {
                        if (i !== index && s.type === 'radio') {
                            s.active = false;
                        }
                    });

                    // Консистентный порядок эмиссии: button-change → button-toggle
                    this.$emit('button-change', new Event('change'), { button: state, index, active: true, type: state.type });
                    this.$emit('button-toggle', { button: state, index, active: true, type: state.type });
                }
                // Если radio уже активна, ничего не делаем (стандартное поведение radio)
            } else {
                // Эмулируем клик по кнопке
                this.$emit('button-click', new Event('click'), { button: state, index, type: state.type });
            }
        }
    },

    mounted() {
        // Инициализация Bootstrap Button для action-кнопок (если нужно)
        this.$nextTick(() => {
            if (window.bootstrap?.Button && this.$refs.groupContainer) {
                const buttons = this.$refs.groupContainer.querySelectorAll('.btn[data-bs-toggle="button"]');
                buttons.forEach(btn => {
                    new window.bootstrap.Button(btn);
                });
            }
        });
    }
};

