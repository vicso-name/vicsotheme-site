# Структура сайта Hangul Hero

> **Устарело — см. `site-structure-v2.md`** (СЯ v2, SERP-кластеры, сайт как учебная инфраструктура).

Фаза 2. Основа — `semantic-core.csv` (843 запроса). Карта генерируется скриптом
`scripts/seo/08-hangulhero-url-map.mjs`:

- **`url-map.csv`** — каждый запрос → URL + волна (или `backlog` / `excluded`). Ни один запрос не потерян.
- **`pages.csv`** — 72 страницы: главный запрос, частотность, до 10 вторичных запросов, тип, функция приложения, волна.

## Принципы

1. **Одна страница = один интент.** Запросы с общей выдачей живут на одной странице, у каждого URL свой главный запрос — без каннибализации.
2. **Каждая страница ведёт в конкретную функцию приложения**, а не просто «скачайте»: страница про гласные → уроки гласных, страница фразы → её пак в Phrase X-Ray.
3. **Сначала польза, потом CTA.** Ответ на запрос — в первом экране (хангыль + романизация + аудио), CTA — после того, как человек получил ответ.
4. **Фраза с частотностью ≥ 300/мес получает свою страницу**, остальные — секция на хабе своего пака (без тонких страниц).

## Дерево сайта

Частотность — главного запроса страницы, US/мес. W = волна запуска.

```
/                                   W1  landing     app to learn korean language 9.9K, learn korean app 8.1K
├── korean-alphabet/                W1  hub         korean alphabet / hangul alphabet 60.5K
│   ├── chart/                      W1  tool        korean alphabet chart 5.4K (интерактив + аудио)
│   ├── vowels/                     W1  article     korean vowels 3.6K
│   ├── consonants/                 W1  article     korean consonants 2.4K
│   ├── batchim/                    W2  article     batchim 590
│   ├── syllable-blocks/            W2  article     korean syllable blocks 140
│   └── history/                    W3  article     hangul day 1.3K
├── learn-hangul/                   W1  hub         learn hangul 1.6K (пошаговый курс → приложение)
├── how-to-read-korean/             W1  article     how to read korean 1.3K
├── korean-pronunciation/           W2  article     hangul pronunciation 1.9K
├── hangul-writing-practice/        W2  article     korean handwriting practice 1.9K (PDF-воркшиты)
├── hangul-quiz/                    W2  tool        korean language learning games 480 (демо-квиз)
├── phrases/                        W1  hub         korean phrases 3.6K
│   ├── basic-korean-phrases/       W1  hub         basic korean phrases 2.9K   ← пак «приветствия»
│   ├── k-drama/                    W1  hub         korean phrases kdrama       ← K-Drama Hits
│   ├── love/                       W1  hub         korean words of endearment 1K ← Love & Dating
│   ├── slang/                      W2  hub         korean slang 1.3K
│   ├── feelings/                   W2  hub         ← Feelings & Reactions
│   ├── food/                       W2  hub         korean food words           ← Food & Café
│   ├── travel/                     W2  hub         korean phrases for travel   ← Getting Around
│   ├── work/                       W2  hub         ← At Work
│   └── {phrase}-in-korean/         W1×20 / W2×24   programmatic
│        hello 49.5K · thank-you 49.5K · i-love-you 18.1K · goodbye 9.9K · happy-birthday 9.9K
│        yes / no / oppa 8.1K · sorry / how-are-you / good-morning 6.6K · coffee / noona 5.4K
│        cheers / cute 4.4K · love 3.6K · delicious / fighting 2.9K · excuse-me / unnie 2.4K  … (W2: ещё 24)
├── korean-words/                   W2  hub         korean words 12.1K
├── best-apps-to-learn-korean/      W1  comparison  best app to learn korean 2.4K
├── learn-korean/                   W3  article     korean language how to learn 110K (KD 50 — когда у домена будет вес)
└── tools/
    ├── hangul-reader/              W2  tool        korean romanization 1K (веб-версия Sori)
    ├── korean-keyboard/            backlog         korean keyboard 27.1K
    └── korean-name/                backlog         name in korean generator 2.9K
```

Плюс служебные: `/privacy/`, `/terms/` (нужны и для Google Play), `/about/` (кто делает приложение — E-E-A-T, ссылка на vicsotheme.com).

## Шаблоны страниц

| Тип | Страниц | Структура | CTA | Schema |
|---|---:|---|---|---|
| **landing** (`/`) | 1 | hero с бейджами Google Play / App Store → 5 функций приложения (алфавит, Phrase X-Ray, квизы, Sori, офлайн) со скриншотами → для кого (K-Pop/K-Drama, путешественники, студенты) → ссылки в хабы → FAQ | бейдж Play в hero и в конце | `MobileApplication`, `Organization` |
| **hub** | 12 | короткий ответ на запрос → сетка дочерних страниц/фраз → секции мелких фраз пака | «Весь пак — в Phrase X-Ray» | `BreadcrumbList`, `ItemList` |
| **article** | 9 | ответ в первом экране → разбор с аудио-примерами → упражнение на странице → «дальше» | «Закрепите в уроках Hangul Hero» | `BreadcrumbList`, `Article` |
| **programmatic** (фраза) | 44 | см. ниже | пак фразы в Phrase X-Ray | `BreadcrumbList`, `Article` |
| **tool** | 3 + 2 backlog | инструмент сразу, без вступления → пояснение → связанные статьи | «Полная версия — в приложении» | `BreadcrumbList`, `WebApplication` |
| **comparison** | 1 | таблица приложений с честными плюсами/минусами, Hangul Hero — для какого сценария лучше | бейдж Play | `BreadcrumbList`, `ItemList` |

