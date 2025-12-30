/**
 * ================================================================================================
 * MODALS CONFIG - Конфигурация модальных окон
 * ================================================================================================
 *
 * ЦЕЛЬ: Единый источник правды для заголовков, иконок и метаданных модальных окон.
 *
 * ПРИНЦИПЫ:
 * - Заголовок модального окна определяется здесь и используется везде
 * - Пункты меню, кнопки и ссылки получают заголовок из этой конфигурации
 * - Изменение заголовка в одном месте автоматически синхронизируется везде
 * - Обязательное требование: заголовок модального окна должен совпадать с текстом пункта меню/кнопки
 *
 * СТРУКТУРА:
 * {
 *   modalId: {
 *     title: 'Заголовок модального окна',
 *     icon: 'fas fa-icon-class', // Опционально
 *     description: 'Описание' // Опционально
 *   }
 * }
 *
 * ССЫЛКИ:
 * - Принципы единого источника правды: docs/doc-comp-principles.md
 * - Компонент модального окна: shared/components/modal.js
 */

(function() {
    'use strict';

    const MODALS_CONFIG = {
        'timezoneModal': {
            title: 'Таймзона & i18n',
            icon: 'fas fa-adjust',
            description: 'Настройка таймзоны и языка перевода новостей'
        },
        'perplexityModal': {
            title: 'Perplexity',
            icon: 'fas fa-robot',
            description: 'Настройки API Perplexity для получения новостей'
        }
    };

    /**
     * Получить конфигурацию модального окна
     * @param {string} modalId - ID модального окна
     * @returns {Object|null} - Конфигурация или null
     */
    function getModalConfig(modalId) {
        return MODALS_CONFIG[modalId] || null;
    }

    /**
     * Получить заголовок модального окна
     * @param {string} modalId - ID модального окна
     * @returns {string|null} - Заголовок или null
     */
    function getModalTitle(modalId) {
        const config = getModalConfig(modalId);
        return config ? config.title : null;
    }

    /**
     * Получить иконку модального окна
     * @param {string} modalId - ID модального окна
     * @returns {string|null} - Иконка или null
     */
    function getModalIcon(modalId) {
        const config = getModalConfig(modalId);
        return config ? config.icon : null;
    }

    // Экспорт в глобальную область
    window.modalsConfig = {
        MODALS_CONFIG,
        getModalConfig,
        getModalTitle,
        getModalIcon
    };

    console.log('modals-config.js: инициализирован');
})();

