# План полного прогона СЯ v2 — hanguledu.com (Hangul Hero)

Статус на 2026-10-27: **все шаги прогнаны.** Ключ №2 ($5.00) — R1, R2, R8; ключ №1, пополненный до $10.08 (бюджет ≤ $10) — R3–R6, потрачено $9.17, остаток $0.91. Ключ кладётся в `~/.config/yepapi/key`; перед стартом и после каждого шага — бесплатная сверка `/v1/account/balance` с `spend.csv`.

| Шаг | Статус | Потрачено | Выход |
|---|---|---:|---|
| R1 | ✅ готово | $0.42 | `competitors.csv`, `10-competitors.json` |
| R2 | ✅ готово, кроме `domain/pages` для 90daykorean, koreanclass101, howtostudykorean (кап) | $3.93 | `gap.csv` (4 878 запросов вне ядра v1), `11-competitor-keywords.json` |
| R3 | ✅ related по 20 фразам W1 и 8 пакам, ideas по 12 темам лексики; 40 jamo и iOS — кандидаты в R4 | $1.70 | `12-expansion.json` (695 запросов с данными, 537 новых) |
| R4 | ✅ clickstream для топ-100 W1; замер кандидатов R3, бэклога v1 и gap (≥ ~400/мес; хвост gap — с частотой из R2) | $1.35 | `13-measured.json` |
| merge | ✅ бесплатно: ядро v2 — 7 126 строк, 6 091 в ядре, 3 239 групп вариантов | $0 | `semantic-core-v2-raw.csv` (`scripts/seo/14-core-v2.mjs`) |
| R5 | ✅ SERP по главным запросам 550 групп (≥ 1 000/мес); кластеры: синонимы → ≥ 2 общих URL «голова к голове» | $5.43 | `15-serp.json`, `clusters-v2.json` (351 кластер, 271 новый против v1), `semantic-core-v2.csv` |
| R6 | ✅ топ-200 в GB/CA/AU/PH/IN/SG/ID; рынки es/pt/id/fr | $0.69 | `16-markets.json` |
| R7 | ⚠️ `serp/google-ai-mode` отвечает 400 у провайдера (не тарифицируется). Заменено бесплатно: источники AI Overview из SERP R5 (`clusters-v2.json` → `ai_cited`) | $0 | `scripts/seo/17-ai-mode.mjs` |
| R8 | ✅ бесплатно из кэша overview (поле `trend`, ~8 лет помесячно). `seo/trends` отдаёт пустой timeline и при этом списывает $0.02 — не использовать | $0.08 (впустую) | `18-seasonality.json` |
| R9 | ✅ бесплатно: подсказки App Store + Google Play (196 запросов × 2 магазина) и выдача приложений по 40 главным терминам | $0 | `aso-suggestions.csv` (903 термина, 88 в обоих магазинах), `aso-serp.csv`, `19-aso.json` |

**R9 — выводы для листингов.** Hangul Hero уже в топе Play по алфавиту: #1 `learn korean alphabet hangul`, #4 `korean alphabet writing hangul`, #5 `korean alphabet` и `learn korean alphabet`, #8 `korean writing`, #10–13 `hangul`, `learn hangul`, `hangul practice`, `hangul flashcards`. Вне топ-30 Play по фразам (`korean phrases`, `learn korean phrases`), словам (`korean words`, `korean vocabulary`), играм (`korean games`, `learn korean game`), `learn korean offline`, `korean pronunciation` — хотя Phrase X-Ray, квизы и офлайн в приложении есть, листинг их не таргетирует. В App Store по `korean alphabet` медиана оценок в топ-10 — 24 (`korean words` 37, `korean vocabulary` 16, `hangul flashcards` 0): слабая конкуренция для iOS-запуска.

Цель v2: заменить оценочные решения v1 проверенными данными —
кластеры по реальной выдаче (а не по правилам), полный список конкурентов и их запросов,
CTR-риски по фразам, рынки помимо US, данные для ТЗ на каждую страницу.

Все запросы кэшируются по хэшу тела — ничего не оплачивается дважды; повторный запуск шага бесплатный.

## Шаги

