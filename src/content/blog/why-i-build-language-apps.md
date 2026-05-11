---
title: "Why I Build Language Learning Apps"
description: "From learning Estonian as a foreigner in Tallinn to shipping three language apps on Google Play — here's what I've learned about EdTech, spaced repetition, and building tools you actually need."
date: 2026-04-11
tags: ["edtech", "flutter", "language-learning"]
draft: false
---

Building language learning apps was never part of a grand plan. It started with a simple problem: I moved to Tallinn and needed to learn Estonian.

Estonian is notoriously difficult. Fourteen grammatical cases, vowel harmony, and verb conjugations that change depending on the person, number, and context. The apps available were either too basic or too generic — built for popular languages, adapted poorly for Estonian.

So I built my own.

## Starting with the problem, not the stack

The first version of what became **Estonian Verbs** was a Python script that generated practice sentences. No UI, no spaced repetition, just a terminal spitting out phrases like "ma olen, sa oled, ta on..." until they stuck.

That script taught me more Estonian than two months of Duolingo. Not because it was better engineered, but because it forced active recall instead of passive recognition.

## What spaced repetition actually means in practice

Everyone says "spaced repetition" like it's magic. The SM-2 algorithm is well documented, but implementing it in a way that feels natural — not mechanical — is the real challenge.

The key insight: the algorithm should be invisible. Users shouldn't think "this card is due today." They should just feel like the app knows what they need.

## What's next

Three apps on Play Store, one web app, one admin dashboard. Each one taught me something the previous one didn't.

Next up: expanding the dictionary in Estonian Verbs to 1000+ words using the Ekilex API, and potentially a Hebrew verb conjugation trainer if the traction is there.

Building in public means shipping imperfect things. That's fine.
