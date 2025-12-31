/**
 * ================================================================================================
 * AI API SETTINGS COMPONENT - Компонент настроек AI API провайдеров
 * ================================================================================================
 *
 * ЦЕЛЬ: Компонент настроек AI API провайдеров (YandexGPT, Perplexity) для модального окна.
 * Позволяет переключаться между провайдерами и настраивать их параметры.
 *
 * ОСОБЕННОСТИ:
 * - Переключатель провайдеров через radio buttons
 * - Условное отображение полей настроек в зависимости от выбранного провайдера
 * - Компактный и аскетичный интерфейс
 * - Использует систему управления кнопками модального окна
 * - Сохранение через cache-manager
 * - Валидация API ключей
 * - Поддержка состояния "Сохранено, закрыть?" для кнопки "Сохранить"
 * - Переключатель видимости API ключа (глазик)
 *
 * API КОМПОНЕНТА:
 *
 * Data:
 * - provider (String) — текущий провайдер ('yandex' | 'perplexity')
 * - yandexApiKey (String) — API ключ Yandex
 * - yandexModel (String) — модель YandexGPT
 * - perplexityApiKey (String) — API ключ Perplexity
 * - perplexityModel (String) — модель Perplexity
 * - initialProvider (String) — исходный провайдер при открытии модального окна
 * - initialYandexApiKey (String) — исходный API ключ Yandex
 * - initialYandexModel (String) — исходная модель Yandex
 * - initialPerplexityApiKey (String) — исходный API ключ Perplexity
 * - initialPerplexityModel (String) — исходная модель Perplexity
 * - showYandexApiKey (Boolean) — видимость API ключа Yandex
 * - showPerplexityApiKey (Boolean) — видимость API ключа Perplexity
 * - isSaved (Boolean) — состояние успешного сохранения
 * - yandexModels (Array) — список доступных моделей YandexGPT
 * - perplexityModels (Array) — список доступных моделей Perplexity
 *
 * Computed:
 * - hasChanges (Boolean) — есть ли изменения в полях
 * - isValid (Boolean) — валидность формы (API ключ текущего провайдера не пустой)
 *
 * Inject:
 * - modalApi — API для управления кнопками (предоставляется cmp-modal)
 *
 * Методы:
 * - loadSettings() — загрузка настроек из кэша
 * - saveSettings() — сохранение настроек в кэш
 * - handleCancel() — обработка отмены (восстановление исходных значений или закрытие)
 * - closeModal() — закрытие модального окна с удалением фокуса
 * - updateSaveButton() — обновление состояния кнопки "Сохранить" (обычное/сохранено)
 * - toggleYandexApiKeyVisibility() — переключение видимости API ключа Yandex
 * - togglePerplexityApiKeyVisibility() — переключение видимости API ключа Perplexity
 *
 * ССЫЛКИ:
 * - Шаблон: app/templates/ai-api-settings-template.js
 * - AI Provider Manager: core/api/ai-provider-manager.js
 * - Система управления кнопками: shared/components/modal.js
 */

