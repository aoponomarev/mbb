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
// - Адаптивности элементов через CSS классы (.dropdown-menu-item-responsive)
// - Детерминированных хэшей экземпляров (instanceHash) для идентификации и кастомной стилизации
//
// ПРИНЦИПЫ:
// - Использование только Bootstrap классов (запрет кастомных стилей, кроме inline transition для chevron)
// - Поддержка тем Bootstrap через CSS-переменные
// - Анимация chevron через Font Awesome классы (fa-rotate-90) + inline transition
// - Условный рендеринг всех опциональных элементов
// - Нативные подсказки браузера через атрибут title (по умолчанию)
// - Опциональное использование Bootstrap tooltips через props tooltipIconBootstrap, tooltipTextBootstrap, tooltipSuffixBootstrap
// - По умолчанию все зоны (иконка, текст, суффикс) эмитят общее событие 'click'
//   Раздельные события (click-icon, click-text, click-suffix) срабатывают только если назначены явно
//
// API КОМПОНЕНТА:
//
// Входные параметры (props):
// Обязательные:
// - title (String, required) — заголовок пункта меню
// Опциональные:
// - icon (String) — CSS класс иконки слева (Font Awesome, Material Symbols)
// - subtitle (String) — подзаголовок (вторая строка текста)
// - suffix (Object) — суффикс справа. Формат: { type: 'badge'|'icon'|'indicator'|'chevron'|'info', value: String|Number, variant: String, expanded: Boolean, tooltip: String }
// - tooltipIcon (String) — всплывающая подсказка для иконки слева (по умолчанию нативная через title, можно переключить на Bootstrap через tooltipIconBootstrap)
// - tooltipText (String) — всплывающая подсказка для текстовой области (по умолчанию нативная через title, можно переключить на Bootstrap через tooltipTextBootstrap)
// - tooltipSuffix (String) — всплывающая подсказка для суффикса (приоритет над suffix.tooltip, по умолчанию нативная через title, можно переключить на Bootstrap через tooltipSuffixBootstrap)
// - tooltipIconBootstrap (Boolean, default: false) — использовать Bootstrap tooltip для иконки вместо нативной подсказки
// - tooltipTextBootstrap (Boolean, default: false) — использовать Bootstrap tooltip для текста вместо нативной подсказки
// - tooltipSuffixBootstrap (Boolean, default: false) — использовать Bootstrap tooltip для суффикса вместо нативной подсказки
// - active (Boolean) — активное состояние пункта меню
// - disabled (Boolean) — отключённое состояние пункта меню
// - iconOpacity (Number, default: 0.5) — прозрачность иконки слева (0-1)
// - subtitleOpacity (Number, default: 0.5) — прозрачность подзаголовка (0-1)
// - classesAdd (Object, default: {}) — классы для добавления на различные элементы компонента. Структура: { root: 'классы', icon: 'классы', subtitle: 'классы', suffix: 'классы' }
// - classesRemove (Object, default: {}) — классы для удаления с различных элементов компонента. Структура: { root: 'классы', icon: 'классы', subtitle: 'классы', suffix: 'классы' }
//
// Выходные события (emits):
// - click — общее событие клика по пункту меню (эмитится всегда при клике на любую зону)
// - click-icon — клик по иконке слева (эмитится вместе с click)
// - click-text — клик по текстовой области (эмитится вместе с click)
// - click-suffix — клик по суффиксу справа (эмитится вместе с click)
//
// Примечание: Все зоны (иконка, текст, суффикс) эмитят общее событие click по умолчанию. Раздельные события (click-icon, click-text, click-suffix) срабатывают только если назначены явно в родительском компоненте.
//
// ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
// Структура layout и CSS-классы: см. в шапке шаблона `shared/templates/dropdown-menu-item-template.js`
// Bootstrap-совместимость:
// - Компонент использует класс dropdown-item Bootstrap для базовой стилизации
// - Состояния active и disabled применяются через классы Bootstrap
// - Поддержка тем Bootstrap через CSS-переменные (var(--bs-body-color), var(--bs-secondary-color) и т.п.)
// Подсказки (tooltips):
// - По умолчанию: нативные подсказки браузера через атрибут title (не требуют инициализации)
// - Опционально: Bootstrap tooltips через props tooltipIconBootstrap, tooltipTextBootstrap, tooltipSuffixBootstrap (Boolean, default: false)
// - Если соответствующий prop = true, используется Bootstrap tooltip с инициализацией через window.bootstrap.Tooltip
// - Bootstrap tooltips уничтожаются в beforeUnmount() для предотвращения утечек памяти
// - Раздельные подсказки для иконки (tooltipIcon), текста (tooltipText) и суффикса (tooltipSuffix или suffix.tooltip)
// Обработка событий:
// - По умолчанию все зоны (иконка, текст, суффикс) эмитят общее событие 'click'
// - Раздельные события (click-icon, click-text, click-suffix) эмитятся всегда при клике на соответствующую зону
// - Обработчики событий используют .stop для предотвращения всплытия
// - Используется @mouseup вместо @click для закрытия dropdown при отпускании кнопки мыши
// - При отпускании кнопки мыши автоматически закрывается родительский dropdown через Bootstrap API
// Использование нативного Bootstrap dropdown-menu:
// - Кастомный компонент dropdown-menu (контейнер выпадающего меню) не создаётся
// - Используется нативный Bootstrap dropdown-menu через классы и JavaScript API
// - Bootstrap 5 уже предоставляет полный функционал: клавиатурную навигацию, позиционирование через Popper.js, управление через JavaScript API, поддержку тем, закрытие при клике вне меню
//
// АРХИТЕКТУРА:
// - Шаблон: shared/templates/dropdown-menu-item-template.js (ID: dropdown-menu-item-template)
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
        // === Использование Bootstrap tooltips (по умолчанию - нативные браузерные через title) ===
        tooltipIconBootstrap: {
            type: Boolean,
            default: false
        },
        tooltipTextBootstrap: {
            type: Boolean,
            default: false
        },
        tooltipSuffixBootstrap: {
            type: Boolean,
            default: false
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
        itemId: {
            type: String,
            default: null
        }, // Для instanceHash (идентификация экземпляра)

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
        },

        // === Управление классами ===
        classesAdd: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'custom-root', icon: 'custom-icon', subtitle: 'custom-subtitle', suffix: 'custom-suffix' }
        },
        classesRemove: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'some-class', icon: 'another-class' }
        }

    },

    emits: ['click', 'click-icon', 'click-text', 'click-suffix'],

    computed: {
        // Подсказка для суффикса (приоритет у tooltipSuffix)
        suffixTooltip() {
            return this.tooltipSuffix || (this.suffix && this.suffix.tooltip) || null;
        },

        // CSS классы для корневого элемента
        itemClasses() {
            const baseClasses = ['dropdown-menu-item-responsive', this.instanceHash];
            if (this.subtitle) {
                // По умолчанию подзаголовок скрыт на мобильных
                baseClasses.push('hide-subtitle-mobile');
            }

            // Управление классами через classesAdd и classesRemove
            if (!window.classManager) {
                console.error('classManager not found in itemClasses');
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.root,
                this.classesRemove?.root
            );
        },

        // CSS классы для иконки
        iconClasses() {
            const baseClasses = ['icon', 'd-flex', 'align-items-center', 'me-2', 'pt-1'];
            if (this.iconOpacity === 0.5) baseClasses.push('opacity-50');

            if (!window.classManager) {
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.icon,
                this.classesRemove?.icon
            );
        },

        // CSS классы для подзаголовка
        subtitleClasses() {
            const baseClasses = ['subtitle', 'd-block', 'mt-1', 'lh-sm'];
            if (this.subtitleOpacity === 0.5) baseClasses.push('opacity-50');

            if (!window.classManager) {
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.subtitle,
                this.classesRemove?.subtitle
            );
        },

        // CSS классы для суффикса
        suffixClasses() {
            const baseClasses = ['d-flex', 'align-items-center', 'ms-2', 'pt-1'];

            if (!window.classManager) {
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.suffix,
                this.classesRemove?.suffix
            );
        },

        // Детерминированный хэш экземпляра на основе родительского контекста и props
        instanceHash() {
            if (!window.hashGenerator) {
                console.warn('hashGenerator not found, using fallback');
                return 'avto-00000000';
            }

            const parentContext = this.getParentContext();
            const instanceId = this.itemId || this.title || this.icon || 'menu-item';
            const uniqueId = `${parentContext}:${instanceId}`;
            return window.hashGenerator.generateMarkupClass(uniqueId);
        }
    },

    methods: {
        // Получить родительский контекст (класс avto-* или ID родителя)
        // Вызывается из computed, поэтому $el может быть еще не доступен
        getParentContext() {
            if (!this.$el) {
                return 'root';
            }

            if (!this.$el.parentElement) {
                return 'root';
            }

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

        // Закрытие родительского dropdown при отпускании кнопки мыши
        closeParentDropdown() {
            // Находим ближайший родительский элемент с классом .dropdown
            let parent = this.$el.closest('.dropdown');
            if (!parent) return;

            // Получаем Bootstrap Dropdown instance
            if (window.bootstrap && window.bootstrap.Dropdown) {
                const dropdownElement = parent.querySelector('[data-bs-toggle="dropdown"]');
                if (dropdownElement) {
                    const dropdownInstance = window.bootstrap.Dropdown.getInstance(dropdownElement);
                    if (dropdownInstance) {
                        dropdownInstance.hide();
                    }
                }
            }
        },

        // Обработчик клика по всему пункту меню
        handleClick(event) {
            if (this.disabled) return;

            // Закрываем dropdown при отпускании кнопки мыши
            this.closeParentDropdown();

            this.$emit('click', event);
        },

        // Обработчик клика по иконке
        handleIconClick(event) {
            if (this.disabled) return;

            // Закрываем dropdown при отпускании кнопки мыши
            this.closeParentDropdown();

            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-icon', event);
        },

        // Обработчик клика по тексту
        handleTextClick(event) {
            if (this.disabled) return;

            // Закрываем dropdown при отпускании кнопки мыши
            this.closeParentDropdown();

            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-text', event);
        },

        // Обработчик клика по суффиксу
        handleSuffixClick(event) {
            if (this.disabled) return;

            // Закрываем dropdown при отпускании кнопки мыши
            this.closeParentDropdown();

            // По умолчанию все зоны эмитят общий click (как будто клик по title)
            this.$emit('click', event);
            // Раздельное событие эмитится всегда (если обработчик не назначен, Vue его не вызовет)
            this.$emit('click-suffix', event);
        }
    },

    mounted() {
        // Инициализация Bootstrap tooltips только для элементов, где соответствующий prop = true
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

