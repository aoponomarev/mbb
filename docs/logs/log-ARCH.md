# Тематический лог: ARCH

Лог изменений, связанных с архитектурой, структурой файлов/компонентов, JavaScript, API, I/O.

## Создание компонента dropdown-menu-item
23.12.2025:4cb4b35 ◆ Создан переиспользуемый компонент dropdown-menu-item для пунктов выпадающего меню ▶ Создан шаблон `shared/templates/dropdown-menu-item-template.html` с поддержкой иконки, заголовка, подзаголовка, суффикса (badge/icon/indicator/chevron/info), tooltips, состояний (active/disabled). Создан компонент `shared/components/dropdown-menu-item.js` с props, emits, методами обработки кликов. Реализована логика событий: по умолчанию все зоны эмитят общий click, раздельные события (click-icon, click-text, click-suffix) эмитятся всегда. Добавлена анимация chevron через Font Awesome классы (fa-rotate-90) + inline transition. Инициализация Bootstrap tooltips через data-bs-toggle. Обновлён index.html с примерами компонента в разных состояниях ◉ Создать универсальный переиспользуемый компонент для пунктов dropdown-меню с поддержкой всех необходимых функций, используя только Bootstrap классы @components @vue @bootstrap @dropdown @menu-item @shared

## Обновление формата записей в тематических логах
22.12.2025:f033986 ◆ Обновлён формат записей в тематических логах для компактности @logs @format @refactoring

## Обновление ссылок на переименованные файлы документации
22.12.2025:dff9953 ◆ Обновлены ссылки на переименованный файл документации в `core/lib-loader.js` @refactoring @links @lib-loader

## Создание загрузчика библиотек с fallback-механизмом
22.12.2025:2b7d0a8 ◆ Создан `core/lib-loader.js` для загрузки внешних библиотек с автоматическим fallback ▶ Реализованы функции: `load()`, `loadMultiple()`, `isLoaded()`, `addSource()`. Поддержка GitHub Pages CDN как основной источник, внешние CDN как fallback, кэширование загруженных библиотек. Поддержка библиотек: vue, chartjs, numeral, vuedraggable, dayjs. Обновлён порядок загрузки в `docs/doc-architect.md` ◉ Обеспечить надёжную загрузку библиотек независимо от доступности отдельных CDN, централизовать управление библиотеками @architect @lib-loader @cdn @fallback

## Создание критически важных структур проекта
22.12.2025:68e89b3 ◆ Созданы все критически важные структуры для здоровья проекта ▶ Создана структура `core/validation/` (schemas.js, validator.js, normalizer.js, math-validation.js). Создана структура `core/errors/` (error-types.js, error-handler.js). Создан `core/api/rate-limiter.js`. Создана структура `core/state/` (loading-state.js). Создана структура `core/events/` (event-bus.js). Создана структура `core/config/` (app-config.js, api-config.js). Создана структура `core/logging/` (logger.js). Обновлена документация `docs/doc-architect.md`: добавлен раздел "Критически важные структуры", обновлён порядок загрузки (15 шагов). Всего создано 19 файлов, 2268 строк JavaScript кода ◉ Заложить фундамент для надёжности финансовых расчётов, предотвратить ошибки из-за некорректных данных, обеспечить единообразную обработку ошибок и состояний @architect @validation @errors @rate-limiting @state @events @config @logging @foundation

## Декомпозиция ui/ и переименование в shared/
22.12.2025:37235af ◆ Переименована папка `ui/shared/` → `shared/`, обновлена структура проекта ▶ Переименована папка `ui/shared/` в `shared/`, удалена пустая папка `ui/`, обновлены все упоминания в `index.html`, создана структура папок: `shared/` (components, styles, templates, utils, config, assets/icons), `features/markets/`, `features/settings/`, `features/layout/` с подпапками ◉ Упростить структуру проекта, убрать лишний уровень вложенности, обеспечить чёткое разделение shared/feature-specific компонентов @architect @structure @refactoring @shared @features

## Создание модульного index.html с принципами модульности
22.12.2025:822e4e4 ◆ Создан `index.html` как точка подключения скриптов с развёрнутой шапкой, описывающей принципы модульности ▶ Добавлена шапка с описанием: вынос x-template шаблонов в отдельные файлы, модульная система загрузки скриптов через конфигурацию, группировка компонентов по функциональности и слоям, правила размещения файлов, порядок загрузки, принципы именования, работа без сборки ◉ Обеспечить модульную архитектуру проекта, избежать раздувания index.html, централизовать управление загрузкой модулей @architect @modularity @index @module-loader
