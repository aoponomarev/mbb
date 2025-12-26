/**
 * Корневой компонент приложения
 *
 * ЦЕЛЬ: Инициализация Vue приложения, загрузка компонентов, настройка корневого компонента
 *
 * ПРОБЛЕМА: Логика загрузки компонентов и инициализации Vue раздувала index.html
 *
 * РЕШЕНИЕ: Вынос всей логики инициализации в отдельный модуль
 * - Последовательная загрузка компонентов через динамическое создание <script> тегов
 * - Инициализация Vue приложения после загрузки всех компонентов
 * - Настройка корневого компонента с данными и методами
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Функция loadComponentsAndInitVue() загружает компоненты последовательно
 * - После загрузки всех компонентов создаётся Vue app через createApp()
 * - Компоненты регистрируются в app через components
 * - App монтируется на #app элемент
 *
 * ПРЕИМУЩЕСТВА:
 * - index.html остаётся компактным
 * - Логика инициализации изолирована
 * - Легко добавлять новые компоненты
 * - Централизованное управление данными приложения
 */

(function() {
    'use strict';

    /**
     * Загружает все компоненты последовательно и инициализирует Vue приложение
     */
    function loadComponentsAndInitVue() {
        // Загружаем все компоненты последовательно
        const dropdownMenuItemScript = document.createElement('script');
        dropdownMenuItemScript.src = 'shared/components/dropdown-menu-item.js';
        dropdownMenuItemScript.onload = function() {
            const buttonScript = document.createElement('script');
            buttonScript.src = 'shared/components/button.js';
            buttonScript.onload = function() {
                const dropdownScript = document.createElement('script');
                dropdownScript.src = 'shared/components/dropdown.js';
                dropdownScript.onload = function() {
                    const comboboxScript = document.createElement('script');
                    comboboxScript.src = 'shared/components/combobox.js';
                    comboboxScript.onload = function() {
                        // Инициализация Vue приложения после загрузки всех компонентов
                        const { createApp } = Vue;

                        createApp({
                            components: {
                                'dropdown-menu-item': window.cmpDropdownMenuItem,
                                'cmp-button': window.cmpButton,
                                'cmp-dropdown': window.cmpDropdown,
                                'cmp-combobox': window.cmpCombobox
                            },
                            data() {
                                return {
                                    // Данные для dropdown
                                    dropdownItems: [
                                        { id: 1, name: 'Элемент 1', description: 'Описание элемента 1' },
                                        { id: 2, name: 'Элемент 2', description: 'Описание элемента 2' },
                                        { id: 3, name: 'Элемент 3', description: 'Описание элемента 3' },
                                        { id: 4, name: 'Элемент 4', description: 'Описание элемента 4' },
                                        { id: 5, name: 'Элемент 5', description: 'Описание элемента 5' }
                                    ],
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
                                    console.log('Click на элемент:', event);
                                },
                                handleSuffixClick(event, item) {
                                    console.log('Click на суффикс:', event, item);
                                },
                                handleInfoClick(event) {
                                    console.log('Click на info (справка):', event);
                                    alert('Открыть справку');
                                },
                                toggleMenu() {
                                    this.isMenuExpanded = !this.isMenuExpanded;
                                },
                                handleSelect(item) {
                                    console.log('Выбран элемент:', item);
                                    alert(`Выбран: ${item.name}`);
                                },
                                handleComboboxSelect(event) {
                                    console.log('Combobox select:', event);
                                },
                                handleComboboxInput(value) {
                                    console.log('Combobox input:', value);
                                },
                                customFilterFunction(items, query) {
                                    // Кастомная фильтрация: ищем по label и value
                                    const lowerQuery = query.toLowerCase();
                                    return items.filter(item => {
                                        const label = (item.label || '').toLowerCase();
                                        const value = (item.value || '').toLowerCase();
                                        return label.includes(lowerQuery) || value.includes(lowerQuery);
                                    });
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
                    };
                    comboboxScript.onerror = function() {
                        console.error('Ошибка загрузки компонента combobox');
                    };
                    document.head.appendChild(comboboxScript);
                };
                dropdownScript.onerror = function() {
                    console.error('Ошибка загрузки компонента dropdown');
                };
                document.head.appendChild(dropdownScript);
            };
            buttonScript.onerror = function() {
                console.error('Ошибка загрузки компонента button');
            };
            document.head.appendChild(buttonScript);
        };
        dropdownMenuItemScript.onerror = function() {
            console.error('Ошибка загрузки компонента dropdown-menu-item');
        };
        document.head.appendChild(dropdownMenuItemScript);
    }

    // Запускаем загрузку компонентов после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponentsAndInitVue);
    } else {
        loadComponentsAndInitVue();
    }
})();

