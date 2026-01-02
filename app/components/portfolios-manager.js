/**
 * ================================================================================================
 * PORTFOLIOS MANAGER COMPONENT - Компонент управления портфелями
 * ================================================================================================
 *
 * ЦЕЛЬ: Vue-компонент для управления портфелями пользователя через Cloudflare API.
 *
 * ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
 * - Список портфелей пользователя (загрузка через portfolios-client)
 * - Создание/редактирование/удаление портфелей
 * - Модальное окно для создания/редактирования
 * - Проверка авторизации перед загрузкой данных
 *
 * API КОМПОНЕНТА:
 *
 * Props: нет
 *
 * Events:
 * - portfolio-created — эмитируется после создания портфеля
 * - portfolio-updated — эмитируется после обновления портфеля
 * - portfolio-deleted — эмитируется после удаления портфеля
 *
 * ССЫЛКИ:
 * - Шаблон: app/templates/portfolios-manager-template.js
 * - API клиент: core/api/cloudflare/portfolios-client.js
 * - Конфигурация модальных окон: core/config/modals-config.js
 */

window.portfoliosManager = {
    template: '#portfolios-manager-template',

    components: {
        'cmp-button': window.cmpButton,
        'cmp-modal': window.cmpModal,
        'cmp-modal-buttons': window.cmpModalButtons,
    },

    data() {
        return {
            portfolios: [],
            isLoading: false,
            error: null,
            successMessage: null,
            isEditing: false,
            editingPortfolioId: null,
            formData: {
                name: '',
                description: '',
                assets: [],
            },
        };
    },

    computed: {
        /**
         * Заголовок модального окна
         * @returns {string}
         */
        modalTitle() {
            if (window.modalsConfig) {
                const title = window.modalsConfig.getModalTitle('portfolioModal');
                if (title) return title;
            }
            return this.isEditing ? 'Редактировать портфель' : 'Создать портфель';
        },

        /**
         * Проверка валидности формы
         * @returns {boolean}
         */
        isFormValid() {
            return this.formData.name && this.formData.name.trim().length > 0;
        },
    },

    async mounted() {
        // Проверка авторизации перед загрузкой
        if (window.authClient) {
            const authenticated = await window.authClient.isAuthenticated();
            if (authenticated) {
                await this.loadPortfolios();
            }
        }
    },

    methods: {
        /**
         * Загрузка списка портфелей
         */
        async loadPortfolios() {
            try {
                if (!window.portfoliosClient) {
                    console.error('portfolios-manager: portfoliosClient не загружен');
                    return;
                }

                this.isLoading = true;
                this.error = null;

                const portfolios = await window.portfoliosClient.getPortfolios();
                this.portfolios = portfolios || [];
            } catch (error) {
                console.error('portfolios-manager.loadPortfolios error:', error);
                this.error = error.message || 'Ошибка при загрузке портфелей';
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Открытие модального окна для создания портфеля
         */
        openCreateModal() {
            this.isEditing = false;
            this.editingPortfolioId = null;
            this.formData = {
                name: '',
                description: '',
                assets: [],
            };
            this.error = null;
            this.successMessage = null;

            if (this.$refs.portfolioModal) {
                this.$refs.portfolioModal.show();
            }
        },

        /**
         * Открытие модального окна для редактирования портфеля
         * @param {Object} portfolio - Портфель для редактирования
         */
        openEditModal(portfolio) {
            this.isEditing = true;
            this.editingPortfolioId = portfolio.id;
            this.formData = {
                name: portfolio.name || '',
                description: portfolio.description || '',
                assets: portfolio.assets ? [...portfolio.assets] : [],
            };
            this.error = null;
            this.successMessage = null;

            if (this.$refs.portfolioModal) {
                this.$refs.portfolioModal.show();
            }
        },

        /**
         * Открытие портфеля (пока заглушка)
         * @param {string|number} portfolioId - ID портфеля
         */
        openPortfolio(portfolioId) {
            console.log('portfolios-manager.openPortfolio:', portfolioId);
            // TODO: Реализовать открытие портфеля (будет на Этапе 8)
        },

        /**
         * Подтверждение удаления портфеля
         * @param {Object} portfolio - Портфель для удаления
         */
        confirmDelete(portfolio) {
            if (confirm(`Вы уверены, что хотите удалить портфель "${portfolio.name}"?`)) {
                this.deletePortfolio(portfolio.id);
            }
        },

        /**
         * Удаление портфеля
         * @param {string|number} portfolioId - ID портфеля
         */
        async deletePortfolio(portfolioId) {
            try {
                if (!window.portfoliosClient) {
                    throw new Error('portfoliosClient не загружен');
                }

                this.isLoading = true;
                this.error = null;

                await window.portfoliosClient.deletePortfolio(portfolioId);
                this.successMessage = 'Портфель успешно удалён';
                this.$emit('portfolio-deleted', portfolioId);

                // Перезагружаем список портфелей
                await this.loadPortfolios();
            } catch (error) {
                console.error('portfolios-manager.deletePortfolio error:', error);
                this.error = error.message || 'Ошибка при удалении портфеля';
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Сохранение портфеля (создание или обновление)
         */
        async savePortfolio() {
            try {
                if (!window.portfoliosClient) {
                    throw new Error('portfoliosClient не загружен');
                }

                if (!this.isFormValid) {
                    this.error = 'Название портфеля обязательно';
                    return;
                }

                this.isLoading = true;
                this.error = null;

                const portfolioData = {
                    name: this.formData.name.trim(),
                    description: this.formData.description.trim() || null,
                    assets: this.formData.assets.filter(asset => asset.coinId && asset.weight !== undefined),
                };

                let savedPortfolio;
                if (this.isEditing) {
                    savedPortfolio = await window.portfoliosClient.updatePortfolio(
                        this.editingPortfolioId,
                        portfolioData
                    );
                    this.successMessage = 'Портфель успешно обновлён';
                    this.$emit('portfolio-updated', savedPortfolio);
                } else {
                    savedPortfolio = await window.portfoliosClient.createPortfolio(portfolioData);
                    this.successMessage = 'Портфель успешно создан';
                    this.$emit('portfolio-created', savedPortfolio);
                }

                // Закрываем модальное окно
                if (this.$refs.portfolioModal) {
                    this.$refs.portfolioModal.hide();
                }

                // Перезагружаем список портфелей
                await this.loadPortfolios();
            } catch (error) {
                console.error('portfolios-manager.savePortfolio error:', error);
                this.error = error.message || 'Ошибка при сохранении портфеля';
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Отмена редактирования
         */
        cancelEdit() {
            this.formData = {
                name: '',
                description: '',
                assets: [],
            };
            this.isEditing = false;
            this.editingPortfolioId = null;
            this.error = null;

            if (this.$refs.portfolioModal) {
                this.$refs.portfolioModal.hide();
            }
        },

        /**
         * Добавление актива в форму
         */
        addAsset() {
            this.formData.assets.push({
                coinId: '',
                weight: 0,
            });
        },

        /**
         * Удаление актива из формы
         * @param {number} index - Индекс актива
         */
        removeAsset(index) {
            this.formData.assets.splice(index, 1);
        },

        /**
         * Форматирование даты для отображения
         * @param {string} dateString - Дата в формате ISO
         * @returns {string}
         */
        formatDate(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            } catch (error) {
                return dateString;
            }
        },
    },
};
