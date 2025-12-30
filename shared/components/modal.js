/**
 * ================================================================================================
 * MODAL COMPONENT - Компонент модального окна
 * ================================================================================================
 *
 * ЦЕЛЬ: Vue-обёртка над Bootstrap Modal с полной проницаемостью для Bootstrap API.
 *
 * ПРИНЦИПЫ:
 * - Максимальная совместимость с Bootstrap JS API (обязательное требование)
 * - Использование только Bootstrap классов (запрет кастомных стилей)
 * - Инициализация Bootstrap Modal через JavaScript API
 * - Подписка на события Bootstrap (show.bs.modal, hide.bs.modal)
 * - Программный доступ к Bootstrap API через ref
 *
 * API КОМПОНЕНТА:
 *
 * Входные параметры (props):
 * - modalId (String, required) — уникальный ID модального окна (используется для Bootstrap)
 * - size (String) — размер модального окна ('sm', 'lg', 'xl') или null для дефолтного
 * - centered (Boolean, default: false) — центрирование модального окна по вертикали
 * - titleId (String) — ID заголовка для aria-labelledby (генерируется автоматически, если не указан)
 * - static (Boolean, default: false) — статическое отображение модального окна (без backdrop, всегда видимо, для примеров)
 *
 * Выходные события (emits):
 * - show — событие открытия модального окна (синхронизировано с show.bs.modal)
 * - shown — событие после открытия (синхронизировано с shown.bs.modal)
 * - hide — событие закрытия модального окна (синхронизировано с hide.bs.modal)
 * - hidden — событие после закрытия (синхронизировано с hidden.bs.modal)
 *
 * Слоты:
 * - header — заголовок модального окна (modal-header)
 * - body — тело модального окна (modal-body)
 * - footer — футер модального окна (modal-footer)
 *
 * Методы (ref API):
 * - show() — программное открытие модального окна через Bootstrap API
 * - hide() — программное закрытие модального окна через Bootstrap API
 * - toggle() — программное переключение модального окна через Bootstrap API
 * - getBootstrapInstance() — получение экземпляра Bootstrap Modal для прямого доступа к API
 *
 * ПРАВИЛА ИСПОЛЬЗОВАНИЯ:
 * - Кнопка "Закрыть" не используется: закрытие модального окна выполняется только через крестик в header (btn-close)
 * - Кнопка "Отмена" обязательна в footer: отменяет введенные данные (восстанавливает исходные значения полей) или закрывает окно, если данные не изменены
 *   - На форме с измененными данными: первый клик по "Отмена" восстанавливает исходные значения полей, второй клик закрывает окно
 *   - На форме без изменений: клик по "Отмена" сразу закрывает окно
 * - Кнопка "Сохранить" обязательна в footer, если есть изменяемые поля: сохраняет введенные данные и закрывает модальное окно
 *
 * СИСТЕМА УПРАВЛЕНИЯ КНОПКАМИ:
 * Компонент предоставляет через provide/inject API для управления кнопками в header и footer:
 * - registerButton(buttonId, config) — регистрация кнопки с указанием мест отображения (header, footer или оба)
 * - updateButton(buttonId, updates) — обновление состояния кнопки (реактивно обновляется во всех местах)
 * - removeButton(buttonId) — удаление кнопки
 * - getButton(buttonId) — получение конфигурации кнопки
 * - getButtonsForLocation(location) — получение кнопок для конкретного места (header/footer)
 *
 * Одна кнопка может отображаться в header, footer или в обоих местах одновременно без дублирования функциональности.
 * Состояние кнопки (disabled, visible, onClick) единое для всех мест отображения.
 *
 * ССЫЛКИ:
 * - Шаблон: shared/templates/modal-template.js
 * - Компонент кнопок: shared/components/modal-buttons.js
 * - Bootstrap Modal API: https://getbootstrap.com/docs/5.3/components/modal/
 */

