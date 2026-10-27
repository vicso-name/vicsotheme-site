# Фаза 1 — семантическое ядро vicsotheme.com

Дата: 2026-10-27. Рынок: Google US / English.
Позиционирование, под которое собиралось ядро: **инди-разработчик EdTech-продуктов, берёт заказы.**

## Метод

Ядро собрано от конкурентов, а не из головы: каждый запрос в нём либо приносит трафик реальному сайту, либо подтверждён частотностью.

| Шаг | Что сделано | Скрипт | Стоимость |
|---|---|---|---|
| 1 | Топ-10 Google по 20 запросам ниши → поиск конкурентов + бесплатные related/PAA | `scripts/seo/01-serp-discovery.mjs` | $0.20 |
| 2 | Запросы, по которым конкуренты в топ-30 (7 инди-аналогов целиком, 6 агентств — только EdTech-разделы) | `02-competitor-keywords.mjs` | $0.65 |
| 3 | Расширение (ideas) там, где у конкурентов пусто: эстонский, разработка; замер частотности/KD/интента всего пула | `03-expand-and-measure.mjs` | $0.63 |
| 4 | Кластеризация по правилам: сегмент → кластер (= будущая страница) | `04-cluster.mjs` | $0 |
| 5 | Проверка выдачи по головным запросам 22 кластеров | `05-serp-validate.mjs` | $0.25 |
| | **Итого** (сверено с балансом YepAPI: $2.05 → $0.32) | | **$1.73** |

Все ответы API закэшированы в `responses/` (в .gitignore) — повторный запуск скриптов бесплатный. Ledger: `spend.csv`.

## Результат

**`semantic-core.csv`** — 697 запросов с частотностью > 0: keyword, volume, KD, intent, CPC, segment, cluster, fit, competitors, source.
**`04-clusters.json`** — сводка по 35 кластерам.

| fit | Запросов | Что значит |
|---|---:|---|
| `target` | 345 | берём на vicsotheme |
| `tool-idea` | 91 | спрос на интерактивный инструмент (корейская клавиатура, конвертер имён, словарь) — отдельное решение |
| `park` | 132 | общие EdTech-темы и массовый рынок языковых приложений — только точечно, под кейс |
| `hebrewedu` | 68 | иврит — территория hebrewedu.com, на vicsotheme не дублируем |
| `exclude` | 61 | бренды (Duolingo, Babbel…), переводы, чужие языки, мусор |

> **Важно про частотности.** Google Ads отдаёт одну частотность на группу близких вариантов: 9 формулировок «best app for language learning» имеют по 22 200. Сумма по кластеру завышена в разы — реалистичная оценка спроса кластера ≈ частотность головного запроса.

## Три сегмента и что показала выдача

### 1. Корейский алфавит → Hangul Hero (главный источник трафика)

| Кластер | Голова (vol/мес) | KD | Кто в топ-10 |
|---|---|---:|---|
| hangul-alphabet | korean alphabet / hangul alphabet (60 500) | 10 | Wikipedia, koreanclass101, 90daykorean, **letslearnhangul.com — одностраничник, #7**, zkorean, flexiclasses, languagebird |
| korean-alphabet-chart | korean alphabet chart (5 400) | 9 | Pinterest ×3, PDF, 90daykorean, zkorean, busuu |
| hangul-writing-practice | korean writing practice (720) | 10 | 90daykorean, YouTube, Scribd, Pinterest, PDF-воркшиты |
| hangul-pronunciation | hangul pronunciation (1 900) | 7 | letslearnhangul, busuu, howtostudykorean, korean.go.kr, kajacoree |
| how-to-read-korean | how to read korean (1 300) | 3 | howtostudykorean, letslearnhangul, **ryanestrada.com (автор-одиночка)**, beccajnorman.com (личный блог) |
| hangul-quiz-games | hangul quiz / korean learning games (480) | 0 | quizlingua, jetpunk, sporcle, wordwall, Google Play — **выигрывают интерактивные страницы** |
| topik-practice-test | topik practice test | 6 | topikguide, lingrow (tool), topik-quiz.com |
| korean-learning-apps | best apps to learn korean (2 400) | 14 | mezzoguild, Reddit, Quora, noun.town — обзоры от самих разработчиков приложений |

