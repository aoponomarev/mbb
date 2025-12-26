// =========================
// КОМПОНЕНТ КНОПКИ
// Универсальный компонент кнопки с иконкой, текстом и суффиксом
// =========================
// ЦЕЛЬ: Переиспользуемый компонент кнопки с поддержкой:
// - Левая иконка с tooltip
// - Текст с переносом
// - Суффикс (badge/icon/indicator/chevron/info) с tooltip (массив элементов)
// - Варианты Bootstrap (primary, secondary, success, danger, warning, info, light, dark, outline-*, link)
// - Размеры (sm, lg)
// - Состояния (disabled, loading)
// - Адаптивность через CSS классы (.btn-responsive с вложенными селекторами)
// - Детерминированные хэши экземпляров (instanceHash) для идентификации и кастомной стилизации
// - Раздельные события для кликов по зонам
//
// ПРИНЦИПЫ:
// - Использование только Bootstrap классов (запрет кастомных стилей, кроме inline transition для chevron)
// - Поддержка тем Bootstrap через CSS-переменные
// - Анимация chevron через Font Awesome классы (fa-rotate-90) + inline transition
// - Условный рендеринг всех опциональных элементов
// - Нативные подсказки браузера через атрибут title (не Bootstrap Tooltip)
// - Паддинги переносятся на внутренний контейнер для корректной работы подсказок
// - По умолчанию все зоны (иконка, текст, суффикс) эмитят общее событие 'click'
//
// АРХИТЕКТУРА:
// - Шаблон: shared/templates/button-template.html
// - Зависимости: Bootstrap 5, Font Awesome 6, Vue.js
// - См. также: docs/doc-architect.md (принципы модульности, запрет кастомных стилей)

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

        // === Стилизация ===
        iconOpacity: {
            type: Number,
            default: 1,
            validator: (value) => value >= 0 && value <= 1
        },

    },

    emits: ['click', 'click-icon', 'click-text', 'click-suffix'],

    computed: {
        // Нормализация suffix в массив
        suffixArray() {
            if (!this.suffix) return [];
            return Array.isArray(this.suffix) ? this.suffix : [this.suffix];
        },

        // CSS классы для кнопки
        buttonClasses() {
            const classes = ['btn', 'btn-responsive', this.instanceHash];

            // Условные классы для адаптивности
            if (this.icon) classes.push('has-icon');
            if (this.labelShort) classes.push('has-label-short');


            // Если disabled и не loading - используем нейтральные цвета (без цвета из темы)
            if (this.disabled && !this.loading) {
                classes.push('btn-secondary', 'text-secondary', 'bg-secondary', 'bg-opacity-10', 'border-secondary');
            } else {
                // Обычный вариант из темы
                classes.push(`btn-${this.variant}`);
            }

            if (this.size) classes.push(`btn-${this.size}`);
            if (this.disabled) classes.push('disabled');
            return classes.join(' ');
        },

        // CSS классы для внутреннего контейнера
        containerClasses() {
            return 'd-flex align-items-center px-3 py-2 px-md-3 py-md-2';
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