| # | Шаг | Эндпоинты | Объём | Оценка | Кап шага |
|---|---|---|---|---:|---:|
| R1 | **Карта конкурентов** по нашему набору запросов | `seo/competitors/serp`, `seo/competitors/domain` | ~430 целевых запросов W1–W2; 3 эталонных домена | $0.40 | $0.60 |
| R2 | **Полные запросы конкурентов** (топ-30, vol ≥ 10) + их страницы-доноры трафика | `seo/domain/keywords` (limit 1000, URL-фильтры для крупных), `seo/domain/pages` | 12–15 доменов | $3.30 | $4.00 |
| R3 | **Расширение** по сидам, которых нет в v1 | `seo/keywords/ideas`, `seo/keywords/related` + Google Autocomplete (бесплатно) | ~60 сидов | $3.00 | $3.50 |
| R4 | **Замер** всего нового + бэклог v1 (2 204) + clickstream по фразам W1 | `seo/keywords/overview` (батчи по 700; clickstream ×2 — только ~100 голов) | ~5 000 кандидатов | $1.30 | $1.80 |
| R5 | **SERP-кластеризация** — топ-10 по каждому целевому запросу vol ≥ 50 + метрики доменов топа | `serp/google` depth 10, `seo/domain/traffic` (bulk) | ~600 запросов, ~400 доменов | $6.20 | $7.00 |
| R6 | **Рынки**: англоязычные страны + размер неанглийских рынков для будущей локализации | `seo/keywords/overview` по странам, `seo/keywords/ideas` es/pt/id/fr | 7 стран × 300 запросов; 4 языка | $1.40 | $1.80 |
| R7 | **AI-поиск**: кого цитирует Google AI Mode по главным запросам | `serp/google-ai-mode` | 20 запросов | $0.20 | $0.30 |
| R8 | **Сезонность** → контент-календарь (Hangul Day 9 окт., сезоны K-Drama) | `seo/trends` | 10 голов | $0.20 | $0.30 |
| R9 | **ASO-подсказки** App Store / Google Play для листингов приложения | бесплатные suggest-эндпоинты магазинов | ~40 сидов | $0 | — |
| | **Итого** | | | **≈ $16** | **$19.30** |

Рекомендуемый бюджет — **$20** (запас на повторы после 503 и уточняющие вызовы).
Минимальный вариант — **≈ $8**: R1, R2 только по 6 доменам, R4, R5 только для W1.

## Детали

### R1 — карта конкурентов
- Вход: главные и вторичные запросы W1–W2 из `pages.csv`.
- `competitors/serp` → домены, которые чаще всего встречаются в топе по нашему набору (это и есть реальные конкуренты, а не те, кого мы знаем).
- `competitors/domain` для letslearnhangul.com, lingrow.io, 90daykorean.com — проверка, кого мы пропустили.
- Выход: `competitors.csv` (домен, пересечение, тип: нишевый / контентный гигант / UGC / магазин).
- **Точка проверки:** показываю список, вместе выбираем 12–15 доменов для R2.

### R2 — запросы конкурентов
- Нишевые сайты (letslearnhangul, zkorean, flexiclasses, languagebird, koreanexplorer, quizlingua…) — целиком.
- Крупные (90daykorean, koreanclass101, migaku, howtostudykorean, talktomeinkorean, lingrow, ling-app) — только по URL-маскам `%alphabet%`, `%hangul%`, `%phrase%`, `%how-to-say%`, `%in-korean%`, `%words%`, `%pronunciation%`.
- `domain/pages` для 5 сильнейших — какие типы страниц у них приносят трафик (подтверждение шаблонов).
- Выход: gap-список — запросы, где конкуренты есть, а у нас нет страницы.

### R3 — расширение (то, чего нет в v1)
- **Буквы:** названия всех 40 jamo (giyeok, nieun, rieul…) + «ㄱ / ㅓ pronunciation» — проверить, есть ли спрос на страницу каждой буквы (как letter pages на hebrewedu).
- **Фразы:** related по каждой из 20 фраз W1 и 8 пакам Phrase X-Ray; остальные фразы из 240 приложения — после выгрузки контента.
- **K-Pop / K-Drama лексика:** aegyo, sunbae, maknae, hwaiting, chingu, saranghae…
- **Слова:** korean numbers, days, colors, family, food — проверка рыночных дыр (части нет в приложении — отметим отдельно).
- **App-intent с iOS:** `korean alphabet app iphone`, `learn hangul app ios`, `offline korean app`.
- Autocomplete — следующий слой для новых голов (бесплатно).

