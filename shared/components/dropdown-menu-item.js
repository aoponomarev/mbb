// =========================
// КОМПОНЕНТ ПУНКТА ВЫПАДАЮЩЕГО МЕНЮ
// Универсальный компонент для пунктов dropdown-меню с иконкой, текстом и суффиксом
// =========================
// ЦЕЛЬ: Переиспользуемый компонент пункта выпадающего меню с поддержкой:
// - Левая иконка с tooltip
// - Заголовок и подзаголовок с переносом текста
// - Суффикс (badge/icon/indicator/chevron/info) с tooltip
// - Состояния (active, disabled)
// - Раздельные события для кликов по зонам (по умолчанию все эмитят общий click)
//
// ПРИНЦИПЫ:
// - Использование только Bootstrap классов (запрет кастомных стилей, кроме inline transition для chevron)
// - Поддержка тем Bootstrap через CSS-переменные
// - Анимация chevron через Font Awesome классы (fa-rotate-90) + inline transition
// - Условный рендеринг всех опциональных элементов
// - Инициализация Bootstrap tooltips через data-bs-toggle
// - По умолчанию все зоны (иконка, текст, суффикс) эмитят общее событие 'click'
//   Раздельные события (click-icon, click-text, click-suffix) срабатывают только если назначены явно
//
// АРХИТЕКТУРА:
// - Шаблон: shared/templates/dropdown-menu-item-template.html
// - Зависимости: Bootstrap 5, Font Awesome 6, Vue.js
// - См. также: docs/doc-architect.md (принципы модульности, запрет кастомных стилей)

window.cmpDropdownMenuItem = {
    template: '#dropdown-menu-item-template',

    props: {
        // === Обязательные ===
        title: {
            type: String,
            required: true
        },

        // === Опциональные ===
        icon: {
            type: String,
            default: null
        },
        subtitle: {
            type: String,
            default: null
        },

        // === Суффикс (правый элемент) ===
        suffix: {
            type: Object,
            default: null,
            validator: (value) => {
                if (!value) return true;
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

        // === Состояния ===
        active: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },

        // === Стилизация ===
        iconOpacity: {
            type: Number,
            default: 0.5,
            validator: (value) => value >= 0 && value <= 1
        },
        subtitleOpacity: {
            type: Number,
            default: 0.5,
            validator: (value) => value >= 0 && value <= 1
        }
    },

    emits: ['click', 'click-icon', 'click-text', 'click-suffix'],

    computed: {
        // Подсказка для суффикса (приоритет у tooltipSuffix)
        suffixTooltip() {
            return this.tooltipSuffix || (this.suffix && this.suffix.tooltip) || null;
        }
    },

    methods: {
        // Обработчик клика по всему пункту меню
        handleClick(event) {
            if (this.disabled) return;
            this.$emit('click', event);
        },

        // Обработчик клика по иконке
        handleIconClick(event) {
            if (this.disabled) return;
            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-icon', event);
        },

        // Обработчик клика по тексту
        handleTextClick(event) {
            if (this.disabled) return;
            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-text', event);
        },

        // Обработчик клика по суффиксу
        handleSuffixClick(event) {
            if (this.disabled) return;
            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-suffix', event);
        }
    },

    mounted() {
        // Инициализация Bootstrap tooltips для всех элементов с data-bs-toggle="tooltip"
        this.$nextTick(() => {
            if (window.bootstrap && window.bootstrap.Tooltip && this.$el && this.$el.querySelectorAll) {
                const tooltipElements = this.$el.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltipElements.forEach(element => {
                    new window.bootstrap.Tooltip(element);
                });
            }
        });
    },

    beforeUnmount() {
        // Уничтожение tooltips при размонтировании компонента
        if (window.bootstrap && window.bootstrap.Tooltip) {
            const tooltipElements = this.$el.querySelectorAll('[data-bs-toggle="tooltip"]');
            tooltipElements.forEach(element => {
                const tooltipInstance = window.bootstrap.Tooltip.getInstance(element);
                if (tooltipInstance) {
                    tooltipInstance.dispose();
                }
            });
        }
    }
};

