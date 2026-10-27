# Листинг Google Play — черновик v2 (Hangul Hero)

Основа — R9 (`aso-suggestions.csv`, `aso-serp.csv`), снято 2026-10-27, Google Play US/en.
Текущий листинг взят со страницы `com.vicsothemes.hangulhero`.

## Что меняем и почему

| Термин | Сейчас на Play | Есть в приложении | Действие |
|---|---|---|---|
| learn korean alphabet hangul | **#1** | да | сохранить (название) |
| korean alphabet / learn korean alphabet | #5 | да | сохранить (название) |
| korean alphabet writing hangul / korean writing | #4 / #8 | частично (буквы, без прописей) | не трогать, не обещать прописи |
| hangul / learn hangul / hangul practice / hangul flashcards | #10–13 | да | усилить: краткое + полное |
| korean phrases / learn korean phrases | вне топ-30 | **да, Phrase X-Ray** | главный рост: краткое + заголовок секции |
| korean games / learn korean game | вне топ-30 | да (квизы, игры на узнавание) | заголовок секции |
| learn korean offline | вне топ-30 | да | краткое + заголовок секции |
| korean pronunciation | вне топ-30 | да (нативное аудио) | заголовок секции |
| korean words / korean vocabulary | вне топ-30 | частично (слова внутри фраз) | упоминать честно, без «словаря» |

**Название не меняем.** Google Play сильнее всего ранжирует по названию, а нынешнее уже держит #1–5 по алфавиту. Замена на «Learn Korean: Hangul & Phrases» добавит `learn korean` (там Duolingo и крупные) и `phrases`, но уберёт `alphabet` — риск потерять единственные сильные позиции. Если пробовать — только после того, как краткое и полное описание отработают 4–6 недель, и с контролем позиций.

Ограничения правил Google Play учтены: без «best / #1 / free / top» в названии, без отзывов и числа загрузок в тексте, без повторения ключей подряд, без обещаний функций, которых нет.

## Название (30)

```
Learn Korean Alphabet: Hangul
```
29 символов — без изменений.

## Краткое описание (80)

Сейчас (77): `Learn Hangul: from the Korean alphabet to 240 real Korean phrases and quizzes`

| # | Текст | Символов | Акцент |
|---|---|---:|---|
| **A** (рекоменд.) | `Korean alphabet, 240 phrases & quiz games with native audio. Works offline` | 74 | фразы + игры + офлайн + аудио, все четыре дыры |
| B | `Read Hangul, then speak real Korean phrases. Native audio, games, offline mode` | 78 | путь «прочитать → заговорить» |
| C | `Learn Korean from Hangul to 240 real phrases: native audio, games, offline` | 74 | добавляет `learn korean` |

Краткое описание можно A/B-тестировать в Play Console → Store listing experiments (текущий текст как контроль, A и B как варианты, 50/50, метрика — first-time installers).

## Полное описание (4000)

Ключевые изменения против текущего: заголовки секций переписаны под термины с нулевой видимостью (phrases, games, pronunciation, offline), добавлены «Hangul flashcards» (это и есть карточки букв) и «Korean words», первый абзац называет все функции. Факты — только из текущего описания.

```
Learn the Korean alphabet (Hangul) step by step, then read and speak real Korean phrases. Hangul Hero is a Korean learning app for complete beginners, with clear Hangul lessons, native audio, quizzes and games, 240 everyday Korean phrases, and offline learning.

Start with the letters and sounds that make up Hangul. Practice until reading feels easy, review what you have learned, and move on to the Korean words and phrases you hear in K-Dramas, K-Pop songs, and everyday life.

🎓 LEARN THE KOREAN ALPHABET

✅ All 19 consonants — basic, aspirated, and double consonants
✅ All 21 vowels — 10 basic and 11 combined vowels
✅ Hangul flashcards: visual letter cards with memorable examples
✅ Native Korean pronunciation for every letter and word

🗣️ PHRASE X-RAY: LEARN KOREAN PHRASES

240 everyday Korean phrases in 8 packs: K-Drama Hits, Food & Café, Getting Around, Shopping & Money, Feelings & Reactions, Love & Dating, Health & Emergencies, and At Work.

✅ Listen to every phrase at normal or slow speed
✅ See how each phrase really sounds — not just how it is written
✅ Every sound change explained in plain English, with romanization
✅ Each phrase broken into parts with literal meanings
✅ Save your favorite phrases to your own collection
✅ K-Drama Hits is free — and you can try phrases from every pack

🎮 KOREAN QUIZZES AND GAMES

Practice Hangul with interactive Korean alphabet quizzes and letter recognition games. Track your progress, earn gems and badges, and review letters until they become easy to remember.

🔎 READ REAL KOREAN WITH SORI

Paste Korean text from K-Pop lyrics, K-Drama subtitles, or everyday messages. Sori breaks each syllable block into its individual jamo, so you can see how Korean letters combine and practice reading Hangul step by step.

🔊 KOREAN PRONUNCIATION WITH NATIVE AUDIO

Listen to native speakers, connect each Korean letter with its sound, and build confident pronunciation from your very first lesson.

✈️ LEARN KOREAN OFFLINE

Core Hangul lessons, phrases, and practice activities work without an internet connection. Learn at home, on a flight, or whenever you have a few free minutes.

PERFECT FOR:

💡 Complete beginners learning Korean from scratch
💡 K-Pop and K-Drama fans who want to read and understand Korean
💡 Students looking for Korean alphabet practice
💡 Travelers who want useful Korean phrases before a trip to South Korea
💡 Anyone preparing to live or work in South Korea
💡 Anyone who wants a simple offline Hangul app

Learn Hangul, practice Korean pronunciation, and take your first step toward reading and speaking Korean today.
```

## После публикации

1. Записать дату изменения; через 2 и 4 недели перезапустить `node scripts/seo/19-aso-suggest.mjs` с очищенным кэшем `responses/aso/play-search-*` — сравнить позиции по `aso-serp.csv`.
2. Play Console → Statistics → acquisition by search term: смотреть `korean phrases`, `korean games`, `learn korean offline`.
3. Скриншоты: сейчас ранжирование не учитывает, но конверсия — да. Второй скриншот — Phrase X-Ray с подписью «240 real Korean phrases, explained», третий — квиз.
