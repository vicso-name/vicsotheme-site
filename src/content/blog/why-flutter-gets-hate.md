---
title: "Why Flutter Gets So Much Hate (And Why It's Wrong)"
description: "Every few months someone publishes a 'Flutter is dying' piece. After building Flutter apps for years, here's what's actually behind the criticism."
date: 2026-04-14
tags: ["mobile app development", "flutter", "cross-platform"]
draft: false
---

Flutter gets buried on a regular schedule. "Flutter failed." "KMP is the Flutter killer." "What's wrong with Flutter?" The content cycle is predictable and, if you've never actually built anything with it, convincing.

I've shipped multiple Flutter apps to Google Play. Here's what the criticism actually looks like up close.

## Key takeaways

- Most Flutter criticism comes from native dev shops that lose business to it, not from technical reality
- The Impeller render engine (Flutter 3+) eliminated the performance problems that existed with Skia
- App size, ecosystem size, and platform support complaints are years out of date
- Flutter apps pass Google Play moderation faster than native — a practical advantage nobody talks about
- The real threat Flutter poses is economic: one developer, two platforms, half the cost

## "Flutter can't do native UI"

Flutter renders everything itself using its own engine rather than calling platform UI components. React Native calls native components through a JavaScript bridge. Flutter skips the bridge entirely and draws its own canvas.

The criticism: when Apple ships a new design system — like Liquid Glass in iOS 26 — Flutter can't use it immediately.

The reality: a community package implementing Liquid Glass appeared within two weeks of the announcement. For 99% of apps, the design system they shipped with is the design system they'll run for years. FatSecret looks like a Material app from 2014 and makes serious money. Platform design purity is not a business requirement for most products.

Flutter's render system is a capability, not a limitation. You can build anything on it.

## "Flutter has performance problems"

This was true. Flutter originally used Skia — a rendering engine built for browsers, also used in Chrome. On complex animations, Skia struggled.

Google replaced it with Impeller, their own rendering engine built specifically for Flutter's architecture. It shipped as the default for iOS in Flutter 3, then Android. The difference is not subtle: animations that dropped below 30fps on Skia run at a locked 60fps on Impeller.

You can still write slow Flutter code. You can also write slow native Android code. The framework isn't the variable.

## "Flutter apps are too large"

A Flutter app with no dependencies starts around 15MB because it bundles the render engine. A native Android equivalent starts around 4MB.

Current bank apps routinely exceed 500MB. Nobody has declined to install an app because it was 15 instead of 4 megabytes. This argument made marginal sense in 2018. It doesn't hold up now.

## "The Flutter ecosystem is too small"

Flutter sits at position 26 on GitHub by stars. It outranks Go, Next.js, React Native, Electron, Kubernetes, and TypeScript. Flutter conferences run on multiple continents. In India and China, Flutter is the dominant mobile framework.

The "small ecosystem" argument is roughly four years out of date.

## "Big companies don't use Flutter"

Google uses Flutter in over 30 of their own products. Yandex uses it. Alibaba uses it. The companies that don't use it are mid-sized businesses that already have a working native codebase they'd have to rewrite — a legitimate business reason that has nothing to do with Flutter's technical merit.

## "Google will shut it down"

Google has shut down projects before. Flutter is different: it's embedded in Google's own production infrastructure. You don't casually deprecate something 30 of your internal products depend on.

And even in the unlikely scenario where Google walked away: Flutter has the community size and commercial investment to survive independently, the same way Java outlived Sun Microsystems.

## One thing I've noticed that nobody talks about

Flutter apps tend to move through Google Play's review queue faster than equivalent native apps.

I can't give you a hard number — this is pattern recognition across multiple Play Store submissions, not a controlled experiment. My hypothesis: the Play Store review system may have better tooling for Flutter's predictable binary structure. Or it might just be variance in the review queue.

Either way, faster moderation means faster iteration and faster revenue. For an indie developer or early-stage startup, that matters.

## The actual reason Flutter gets hate

A native Android and iOS shop charges roughly twice what a Flutter developer charges for the same functional result. A business that understands this has no reason to pay the premium.

Native dev agencies lose clients to Flutter. Native developers who've spent years on Kotlin and Swift don't want to start over. These are understandable incentives — they're just not technical arguments.

When you read "Flutter is dying," ask who published it and what they sell.

---

If you're deciding between Flutter and native for your next project, I'm happy to give you a direct answer based on your specific requirements. [Get in touch](/contact) or read more about how I approach [mobile app development](/services/mobile-app-development).