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
//
// ПРИНЦИПЫ:
// - Максимальная совместимость с Bootstrap JS API (обязательное требование)
// - Использование только Bootstrap классов (запрет кастомных стилей)
// - Инициализация Bootstrap Dropdown через JavaScript API
// - Подписка на события Bootstrap (show.bs.dropdown, hide.bs.dropdown)
// - Программный доступ к Bootstrap API через ref
// - Поддержка тем Bootstrap через CSS-переменные
//
// АРХИТЕКТУРА:
// - Шаблон: shared/templates/dropdown-template.html
// - Зависимости: Bootstrap 5, Vue.js
// - См. также: docs/doc-components.md (стратегия совместимости с Bootstrap)
// - См. также: docs/doc-architect.md (принципы модульности, запрет кастомных стилей)

window.cmpDropdown = {
    template: '#dropdown-template',

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
        // === Адаптивность ===
        responsive: {
            type: Object,
            default: () => ({
                hideTextOnMobile: true,  // скрывать текст на мобильных, если есть иконка
                showIconOnMobile: true,  // показывать иконку только на мобильных
                useShortTextOnMobile: true // использовать укороченный текст на мобильных, если нет иконки
            })
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

        // === Дополнительные классы ===
        menuClasses: {
            type: String,
            default: ''
        },
        menuStyle: {
            type: Object,
            default: () => ({})
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
        // CSS классы для кнопки
        buttonClasses() {
            const classes = ['btn', `btn-${this.buttonVariant}`, 'dropdown-toggle'];
            if (this.buttonSize) classes.push(`btn-${this.buttonSize}`);
            return classes.join(' ');
        },

        // Отфильтрованные элементы (если используется встроенная фильтрация)
        filteredItems() {
            if (!this.searchable || !this.searchQuery) {
                return this.items;
            }

            // Если указана кастомная функция поиска
            if (this.searchFunction) {
                return this.searchFunction(this.items, this.searchQuery);
            }

            // Встроенная фильтрация по строке (ищет в значениях объектов)
            const query = this.searchQuery.toLowerCase();
            return this.items.filter(item => {
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

    mounted() {
        // Инициализация Bootstrap Dropdown через JavaScript API
        // КРИТИЧЕСКИ ВАЖНО: Сохраняем совместимость с Bootstrap API
        this.$nextTick(() => {
            if (window.bootstrap && window.bootstrap.Dropdown && this.$refs.dropdownContainer) {
                const toggleElement = this.$refs.dropdownContainer.querySelector('[data-bs-toggle="dropdown"]');
                if (toggleElement) {
                    this.dropdownInstance = new window.bootstrap.Dropdown(toggleElement, {
                        // Опции Bootstrap Dropdown можно передать через props при необходимости
                    });

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
    },

    methods: {
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
    }
};