window.cmpModal = {
    template: '#modal-template',

    props: {
        modalId: {
            type: String,
            required: true
        },
        size: {
            type: String,
            default: null,
            validator: (value) => value === null || ['sm', 'lg', 'xl'].includes(value)
        },
        centered: {
            type: Boolean,
            default: false
        },
        titleId: {
            type: String,
            default: null
        },
        static: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            isOpen: false,
            modalInstance: null,
            // Единый реестр всех кнопок модального окна
            // Map<buttonId, buttonConfig> - кнопка регистрируется один раз, может отображаться в header, footer или в обоих
            buttons: new Map()
        };
    },

    computed: {
        modalClasses() {
            const classes = ['modal'];
            if (this.static) {
                classes.push('show', 'd-block');
            } else {
                classes.push('fade');
                if (this.isOpen) {
                    classes.push('show');
                }
            }
            return classes;
        },

        dialogClasses() {
            const classes = ['modal-dialog'];
            if (this.size) {
                classes.push(`modal-${this.size}`);
            }
            if (this.centered) {
                classes.push('modal-dialog-centered');
            }
            return classes;
        },

        computedTitleId() {
            return this.titleId || `${this.modalId}-title`;
        },

        /**
         * Проверка наличия кнопок для конкретного места
         */
        hasButtons() {
            return (location) => {
                for (const button of this.buttons.values()) {
                    if (button.locations.includes(location) && button.visible) {
                        return true;
                    }
                }
                return false;
            };
        }
    },

    methods: {
        show() {
            if (this.modalInstance) {
                this.modalInstance.show();
            }
        },

        hide() {
            if (this.modalInstance) {
                this.modalInstance.hide();
            }
        },

        toggle() {
            if (this.modalInstance) {
                this.modalInstance.toggle();
            }
        },

        getBootstrapInstance() {
            return this.modalInstance;
        },

        /**
         * Регистрация кнопки в модальном окне
         * @param {string} buttonId - уникальный ID кнопки
         * @param {Object} config - конфигурация кнопки
         * @param {string|Array<string>} config.locations - где отображать: 'header', 'footer', или ['header', 'footer']
         * @param {string} config.label - текст кнопки
         * @param {string} config.variant - вариант Bootstrap (primary, secondary, и т.д.)
         * @param {Function} config.onClick - обработчик клика
         * @param {boolean} config.disabled - состояние disabled (по умолчанию false)
         * @param {boolean} config.visible - видимость кнопки (по умолчанию true)
         * @param {Object} config.classesAdd - дополнительные классы для cmp-button
         * @param {Object} config.buttonAttributes - атрибуты для передачи на корневой элемент button
         * @param {string} config.icon - CSS класс иконки (Font Awesome, Material Symbols)
         */
        registerButton(buttonId, config) {
            // Нормализуем locations в массив
            const locations = Array.isArray(config.locations)
                ? config.locations
                : [config.locations || 'footer'];

            // Валидация locations
            const validLocations = ['header', 'footer'];
            const invalidLocations = locations.filter(loc => !validLocations.includes(loc));
            if (invalidLocations.length > 0) {
                console.warn(`[cmp-modal] Invalid locations for button "${buttonId}":`, invalidLocations);
            }
            const normalizedLocations = locations.filter(loc => validLocations.includes(loc));

            if (normalizedLocations.length === 0) {
                console.warn(`[cmp-modal] No valid locations for button "${buttonId}", defaulting to footer`);
                normalizedLocations.push('footer');
            }

            // Сохраняем кнопку с единым состоянием
            this.buttons.set(buttonId, {
                id: buttonId,
                locations: normalizedLocations, // Где отображать
                label: config.label || '',
                variant: config.variant || 'primary',
                disabled: config.disabled || false,
                visible: config.visible !== false, // По умолчанию видима
                onClick: config.onClick || null,
                classesAdd: config.classesAdd || {},
                buttonAttributes: config.buttonAttributes || {},
                icon: config.icon || null
            });

            // Принудительное обновление для реактивности
            this.$forceUpdate();
        },

        /**
         * Обновление кнопки (реактивно обновляется во всех местах отображения)
         * @param {string} buttonId - ID кнопки
         * @param {Object} updates - объект с обновляемыми свойствами (locations не обновляется)
         */
        updateButton(buttonId, updates) {
            const button = this.buttons.get(buttonId);
            if (!button) {
                console.warn(`[cmp-modal] Button "${buttonId}" not found for update`);
                return;
            }

            // Обновляем свойства, но locations не меняем (они задаются при регистрации)
            Object.keys(updates).forEach(key => {
                if (key !== 'locations') {
                    button[key] = updates[key];
                }
            });

            // Принудительное обновление для реактивности
            this.$forceUpdate();
        },

        /**
         * Удаление кнопки
         * @param {string} buttonId - ID кнопки
         */
        removeButton(buttonId) {
            if (this.buttons.delete(buttonId)) {
                this.$forceUpdate();
            }
        },

        /**
         * Получение конфигурации кнопки
         * @param {string} buttonId - ID кнопки
         * @returns {Object|null} - конфигурация кнопки или null
         */
        getButton(buttonId) {
            return this.buttons.get(buttonId) || null;
        },

        /**
         * Получение кнопок для конкретного места (header или footer)
         * @param {string} location - 'header' или 'footer'
         * @returns {Array<Object>} - массив конфигураций кнопок
         */
        getButtonsForLocation(location) {
            const result = [];
            for (const button of this.buttons.values()) {
                if (button.locations.includes(location) && button.visible) {
                    result.push(button);
                }
            }
            return result;
        }
    },

    /**
     * Предоставление API для управления кнопками через provide/inject
     */
    provide() {
        return {
            modalApi: {
                registerButton: this.registerButton,
                updateButton: this.updateButton,
                removeButton: this.removeButton,
                getButton: this.getButton,
                getButtonsForLocation: this.getButtonsForLocation
            }
        };
    },

    mounted() {
        // Инициализация Bootstrap Modal через JavaScript API
        // КРИТИЧЕСКИ ВАЖНО: Сохраняем совместимость с Bootstrap API
        // Для статического режима не инициализируем Bootstrap Modal
        if (this.static) {
            return;
        }

        this.$nextTick(() => {
            if (window.bootstrap && window.bootstrap.Modal && this.$refs.modalElement) {
                this.modalInstance = new window.bootstrap.Modal(this.$refs.modalElement, {});

                // Подписка на события Bootstrap для синхронизации состояния
                this.$refs.modalElement.addEventListener('show.bs.modal', () => {
                    this.isOpen = true;
                    this.$emit('show');
                });

                this.$refs.modalElement.addEventListener('shown.bs.modal', () => {
                    this.$emit('shown');
                });

                this.$refs.modalElement.addEventListener('hide.bs.modal', () => {
                    this.isOpen = false;
                    this.$emit('hide');
                });

                this.$refs.modalElement.addEventListener('hidden.bs.modal', () => {
                    this.$emit('hidden');
                });
            }
        });
    },

    beforeUnmount() {
        // Уничтожение Bootstrap Modal для предотвращения утечек памяти
        if (this.modalInstance) {
            this.modalInstance.dispose();
            this.modalInstance = null;
        }
    }
};

