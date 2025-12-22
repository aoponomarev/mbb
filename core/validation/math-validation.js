/**
 * ================================================================================================
 * MATH VALIDATION - Валидация математических вычислений
 * ================================================================================================
 *
 * ЦЕЛЬ: Проверка корректности финансовых расчётов и математических операций.
 * Валидация диапазонов, проверка на NaN/Infinity, валидация портфелей.
 *
 * ПРИНЦИПЫ:
 * - Строгая проверка перед использованием результатов расчётов
 * - Валидация портфелей (сумма весов = 1)
 * - Проверка корреляций (-1 до 1)
 * - Проверка метрик на NaN/Infinity
 *
 * ССЫЛКА: Критически важные структуры описаны в docs/doc-architect.md
 */

(function() {
    'use strict';

    /**
     * Проверить, является ли число валидным (не NaN, не Infinity)
     * @param {number} value - значение
     * @returns {boolean}
     */
    function isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    /**
     * Валидировать вес портфеля (сумма весов должна быть равна 1)
     * @param {Array} assets - массив активов с весами [{ coinId, weight }, ...]
     * @param {number} tolerance - допустимое отклонение (по умолчанию 0.001)
     * @returns {Object} - { valid: boolean, error: string, sum: number }
     */
    function validatePortfolioWeights(assets, tolerance = 0.001) {
        if (!Array.isArray(assets)) {
            return { valid: false, error: 'Активы должны быть массивом', sum: 0 };
        }

        let sum = 0;
        for (const asset of assets) {
            if (!asset || typeof asset.weight !== 'number') {
                return { valid: false, error: 'Каждый актив должен иметь числовой вес', sum: 0 };
            }
            if (asset.weight < 0 || asset.weight > 1) {
                return { valid: false, error: `Вес актива должен быть от 0 до 1, получен ${asset.weight}`, sum: 0 };
            }
            sum += asset.weight;
        }

        const diff = Math.abs(sum - 1);
        if (diff > tolerance) {
            return { valid: false, error: `Сумма весов должна быть равна 1, получена ${sum.toFixed(4)}`, sum };
        }

        return { valid: true, error: null, sum };
    }

    /**
     * Валидировать корреляцию (должна быть от -1 до 1)
     * @param {number} correlation - значение корреляции
     * @returns {Object} - { valid: boolean, error: string }
     */
    function validateCorrelation(correlation) {
        if (!isValidNumber(correlation)) {
            return { valid: false, error: 'Корреляция должна быть числом' };
        }
        if (correlation < -1 || correlation > 1) {
            return { valid: false, error: `Корреляция должна быть от -1 до 1, получена ${correlation}` };
        }
        return { valid: true, error: null };
    }

    /**
     * Валидировать метрику (не должна быть NaN или Infinity)
     * @param {number} metric - значение метрики
     * @param {string} metricName - имя метрики (для сообщения об ошибке)
     * @returns {Object} - { valid: boolean, error: string }
     */
    function validateMetric(metric, metricName = 'метрика') {
        if (!isValidNumber(metric)) {
            if (isNaN(metric)) {
                return { valid: false, error: `${metricName} не может быть NaN` };
            }
            if (!isFinite(metric)) {
                return { valid: false, error: `${metricName} не может быть Infinity` };
            }
            return { valid: false, error: `${metricName} должна быть числом` };
        }
        return { valid: true, error: null };
    }

    /**
     * Валидировать временной ряд (монотонность времени, отсутствие пропусков)
     * @param {Array} timeSeries - массив точек [{ timestamp, value }, ...]
     * @returns {Object} - { valid: boolean, error: string }
     */
    function validateTimeSeries(timeSeries) {
        if (!Array.isArray(timeSeries) || timeSeries.length === 0) {
            return { valid: false, error: 'Временной ряд должен быть непустым массивом' };
        }

        let prevTimestamp = null;
        for (let i = 0; i < timeSeries.length; i++) {
            const point = timeSeries[i];
            if (!point || typeof point.timestamp !== 'number') {
                return { valid: false, error: `Точка [${i}] должна иметь числовой timestamp` };
            }
            if (typeof point.value !== 'number' || !isValidNumber(point.value)) {
                return { valid: false, error: `Точка [${i}] должна иметь валидное числовое value` };
            }
            if (prevTimestamp !== null && point.timestamp < prevTimestamp) {
                return { valid: false, error: `Точка [${i}] имеет timestamp меньше предыдущей (нарушена монотонность)` };
            }
            prevTimestamp = point.timestamp;
        }

        return { valid: true, error: null };
    }

    // Экспорт в глобальную область
    window.mathValidation = {
        isValidNumber,
        validatePortfolioWeights,
        validateCorrelation,
        validateMetric,
        validateTimeSeries
    };

    console.log('math-validation.js: инициализирован');
})();

