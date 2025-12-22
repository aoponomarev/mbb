# Инструкция по настройке GitHub Pages для libs-репозитория

## Шаг 1: Создание репозитория

1. Создай новый репозиторий на GitHub: `https://github.com/aoponomarev/libs`
2. Сделай его публичным (для доступа через GitHub Pages)
3. Инициализируй локально:

```bash
mkdir libs
cd libs
git init
git remote add origin https://github.com/aoponomarev/libs.git
```

## Шаг 2: Создание структуры папок

Создай следующую структуру:

```
libs/
├── vue/
│   └── 3.4.0/
│       └── vue.global.js
├── chartjs/
│   └── 4.4.0/
│       ├── chart.umd.js
│       └── chart.min.js
├── vue-chartjs/
│   └── 5.2.0/
│       └── vue-chartjs.umd.js
├── numeral/
│   └── 2.0.6/
│       └── numeral.min.js
├── vueuse/
│   └── 10.7.0/
│       └── index.umd.js
├── vuedraggable/
│   └── 4.1.0/
│       └── vuedraggable.umd.js
├── date-fns/
│   └── 2.30.0/
│       └── index.umd.js
└── README.md
```

## Шаг 3: Загрузка библиотек

### Способ 1: Ручная загрузка

1. Скачай файлы библиотек с официальных сайтов или CDN
2. Размести их в соответствующих папках по версиям

### Способ 2: Скрипт для автоматической загрузки

Создай скрипт `download-libs.sh`:

```bash
#!/bin/bash

# Vue.js
mkdir -p vue/3.4.0
curl -o vue/3.4.0/vue.global.js https://cdn.jsdelivr.net/npm/vue@3.4.0/dist/vue.global.js

# Chart.js
mkdir -p chartjs/4.4.0
curl -o chartjs/4.4.0/chart.umd.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js
curl -o chartjs/4.4.0/chart.min.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js

# Vue Chart.js
mkdir -p vue-chartjs/5.2.0
curl -o vue-chartjs/5.2.0/vue-chartjs.umd.js https://cdn.jsdelivr.net/npm/vue-chartjs@5.2.0/dist/vue-chartjs.umd.js

# Numeral.js
mkdir -p numeral/2.0.6
curl -o numeral/2.0.6/numeral.min.js https://cdn.jsdelivr.net/npm/numeral@2.0.6/min/numeral.min.js

# VueUse
mkdir -p vueuse/10.7.0
curl -o vueuse/10.7.0/index.umd.js https://cdn.jsdelivr.net/npm/@vueuse/core@10.7.0/dist/index.umd.js

# Vue Draggable
mkdir -p vuedraggable/4.1.0
curl -o vuedraggable/4.1.0/vuedraggable.umd.js https://cdn.jsdelivr.net/npm/vuedraggable@4.1.0/dist/vuedraggable.umd.js

# Date-fns
mkdir -p date-fns/2.30.0
curl -o date-fns/2.30.0/index.umd.js https://cdn.jsdelivr.net/npm/date-fns@2.30.0/index.umd.js
```

Выполни: `chmod +x download-libs.sh && ./download-libs.sh`

## Шаг 4: Создание README.md

Создай `README.md` в корне репозитория:

```markdown
# Библиотеки для проектов

Репозиторий библиотек для использования в проектах через GitHub Pages CDN.

## Использование

Библиотеки доступны по адресу:
`https://aoponomarev.github.io/libs/lib-name/version/file.js`

## Структура

- `vue/3.4.0/vue.global.js` - Vue.js 3.4.0
- `chartjs/4.4.0/chart.umd.js` - Chart.js 4.4.0
- и т.д.

## Обновление

При обновлении библиотек:
1. Добавь новую версию в соответствующую папку
2. Закоммить изменения
3. Запушь в репозиторий
```

## Шаг 5: Настройка GitHub Pages

1. Перейди в Settings репозитория
2. В разделе "Pages" выбери:
   - Source: Deploy from a branch
   - Branch: main (или master)
   - Folder: / (root)
3. Нажми Save
4. GitHub автоматически развернёт Pages через несколько минут

## Шаг 6: Проверка доступности

После настройки Pages проверь доступность:

```bash
curl https://aoponomarev.github.io/libs/vue/3.4.0/vue.global.js
```

Должен вернуться JavaScript код.

## Шаг 7: Первый коммит

```bash
git add .
git commit -m "Initial commit: добавлены библиотеки"
git branch -M main
git push -u origin main
```

## Обновление библиотек

При добавлении новых версий:

1. Создай папку с новой версией: `vue/3.5.0/`
2. Добавь файлы библиотеки
3. Закоммить и запушь:

```bash
git add vue/3.5.0/
git commit -m "Добавлена Vue.js 3.5.0"
git push
```

## Использование в проекте

В проекте используй через `core/lib-loader.js`:

```javascript
await window.libLoader.load('vue', '3.4.0');
await window.libLoader.load('chartjs', '4.4.0');
```

Загрузчик автоматически попробует загрузить из GitHub Pages, затем из внешних CDN.

