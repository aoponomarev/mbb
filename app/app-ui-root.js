/**
 * Корневой компонент приложения
 *
 * ЦЕЛЬ: Инициализация Vue приложения и настройка корневого компонента
 *
 * ПРОБЛЕМА: Логика инициализации Vue раздувала index.html
 *
 * РЕШЕНИЕ: Вынос всей логики инициализации в отдельный модуль
 * - Компоненты загружаются через модульную систему (core/module-loader.js)
 * - Инициализация Vue приложения после загрузки всех модулей
 * - Настройка корневого компонента с данными и методами
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Модульная система загружает все компоненты в правильном порядке
 * - После загрузки всех модулей создаётся Vue app через createApp()
 * - Компоненты регистрируются в app через components
 * - App монтируется на #app элемент
 *
 * ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ:
 * - Установка темы на body (data-bs-theme)
 * - Установка CSS-класса версии на body (app-version-{hash})
 * - Очистка кэша старых версий (clearOldVersions)
 * - Инициализация автоматической маркировки элементов (autoMarkup)
 *
 * ПРЕИМУЩЕСТВА:
 * - index.html остаётся компактным
 * - Логика инициализации изолирована
 * - Легко добавлять новые компоненты
 * - Централизованное управление данными приложения
 * - Автоматическое разрешение зависимостей через модульную систему
 *
 * ССЫЛКА: Модульная система описана в core/module-loader.js и core/modules-config.js
 */

