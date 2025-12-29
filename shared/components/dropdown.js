// =========================
// КОМПОНЕНТ DROPDOWN
// Vue-обёртка над Bootstrap dropdown с поддержкой поиска и прокрутки
// =========================
// ЦЕЛЬ: Переиспользуемый компонент выпадающего списка с поддержкой:
// - Поиска по элементам
// - Прокрутки для длинных списков
// - Полной совместимости с Bootstrap JS API
// - Кастомной кнопки через слот
// - Динамической загрузки элементов
// - Адаптивности кнопки триггера через CSS классы (.dropdown-responsive)
// - Детерминированных хэшей экземпляров (instanceHash) для идентификации и кастомной стилизации
// - Использования компонента cmp-button для кнопки триггера (полная совместимость с Bootstrap API)
//
// ПРИНЦИПЫ:
// - Максимальная совместимость с Bootstrap JS API (обязательное требование)
// - Использование только Bootstrap классов (запрет кастомных стилей)
// - Инициализация Bootstrap Dropdown через JavaScript API
// - Подписка на события Bootstrap (show.bs.dropdown, hide.bs.dropdown)
// - Программный доступ к Bootstrap API через ref
// - Поддержка тем Bootstrap через CSS-переменные
// - Использование компонента cmp-button для кнопки триггера: атрибуты Bootstrap передаются через buttonAttributes,
//   доступ к реальному DOM-элементу через $refs.dropdownButton.$el для инициализации Bootstrap API
//
// АРХИТЕКТУРА:
// - Шаблон: shared/templates/dropdown-template.html
// - Зависимости: Bootstrap 5, Vue.js
// - См. также: docs/doc-components.md (стратегия совместимости с Bootstrap)
// - См. также: docs/doc-architect.md (принципы модульности, запрет кастомных стилей)

