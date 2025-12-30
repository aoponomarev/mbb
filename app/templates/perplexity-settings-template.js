/**
 * ================================================================================================
 * PERPLEXITY SETTINGS TEMPLATE - Шаблон компонента настроек Perplexity
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для компонента настроек Perplexity (perplexity-settings).
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="perplexity-settings-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="perplexity-settings-template"
 * - Компонент использует шаблон через template: '#perplexity-settings-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * Структура HTML:
 * - Компактный и аскетичный интерфейс
 * - Поле ввода API ключа (password/text с переключателем видимости)
 * - Выбор модели Perplexity через select
 * - Минимальные Bootstrap классы
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Компонент: app/components/perplexity-settings.js
 */

(function() {
    'use strict';

    const TEMPLATE = `<div>
    <div class="mb-3">
        <label for="perplexity-api-key" class="form-label">API ключ</label>
        <div class="input-group">
            <input
                class="form-control"
                id="perplexity-api-key"
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="pplx-...">
            <button
                class="btn btn-outline-secondary"
                type="button"
                @click="toggleApiKeyVisibility">
                <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
        </div>
    </div>
    <div class="mb-3">
        <label for="perplexity-model" class="form-label">Модель</label>
        <select
            class="form-select"
            id="perplexity-model"
            v-model="model">
            <option v-for="m in models" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
    </div>
</div>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'perplexity-settings-template';
        templateScript.textContent = TEMPLATE;
        document.body.appendChild(templateScript);
    }

    // Вставляем шаблон при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertTemplate);
    } else {
        insertTemplate();
    }
})();