(function() {
    'use strict';

    /**
     * Инициализирует Vue приложение
     * Вызывается после загрузки всех модулей через модульную систему
     */
    function initVueApp() {
        // Проверяем наличие Vue и компонентов
        if (typeof Vue === 'undefined') {
            console.error('app-ui-root: Vue.js не загружен');
            return;
        }

        // Базовые компоненты (всегда должны быть загружены)
        if (!window.cmpDropdownMenuItem || !window.cmpButton || !window.cmpDropdown || !window.cmpCombobox || !window.cmpButtonGroup || !window.appHeader || !window.appFooter || !window.cmpModal || !window.cmpModalButtons || !window.cmpTimezoneSelector || !window.modalExampleBody || !window.aiApiSettings || !window.timezoneModalBody) {
            console.error('app-ui-root: не все базовые компоненты загружены');
            return;
        }

        // Проверка feature flags для условной загрузки компонентов
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:56',message:'Проверка feature flags в app-ui-root',data:{hasAppConfig:!!window.appConfig,hasAuthButton:!!window.authButton,hasPortfoliosManager:!!window.portfoliosManager},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const authEnabled = window.appConfig && window.appConfig.isFeatureEnabled('auth');
        const portfoliosEnabled = window.appConfig && window.appConfig.isFeatureEnabled('portfolios') && window.appConfig.isFeatureEnabled('cloudSync');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:59',message:'Результаты проверки feature flags',data:{authEnabled:authEnabled,portfoliosEnabled:portfoliosEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (authEnabled && !window.authButton) {
            console.warn('app-ui-root: auth-button не загружен, хотя feature flag auth включен');
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:62',message:'auth-button отсутствует',data:{authEnabled:authEnabled,hasAuthButton:!!window.authButton},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
        }

        if (portfoliosEnabled && !window.portfoliosManager) {
            console.warn('app-ui-root: portfolios-manager не загружен, хотя feature flags portfolios и cloudSync включены');
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:67',message:'portfolios-manager отсутствует',data:{portfoliosEnabled:portfoliosEnabled,hasPortfoliosManager:!!window.portfoliosManager},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
        }

        const { createApp } = Vue;

        createApp({
            components: {
                'dropdown-menu-item': window.cmpDropdownMenuItem,
                'cmp-button': window.cmpButton,
                'cmp-dropdown': window.cmpDropdown,
                'cmp-combobox': window.cmpCombobox,
                'cmp-button-group': window.cmpButtonGroup,
                'cmp-modal': window.cmpModal,
                'cmp-modal-buttons': window.cmpModalButtons,
                'cmp-timezone-selector': window.cmpTimezoneSelector,
                'timezone-modal-body': window.timezoneModalBody,
                'modal-example-body': window.modalExampleBody,
                'ai-api-settings': window.aiApiSettings,
                // Условная регистрация компонентов авторизации и портфелей
                ...(window.authButton ? { 'auth-button': window.authButton } : {}),
                ...(window.portfolioModalBody ? { 'portfolio-modal-body': window.portfolioModalBody } : {}),
                ...(window.portfoliosManager ? { 'portfolios-manager': window.portfoliosManager } : {}),
                'app-header': window.appHeader,
                'app-footer': window.appFooter
            },
            data() {
                // Проверка feature flags
                const authEnabled = window.appConfig && window.appConfig.isFeatureEnabled('auth');
                const portfoliosEnabled = window.appConfig && window.appConfig.isFeatureEnabled('portfolios') && window.appConfig.isFeatureEnabled('cloudSync');

                // Синхронная инициализация темы (читаем напрямую из localStorage для избежания мерцания)
                let initialTheme = 'light';
                try {
                    const savedTheme = localStorage.getItem('theme');
                    if (savedTheme === 'dark' || savedTheme === 'light') {
                        initialTheme = savedTheme;
                    }
                } catch (e) {
                    // Игнорируем ошибки
                }

                // Применяем тему сразу при инициализации
                if (initialTheme === 'dark') {
                    document.body.setAttribute('data-bs-theme', 'dark');
                } else {
                    document.body.removeAttribute('data-bs-theme');
                }

                // Синхронная инициализация языка перевода (читаем напрямую из localStorage)
                // ВАЖНО: используем тот же источник, что и в mounted(), чтобы избежать рассинхронизации
                let initialLanguage = 'ru';
                try {
                    // Пробуем сначала cacheManager (если доступен синхронно), потом localStorage
                    if (window.cacheManager && typeof window.cacheManager.get === 'function') {
                        // cacheManager асинхронный, поэтому для синхронной инициализации используем localStorage
                        const savedLanguage = localStorage.getItem('translation-language');
                        if (savedLanguage && typeof savedLanguage === 'string') {
                            initialLanguage = savedLanguage;
                        }
                    } else {
                        const savedLanguage = localStorage.getItem('translation-language');
                        if (savedLanguage && typeof savedLanguage === 'string') {
                            initialLanguage = savedLanguage;
                        }
                    }
                } catch (e) {
                    // Игнорируем ошибки
                }

                return {
                    // Feature flags для условного отображения компонентов
                    isAuthEnabled: authEnabled,
                    isPortfoliosEnabled: portfoliosEnabled,
                    // Конфигурация модальных окон (для доступа в шаблоне)
                    modalsConfig: window.modalsConfig || null,
                    // Конфигурация tooltips (для доступа в шаблоне)
                    tooltipsConfig: window.tooltipsConfig || null,
                    // Текущая тема приложения
                    currentTheme: initialTheme,
                    // Текущий язык перевода (для отображения в тестовом примере)
                    currentTranslationLanguage: initialLanguage,
                    // Реактивные tooltips (обновляются при смене языка)
                    tooltips: {
                        'button.save.icon': '',
                        'button.save.text': '',
                        'button.delete.icon': '',
                        'button.delete.text': '',
                        'button.load.icon': '',
                        'button.load.text': '',
                        'button.notifications.icon': '',
                        'button.notifications.text': '',
                        'button.notifications.suffix.badge': '',
                        'button.export.icon': '',
                        'button.export.text': '',
                        'button.export.suffix.icon': '',
                        'button.help.icon': '',
                        'button.help.text': '',
                        'button.help.suffix.info': ''
                    },
                    // Данные для dropdown
                    dropdownItems: [
                        { id: 1, name: 'Элемент 1', description: 'Описание элемента 1', icon: 'fas fa-home', labelShort: 'Эл. 1' },
                        { id: 2, name: 'Элемент 2', description: 'Описание элемента 2', icon: 'fas fa-user', labelShort: 'Эл. 2' },
                        { id: 3, name: 'Элемент 3', description: 'Описание элемента 3', icon: 'fas fa-cog', labelShort: 'Эл. 3' },
                        { id: 4, name: 'Элемент 4', description: 'Описание элемента 4', icon: 'fas fa-file', labelShort: 'Эл. 4' },
                        { id: 5, name: 'Элемент 5', description: 'Описание элемента 5', icon: 'fas fa-folder', labelShort: 'Эл. 5' }
                    ],
                    // Данные для режима select (отдельные переменные для каждого dropdown)
                    selectedDropdownItem1: null, // Только иконка
                    selectedDropdownItem2: null, // Иконка + полный текст
                    selectedDropdownItem3: null, // Иконка + укороченный текст
                    selectedDropdownItem4: null, // Только полный текст
                    selectedDropdownItem5: null, // Только value
                    selectedDropdownItem6: null, // Все вместе
                    longList: Array.from({ length: 50 }, (_, i) => ({
                        id: i + 1,
                        name: `Элемент ${i + 1}`,
                        description: `Описание элемента ${i + 1}`
                    })),
                    isMenuExpanded: false,
                    // Данные для combobox
                    comboboxValue1: '',
                    comboboxValue2: '',
                    comboboxValue3: '',
                    comboboxValue4: '',
                    comboboxValue5: '',
                    comboboxValue6: '',
                    comboboxValue7: '',
                    comboboxItems: [
                        { id: 1, label: 'Москва', value: 'moscow' },
                        { id: 2, label: 'Санкт-Петербург', value: 'spb' },
                        { id: 3, label: 'Новосибирск', value: 'novosibirsk' },
                        { id: 4, label: 'Екатеринбург', value: 'ekaterinburg' },
                        { id: 5, label: 'Казань', value: 'kazan' },
                        { id: 6, label: 'Нижний Новгород', value: 'nn' },
                        { id: 7, label: 'Челябинск', value: 'chelyabinsk' },
                        { id: 8, label: 'Самара', value: 'samara' }
                    ],
                    comboboxLongList: Array.from({ length: 100 }, (_, i) => ({
                        id: i + 1,
                        label: `Город ${i + 1}`,
                        value: `city-${i + 1}`
                    })),
                    // Таймзона
                    selectedTimezone: 'Europe/Moscow',
                    initialTimezone: 'Europe/Moscow', // Исходное значение таймзоны при открытии модального окна
                    selectedTranslationLanguage: 'ru',
                    initialTranslationLanguage: 'ru', // Исходное значение языка перевода при открытии модального окна
                    // Тестирование Yandex API
                    yandexTestQuery: '',
                    yandexTestInputQuery: '',
                    yandexTestResponse: '',
                    yandexTestLoading: false,
                    yandexTestError: '', // Используем пустую строку вместо null для лучшей реактивности Vue
                    // Тестирование Google-Cloudflare интеграции
                    testStep1Result: null,
                    testStep2Result: null,
                    testStep3Result: null,
                    testStep4Result: null,
                    testStep5Result: null,
                    testStep6Result: null
                };
            },
            watch: {
                // Реактивное обновление tooltips при изменении языка
                currentTranslationLanguage: {
                    async handler(newLanguage, oldLanguage) {
                        if (newLanguage && newLanguage !== oldLanguage) {
                            // Обновляем tooltips для нового языка
                            if (window.tooltipsConfig && typeof window.tooltipsConfig.init === 'function') {
                                try {
                                    await window.tooltipsConfig.init(newLanguage);
                                    // Обновляем реактивные tooltips после инициализации
                                    this.updateTooltips();
                                } catch (error) {
                                    console.error('app-ui-root: ошибка обновления tooltips при смене языка (watch):', error);
                                }
                            }
                        }
                    },
                    immediate: false
                },
                // #region agent log
                yandexTestError: {
                    handler(newVal, oldVal) {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:watch-yandexTestError',message:'yandexTestError changed',data:{newVal,oldVal,typeNew:typeof newVal,typeOld:typeof oldVal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                        // #endregion
                    },
                    immediate: false // Убираем immediate, чтобы избежать мелькания при инициализации
                },
                // #endregion
                // Watcher для отслеживания успешной авторизации через изменение testStep4Result
                'testStep4Result.isAuthenticated': {
                    handler(newVal, oldVal) {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:watch-isAuthenticated',message:'isAuthenticated changed',data:{newVal,oldVal,hasUserData:!!this.testStep4Result?.userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'login-success'})}).catch(()=>{});
                        // #endregion

                        // Если пользователь успешно авторизован, но testStep5Result еще не обновлен через handleAuthLogin
                        if (newVal === true && oldVal === false && this.testStep4Result && this.testStep4Result.userData) {
                            // Обновляем testStep5Result для отображения успешной авторизации
                            if (!this.testStep5Result || !this.testStep5Result.success) {
                                const userEmail = this.testStep4Result.userData.email || 'неизвестен';
                                const userName = this.testStep4Result.userData.name || userEmail;
                                this.testStep5Result = {
                                    success: true,
                                    message: `✓ Авторизация успешна! Пользователь ${userName} (${userEmail}) авторизован.`
                                };
                                // #region agent log
                                fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:watch-isAuthenticated',message:'testStep5Result updated via watcher',data:{userEmail,userName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'login-success'})}).catch(()=>{});
                                // #endregion
                            }
                        }
                    },
                    immediate: false
                }
            },
            methods: {
                /**
                 * Обновить реактивные tooltips из tooltipsConfig
                 * Вызывается при инициализации и смене языка
                 */
                updateTooltips() {
                    if (!window.tooltipsConfig || typeof window.tooltipsConfig.getTooltip !== 'function') {
                        return;
                    }

                    // Синхронизируем currentTranslationLanguage с currentLanguage из tooltipsConfig
                    if (typeof window.tooltipsConfig.getCurrentLanguage === 'function') {
                        const tooltipsLanguage = window.tooltipsConfig.getCurrentLanguage();
                        if (tooltipsLanguage && tooltipsLanguage !== this.currentTranslationLanguage) {
                            this.currentTranslationLanguage = tooltipsLanguage;
                        }
                    }

                    // Обновляем все tooltips из конфига
                    const keys = Object.keys(this.tooltips);
                    keys.forEach(key => {
                        const value = window.tooltipsConfig.getTooltip(key);
                        this.tooltips[key] = value || '';
                    });
                },
                async toggleTheme() {
                    // Переключаем тему
                    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';

                    // Сохраняем через cacheManager (асинхронно)
                    if (window.cacheManager) {
                        await window.cacheManager.set('theme', this.currentTheme);
                    } else {
                        // Fallback на прямое localStorage, если cacheManager ещё не загружен
                        localStorage.setItem('theme', this.currentTheme);
                    }

                    // Применяем тему к body через data-bs-theme (Bootstrap 5)
                    if (this.currentTheme === 'dark') {
                        document.body.setAttribute('data-bs-theme', 'dark');
                    } else {
                        document.body.removeAttribute('data-bs-theme');
                    }
                },
                handleClick(event) {
                },
                /**
                 * Обработка успешного входа через Google OAuth
                 * @param {Object} tokenData - Данные токена и пользователя
                 */
                handleAuthLogin(tokenData) {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:handleAuthLogin',message:'Login success event received',data:{hasTokenData:!!tokenData,hasAccessToken:!!tokenData?.access_token},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'login-success'})}).catch(()=>{});
                    // #endregion
                    console.log('app-ui-root: пользователь успешно авторизован', tokenData);

                    // Обновляем testStep5Result для отображения успешной авторизации на тестовой карточке
                    if (tokenData && tokenData.access_token) {
                        const userEmail = tokenData.user?.email || 'неизвестен';
                        const userName = tokenData.user?.name || userEmail;
                        this.testStep5Result = {
                            success: true,
                            message: `✓ Авторизация успешна! Пользователь ${userName} (${userEmail}) авторизован. Токен сохранен.`
                        };
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:handleAuthLogin',message:'testStep5Result updated',data:{userEmail,userName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'login-success'})}).catch(()=>{});
                        // #endregion

                        // Автоматически обновляем testStep4Result, чтобы отобразить информацию о пользователе
                        this.$nextTick(async () => {
                            await this.testStep4_CheckAuthStatus();
                        });
                    }

                    // Можно добавить дополнительную логику при входе
                    // Например, загрузку портфелей пользователя
                },
                /**
                 * Обработка выхода из системы
                 */
                handleAuthLogout() {
                    console.log('app-ui-root: пользователь вышел из системы');
                    // Можно добавить дополнительную логику при выходе
                    // Например, очистку данных пользователя
                },
                handleSuffixClick(event, item) {
                },
                handleInfoClick(event) {
                    alert('Открыть справку');
                },
                toggleMenu() {
                    this.isMenuExpanded = !this.isMenuExpanded;
                },
                handleSelect(item) {
                    alert(`Выбран: ${item.name}`);
                },
                handleComboboxSelect(event) {
                },
                handleComboboxInput(value) {
                },
                /**
                 * Тестирование Yandex API: отправка запроса (из поля ввода или случайный)
                 */
                async testYandexAPI(useRandom = false) {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:280',message:'testYandexAPI called',data:{useRandom,hasAiProviderManager:!!window.aiProviderManager,currentError:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion

                    if (!window.aiProviderManager) {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:282',message:'Setting error: AI Provider Manager not loaded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                        this.yandexTestError = 'AI Provider Manager не загружен';
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:285',message:'Error set',data:{error:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                        return;
                    }

                    let query = '';

                    if (useRandom || !this.yandexTestInputQuery.trim()) {
                        // Список случайных запросов для тестирования
                        const randomQueries = [
                            'Что такое искусственный интеллект?',
                            'Расскажи про криптовалюты',
                            'Какая погода сегодня?',
                            'Что такое блокчейн?',
                            'Объясни квантовую физику простыми словами',
                            'Какие преимущества у Vue.js?',
                            'Что такое машинное обучение?',
                            'Расскажи про историю программирования',
                            'Какие есть типы данных в JavaScript?',
                            'Что такое REST API?'
                        ];
                        query = randomQueries[Math.floor(Math.random() * randomQueries.length)];
                    } else {
                        query = this.yandexTestInputQuery.trim();
                    }

                    this.yandexTestQuery = query;
                    this.yandexTestResponse = '';
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:309',message:'Clearing error before request',data:{errorBefore:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    this.yandexTestError = ''; // Используем пустую строку вместо null
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:311',message:'Error cleared',data:{errorAfter:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    this.yandexTestLoading = true;

                    try {
                        const providerName = await window.aiProviderManager.getCurrentProviderName();
                        const apiKey = await window.aiProviderManager.getApiKey(providerName);

                        if (!apiKey) {
                            throw new Error(`API ключ для ${providerName} не настроен. Откройте настройки "AI API" для настройки.`);
                        }

                        const model = await window.aiProviderManager.getModel(providerName);

                        // Отправляем запрос через aiProviderManager
                        const response = await window.aiProviderManager.sendRequest(
                            [{ role: 'user', content: query }]
                        );

                        this.yandexTestResponse = response;
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:327',message:'Request successful',data:{hasResponse:!!response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                        // #endregion
                    } catch (error) {
                        console.error('testYandexAPI: ошибка запроса:', error);
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:347',message:'Setting error from catch',data:{errorMessage:error.message,errorType:error.constructor.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        const errorMessage = error.message || 'Неизвестная ошибка';
                        // Используем Vue.nextTick для гарантии обновления DOM
                        this.$nextTick(() => {
                            this.yandexTestError = errorMessage;
                            // #region agent log
                            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:352',message:'Error set in catch after nextTick',data:{error:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                            // #endregion
                        });
                        this.yandexTestResponse = '';
                    } finally {
                        this.yandexTestLoading = false;
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:359',message:'Finally block',data:{loading:this.yandexTestLoading,error:this.yandexTestError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                        // #endregion
                    }
                },
                customFilterFunction(items, query) {
                    // Кастомная фильтрация: ищем по label и value
                    const lowerQuery = query.toLowerCase();
                    return items.filter(item => {
                        const label = (item.label || '').toLowerCase();
                        const value = (item.value || '').toLowerCase();
                        return label.includes(lowerQuery) || value.includes(lowerQuery);
                    });
                },
                handleButtonGroupClick(event, data) {
                    console.log('Button click:', data);
                    // Здесь можно добавить логику обработки клика по кнопке в группе
                },
                openExampleModalNew() {
                    if (this.$refs.exampleModalNew) {
                        this.$refs.exampleModalNew.show();
                    }
                },
                async openTimezoneModal() {
                    // Загружаем текущую таймзону и язык перевода из кэша
                    try {
                        if (window.cacheManager) {
                            const savedTimezone = await window.cacheManager.get('timezone');
                            if (savedTimezone && typeof savedTimezone === 'string') {
                                this.selectedTimezone = savedTimezone;
                                this.initialTimezone = savedTimezone;
                            } else {
                                this.initialTimezone = this.selectedTimezone;
                            }

                            const savedLanguage = await window.cacheManager.get('translation-language');
                            if (savedLanguage && typeof savedLanguage === 'string') {
                                this.selectedTranslationLanguage = savedLanguage;
                                this.initialTranslationLanguage = savedLanguage;
                                this.currentTranslationLanguage = savedLanguage;
                            } else {
                                this.initialTranslationLanguage = this.selectedTranslationLanguage;
                                this.currentTranslationLanguage = this.selectedTranslationLanguage;
                            }
                        } else {
                            const savedTimezone = localStorage.getItem('timezone');
                            if (savedTimezone) {
                                this.selectedTimezone = savedTimezone;
                                this.initialTimezone = savedTimezone;
                            } else {
                                this.initialTimezone = this.selectedTimezone;
                            }

                            const savedLanguage = localStorage.getItem('translation-language');
                            if (savedLanguage) {
                                this.selectedTranslationLanguage = savedLanguage;
                                this.initialTranslationLanguage = savedLanguage;
                                this.currentTranslationLanguage = savedLanguage;
                            } else {
                                this.initialTranslationLanguage = this.selectedTranslationLanguage;
                                this.currentTranslationLanguage = this.selectedTranslationLanguage;
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load timezone/language:', error);
                        this.initialTimezone = this.selectedTimezone;
                        this.initialTranslationLanguage = this.selectedTranslationLanguage;
                    }

                    if (this.$refs.timezoneModal) {
                        this.$refs.timezoneModal.show();
                    }
                },
                cancelTimezone() {
                    // Если таймзона или язык изменены - восстанавливаем исходные значения
                    if (this.selectedTimezone !== this.initialTimezone ||
                        this.selectedTranslationLanguage !== this.initialTranslationLanguage) {
                        this.selectedTimezone = this.initialTimezone;
                        this.selectedTranslationLanguage = this.initialTranslationLanguage;
                    } else {
                        // Если ничего не изменено - закрываем модальное окно
                        if (this.$refs.timezoneModal) {
                            this.$refs.timezoneModal.hide();
                        }
                    }
                },
                async saveTimezone(timezone, translationLanguage) {
                    try {
                        const timezoneToSave = timezone || this.selectedTimezone;
                        const languageToSave = translationLanguage || this.selectedTranslationLanguage;

                        if (window.cacheManager) {
                            await window.cacheManager.set('timezone', timezoneToSave);
                            await window.cacheManager.set('translation-language', languageToSave);
                        } else {
                            localStorage.setItem('timezone', timezoneToSave);
                            localStorage.setItem('translation-language', languageToSave);
                        }

                        // Обновляем исходные значения
                        this.selectedTimezone = timezoneToSave;
                        this.initialTimezone = timezoneToSave;
                        this.selectedTranslationLanguage = languageToSave;
                        this.initialTranslationLanguage = languageToSave;
                        this.currentTranslationLanguage = languageToSave;

                        // Обновляем таймзону в футере
                        if (this.$refs.appFooter) {
                            await this.$refs.appFooter.saveTimezone(timezoneToSave);
                            // Обновляем язык перевода в футере
                            if (this.$refs.appFooter.updateTranslationLanguage) {
                                this.$refs.appFooter.updateTranslationLanguage(languageToSave);
                            }
                        }

                        // Обновляем tooltips для нового языка
                        if (window.tooltipsConfig && typeof window.tooltipsConfig.init === 'function') {
                            try {
                                await window.tooltipsConfig.init(languageToSave);
                                // Обновляем реактивные tooltips после инициализации
                                this.updateTooltips();
                            } catch (error) {
                                console.error('app-ui-root: ошибка обновления tooltips при смене языка:', error);
                            }
                        }

                        // Модальное окно закрывается через крестик или клик вне модального окна
                        // Кнопка "Сохранить" не должна закрывать модальное окно
                    } catch (error) {
                        console.error('Failed to save timezone/language:', error);
                    }
                },
                openAiApiModal() {
                    if (this.$refs.aiApiModal) {
                        this.$refs.aiApiModal.show();
                    }
                },
                /**
                 * Обработка создания портфеля
                 * @param {Object} portfolio - Созданный портфель
                 */
                handlePortfolioCreated(portfolio) {
                    console.log('app-ui-root: портфель создан', portfolio);
                    // Можно добавить дополнительную логику при создании портфеля
                },
                /**
                 * Обработка обновления портфеля
                 * @param {Object} portfolio - Обновлённый портфель
                 */
                handlePortfolioUpdated(portfolio) {
                    console.log('app-ui-root: портфель обновлён', portfolio);
                    // Можно добавить дополнительную логику при обновлении портфеля
                },
                /**
                 * Обработка удаления портфеля
                 * @param {string|number} portfolioId - ID удалённого портфеля
                 */
                handlePortfolioDeleted(portfolioId) {
                    console.log('app-ui-root: портфель удалён', portfolioId);
                    // Можно добавить дополнительную логику при удалении портфеля
                },

                /**
                 * Шаг 1: Проверка загрузки модулей
                 */
                testStep1_CheckModules() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep1',message:'Проверка загрузки модулей',data:{hasAuthClient:!!window.authClient,hasPortfoliosClient:!!window.portfoliosClient,hasAuthButton:!!window.authButton,hasPortfoliosManager:!!window.portfoliosManager},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step1'})}).catch(()=>{});
                    // #endregion
                    const checks = [];
                    if (window.authClient) checks.push('✓ auth-client загружен');
                    else checks.push('✗ auth-client НЕ загружен');
                    if (window.portfoliosClient) checks.push('✓ portfolios-client загружен');
                    else checks.push('✗ portfolios-client НЕ загружен');
                    if (window.authButton) checks.push('✓ auth-button загружен');
                    else checks.push('✗ auth-button НЕ загружен');
                    if (window.portfoliosManager) checks.push('✓ portfolios-manager загружен');
                    else checks.push('✗ portfolios-manager НЕ загружен');

                    const allLoaded = window.authClient && window.portfoliosClient && window.authButton && window.portfoliosManager;
                    this.testStep1Result = {
                        success: allLoaded,
                        message: checks.join(' | ')
                    };
                },

                /**
                 * Шаг 2: Проверка feature flags
                 */
                testStep2_CheckFeatureFlags() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep2',message:'Проверка feature flags',data:{hasAppConfig:!!window.appConfig,authEnabled:window.appConfig?window.appConfig.isFeatureEnabled('auth'):false,cloudSyncEnabled:window.appConfig?window.appConfig.isFeatureEnabled('cloudSync'):false,portfoliosEnabled:window.appConfig?window.appConfig.isFeatureEnabled('portfolios'):false},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step2'})}).catch(()=>{});
                    // #endregion
                    if (!window.appConfig) {
                        this.testStep2Result = {
                            success: false,
                            message: '✗ appConfig не загружен'
                        };
                        return;
                    }
                    const authEnabled = window.appConfig.isFeatureEnabled('auth');
                    const cloudSyncEnabled = window.appConfig.isFeatureEnabled('cloudSync');
                    const portfoliosEnabled = window.appConfig.isFeatureEnabled('portfolios');

                    const checks = [];
                    checks.push(authEnabled ? '✓ auth: включен' : '✗ auth: выключен');
                    checks.push(cloudSyncEnabled ? '✓ cloudSync: включен' : '✗ cloudSync: выключен');
                    checks.push(portfoliosEnabled ? '✓ portfolios: включен' : '✗ portfolios: выключен');

                    const allEnabled = authEnabled && cloudSyncEnabled && portfoliosEnabled;
                    this.testStep2Result = {
                        success: allEnabled,
                        message: checks.join(' | ')
                    };
                },

                /**
                 * Шаг 3: Проверка компонента auth-button
                 */
                testStep3_CheckAuthButton() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep3',message:'Проверка auth-button',data:{hasAuthButton:!!window.authButton,hasAuthClient:!!window.authClient},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step3'})}).catch(()=>{});
                    // #endregion
                    if (!window.authButton) {
                        this.testStep3Result = {
                            success: false,
                            hasAuthButton: false,
                            message: '✗ auth-button не загружен. Проверьте консоль на наличие ошибок загрузки модулей.'
                        };
                        return;
                    }
                    if (!window.authClient) {
                        this.testStep3Result = {
                            success: false,
                            hasAuthButton: true,
                            message: '⚠ auth-button загружен, но auth-client отсутствует'
                        };
                        return;
                    }
                    this.testStep3Result = {
                        success: true,
                        hasAuthButton: true,
                        message: '✓ auth-button загружен и доступен. Компонент должен отображаться в header справа.'
                    };
                },

                /**
                 * Шаг 4: Проверка состояния авторизации
                 */
                async testStep4_CheckAuthStatus() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep4',message:'Начало проверки авторизации',data:{hasAuthClient:!!window.authClient},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step4'})}).catch(()=>{});
                    // #endregion
                    if (!window.authClient) {
                        this.testStep4Result = {
                            success: false,
                            message: '✗ auth-client не загружен'
                        };
                        return;
                    }
                    try {
                        const isAuthenticated = await window.authClient.isAuthenticated();
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep4',message:'Результат isAuthenticated',data:{isAuthenticated:isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step4'})}).catch(()=>{});
                        // #endregion
                        let userData = null;
                        if (isAuthenticated) {
                            userData = await window.authClient.getCurrentUser();
                            // #region agent log
                            fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep4',message:'Результат getCurrentUser',data:{hasUser:userData!==null,hasEmail:userData&&userData.email?true:false},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step4'})}).catch(()=>{});
                            // #endregion
                        }
                        this.testStep4Result = {
                            success: true,
                            isAuthenticated: isAuthenticated,
                            userData: userData,
                            message: isAuthenticated
                                ? `✓ Авторизован${userData ? ` как ${userData.email || userData.name || 'пользователь'}` : ' (но user === null)'}`
                                : '○ Не авторизован'
                        };
                    } catch (error) {
                        this.testStep4Result = {
                            success: false,
                            message: `✗ Ошибка проверки авторизации: ${error.message}`
                        };
                    }
                },

                /**
                 * Шаг 5: Инициация входа через Google
                 */
                testStep5_InitiateLogin() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep5',message:'Инициация входа через Google',data:{hasAuthClient:!!window.authClient},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step5'})}).catch(()=>{});
                    // #endregion
                    if (!window.authClient) {
                        this.testStep5Result = {
                            success: false,
                            message: '✗ auth-client не загружен'
                        };
                        return;
                    }
                    try {
                        window.authClient.initiateGoogleAuth();
                        this.testStep5Result = {
                            success: true,
                            message: '✓ Редирект на Google OAuth инициирован. Вы будете перенаправлены на страницу авторизации Google.'
                        };
                    } catch (error) {
                        this.testStep5Result = {
                            success: false,
                            message: `✗ Ошибка инициации входа: ${error.message}`
                        };
                    }
                },

                /**
                 * Шаг 6: Проверка компонента portfolios-manager
                 */
                testStep6_CheckPortfoliosManager() {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6397d191-f6f2-43f4-b4da-44a3482bedec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-ui-root.js:testStep6',message:'Проверка portfolios-manager',data:{hasPortfoliosManager:!!window.portfoliosManager,hasPortfoliosClient:!!window.portfoliosClient,isPortfoliosEnabled:this.isPortfoliosEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'test-step6'})}).catch(()=>{});
                    // #endregion
                    if (!window.portfoliosManager) {
                        this.testStep6Result = {
                            success: false,
                            message: '✗ portfolios-manager не загружен. Проверьте консоль на наличие ошибок загрузки модулей.'
                        };
                        return;
                    }
                    if (!window.portfoliosClient) {
                        this.testStep6Result = {
                            success: false,
                            message: '⚠ portfolios-manager загружен, но portfolios-client отсутствует'
                        };
                        return;
                    }
                    if (!this.isPortfoliosEnabled) {
                        this.testStep6Result = {
                            success: false,
                            message: '⚠ portfolios-manager загружен, но feature flags не включены или пользователь не авторизован'
                        };
                        return;
                    }
                    this.testStep6Result = {
                        success: true,
                        message: '✓ portfolios-manager загружен и доступен. Компонент должен отображаться ниже.'
                    };
                }
            },

            async mounted() {
                // Загружаем таймзону и язык перевода из кэша при инициализации
                // Это обеспечивает синхронизацию с футером и статическими примерами
                try {
                    let savedLanguage = 'ru';
                    if (window.cacheManager) {
                        const savedTimezone = await window.cacheManager.get('timezone');
                        if (savedTimezone && typeof savedTimezone === 'string') {
                            this.selectedTimezone = savedTimezone;
                            this.initialTimezone = savedTimezone;
                        }

                        const lang = await window.cacheManager.get('translation-language');
                        if (lang && typeof lang === 'string') {
                            savedLanguage = lang;
                            this.selectedTranslationLanguage = lang;
                            this.initialTranslationLanguage = lang;
                            this.currentTranslationLanguage = lang;
                        }
                    } else {
                        const savedTimezone = localStorage.getItem('timezone');
                        if (savedTimezone) {
                            this.selectedTimezone = savedTimezone;
                            this.initialTimezone = savedTimezone;
                        }

                        const lang = localStorage.getItem('translation-language');
                        if (lang) {
                            savedLanguage = lang;
                            this.selectedTranslationLanguage = lang;
                            this.initialTranslationLanguage = lang;
                            this.currentTranslationLanguage = lang;
                        }
                    }

                    // Инициализируем tooltips для загруженного языка
                    // Ждём завершения инициализации перед обновлением реактивных tooltips
                    if (window.tooltipsConfig && typeof window.tooltipsConfig.init === 'function') {
                        try {
                            await window.tooltipsConfig.init(savedLanguage);
                            // Обновляем реактивные tooltips после инициализации
                            // Синхронизируем currentTranslationLanguage с currentLanguage из tooltipsConfig
                            if (window.tooltipsConfig && typeof window.tooltipsConfig.getCurrentLanguage === 'function') {
                                const tooltipsLanguage = window.tooltipsConfig.getCurrentLanguage();
                                if (tooltipsLanguage !== this.currentTranslationLanguage) {
                                    this.currentTranslationLanguage = tooltipsLanguage;
                                }
                            }
                            this.updateTooltips();
                        } catch (error) {
                            console.error('app-ui-root: ошибка инициализации tooltips при монтировании:', error);
                        }
                    }
                } catch (error) {
                    console.error('Failed to load timezone/language in app-ui-root:', error);
                }
            }
        }).mount('#app');

        // Инициализация темы при загрузке (если не была применена в data())
        // Дополнительная проверка на случай, если тема была изменена до монтирования Vue
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.setAttribute('data-bs-theme', 'dark');
            } else {
                document.body.removeAttribute('data-bs-theme');
            }
        } catch (e) {
            // Игнорируем ошибки
        }

        // Инициализация CSS-класса версии приложения на body
        // Используется для версионной стилизации и привязки кэша к версии
        try {
            if (window.appConfig) {
                const versionClass = window.appConfig.getVersionClass();
                document.body.classList.add(versionClass);
                console.log(`app-ui-root: версия приложения ${window.appConfig.CONFIG.version}, класс ${versionClass}`);
            }
        } catch (e) {
            console.error('app-ui-root: ошибка установки класса версии:', e);
        }

        // Очистка кэша старых версий приложения
        // Выполняется асинхронно, не блокирует инициализацию
        if (window.cacheManager && typeof window.cacheManager.clearOldVersions === 'function') {
            window.cacheManager.clearOldVersions().catch(error => {
                console.error('app-ui-root: ошибка очистки старых версий кэша:', error);
            });
        }

        // Инициализация tooltips теперь происходит в mounted() компонента
        // Убрали дублирующий вызов отсюда, чтобы избежать гонки условий

        // Инициализация автоматической маркировки элементов после монтирования Vue
        // Ждем, чтобы Vue успел смонтировать все компоненты
        setTimeout(() => {
            if (window.autoMarkup) {
                window.autoMarkup.init();
            }
        }, 200);
    }

    // Инициализация Vue приложения после загрузки всех модулей
    // Модульная система вызывает эту функцию после успешной загрузки всех модулей
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Ждём завершения загрузки модулей
            // Модульная система вызовет initVueApp через window.appInit
            window.appInit = initVueApp;
        });
    } else {
        // Если DOM уже загружен, устанавливаем функцию инициализации
        window.appInit = initVueApp;
    }
})();