### Страница фразы — главный источник трафика

Шаблон один на 44 страницы, данные — из контента Phrase X-Ray.

1. **H1:** «How to Say Hello in Korean» + сразу ответ: **안녕하세요** · annyeonghaseyo · ▶ аудио (обычный / медленный темп).
2. **Формы:** таблица формальная / вежливая / неформальная (안녕하십니까 / 안녕하세요 / 안녕) — когда какую говорить.
3. **Phrase X-Ray:** как пишется vs как звучит, разбор по слогам и звуковым изменениям — фирменный блок, которого нет у конкурентов.
4. **В жизни:** 2–3 примера-диалога (K-Drama, кафе, работа — по паку).
5. **Разбор букв:** каждая буква фразы → ссылка на её разбор в `/korean-alphabet/`.
6. **Связанные фразы:** 4–6 из того же пака + хаб пака.
7. **CTA:** «Эта фраза — из пака *K-Drama Hits* (бесплатный). Ещё 29 фраз с аудио — в Hangul Hero».

Риск: по `hello in korean` / `thank you in korean` Google может показывать собственный блок перевода. Перед запуском фраз W1 — снять выдачу по 20 фразам (см. «Ворота» ниже).

## Перелинковка

- **Вертикаль:** хлебные крошки на всех страницах; хаб ↔ дети.
- **Фразы:** → хаб своего пака, 4–6 фраз того же пака, буквы фразы в `/korean-alphabet/`.
- **Алфавит:** `/korean-alphabet/` → chart, vowels, consonants, batchim, syllable-blocks; каждая статья → `/korean-alphabet/chart/` и `/hangul-quiz/`.
- **Воронка обучения:** `/learn-hangul/` → алфавит → `/how-to-read-korean/` → `/phrases/basic-korean-phrases/` — порядок совпадает с уроками в приложении.
- **Вес на главную:** из каждой страницы — ссылка на `/` в шапке и в CTA-блоке; `/best-apps-to-learn-korean/` ← из всех хабов.
- **Сайт ↔ vicsotheme.com:** `/about/` → vicsotheme.com (кейс разработчика), vicsotheme `/apps` → этот сайт.

## Волны запуска

| Волна | Страниц | Запросов | Что входит |
|---|---:|---:|---|
| **W1** | 32 | 374 | главная, хаб алфавита + chart/vowels/consonants, learn-hangul, how-to-read-korean, best-apps, хабы phrases/basic/k-drama/love, **топ-20 фраз** |
| **W2** | 36 | 259 | остальные 24 фразы, хабы паков, korean-words, slang, произношение, батчим, слоги, письмо, квиз, Sori-reader |
| **W3** | 2 | 59 | история хангыля, пиллар `/learn-korean/` |
| backlog | 2 | 89 | корейская клавиатура, конвертер имён; словарь — без страницы |
| excluded | — | 62 | переводчики, TOPIK, еда/бренды |

**Ворота перед W1:** снять топ-10 по 20 фразам W1 (~$0.20 YepAPI или вручную в инкогнито). Если в выдаче доминирует блок Google Translate и словари — в W1 оставить 5–7 фраз с самым «живым» топом, остальные сдвинуть в W2.

## Отслеживание установок

- Ссылки на Google Play — с install referrer, чтобы Play Console показывал установки по страницам:
  `https://play.google.com/store/apps/details?id=com.vicsothemes.hangulhero&referrer=utm_source%3Dhangulhero_site%26utm_medium%3D{page_type}%26utm_campaign%3D{slug}`
- Google Search Console — с первого дня; sitemap.xml генерируется из `pages.csv`.
- Клики по бейджу Play — событие в аналитике (страница + позиция CTA: hero / после ответа / финал).

## Технические требования

- Статический сайт (Astro, как vicsotheme) — скорость и Core Web Vitals из коробки.
- Хангыль размечен `lang="ko"`; шрифт Noto Sans KR с сабсетом — только используемые глифы.
- Аудио — `<audio preload="none">`, файлы из приложения (mp3/ogg, короткие).
- `MobileApplication`: `operatingSystem: "ANDROID, IOS"`, `offers.price: 0`; `aggregateRating` — только реальные данные из Play, обновлять при изменении.
- Title без суффикса бренда; бренд — в `og:site_name` и `WebSite`.

## Решения и открытые вопросы

1. **Домен — `hanguledu.com`** (свободен на 2026-10-27, в Wayback Machine снимков нет — чистая история). Серия с hebrewedu.com: платформу hebrewedu-site (Astro, курс, игры, i18n, SEO-скрипты) можно переиспользовать. Приложение — продукт «Hangul Hero» на сайте бренда HangulEdu.
2. **iOS — будет.** CTA — два бейджа (Google Play + App Store); `MobileApplication.operatingSystem: "ANDROID, IOS"`; до релиза iOS — бейдж Play + «скоро в App Store».
3. **Контент приложения.** Можно ли выгрузить 240 фраз Phrase X-Ray (хангыль, романизация, разбор, аудио) в JSON — это данные для 44 страниц фраз и хабов паков.
4. **Языки.** Старт — только английский; порядок локализации — по итогам R6 плана v2 (`research-plan-v2.md`).
5. **Структура будет уточнена** после SERP-кластеризации (R5 плана v2).
