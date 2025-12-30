/**
 * ================================================================================================
 * AI API SETTINGS TEMPLATE - Шаблон компонента настроек AI API провайдеров
 * ================================================================================================
 *
 * ЦЕЛЬ: Шаблон для компонента настроек AI API провайдеров (ai-api-settings).
 *
 * ПРОБЛЕМА: Шаблон должен быть доступен в DOM до инициализации Vue.js для работы компонента.
 *
 * РЕШЕНИЕ: Шаблон хранится как строка в JavaScript файле и автоматически вставляется в DOM
 * при загрузке файла как <script type="text/x-template"> элемент с id="ai-api-settings-template".
 *
 * КАК ДОСТИГАЕТСЯ:
 * - Шаблон определён как строка в константе TEMPLATE
 * - При загрузке файла автоматически создаётся <script type="text/x-template"> элемент
 * - Элемент добавляется в document.body с id="ai-api-settings-template"
 * - Компонент использует шаблон через template: '#ai-api-settings-template'
 *
 * ОСОБЕННОСТИ ШАБЛОНА:
 * Структура HTML:
 * - Radio buttons для выбора провайдера (YandexGPT, Perplexity)
 * - Условное отображение полей настроек в зависимости от выбранного провайдера
 * - Поля ввода API ключей (password/text с переключателем видимости)
 * - Выбор моделей через select
 * - Компактный и аскетичный интерфейс
 *
 * ССЫЛКИ:
 * - Общие принципы работы с шаблонами: docs/doc-architect.md (раздел "Вынос x-template шаблонов")
 * - Компонент: app/components/ai-api-settings.js
 */

(function() {
    'use strict';

    const TEMPLATE = `<div>
    <!-- Выбор провайдера -->
    <div class="mb-4">
        <label class="form-label">AI провайдер</label>
        <div class="btn-group" role="group" aria-label="Выбор AI провайдера">
            <input
                type="radio"
                class="btn-check"
                id="provider-yandex"
                value="yandex"
                v-model="provider">
            <label class="btn btn-outline-primary" for="provider-yandex">YandexGPT</label>

            <input
                type="radio"
                class="btn-check"
                id="provider-perplexity"
                value="perplexity"
                v-model="provider">
            <label class="btn btn-outline-primary" for="provider-perplexity">Perplexity AI</label>
        </div>
    </div>

    <!-- Настройки YandexGPT -->
    <div v-if="provider === 'yandex'">
        <div class="mb-3">
            <label for="yandex-api-key" class="form-label">API ключ Yandex</label>
            <div class="input-group">
                <input
                    class="form-control"
                    id="yandex-api-key"
                    v-model="yandexApiKey"
                    :type="showYandexApiKey ? 'text' : 'password'"
                    placeholder="Введите API ключ Yandex">
                <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="toggleYandexApiKeyVisibility">
                    <i :class="showYandexApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
            </div>
        </div>
        <div class="mb-3">
            <label for="yandex-model" class="form-label">Модель YandexGPT</label>
            <select
                class="form-select"
                id="yandex-model"
                v-model="yandexModel">
                <option v-for="m in yandexModels" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
        </div>
    </div>

    <!-- Настройки Perplexity -->
    <div v-if="provider === 'perplexity'">
        <div class="mb-3">
            <label for="perplexity-api-key" class="form-label">API ключ Perplexity</label>
            <div class="input-group">
                <input
                    class="form-control"
                    id="perplexity-api-key"
                    v-model="perplexityApiKey"
                    :type="showPerplexityApiKey ? 'text' : 'password'"
                    placeholder="pplx-...">
                <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="togglePerplexityApiKeyVisibility">
                    <i :class="showPerplexityApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
            </div>
        </div>
        <div class="mb-3">
            <label for="perplexity-model" class="form-label">Модель Perplexity</label>
            <select
                class="form-select"
                id="perplexity-model"
                v-model="perplexityModel">
                <option v-for="m in perplexityModels" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
        </div>
    </div>
</div>`;

    /**
     * Вставляет шаблон в DOM
     */
    function insertTemplate() {
        const templateScript = document.createElement('script');
        templateScript.type = 'text/x-template';
        templateScript.id = 'ai-api-settings-template';
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

