# Семантическое ядро: маркетинговый сайт Hangul Hero

Дата: 2026-10-27. Рынок: Google US / English.
Цель сайта: установки [Hangul Hero](https://play.google.com/store/apps/details?id=com.vicsothemes.hangulhero) (10K+ загрузок).

## Метод

1. **База** — 270 корейских запросов фазы 1 (запросы конкурентов letslearnhangul.com, lingrow.io, hangl.app + SERP-проверка, см. `../README.md`).
2. **Сиды по функциям приложения** — алфавит (19 согласных / 21 гласная), произношение, Phrase X-Ray (8 паков), квизы, Sori (разбор текста на jamo), запросы «приложение».
3. **Google Autocomplete** — 402 запроса (бесплатно), включая `seed a…z` для 12 главных сидов → 3 004 новых кандидата после фильтра мусора.
4. **Шаблоны фраз** — `X in korean` / `how to say X in korean` для 48 фраз из паков Phrase X-Ray.
5. **Замер** — 800 самых популярных кандидатов (по позиции в автокомплите) через YepAPI overview: 573 с частотностью > 0.
6. **Кластеризация** — `scripts/seo/07-hangulhero-cluster.mjs`: раздел сайта → кластер (= страница) → тип страницы → функция приложения → роль в установках.

Стоимость этапа: $0.24 (баланс YepAPI $0.32 → $0.08). Итог по всему исследованию — $1.97 из капа $2.00.

## Файлы

| Файл | Что внутри |
|---|---|
| `semantic-core.csv` | **843 запроса**: keyword, volume, kd, intent, cpc, section, cluster, page_type, app_feature, pack, role, source |
| `07-clusters.json` | 81 кластер со сводкой (голова, частотность головы, KD max) |
| `backlog-unmeasured.txt` | 2 204 реальных запроса из автокомплита без частотности — бэклог для доп. замера (~$0.50–0.70) |
| `06-candidates.json` | сырые метрики (тренды 12 мес, CPC, SERP-фичи) |

> Частотности групп близких вариантов в Google Ads совпадают (5 вариантов «hello in korean» по 49 500) — оценивать кластер по голове, не по сумме.

## Главное

| Роль | Кластеров | Запросов | Сумма голов/мес | Что это |
|---|---:|---:|---:|---|
| **Фразы (programmatic)** | 50 | 132 | ~240 000 | `hello in korean` 49.5K, `thank you in korean` 49.5K, `i love you in korean` 18.1K, `oppa in korean` 8.1K… KD ≈ 0 |
| **Совпадение с функцией** | 21 | 433 | ~100 000 | алфавит, гласные/согласные, чтение, произношение, письмо, квизы, хабы фраз |
| **Прямой интент «приложение»** | 1 | 53 | ~9 900 | `app to learn korean language` 9.9K, `learn korean app` 8.1K, `best app to learn korean` 2.4K |
| Инструменты | 4 | 107 | ~34 000 | клавиатура 27K, конвертер имён, словарь, романизация |
| Общий «learn korean» | 2 | 56 | ~112 000 | `korean language how to learn` 110K — KD 50, конкуренция высокая |
| Отложено/исключено | 3 | 62 | — | TOPIK (приложение не покрывает), переводчики, еда, бренды |

**Самое ценное — фразы.** Это 1-в-1 контент Phrase X-Ray: каждая фраза — страница с хангылем, аудио обычным/медленным темпом, «рентгеном» звучания (как пишется vs как звучит), формальной/неформальной формой и CTA «весь пак K-Drama Hits — в приложении». Таких страниц у конкурентов почти нет — в нише в основном списки и блоги.

## Предлагаемая структура сайта

| URL | Кластер (голова, vol/мес) | Тип | Функция приложения |
|---|---|---|---|
| `/` | app/korean-learning-app (`app to learn korean language` 9.9K, `learn korean app` 8.1K, `korean alphabet app`) | лендинг | установка |
| `/korean-alphabet/` | hangul-alphabet (`korean alphabet` / `hangul alphabet` 60.5K) | хаб | уроки алфавита |
| `/korean-alphabet/chart/` | korean-alphabet-chart (`korean alphabet chart` 5.4K, `a to z` 2.9K) | интерактивный чарт с аудио | уроки + аудио |
| `/korean-alphabet/vowels/` | korean-vowels (3.6K) | статья | 21 гласная |
| `/korean-alphabet/consonants/` | korean-consonants (2.4K) + consonants-and-vowels (1.3K) | статья | 19 согласных |
| `/korean-alphabet/batchim/` | batchim (590) | статья | звуковые изменения |
| `/korean-alphabet/syllable-blocks/` | syllable-blocks (140) | статья | Sori |
| `/korean-alphabet/order/` | order-names (480) | статья | — |
| `/korean-alphabet/history/` | hangul-history (`hangul day` 1.3K) | статья | — |
| `/how-to-read-korean/` | how-to-read-korean (1.3K) | гайд | Sori |
| `/korean-pronunciation/` | korean-pronunciation (`hangul pronunciation` 1.9K) | гайд | аудио + Phrase X-Ray |
| `/hangul-writing-practice/` | hangul-writing (`korean handwriting practice` 1.9K) | воркшиты PDF | — |
| `/hangul-quiz/` | hangul-quiz-games (480) | веб-квиз (демо приложения) | квизы |
| `/tools/hangul-reader/` | romanization (`korean romanization` 1K) | веб-версия Sori | Sori |
| `/phrases/` | korean-phrases (3.6K), `basic korean phrases` 2.9K | хаб | Phrase X-Ray |
| `/phrases/{pack}/` | kdrama, love-dating, slang (1.3K), travel, food, words (`korean words` 12.1K) | хабы паков | паки |
| `/phrases/{phrase}/` | 50 страниц: hello, thank-you, i-love-you, goodbye, happy-birthday, yes, no, oppa, sorry… | programmatic | Phrase X-Ray |
| `/best-apps-to-learn-korean/` | `best app to learn korean` 2.4K | честное сравнение | установка |

Отложить: `korean keyboard` (27K) и конвертер имён — трафик большой, но к установке почти не ведёт; браться после основного ядра. `learn korean` (110K) — один пиллар позже, когда у домена появится вес.

## Что не проверено (нет бюджета)

- **Выдача по фразам не снималась.** Для `hello in korean` / `thank you in korean` в топе часто стоит виджет Google Translate или featured snippet — CTR может быть заметно ниже частотности. Перед запуском 50 programmatic-страниц стоит снять топ-10 по 20–30 фразам (~$0.30) или посмотреть вручную.
- Выдача по корейскому алфавиту проверена в фазе 1 (пробиваемая: letslearnhangul.com — одностраничник на #7 по `korean alphabet`).
- Только US. Корейский учат массово на Филиппинах, в Индии, Индонезии — глобальный англоязычный спрос в разы больше.
- KD провайдера на массовых запросах занижен; ориентир — фактическая выдача.