### R4 — замер
- overview для всего нового + бэклог v1. Платятся только строки с данными.
- `include_clickstream` для ~100 голов фраз W1: clickstream-частотность показывает реальные клики, а не рекламную оценку — прямой ответ на риск «виджет Google Translate съедает клики».

### R5 — SERP-кластеризация (главный шаг)
- Топ-10 по каждому целевому запросу с частотностью ≥ 50 (~600).
- Кластеризация по пересечению URL: ≥ 3 общих URL в топ-10 → одна страница. Сравнение с правилами v1 → список слияний/разделений страниц.
- Из той же выдачи бесплатно: PAA-вопросы (→ FAQ-блоки страниц), SERP-фичи (Translate, AI Overview, видео, картинки → оценка CTR), URL конкурентов для разбора в ТЗ.
- `domain/traffic` по всем доменам топа → «слабость топа»: сколько мест занимают сайты с трафиком ниже порога → приоритет страниц.

### R6 — рынки
- overview главных 300 запросов: GB, CA, AU, PH, IN, ID, SG (англ.) → решение «только US» или «глобальный английский» (влияет на примеры, валюту, hreflang).
- Размер неанглийских рынков: `alfabeto coreano` (es, pt), `huruf korea` (id), `alphabet coréen` (fr) — очередность локализации.

## Что получится на выходе

1. `semantic-core-v2.csv` — ядро с clickstream, SERP-фичами, слабостью топа, рынками.
2. `clusters-v2.json` — кластеры по выдаче + дифф с v1.
3. `pages-v2.csv` — обновлённая структура (слияния/разделения, новые страницы букв/слов, порядок по ROI).
4. `briefs/` — данные для ТЗ на каждую страницу W1: главный/вторичные запросы, PAA, 3 URL конкурентов для разбора, SERP-фичи.
5. Решение по рынкам и порядку локализации, контент-календарь.

## Правила прогона

- Каждый шаг — отдельный скрипт `scripts/seo/1x-*.mjs` с жёстким капом; шаг, который может превысить кап, не отправляется.
- После каждого шага — сверка баланса и короткий отчёт; R2 и R5 стартуют только после точки проверки.
- Падения 503 — повтор с backoff; неудачные запросы не оплачиваются.

## Итоги прогона v2 (2026-10-27)

- **Clickstream (реальные поиски) против рекламной оценки:** фразы 25–65% (`hello in korean` 20.7K, `sorry` 65%), алфавит 42% (`korean alphabet` 25.7K), `hangul` 66%. App-intent — 0–3% (`learn korean app` 0, `korean learning apps` 203): главная страница трафика не даст, установки — через контент.
- **SERP:** AI Overview в 346 из 351 кластера, PAA в 290, видео в 200. Органики в топ-10 остаётся ~8 мест; медиана «слабых» мест (UGC/форумы/малые сайты) — 7 из ~8, у 274 кластеров ≥ 6. Ниша пробиваемая.
- **AI Overview цитирует** YouTube, Reddit, Wikipedia, Instagram, Quora, TikTok, затем preply, koreanclass101, migaku, noun.town — видео и UGC важны для AI-видимости.
- **Новые кластеры** (нет в v1): nicknames 54K, aegyo 49.5K, swear words 46K, mom/dad/grandma/aunt (семья) 27.9K/19.8K/16.2K/8.8K, korean keyboard layout 27K, family names 27K, «you» 26K, dog/cat, numbers 1–10 6.7K, food names 7.2K, honorifics 7.2K, days of the week 5.8K, weather 5.8K, Korean New Year 6.5K.
- **Рынки:** India = 43% от US, Philippines 24%, UK 9% → писать на глобальном английском. Локализация: **pt-BR первой** (`alfabeto coreano` 22–27K), затем fr (8.1K), id (6.6K), es-MX (5.4K).
- **Не вошло (бюджет):** SERP для групп < 1 000/мес (2 689 групп) — привязываются к кластерам по правилам при сборке `pages-v2.csv`; `domain/pages` для 3 крупных конкурентов.
