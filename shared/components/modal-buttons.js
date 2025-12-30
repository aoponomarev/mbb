/**
 * ================================================================================================
 * MODAL BUTTONS COMPONENT - Компонент для рендеринга кнопок модального окна
 * ================================================================================================
 *
 * ЦЕЛЬ: Рендеринг кнопок модального окна в header или footer на основе единой системы управления.
 *
 * ПРИНЦИПЫ:
 * - Компонент получает кнопки через inject от cmp-modal
 * - Отображает кнопки только для указанного места (header или footer)
 * - Использует cmp-button для рендеринга каждой кнопки
 * - Реагирует на изменения состояния кнопок (disabled, visible)
 *
 * API КОМПОНЕНТА:
 *
 * Входные параметры (props):
 * - location (String, required) — место отображения: 'header' или 'footer'
 *
 * Inject:
 * - modalApi — API для управления кнопками (предоставляется cmp-modal)
 *
 * ССЫЛКИ:
 * - Шаблон: shared/templates/modal-buttons-template.js
 * - Компонент модального окна: shared/components/modal.js
 * - Компонент кнопки: shared/components/button.js
 */

window.cmpModalButtons = {
    template: '#modal-buttons-template',

    inject: ['modalApi'],

    props: {
        location: {
            type: String,
            required: true,
            validator: (value) => ['header', 'footer'].includes(value)
        }
    },

    components: {
        'cmp-button': window.cmpButton
    },

    data() {
        return {
            buttons: []
        };
    },

    methods: {
        /**
         * Обновление списка кнопок для текущего места
         */
        updateButtons() {
            if (this.modalApi && this.modalApi.getButtonsForLocation) {
                this.buttons = this.modalApi.getButtonsForLocation(this.location);
            }
        },

        /**
         * Обработчик клика по кнопке
         * @param {Object} button - конфигурация кнопки
         */
        handleClick(button) {
            if (button.onClick && !button.disabled) {
                button.onClick();
            }
        }
    },

    mounted() {
        this.updateButtons();

        // Подписка на изменения кнопок через watch
        // Используем $watch для отслеживания изменений в modalApi
        this.$watch(
            () => {
                // Принудительно получаем актуальный список кнопок
                return this.modalApi ? this.modalApi.getButtonsForLocation(this.location) : [];
            },
            (newButtons) => {
                this.buttons = newButtons;
            },
            { deep: true, immediate: true }
        );
    }
};

