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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modal-buttons.js:updateButtons',message:'updateButtons called',data:{location:this.location,hasModalApi:!!this.modalApi,hasGetButtonsForLocation:!!(this.modalApi&&this.modalApi.getButtonsForLocation)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            if (this.modalApi && this.modalApi.getButtonsForLocation) {
                const buttons = this.modalApi.getButtonsForLocation(this.location);
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modal-buttons.js:updateButtons',message:'got buttons from modalApi',data:{location:this.location,buttonsCount:buttons.length,buttons:buttons.map(b=>({id:b.id,label:b.label,visible:b.visible}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                this.buttons = buttons;
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modal-buttons.js:mounted',message:'mounted called',data:{location:this.location,hasModalApi:!!this.modalApi,hasGetButtonsForLocation:!!(this.modalApi&&this.modalApi.getButtonsForLocation)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        this.updateButtons();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modal-buttons.js:mounted',message:'after updateButtons',data:{buttonsCount:this.buttons.length,buttons:this.buttons.map(b=>({id:b.id,label:b.label}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        // Подписка на изменения кнопок через watch
        // Используем $watch для отслеживания изменений в modalApi
        this.$watch(
            () => {
                // Принудительно получаем актуальный список кнопок
                return this.modalApi ? this.modalApi.getButtonsForLocation(this.location) : [];
            },
            (newButtons) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'modal-buttons.js:watch',message:'buttons updated via watch',data:{location:this.location,buttonsCount:newButtons.length,buttons:newButtons.map(b=>({id:b.id,label:b.label}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                this.buttons = newButtons;
            },
            { deep: true, immediate: true }
        );
    }
};

