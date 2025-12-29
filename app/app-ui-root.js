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

        if (!window.cmpDropdownMenuItem || !window.cmpButton || !window.cmpDropdown || !window.cmpCombobox || !window.cmpButtonGroup) {
            console.error('app-ui-root: не все компоненты загружены');
            return;
        }

        const { createApp } = Vue;

        createApp({
            components: {
                'dropdown-menu-item': window.cmpDropdownMenuItem,
                'cmp-button': window.cmpButton,
                'cmp-dropdown': window.cmpDropdown,
                'cmp-combobox': window.cmpCombobox,
                'cmp-button-group': window.cmpButtonGroup
            },
            data() {
                return {
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
                    }))
                };
            },
            methods: {
                handleClick(event) {
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
                }
            }
        }).mount('#app');

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

