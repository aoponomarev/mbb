/**
 * ================================================================================================
 * MODULES CONFIG - Конфигурация модулей для модульной системы загрузки
 * ================================================================================================
 *
 * ЦЕЛЬ: Централизованное описание всех модулей приложения с их зависимостями.
 * Используется модульным загрузчиком (core/module-loader.js) для автоматической
 * загрузки модулей в правильном порядке.
 *
 * ПРИНЦИПЫ:
 * - Модули группируются по категориям: utilities, core, templates, components, app
 * - Каждый модуль описывает свои зависимости через массив deps
 * - Загрузчик автоматически разрешает зависимости и загружает модули в правильном порядке
 * - Поддержка внешних модулей (type: 'external') и локальных (type: 'local')
 *
 * СТРУКТУРА МОДУЛЯ:
 * {
 *   id: 'unique-id',           // Уникальный идентификатор модуля
 *   src: 'path/to/module.js',   // Путь к модулю
 *   type: 'local' | 'external', // Тип модуля
 *   deps: ['dep-id-1', 'dep-id-2'], // Массив ID зависимостей
 *   category: 'utilities' | 'core' | 'templates' | 'libraries' | 'components' | 'app', // Категория
 *   condition: function() { return true; } // Опциональная функция для условной загрузки (feature flag)
 * }
 *
 * ВАЖНО:
 * - Порядок модулей в массивах не важен - загрузчик сам определит правильный порядок
 * - Зависимости указываются через ID модулей
 * - Циклические зависимости будут обнаружены и вызовут ошибку
 *
 * ССЫЛКА: Принципы модульной системы описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Конфигурация всех модулей приложения
     */
    window.modulesConfig = {
        // Утилиты (загружаются первыми, до Vue.js)
        utilities: [
            {
                id: 'hash-generator',
                src: 'shared/utils/hash-generator.js',
                type: 'local',
                deps: [],
                category: 'utilities'
            },
            {
                id: 'auto-markup',
                src: 'shared/utils/auto-markup.js',
                type: 'local',
                deps: ['hash-generator'],
                category: 'utilities'
            },
            {
                id: 'pluralize',
                src: 'shared/utils/pluralize.js',
                type: 'local',
                deps: [],
                category: 'utilities'
            },
            {
                id: 'class-manager',
                src: 'shared/utils/class-manager.js',
                type: 'local',
                deps: [],
                category: 'utilities'
            },
            {
                id: 'layout-sync',
                src: 'shared/utils/layout-sync.js',
                type: 'local',
                deps: [],
                category: 'utilities'
            }
        ],

        // Core модули (бизнес-логика, кэш, валидация)
        core: [
            // Cache модули
            {
                id: 'storage-layers',
                src: 'core/cache/storage-layers.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'cache-config',
                src: 'core/cache/cache-config.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'cache-migrations',
                src: 'core/cache/cache-migrations.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'cache-manager',
                src: 'core/cache/cache-manager.js',
                type: 'local',
                deps: ['storage-layers', 'cache-config', 'cache-migrations'],
                category: 'core'
            },
            {
                id: 'cache-cleanup',
                src: 'core/cache/cache-cleanup.js',
                type: 'local',
                deps: ['cache-manager'],
                category: 'core'
            },
            {
                id: 'cache-indexes',
                src: 'core/cache/cache-indexes.js',
                type: 'local',
                deps: ['cache-manager'],
                category: 'core'
            },
            // Validation модули
            {
                id: 'validation-schemas',
                src: 'core/validation/schemas.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'validator',
                src: 'core/validation/validator.js',
                type: 'local',
                deps: ['validation-schemas'],
                category: 'core'
            },
            {
                id: 'normalizer',
                src: 'core/validation/normalizer.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'math-validation',
                src: 'core/validation/math-validation.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            // Error handling
            {
                id: 'error-types',
                src: 'core/errors/error-types.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'error-handler',
                src: 'core/errors/error-handler.js',
                type: 'local',
                deps: ['error-types'],
                category: 'core'
            },
            // API
            {
                id: 'rate-limiter',
                src: 'core/api/rate-limiter.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'market-metrics',
                src: 'core/api/market-metrics.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'perplexity',
                src: 'core/api/perplexity.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            // Config
            {
                id: 'api-config',
                src: 'core/config/api-config.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            {
                id: 'app-config',
                src: 'core/config/app-config.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            // Events
            {
                id: 'event-bus',
                src: 'core/events/event-bus.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            // State
            {
                id: 'loading-state',
                src: 'core/state/loading-state.js',
                type: 'local',
                deps: [],
                category: 'core'
            },
            // Logging
            {
                id: 'logger',
                src: 'core/logging/logger.js',
                type: 'local',
                deps: [],
                category: 'core'
            }
        ],

        // Шаблоны (загружаются до Vue.js)
        templates: [
            {
                id: 'button-template',
                src: 'shared/templates/button-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'dropdown-menu-item-template',
                src: 'shared/templates/dropdown-menu-item-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'dropdown-template',
                src: 'shared/templates/dropdown-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'combobox-template',
                src: 'shared/templates/combobox-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'button-group-template',
                src: 'shared/templates/button-group-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'modal-template',
                src: 'shared/templates/modal-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'modal-buttons-template',
                src: 'shared/templates/modal-buttons-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'timezone-selector-template',
                src: 'shared/templates/timezone-selector-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'perplexity-settings-template',
                src: 'app/templates/perplexity-settings-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'app-header-template',
                src: 'app/templates/app-header-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            },
            {
                id: 'app-footer-template',
                src: 'app/templates/app-footer-template.js',
                type: 'local',
                deps: [],
                category: 'templates'
            }
        ],

        // Внешние библиотеки (загружаются после шаблонов, до компонентов)
        libraries: [
            {
                id: 'vue',
                src: 'https://unpkg.com/vue@3/dist/vue.global.prod.js',
                type: 'external',
                deps: ['button-template', 'dropdown-menu-item-template', 'dropdown-template', 'combobox-template', 'button-group-template', 'modal-template', 'timezone-selector-template'],
                category: 'libraries'
            }
        ],

        // Vue компоненты (загружаются после Vue.js)
        components: [
            {
                id: 'dropdown-menu-item',
                src: 'shared/components/dropdown-menu-item.js',
                type: 'local',
                deps: ['vue'],
                category: 'components'
            },
            {
                id: 'button',
                src: 'shared/components/button.js',
                type: 'local',
                deps: ['vue', 'hash-generator', 'auto-markup'],
                category: 'components'
            },
            {
                id: 'dropdown',
                src: 'shared/components/dropdown.js',
                type: 'local',
                deps: ['vue', 'button', 'hash-generator', 'auto-markup'],
                category: 'components'
            },
            {
                id: 'combobox',
                src: 'shared/components/combobox.js',
                type: 'local',
                deps: ['vue', 'dropdown', 'button'],
                category: 'components'
            },
            {
                id: 'button-group',
                src: 'shared/components/button-group.js',
                type: 'local',
                deps: ['vue', 'button', 'dropdown', 'dropdown-menu-item', 'hash-generator', 'auto-markup'],
                category: 'components'
            },
            {
                id: 'app-header',
                src: 'app/components/app-header.js',
                type: 'local',
                deps: ['vue', 'dropdown'],
                category: 'components'
            },
            {
                id: 'app-footer',
                src: 'app/components/app-footer.js',
                type: 'local',
                deps: ['vue', 'market-metrics', 'perplexity'],
                category: 'components'
            },
            {
                id: 'modal',
                src: 'shared/components/modal.js',
                type: 'local',
                deps: ['vue', 'modal-buttons-template', 'modal-buttons'],
                category: 'components'
            },
            {
                id: 'modal-buttons',
                src: 'shared/components/modal-buttons.js',
                type: 'local',
                deps: ['vue', 'button', 'modal-buttons-template'],
                category: 'components'
            },
            {
                id: 'timezone-selector',
                src: 'shared/components/timezone-selector.js',
                type: 'local',
                deps: ['vue'],
                category: 'components'
            },
            {
                id: 'modal-example-body',
                src: 'app/components/modal-example-body.js',
                type: 'local',
                deps: ['vue', 'modal'],
                category: 'components'
            },
            {
                id: 'perplexity-settings',
                src: 'app/components/perplexity-settings.js',
                type: 'local',
                deps: ['vue', 'modal', 'perplexity-settings-template'],
                category: 'components'
            }
        ],

        // Приложение (загружается последним)
        app: [
            {
                id: 'app-ui-root',
                src: 'app/app-ui-root.js',
                type: 'local',
                deps: ['dropdown-menu-item', 'button', 'dropdown', 'combobox', 'button-group', 'app-header', 'app-footer', 'modal', 'modal-buttons', 'modal-example-body', 'perplexity-settings'],
                category: 'app'
            }
        ]
    };
})();

