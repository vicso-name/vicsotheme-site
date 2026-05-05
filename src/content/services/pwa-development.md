---
title: "PWA Development"
headline: "Installable Web Apps\nWithout the App Store"
description: "Progressive Web Apps that work offline, install on any device, and feel native — without Play Store fees, review times, or native development costs."
category: "Web & Frontend"
accent: "#2563eb"
icon: "⚡"
badge: "Offline · Installable"
stack: ["Vanilla JS", "Astro", "Next.js", "Service Workers", "Web App Manifest", "IndexedDB"]
timeline: "2–5 weeks"
priceRange: "$2,000–$7,000"
deliverables:
  - icon: "📥"
    title: "Installable app"
    desc: "Add-to-homescreen prompt, app manifest, and icons for Android and iOS. Feels like a native app."
  - icon: "📡"
    title: "Offline support"
    desc: "Service worker caching strategy — content available even without internet connection."
  - icon: "🔔"
    title: "Push notifications"
    desc: "Web push notifications for re-engagement — streak reminders, new content alerts, or custom triggers."
  - icon: "⚡"
    title: "Native-like performance"
    desc: "App shell architecture, lazy loading, and smooth animations — no janky web feel."
process:
  - step: 1
    title: "App shell design"
    desc: "Define what loads instantly vs. what loads on demand. Core UX must work offline."
  - step: 2
    title: "Service worker strategy"
    desc: "Cache-first or network-first per resource type. Offline fallbacks for all critical paths."
  - step: 3
    title: "Manifest & install flow"
    desc: "Web app manifest, icons for all sizes, install prompt logic and timing."
  - step: 4
    title: "Testing & deploy"
    desc: "Lighthouse PWA audit, cross-device testing, GitHub Pages or custom domain deployment."
faq:
  - q: "Is a PWA better than a native app?"
    a: "Depends on your use case. PWAs are cheaper to build, update instantly, and require no app store. Native apps have better device integration and discoverability. For content/learning tools, PWAs often win."
  - q: "Do PWAs work on iOS?"
    a: "Yes, with limitations. iOS supports service workers and add-to-homescreen. Push notifications are supported from iOS 16.4+. I'll be honest about what works and what doesn't on each platform."
  - q: "Can a PWA access device features like camera or GPS?"
    a: "Yes — modern PWAs can access camera, microphone, geolocation, and sensors via Web APIs. More limited than native but sufficient for most use cases."
  - q: "How do updates work?"
    a: "PWAs update automatically when the user is online — no app store approval needed. Users always get the latest version."
  - q: "Can you convert my existing web app to a PWA?"
    a: "Usually yes — adding a service worker and manifest to an existing site is straightforward if the architecture allows it."
caseStudy:
  title: "Estonian Learning PWA Suite"
  desc: "4 PWAs built with vanilla JS on GitHub Pages: number drills, pronoun trainer, countries/nationalities, and Estonian Verbs. SM-2 spaced repetition, Google TTS audio, offline support, and gamification."
  link: "https://eestisoned.com"
  result: "4 PWAs · Zero hosting cost · Full offline support"
draft: false
---

The best app is the one your users actually use. PWAs remove the friction of app store downloads while delivering an experience that feels native.

I've built a suite of Estonian learning PWAs that run fully offline, generate audio via Google TTS, and use SM-2 spaced repetition — all in vanilla JS with zero frameworks.