window.cmpDropdown = {
    template: '#dropdown-template',
    components: {
        'cmp-button': window.cmpButton
    },

    props: {
        // === Кнопка триггера ===
        buttonText: {
            type: String,
            default: 'Dropdown'
        },
        buttonTextShort: {
            type: String,
            default: null // укороченная версия текста для мобильных (если buttonIcon не задан)
        },
        buttonIcon: {
            type: String,
            default: null // иконка для мобильной версии (Font Awesome класс)
        },
        buttonVariant: {
            type: String,
            default: 'primary',
            validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary', 'outline-success', 'outline-danger', 'outline-warning', 'outline-info', 'outline-light', 'outline-dark', 'link'].includes(value)
        },
        buttonSize: {
            type: String,
            default: null,
            validator: (value) => !value || ['sm', 'lg'].includes(value)
        },

        // === Поиск ===
        searchable: {
            type: Boolean,
            default: false
        },
        searchPlaceholder: {
            type: String,
            default: 'Поиск...'
        },
        emptySearchText: {
            type: String,
            default: 'Ничего не найдено'
        },
        searchFunction: {
            type: Function,
            default: null // Если не указана, используется встроенная фильтрация по строке
        },

        // === Прокрутка ===
        scrollable: {
            type: Boolean,
            default: false
        },
        maxHeight: {
            type: String,
            default: '300px'
        },

        // === Элементы списка ===
        items: {
            type: Array,
            default: () => []
        },

        // === Управление классами ===
        classesAdd: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'float-start', button: 'custom-button', menu: 'custom-menu' }
        },
        classesRemove: {
            type: Object,
            default: () => ({})
            // Пример: { root: 'some-class', button: 'another-class', menu: 'yet-another-class' }
        },
        menuClasses: {
            type: String,
            default: ''
        },
        menuStyle: {
            type: Object,
            default: () => ({})
        },
        menuOffset: {
            type: [Number, Array],
            default: null
            // Число: [0, -16] (x, y в пикселях)
            // Массив: [0, -16] (x, y в пикселях)
            // null: использовать дефолтный offset Bootstrap
        },

        // === ID для Bootstrap (опционально) ===
        dropdownId: {
            type: String,
            default: null
        }
    },

    emits: ['show', 'hide', 'search', 'item-select'],

    data() {
        return {
            isOpen: false,
            searchQuery: '',
            dropdownInstance: null
        };
    },

    computed: {
        // CSS классы для корневого элемента dropdown
        dropdownClasses() {
            const baseClasses = ['dropdown', 'dropdown-responsive', this.instanceHash];

            // Условные классы для адаптивности
            if (this.buttonIcon) baseClasses.push('has-icon');
            if (this.buttonTextShort) baseClasses.push('has-text-short');

            // Управление классами через classesAdd и classesRemove
            if (!window.classManager) {
                console.error('classManager not found in dropdownClasses');
                return baseClasses.join(' ');
            }

            const result = window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.root,
                this.classesRemove?.root
            );
            return result;
        },

        // CSS классы для выпадающего меню
        menuClassesComputed() {
            const baseClasses = ['dropdown-menu'];

            // Добавляем классы из prop menuClasses (для обратной совместимости)
            if (this.menuClasses) {
                const extraClasses = this.menuClasses.split(' ').filter(c => c);
                baseClasses.push(...extraClasses);
            }

            // Управление классами через classesAdd и classesRemove
            if (!window.classManager) {
                return baseClasses.join(' ');
            }

            return window.classManager.processClassesToString(
                baseClasses,
                this.classesAdd?.menu,
                this.classesRemove?.menu
            );
        },

        // Атрибуты для кнопки триггера (для передачи в cmp-button)
        buttonAttributes() {
            return {
                'data-bs-toggle': 'dropdown',
                'aria-expanded': this.isOpen,
                'id': this.dropdownId,
                'class': 'dropdown-toggle'
            };
        },

        // Классы для кнопки триггера (для передачи в cmp-button через classesAdd/classesRemove)
        // Передаем classesAdd.button как root, classesAdd.buttonIcon как icon и т.д.
        buttonClassesForDropdown() {
            // ВАЖНО: Возвращаем объект с undefined вместо пропуска свойств
            // Это обеспечивает стабильную структуру объекта для Vue реактивности
            const result = {
                root: this.classesAdd?.button || undefined,
                container: this.classesAdd?.buttonContainer || undefined,
                icon: this.classesAdd?.buttonIcon || undefined,
                label: this.classesAdd?.buttonLabel || undefined,
                suffix: this.classesAdd?.buttonSuffix || undefined
            };
            return result;
        },
        buttonClassesRemoveForDropdown() {
            // ВАЖНО: Возвращаем объект с undefined вместо пропуска свойств
            // Это обеспечивает стабильную структуру объекта для Vue реактивности
            return {
                root: this.classesRemove?.button || undefined,
                container: this.classesRemove?.buttonContainer || undefined,
                icon: this.classesRemove?.buttonIcon || undefined,
                label: this.classesRemove?.buttonLabel || undefined,
                suffix: this.classesRemove?.buttonSuffix || undefined
            };
        },

        // Детерминированный хэш экземпляра на основе родительского контекста и props
        instanceHash() {
            if (!window.hashGenerator) {
                console.warn('hashGenerator not found, using fallback');
                return 'avto-00000000';
            }

            const parentContext = this.getParentContext();
            const instanceId = this.dropdownId || this.buttonText || this.buttonIcon || 'dropdown';
            const uniqueId = `${parentContext}:${instanceId}`;
            return window.hashGenerator.generateMarkupClass(uniqueId);
        },

        // Отфильтрованные элементы (если используется встроенная фильтрация)
        filteredItems() {
            // Защита от undefined/null items
            const items = this.items || [];
            if (!this.searchable || !this.searchQuery) {
                return items;
            }

            // Если указана кастомная функция поиска
            if (this.searchFunction) {
                return this.searchFunction(items, this.searchQuery);
            }

            // Встроенная фильтрация по строке (ищет в значениях объектов)
            const query = this.searchQuery.toLowerCase();
            return items.filter(item => {
                if (typeof item === 'string') {
                    return item.toLowerCase().includes(query);
                }
                if (typeof item === 'object') {
                    return Object.values(item).some(value =>
                        String(value).toLowerCase().includes(query)
                    );
                }
                return false;
            });
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

        // Обработчик переключения dropdown
        handleToggle(event) {
            // Bootstrap сам управляет открытием/закрытием через data-bs-toggle
            // Этот метод можно использовать для дополнительной логики
        },

        // Обработчик поиска
        handleSearch() {
            this.$emit('search', this.searchQuery);
        },

        // Обработчик Escape (закрытие при поиске)
        handleEscape() {
            if (this.dropdownInstance) {
                this.dropdownInstance.hide();
            }
        },

        // Программное открытие dropdown (через Bootstrap API)
        show() {
            if (this.dropdownInstance) {
                this.dropdownInstance.show();
            }
        },

        // Программное закрытие dropdown (через Bootstrap API)
        hide() {
            if (this.dropdownInstance) {
                this.dropdownInstance.hide();
            }
        },

        // Программное переключение dropdown (через Bootstrap API)
        toggle() {
            if (this.dropdownInstance) {
                this.dropdownInstance.toggle();
            }
        },

        // Получение экземпляра Bootstrap Dropdown (для прямого доступа к API)
        getBootstrapInstance() {
            return this.dropdownInstance;
        }
    },

    mounted() {
        // Инициализация Bootstrap Dropdown через JavaScript API
        // КРИТИЧЕСКИ ВАЖНО: Сохраняем совместимость с Bootstrap API
        this.$nextTick(() => {
            if (window.bootstrap && window.bootstrap.Dropdown && this.$refs.dropdownContainer) {
                // Получаем реальный DOM-элемент кнопки через ref на Vue-компоненте или querySelector
                let toggleElement = null;
                if (this.$refs.dropdownButton) {
                    // Вариант 1: Через ref на Vue-компоненте (более надежно)
                    toggleElement = this.$refs.dropdownButton.$el;
                } else {
                    // Вариант 2: Через querySelector (fallback)
                    toggleElement = this.$refs.dropdownContainer.querySelector('[data-bs-toggle="dropdown"]');
                }

                if (toggleElement) {
                    // Подготовка опций для Bootstrap Dropdown
                    const dropdownOptions = {};

                    // Если указан menuOffset, используем его для Popper.js offset
                    if (this.menuOffset !== null) {
                        // Преобразуем в формат Popper.js: [x, y] или число (только y)
                        if (Array.isArray(this.menuOffset)) {
                            dropdownOptions.offset = this.menuOffset;
                        } else if (typeof this.menuOffset === 'number') {
                            dropdownOptions.offset = [0, this.menuOffset];
                        }
                    }

                    this.dropdownInstance = new window.bootstrap.Dropdown(toggleElement, dropdownOptions);

                    // Подписка на события Bootstrap для синхронизации состояния
                    this.$refs.dropdownContainer.addEventListener('show.bs.dropdown', () => {
                        this.isOpen = true;
                        this.$emit('show');

                        // Фокус на поле поиска при открытии (если поиск включен)
                        if (this.searchable && this.$refs.searchInput) {
                            this.$nextTick(() => {
                                this.$refs.searchInput.focus();
                            });
                        }
                    });

                    this.$refs.dropdownContainer.addEventListener('shown.bs.dropdown', () => {
                        // Дополнительные действия после открытия
                    });

                    this.$refs.dropdownContainer.addEventListener('hide.bs.dropdown', () => {
                        this.isOpen = false;
                        this.$emit('hide');
                    });

                    this.$refs.dropdownContainer.addEventListener('hidden.bs.dropdown', () => {
                        // Очистка поиска при закрытии (опционально)
                        if (this.searchable) {
                            this.searchQuery = '';
                        }
                    });
                }
            }
        });
    },

    beforeUnmount() {
        // Уничтожение Bootstrap Dropdown для предотвращения утечек памяти
        if (this.dropdownInstance) {
            this.dropdownInstance.dispose();
            this.dropdownInstance = null;
        }
    }
};


