/**
 * ================================================================================================
 * AUTH BUTTON COMPONENT - Компонент кнопки авторизации и профиля пользователя
 * ================================================================================================
 *
 * ЦЕЛЬ: Vue-компонент для отображения кнопки входа через Google или профиля пользователя.
 *
 * ОСОБЕННОСТИ РЕАЛИЗАЦИИ:
 * - Условное отображение: кнопка входа или dropdown с профилем
 * - Реактивное обновление при изменении состояния авторизации
 * - Обработка callback от Google OAuth при загрузке страницы
 * - Использование auth-client для проверки состояния авторизации
 *
 * API КОМПОНЕНТА:
 *
 * Props: нет
 *
 * Events:
 * - login-success — эмитируется после успешного входа
 * - logout-success — эмитируется после успешного выхода
 *
 * ССЫЛКИ:
 * - Шаблон: app/templates/auth-button-template.js
 * - OAuth клиент: core/api/cloudflare/auth-client.js
 */

window.authButton = {
    template: '#auth-button-template',

    components: {
        'cmp-button': window.cmpButton,
        'cmp-dropdown': window.cmpDropdown,
        'dropdown-menu-item': window.cmpDropdownMenuItem,
    },

    data() {
        return {
            isAuthenticated: false,
            isLoading: false,
            user: null,
        };
    },

    computed: {
        /**
         * Отображаемое имя пользователя
         * @returns {string}
         */
        userDisplayName() {
            if (!this.user) return 'Пользователь';
            return this.user.name || this.user.email || 'Пользователь';
        },
    },

    async mounted() {
        // Проверка состояния авторизации при монтировании
        await this.checkAuthStatus();

        // Обработка callback от Google OAuth (если есть code в URL)
        await this.handleAuthCallback();

        // Обработка postMessage от popup окна OAuth callback
        window.addEventListener('message', this.handleOAuthMessage);
    },

    beforeUnmount() {
        // Удаляем обработчик postMessage при размонтировании компонента
        window.removeEventListener('message', this.handleOAuthMessage);
    },

    methods: {
        /**
         * Проверка состояния авторизации
         */
        async checkAuthStatus() {
            try {
                if (!window.authClient) {
                    console.warn('auth-button: authClient не загружен');
                    return;
                }

                const authenticated = await window.authClient.isAuthenticated();

                if (authenticated) {
                    // Получаем данные пользователя
                    const user = await window.authClient.getCurrentUser();
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:79',message:'Проверка user после getCurrentUser',data:{authenticated:authenticated,userIsNull:user===null,hasEmail:user&&user.email?true:false},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'bug1-fix'})}).catch(()=>{});
                    // #endregion
                    // Устанавливаем isAuthenticated только если user получен успешно
                    // Это предотвращает рендеринг с null user
                    this.isAuthenticated = user !== null;
                    this.user = user;
                } else {
                    this.isAuthenticated = false;
                    this.user = null;
                }
            } catch (error) {
                console.error('auth-button.checkAuthStatus error:', error);
                this.isAuthenticated = false;
                this.user = null;
            }
        },

        /**
         * Обработка callback от Google OAuth
         */
        async handleAuthCallback() {
            try {
                if (!window.authClient) {
                    return;
                }

                // Проверяем наличие code в URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');

                if (code && state) {
                    // Обрабатываем callback
                    this.isLoading = true;
                    const tokenData = await window.authClient.handleAuthCallback();

                    if (tokenData) {
                        // Обновляем состояние
                        await this.checkAuthStatus();
                        this.$emit('login-success', tokenData);
                    }
                }
            } catch (error) {
                console.error('auth-button.handleAuthCallback error:', error);
                if (window.errorHandler) {
                    window.errorHandler.handleError(error, {
                        context: 'auth-button.handleAuthCallback',
                        userMessage: 'Ошибка при обработке авторизации'
                    });
                }
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Обработка postMessage от popup окна OAuth callback
         */
        async handleOAuthMessage(event) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:150',message:'postMessage received',data:{hasData:!!event.data,messageType:event.data?.type,hasSuccess:event.data?.success,origin:event.origin},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
            // #endregion

            // Проверяем, что сообщение от нашего Worker callback
            // Принимаем сообщения с любым origin, так как при file:// точный origin неизвестен
            if (event.data && event.data.type === 'oauth-callback' && event.data.success) {
                try {
                    const tokenData = event.data.token;
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:158',message:'OAuth callback message processing',data:{hasToken:!!tokenData,hasAccessToken:!!tokenData?.access_token},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                    // #endregion

                    if (tokenData && tokenData.access_token) {
                        // Сохраняем токен через auth-client
                        if (window.authClient && window.authClient.saveToken) {
                            // #region agent log
                            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:166',message:'Before saveToken',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                            // #endregion
                            await window.authClient.saveToken(tokenData);
                            // #region agent log
                            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:170',message:'After saveToken',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                            // #endregion
                        }

                        // Обновляем состояние авторизации
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:175',message:'Before checkAuthStatus',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                        // #endregion
                        await this.checkAuthStatus();
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:178',message:'After checkAuthStatus',data:{isAuthenticated:this.isAuthenticated,hasUser:!!this.user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                        // #endregion

                        // Эмитируем событие успешного входа
                        this.$emit('login-success', tokenData);
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:182',message:'Login success event emitted',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                        // #endregion
                    }
                } catch (error) {
                    console.error('auth-button.handleOAuthMessage error:', error);
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-button.js:186',message:'postMessage error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'postMessage'})}).catch(()=>{});
                    // #endregion
                    if (window.errorHandler) {
                        window.errorHandler.handleError(error, {
                            context: 'auth-button.handleOAuthMessage',
                            userMessage: 'Ошибка при обработке авторизации'
                        });
                    }
                }
            }
        },

        /**
         * Обработка клика на кнопку входа
         */
        async handleLogin() {
            try {
                if (!window.authClient) {
                    console.error('auth-button: authClient не загружен');
                    return;
                }

                this.isLoading = true;
                window.authClient.initiateGoogleAuth();
            } catch (error) {
                console.error('auth-button.handleLogin error:', error);
                this.isLoading = false;
                if (window.errorHandler) {
                    window.errorHandler.handleError(error, {
                        context: 'auth-button.handleLogin',
                        userMessage: 'Ошибка при инициации авторизации'
                    });
                }
            }
        },

        /**
         * Обработка выхода
         */
        async handleLogout() {
            try {
                if (!window.authClient) {
                    console.error('auth-button: authClient не загружен');
                    return;
                }

                this.isLoading = true;
                await window.authClient.logout();
                this.isAuthenticated = false;
                this.user = null;
                this.$emit('logout-success');
            } catch (error) {
                console.error('auth-button.handleLogout error:', error);
                // Даже при ошибке обновляем состояние
                this.isAuthenticated = false;
                this.user = null;
                this.$emit('logout-success');
            } finally {
                this.isLoading = false;
            }
        },
    },
};