window.aiApiSettings = {
    template: '#ai-api-settings-template',

    inject: ['modalApi'],

    data() {
        const defaultProvider = window.appConfig?.get('defaults.aiProvider', 'yandex');
        const defaultYandexModel = window.appConfig?.get('defaults.yandex.model', 'gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest');
        const defaultYandexModels = window.appConfig?.get('defaults.yandex.models', [
            { value: 'gpt://b1gv03a122le5a934cqj/yandexgpt-lite/latest', label: 'YandexGPT Lite' },
            { value: 'gpt://b1gv03a122le5a934cqj/yandexgpt/latest', label: 'YandexGPT' }
        ]);
        const defaultYandexFolderId = window.appConfig?.get('defaults.yandex.folderId', 'b1gv03a122le5a934cqj');
        const defaultPerplexityModel = window.appConfig?.get('defaults.perplexity.model', 'sonar-pro');
        const defaultPerplexityModels = window.appConfig?.get('defaults.perplexity.models', [
            { value: 'sonar-pro', label: 'sonar-pro' },
            { value: 'sonar', label: 'sonar' },
            { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
            { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
        ]);
        return {
            provider: defaultProvider,
            yandexApiKey: '',
            yandexFolderId: defaultYandexFolderId,
            yandexModel: defaultYandexModel,
            perplexityApiKey: '',
            perplexityModel: defaultPerplexityModel,
            initialProvider: defaultProvider,
            initialYandexApiKey: '',
            initialYandexFolderId: defaultYandexFolderId,
            initialYandexModel: defaultYandexModel,
            initialPerplexityApiKey: '',
            initialPerplexityModel: defaultPerplexityModel,
            showYandexApiKey: false,
            showPerplexityApiKey: false,
            isSaved: false,
            yandexModels: defaultYandexModels,
            perplexityModels: defaultPerplexityModels
        };
    },

    computed: {
        hasChanges() {
            return this.provider !== this.initialProvider ||
                   this.yandexApiKey !== this.initialYandexApiKey ||
                   this.yandexFolderId !== this.initialYandexFolderId ||
                   this.yandexModel !== this.initialYandexModel ||
                   this.perplexityApiKey !== this.initialPerplexityApiKey ||
                   this.perplexityModel !== this.initialPerplexityModel;
        },
        isValid() {
            if (this.provider === 'yandex') {
                return this.yandexApiKey.trim().length > 0;
            } else if (this.provider === 'perplexity') {
                return this.perplexityApiKey.trim().length > 0;
            }
            return false;
        }
    },

    watch: {
        provider() {
            // Отложим обновление кнопки до следующего тика, чтобы кнопки успели зарегистрироваться
            this.$nextTick(() => {
                this.onFieldChange();
            });
        },
        yandexApiKey() {
            this.$nextTick(() => {
                this.onFieldChange();
            });
        },
        yandexModel() {
            this.$nextTick(() => {
                this.onFieldChange();
            });
        },
        yandexFolderId() {
            this.$nextTick(() => {
                this.onFieldChange();
            });
        },
        perplexityApiKey() {
            this.$nextTick(() => {
                this.onFieldChange();
            });
        },
        perplexityModel() {
            this.$nextTick(() => {
                this.onFieldChange();
            });
        }
    },

        async mounted() {
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
                        onClick: () => {
                            // Если уже сохранено - закрываем окно (кнопка "Сохранено, закрыть?")
                            if (this.isSaved) {
                                this.handleCancel();
                            } else {
                                this.saveSettings();
                            }
                        }
                    });
                }
            });
            // Загружаем настройки после регистрации кнопок
            await this.loadSettings();
            // Обновляем кнопку после загрузки настроек
            this.$nextTick(() => {
                this.updateSaveButton();
            });
        },

    methods: {
        /**
         * Обработчик изменения полей
         */
        onFieldChange() {
            if (this.isSaved) {
                this.isSaved = false;
                this.updateSaveButton();
            } else if (this.modalApi) {
                this.modalApi.updateButton('save', {
                    disabled: !this.hasChanges || !this.isValid
                });
            }
        },

        /**
         * Загрузка настроек из кэша
         */
        async loadSettings() {
            try {
                if (window.cacheManager) {
                    // Загружаем текущий провайдер
                    const savedProvider = await window.cacheManager.get('ai-provider');
                    if (savedProvider) {
                        this.provider = savedProvider;
                        this.initialProvider = savedProvider;
                    }

                    // Загружаем настройки Yandex
                    const savedYandexApiKey = await window.cacheManager.get('yandex-api-key');
                    if (savedYandexApiKey) {
                        this.yandexApiKey = savedYandexApiKey;
                        this.initialYandexApiKey = savedYandexApiKey;
                    }

                    const savedYandexModel = await window.cacheManager.get('yandex-model');
                    if (savedYandexModel) {
                        this.yandexModel = savedYandexModel;
                        this.initialYandexModel = savedYandexModel;
                    }

                    const savedYandexFolderId = await window.cacheManager.get('yandex-folder-id');
                    if (savedYandexFolderId) {
                        this.yandexFolderId = savedYandexFolderId;
                        this.initialYandexFolderId = savedYandexFolderId;
                    } else {
                        // Дефолтное значение из конфига, если не сохранено
                        const defaultFolderId = window.appConfig?.get('defaults.yandex.folderId', 'b1gv03a122le5a934cqj');
                        this.yandexFolderId = defaultFolderId;
                        this.initialYandexFolderId = defaultFolderId;
                    }

                    // Загружаем настройки Perplexity
                    const savedPerplexityApiKey = await window.cacheManager.get('perplexity-api-key');
                    if (savedPerplexityApiKey) {
                        this.perplexityApiKey = savedPerplexityApiKey;
                        this.initialPerplexityApiKey = savedPerplexityApiKey;
                    }

                    const savedPerplexityModel = await window.cacheManager.get('perplexity-model');
                    if (savedPerplexityModel) {
                        this.perplexityModel = savedPerplexityModel;
                        this.initialPerplexityModel = savedPerplexityModel;
                    }
                }
            } catch (error) {
                console.error('ai-api-settings: ошибка загрузки настроек:', error);
            }
        },

        /**
         * Сохранение настроек в кэш
         */
        async saveSettings() {
            try {
                if (!window.cacheManager) {
                    console.error('ai-api-settings: cacheManager не загружен');
                    return;
                }

                // Сохраняем текущий провайдер
                await window.cacheManager.set('ai-provider', this.provider);

                // Сохраняем настройки Yandex
                await window.cacheManager.set('yandex-api-key', this.yandexApiKey);
                await window.cacheManager.set('yandex-folder-id', this.yandexFolderId);
                await window.cacheManager.set('yandex-model', this.yandexModel);

                // Сохраняем настройки Perplexity
                await window.cacheManager.set('perplexity-api-key', this.perplexityApiKey);
                await window.cacheManager.set('perplexity-model', this.perplexityModel);

                // Обновляем менеджер провайдеров
                if (window.aiProviderManager) {
                    await window.aiProviderManager.setProvider(this.provider);
                }

                // Обновляем исходные значения
                this.initialProvider = this.provider;
                this.initialYandexApiKey = this.yandexApiKey;
                this.initialYandexFolderId = this.yandexFolderId;
                this.initialYandexModel = this.yandexModel;
                this.initialPerplexityApiKey = this.perplexityApiKey;
                this.initialPerplexityModel = this.perplexityModel;

                // Устанавливаем состояние "Сохранено"
                this.isSaved = true;
                this.updateSaveButton();

                console.log('ai-api-settings: настройки сохранены');
            } catch (error) {
                console.error('ai-api-settings: ошибка сохранения настроек:', error);
            }
        },

        /**
         * Обработка отмены
         */
        handleCancel() {
            if (this.isSaved) {
                // Если уже сохранено - закрываем модальное окно
                this.closeModal();
            } else {
                // Восстанавливаем исходные значения
                this.provider = this.initialProvider;
                this.yandexApiKey = this.initialYandexApiKey;
                this.yandexFolderId = this.initialYandexFolderId;
                this.yandexModel = this.initialYandexModel;
                this.perplexityApiKey = this.initialPerplexityApiKey;
                this.perplexityModel = this.initialPerplexityModel;
                this.updateSaveButton();
            }
        },

        /**
         * Закрытие модального окна с удалением фокуса
         */
        closeModal() {
            if (this.modalApi && this.modalApi.hide) {
                this.modalApi.hide();
            }
        },

        /**
         * Обновление состояния кнопки "Сохранить"
         */
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
                // Обычное состояние
                this.modalApi.updateButton('save', {
                    label: 'Сохранить',
                    variant: 'primary',
                    disabled: !this.hasChanges || !this.isValid
                });
            }
        },

        /**
         * Переключение видимости API ключа Yandex
         */
        toggleYandexApiKeyVisibility() {
            this.showYandexApiKey = !this.showYandexApiKey;
        },

        /**
         * Переключение видимости API ключа Perplexity
         */
        togglePerplexityApiKeyVisibility() {
            this.showPerplexityApiKey = !this.showPerplexityApiKey;
        }
    }
};

