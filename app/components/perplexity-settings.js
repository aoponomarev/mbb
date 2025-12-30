/**
 * ================================================================================================
 * PERPLEXITY SETTINGS COMPONENT - Компонент настроек Perplexity
 * ================================================================================================
 *
 * ЦЕЛЬ: Компонент настроек Perplexity AI (API ключ и модель) для модального окна.
 *
 * ОСОБЕННОСТИ:
 * - Компактный и аскетичный интерфейс
 * - Использует систему управления кнопками модального окна
 * - Сохранение через cache-manager
 * - Валидация API ключа
 *
 * API КОМПОНЕНТА:
 *
 * Inject:
 * - modalApi — API для управления кнопками (предоставляется cmp-modal)
 *
 * ССЫЛКИ:
 * - Шаблон: app/templates/perplexity-settings-template.js
 * - API модуль: core/api/perplexity.js
 * - Система управления кнопками: shared/components/modal.js
 */

window.perplexitySettings = {
    template: '#perplexity-settings-template',

    inject: ['modalApi'],

    data() {
        return {
            apiKey: '',
            model: 'sonar-pro',
            initialApiKey: '',
            initialModel: 'sonar-pro',
            showApiKey: false,
            models: [
                { value: 'sonar-pro', label: 'sonar-pro' },
                { value: 'sonar', label: 'sonar' },
                { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
                { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
            ]
        };
    },

    computed: {
        hasChanges() {
            return this.apiKey !== this.initialApiKey || this.model !== this.initialModel;
        },
        isValid() {
            return this.apiKey.trim().length > 0;
        }
    },

    watch: {
        apiKey() {
            if (this.modalApi) {
                this.modalApi.updateButton('save', {
                    disabled: !this.hasChanges || !this.isValid
                });
            }
        },
        model() {
            if (this.modalApi) {
                this.modalApi.updateButton('save', {
                    disabled: !this.hasChanges || !this.isValid
                });
            }
        }
    },

    methods: {
        async loadSettings() {
            const defaultApiKey = ''; // API ключ должен быть настроен пользователем

            try {
                if (window.cacheManager) {
                    let savedApiKey = null;
                    let savedModel = null;

                    // Обрабатываем каждое значение отдельно, чтобы ошибка в одном не блокировала другое
                    try {
                        savedApiKey = await window.cacheManager.get('perplexity-api-key');
                    } catch (error) {
                        console.warn('Failed to load perplexity-api-key from cache, using default:', error);
                        // Очищаем некорректное значение из localStorage
                        try {
                            localStorage.removeItem('perplexity-api-key');
                        } catch (e) {}
                    }

                    try {
                        savedModel = await window.cacheManager.get('perplexity-model');
                    } catch (error) {
                        console.warn('Failed to load perplexity-model from cache:', error);
                    }

                    if (savedApiKey) {
                        this.apiKey = savedApiKey;
                        this.initialApiKey = savedApiKey;
                    } else {
                        // Используем ключ по умолчанию
                        this.apiKey = defaultApiKey;
                        this.initialApiKey = defaultApiKey;
                    }

                    if (savedModel) {
                        this.model = savedModel;
                        this.initialModel = savedModel;
                    } else {
                        this.model = 'sonar-pro';
                        this.initialModel = 'sonar-pro';
                    }
                } else {
                    const savedApiKey = localStorage.getItem('perplexity-api-key');
                    const savedModel = localStorage.getItem('perplexity-model');

                    if (savedApiKey) {
                        this.apiKey = savedApiKey;
                        this.initialApiKey = savedApiKey;
                    } else {
                        // Используем ключ по умолчанию
                        this.apiKey = defaultApiKey;
                        this.initialApiKey = defaultApiKey;
                    }

                    if (savedModel) {
                        this.model = savedModel;
                        this.initialModel = savedModel;
                    }
                }
            } catch (error) {
                console.error('Failed to load Perplexity settings:', error);
                // В случае общей ошибки используем значения по умолчанию
                this.apiKey = defaultApiKey;
                this.initialApiKey = defaultApiKey;
                this.model = 'sonar-pro';
                this.initialModel = 'sonar-pro';
            }
        },
        async saveSettings() {
            try {
                if (window.cacheManager) {
                    await window.cacheManager.set('perplexity-api-key', this.apiKey.trim());
                    await window.cacheManager.set('perplexity-model', this.model);
                } else {
                    localStorage.setItem('perplexity-api-key', this.apiKey.trim());
                    localStorage.setItem('perplexity-model', this.model);
                }

                this.initialApiKey = this.apiKey;
                this.initialModel = this.model;

                // Обновляем настройки в футере и перезапрашиваем новости
                if (this.$parent.$refs && this.$parent.$refs.appFooter) {
                    this.$parent.$refs.appFooter.perplexityApiKey = this.apiKey.trim();
                    this.$parent.$refs.appFooter.perplexityModel = this.model;
                    // Перезапрашиваем новости (старые будут перезаписаны)
                    await this.$parent.$refs.appFooter.fetchCryptoNews();
                }

                // Закрываем модальное окно
                this.closeModal();
            } catch (error) {
                console.error('Failed to save Perplexity settings:', error);
            }
        },
        handleCancel() {
            if (this.hasChanges) {
                // Восстанавливаем исходные значения
                this.apiKey = this.initialApiKey;
                this.model = this.initialModel;
                // После отмены изменений hasChanges станет false, следующий клик закроет окно
            } else {
                // Закрываем модальное окно, если изменений нет
                this.closeModal();
            }
        },

        closeModal() {
            // Убираем фокус с активного элемента перед закрытием модального окна
            // Это предотвращает ошибку доступности: "Blocked aria-hidden on an element because its descendant retained focus"
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            // Перемещаем фокус на body для гарантии
            if (document.body && document.body.focus) {
                document.body.focus();
            } else {
                // Если body не может получить фокус, просто убираем фокус
                document.activeElement?.blur();
            }

            // Ищем модальное окно через родительские компоненты
            let parent = this.$parent;
            while (parent) {
                if (parent.$refs && parent.$refs.perplexityModal) {
                    parent.$refs.perplexityModal.hide();
                    return;
                }
                // Также проверяем статическую модалку
                if (parent.$refs && parent.$refs.perplexityModalStatic) {
                    // Для статической модалки просто эмитим событие закрытия
                    return;
                }
                parent = parent.$parent;
            }
            // Если не нашли через refs, пытаемся найти через Bootstrap API
            const modalElement = this.$el.closest('.modal');
            if (modalElement && window.bootstrap && window.bootstrap.Modal) {
                const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        },
        toggleApiKeyVisibility() {
            this.showApiKey = !this.showApiKey;
        }
    },

    mounted() {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:mounted',message:'mounted called',data:{hasModalApi:!!this.modalApi,modalApiType:typeof this.modalApi},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        this.loadSettings();

        // Регистрируем кнопки при монтировании через $nextTick для гарантии доступности modalApi
        this.$nextTick(() => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:$nextTick',message:'$nextTick callback',data:{hasModalApi:!!this.modalApi,hasRegisterButton:!!(this.modalApi&&this.modalApi.registerButton)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            if (this.modalApi) {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:registerButton',message:'registering cancel button',data:{hasChanges:this.hasChanges,isValid:this.isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                // Кнопка "Отмена" только в footer
                this.modalApi.registerButton('cancel', {
                    locations: ['footer'],
                    label: 'Отмена',
                    variant: 'secondary',
                    classesAdd: { root: 'me-auto' },
                    onClick: () => this.handleCancel()
                });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:registerButton',message:'registering save button',data:{hasChanges:this.hasChanges,isValid:this.isValid,disabled:!this.hasChanges||!this.isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                // Кнопка "Сохранить" только в footer
                this.modalApi.registerButton('save', {
                    locations: ['footer'],
                    label: 'Сохранить',
                    variant: 'primary',
                    disabled: !this.hasChanges || !this.isValid,
                    onClick: () => this.saveSettings()
                });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:registerButton',message:'both buttons registered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'perplexity-settings.js:$nextTick',message:'modalApi is null/undefined',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
            }
        });
    },

    beforeUnmount() {
        // Удаляем кнопки при размонтировании
        if (this.modalApi) {
            this.modalApi.removeButton('cancel');
            this.modalApi.removeButton('save');
        }
    }
};

