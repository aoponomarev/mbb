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
 * - Поддержка состояния "Сохранено, закрыть?" для кнопки "Сохранить"
 * - Переключатель видимости API ключа (глазик)
 *
 * API КОМПОНЕНТА:
 *
 * Data:
 * - apiKey (String) — API ключ Perplexity
 * - model (String) — модель Perplexity (по умолчанию 'sonar-pro')
 * - initialApiKey (String) — исходный API ключ при открытии модального окна
 * - initialModel (String) — исходная модель при открытии модального окна
 * - showApiKey (Boolean) — видимость API ключа (для переключателя)
 * - isSaved (Boolean) — состояние успешного сохранения
 * - models (Array) — список доступных моделей Perplexity
 *
 * Computed:
 * - hasChanges (Boolean) — есть ли изменения в полях
 * - isValid (Boolean) — валидность формы (API ключ не пустой)
 *
 * Inject:
 * - modalApi — API для управления кнопками (предоставляется cmp-modal)
 *
 * Методы:
 * - loadSettings() — загрузка настроек из кэша
 * - saveSettings() — сохранение настроек в кэш и обновление в app-footer
 * - handleCancel() — обработка отмены (восстановление исходных значений или закрытие)
 * - closeModal() — закрытие модального окна с удалением фокуса
 * - updateSaveButton() — обновление состояния кнопки "Сохранить" (обычное/сохранено)
 * - toggleApiKeyVisibility() — переключение видимости API ключа
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
        const defaultModel = window.appConfig?.get('defaults.perplexity.model', 'sonar-pro');
        const defaultModels = window.appConfig?.get('defaults.perplexity.models', [
            { value: 'sonar-pro', label: 'sonar-pro' },
            { value: 'sonar', label: 'sonar' },
            { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
            { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
        ]);
        return {
            apiKey: '',
            model: defaultModel,
            initialApiKey: '',
            initialModel: defaultModel,
            showApiKey: false,
            models: defaultModels
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
            // Сбрасываем состояние сохранения при изменении полей
            if (this.isSaved) {
                this.isSaved = false;
                this.updateSaveButton();
            } else if (this.modalApi) {
                this.modalApi.updateButton('save', {
                    disabled: !this.hasChanges || !this.isValid
                });
            }
        },
        model() {
            // Сбрасываем состояние сохранения при изменении полей
            if (this.isSaved) {
                this.isSaved = false;
                this.updateSaveButton();
            } else if (this.modalApi) {
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
                        // Используем модель по умолчанию
                        const defaultModel = window.appConfig?.get('defaults.perplexity.model', 'sonar-pro');
                        this.model = defaultModel;
                        this.initialModel = defaultModel;
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
                const defaultModel = window.appConfig?.get('defaults.perplexity.model', 'sonar-pro');
                this.model = defaultModel;
                this.initialModel = defaultModel;
            }
        },
        async saveSettings() {
            // Если уже сохранено - закрываем модальное окно
            if (this.isSaved) {
                this.closeModal();
                return;
            }

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

                // Переводим кнопку в состояние "Сохранено, закрыть?"
                this.isSaved = true;
                this.updateSaveButton();
            } catch (error) {
                console.error('Failed to save Perplexity settings:', error);
            }
        },

        updateSaveButton() {
            if (!this.modalApi) return;

            if (this.isSaved) {
                // Состояние "Сохранено, закрыть?"
                this.modalApi.updateButton('save', {
                    label: 'Сохранено, закрыть?',
                    variant: 'success',
                    disabled: false
                });
            } else {
                // Обычное состояние "Сохранить"
                this.modalApi.updateButton('save', {
                    label: 'Сохранить',
                    variant: 'primary',
                    disabled: !this.hasChanges || !this.isValid
                });
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
        this.loadSettings();

        // Регистрируем кнопки при монтировании через $nextTick для гарантии доступности modalApi
        this.$nextTick(() => {
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
                    disabled: !this.hasChanges || !this.isValid,
                    onClick: () => this.saveSettings()
                });
                // Инициализируем состояние кнопки
                this.updateSaveButton();
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