**Вывод:** выдача пробиваемая. Её держат небольшие нишевые сайты, PDF и Pinterest; интерактив (чарт с аудио, квиз, тренажёр письма) там почти не представлен, а это ровно то, что умеет Hangul Hero. Главные кейсы конкурентов: letslearnhangul.com (одна страница → 383 запроса в топ-30) и lingrow.io (бесплатные инструменты → 608 запросов).

### 2. Эстонский → Estonian Verbs + Eesti Sõned (мало трафика, почти нет конкуренции)

| Кластер | Голова | Кто в топ-10 |
|---|---|---|
| estonian-language | estonian language (8 100) | YouTube, Quora, lingohut, BBC, Medium, preply |
| learn-estonian | learn estonian (170) | utalk, ling-app, livelingua, udemy, preply, Reddit |
| estonian-grammar | estonian grammar (40) | talkpal, ERR, decode.ee, colanguage, eestielu.ca |
| is-estonian-hard | is estonian hard to learn (70) | Quora, ling-app, preply, Reddit |

**Вывод:** объёмы маленькие, но в топе слабые блоговые страницы, а прямой аналог — latvianapps.com с приложением «Estonian Verbs» — по данным провайдера не имеет ни одного запроса в топ-30. Ниша пустая: страница-гайд по эстонским глаголам/падежам с живым тренажёром займёт её без борьбы. eestisoned.com — веб-приложение за логином без контента, каннибализации нет.

### 3. Разработка на заказ → «берёт заказы» (мало трафика, но это лиды)

| Кластер | Голова | Кто в топ-10 |
|---|---|---|
| edtech-app-development-company | education app development company (210), educational app development (110) | листиклы агентств «Top-10 EdTech companies» (inoxoft, cleveroad, designrush…), Reddit |
| how-to-build-educational-app | how to make an educational app (50) | блоги агентств (audiorista, cogniteq, bigscal), Quora, YouTube |
| edtech-app-development-cost | education app development cost (40) | devtechnosys, jotform, nimbleappgenie… |
| educational-app-ideas | unique app ideas for students (110) | Reddit, cmarix, spec-india, spdload |
| language-learning-app-development | language learning app development (10) | Reddit, sapient, geniusee, riseapps |

**Вывод:** весь сегмент — ~1–2 тыс. запросов в месяц на всех, топ держат шаблонные статьи агентств. Коммерческие «company»-запросы инди не возьмёт (там листиклы), но гайды «как сделать / сколько стоит» с реальными цифрами своих приложений — да: у агентств там нет опыта из первых рук. Это не трафик, это конверсия.

## Что отпало и почему

- **«hire edtech developer», «freelance edtech developer»** — в выдаче вакансии (Indeed, LinkedIn, edtechjobs.io): ищут работу, а не исполнителя.
- **«indie edtech founder», «solo developer language app»** — частотность ~0.
- **«best language learning app» (22 200)** — KD 1 по данным провайдера, но это артефакт: запросы такого уровня держат обзоры от самих приложений (talkreal, polychatapp, taalhammer). В `park` — на потом.
- **EdTech-теория** (what is edtech, gamification, AI in education) — университеты, NIH, Wikipedia. В `park`.

## Вход для фазы 2 (позиционирование)

Данные показывают: **трафик дадут ученики, а заказы — кейсы.** Это две разные аудитории, и выбор в фазе 2 — как их совместить:

1. **Продуктовая витрина на одном домене.** vicsotheme = инди EdTech-студия; у каждого приложения — хаб с бесплатными учебными страницами/инструментами (`/hangul-hero/alphabet-chart`, `/estonian-verbs/…`), которые качают трафик и ведут в приложение; рядом — кейсы и одна страница «работаю на заказ» с гайдами по разработке. Плюс: весь вес домена копится в одном месте, кейсы подкреплены живыми продуктами.
2. **Студия + отдельные сайты продуктов** (как уже сделано с hebrewedu.com). vicsotheme остаётся витриной кейсов + dev-сегмент, а корейский/эстонский контент уходит на свои домены. Плюс: чистая тематика каждого домена; минус: vicsotheme почти без трафика (сегмент 3 — ~1–2 тыс./мес на всех).

## Ограничения

- KD провайдера (DataForSEO-подобный) систематически занижен на массовых запросах — решения принимались по фактической выдаче, а не по KD.
- Выдача снята один раз, без учёта персонализации; позиции 1–3 часто заняты AI Overview и видео.
- Hebrew-запросы собраны попутно (learnhebrewalphabet.com) — их стоит передать в исследование hebrewedu.
