/**
 * ================================================================================================
 * TIMEZONE MODAL BODY COMPONENT - Компонент body модального окна выбора таймзоны
 * ================================================================================================
 *
 * ЦЕЛЬ: Интеграция timezone-selector с системой управления кнопками модального окна.
 *
 * ОСОБЕННОСТИ:
 * - Использует cmp-timezone-selector для выбора таймзоны
 * - Регистрирует кнопки "Отмена" и "Сохранить" через modalApi
 * - Реактивно обновляет состояние кнопок при изменении таймзоны
 * - Управляет логикой отмены (восстановление исходного значения)
 *
 * ССЫЛКИ:
 * - Компонент выбора таймзоны: shared/components/timezone-selector.js
 * - Система управления кнопками: shared/components/modal.js
 */

window.timezoneModalBody = {
    template: `
        <cmp-timezone-selector v-model="selectedTimezone"></cmp-timezone-selector>
    `,

    components: {
        'cmp-timezone-selector': window.cmpTimezoneSelector
    },

    inject: ['modalApi'],

    props: {
        modelValue: {
            type: String,
            required: true
        },
        initialValue: {
            type: String,
            required: true
        },
        onSave: {
            type: Function,
            required: true
        },
        onCancel: {
            type: Function,
            required: true
        },
        modalRef: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            selectedTimezone: this.modelValue
        };
    },

    watch: {
        modelValue(newVal) {
            this.selectedTimezone = newVal;
        },
        selectedTimezone(newVal) {
            this.$emit('update:modelValue', newVal);
            // Обновляем состояние кнопки "Сохранить" при изменении таймзоны
            if (this.modalApi) {
                const hasChanges = newVal !== this.initialValue;
                this.modalApi.updateButton('save', {
                    disabled: !hasChanges
                });
            }
        }
    },

    computed: {
        hasChanges() {
            return this.selectedTimezone !== this.initialValue;
        }
    },

    methods: {
        handleCancel() {
            if (this.hasChanges) {
                // Восстанавливаем исходное значение
                this.selectedTimezone = this.initialValue;
                this.$emit('update:modelValue', this.initialValue);
            } else {
                // Закрываем модальное окно
                this.onCancel();
            }
        },
        handleSave() {
            this.onSave(this.selectedTimezone);
        }
    },

    mounted() {
        // Регистрируем кнопки при монтировании
        if (this.modalApi) {
            // Кнопка "Отмена" только в footer
            this.modalApi.registerButton('cancel', {
                locations: ['footer'],
                label: 'Отмена',
                variant: 'secondary',
                classesAdd: { root: 'me-auto' },
                onClick: () => this.handleCancel()
            });

            // Кнопка "Сохранить" только в footer
            this.modalApi.registerButton('save', {
                locations: ['footer'],
                label: 'Сохранить',
                variant: 'primary',
                disabled: !this.hasChanges,
                onClick: () => this.handleSave()
            });
        }
    },

    beforeUnmount() {
        // Удаляем кнопки при размонтировании
        if (this.modalApi) {
            this.modalApi.removeButton('cancel');
            this.modalApi.removeButton('save');
        }
    }
};

