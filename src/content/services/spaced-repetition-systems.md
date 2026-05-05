---
title: "Spaced Repetition Systems"
headline: "Memory Systems That\nActually Work"
description: "SM-2 and custom spaced repetition algorithms with adaptive scheduling, performance analytics, and streak mechanics. The science of memory, implemented correctly."
category: "EdTech & Learning Products"
accent: "#d97706"
icon: "🔁"
badge: "SM-2 · Adaptive"
stack: ["Flutter", "Python", "Django", "PostgreSQL", "Firebase Analytics"]
timeline: "3–8 weeks"
priceRange: "$3,000–$10,000"
deliverables:
  - icon: "🧠"
    title: "SRS algorithm"
    desc: "SM-2 implementation with ease factor, interval calculation, and performance-based scheduling."
  - icon: "📈"
    title: "Progress analytics"
    desc: "Per-item and per-user performance tracking — retention rates, struggle points, and learning velocity."
  - icon: "🎮"
    title: "Gamification layer"
    desc: "Streaks, XP, badges, and level progression that motivate without distracting from learning."
  - icon: "🔄"
    title: "Adaptive difficulty"
    desc: "Easier exercises for new material, harder ones for familiar content — automatic calibration."
process:
  - step: 1
    title: "Algorithm design"
    desc: "Choose SRS model (SM-2, Leitner, custom) based on content type and learning goals. Define interval parameters."
  - step: 2
    title: "Data model"
    desc: "Database schema for items, reviews, intervals, and user performance — designed for efficient scheduling queries."
  - step: 3
    title: "Review engine"
    desc: "Scheduling logic, due item querying, performance recording, and interval recalculation."
  - step: 4
    title: "Analytics & gamification"
    desc: "Progress dashboards, streak calculation, and achievement system integrated with the review flow."
faq:
  - q: "What is SM-2 and why is it better than other methods?"
    a: "SM-2 (SuperMemo 2) schedules reviews based on how well you remembered an item — easy items are shown less, hard items more. It's the algorithm behind Anki and is the most research-validated approach to long-term retention."
  - q: "Can you build a custom algorithm?"
    a: "Yes — SM-2 is the baseline, but I can adapt interval logic for specific content types, session length constraints, or learning goals."
  - q: "How do you handle new vs. learning vs. mastered items?"
    a: "Five-tier classification: New → Learning → Review → Mature → Mastered. Each state has different scheduling rules and exercise difficulty."
  - q: "Can the SRS work across multiple content types?"
    a: "Yes — vocabulary, grammar rules, reading comprehension, and listening exercises can all be managed by one SRS with content-type-specific difficulty parameters."
  - q: "What if a user takes a long break?"
    a: "The system detects long gaps and resets intervals appropriately — avoiding the overwhelming backlog problem that kills Anki usage for most people."
caseStudy:
  title: "Estonian Verbs SRS"
  desc: "Five-tier word status system (NEW → LEARNING → REVIEW → MATURE → MASTERED) with SM-2 scheduling, adaptive exercise difficulty per tier, session-based review queues, and streak/XP gamification."
  result: "5-tier SRS · Adaptive difficulty · Streak mechanics"
draft: false
---

Flashcard apps don't work because of flashcards. They work because of spaced repetition. The algorithm is the product.

Most implementations get the basics right but fail on the details — handling new users, managing comeback after breaks, calibrating difficulty across content types. I've solved these problems in production.
