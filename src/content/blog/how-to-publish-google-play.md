---
title: "How to Publish a Flutter App to Google Play: Complete Guide"
description: "Step-by-step guide to publishing a Flutter app on Google Play — bundle name, keystore setup, release build, and Play Console. From someone who ships Flutter apps to production."
date: 2026-05-06
tags: ["mobile app development", "flutter", "google play", "play store launch"]
draft: false
---

I've published Flutter apps to Google Play under the `com.vicsothemes` package. The process is straightforward once you've done it — but the first time, a few decisions can cost you hours of pain later. This guide covers everything in the order you actually need it.

## Key takeaways

- Set your bundle name before writing a single line of logic — changing it in production is painful
- Your keystore file is irreplaceable — lose it and you lose the ability to update your app forever
- Always use App Bundle (`.aab`), not APK, for Play Store submissions
- Add `key.properties` and your `.jks` file to `.gitignore` before your first commit
- Flutter apps tend to move through Play Store moderation faster than native apps — a practical advantage for iteration speed

---

## Step 1: Get your bundle name right

Before you build anything for release, your bundle name needs to be final. This is the unique identifier for your app across all stores — once it's live, it cannot be changed.

Bundle names follow reverse domain notation: `com.yourcompany.appname`. If your site is `example.com`, your bundle is `com.example.appname`.

No domain? Use your company name, a Telegram handle, anything readable. The format matters, not whether you own the domain.

```bash
flutter create --org com.yourcompany yourapp
```

I learned this the hard way. My early apps shipped with `com.example` as the org — a placeholder I forgot to change. Migrating a published app away from `com.example` means creating a new Play Store listing from scratch: no reviews, no install history, starting from zero. I did this migration for Eesti Verbid. It took an afternoon and wasn't fun.

If you're mid-project and need to fix it now, find every occurrence in `build.gradle` and replace it before you touch the Play Console.

---

## Step 2: Generate your keystore

Every Android app requires a signing key. This key proves the update you're pushing is really from you. Google Play validates the signature on every upload — if your key doesn't match, the upload is rejected.

Generate your keystore with this command:

```bash
keytool -genkey -v \
  -keystore your-app.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

What the parameters mean:
- `-keystore your-app.jks` — output filename, name it after your app
- `-keyalg RSA` — standard encryption algorithm, don't change this
- `-keysize 2048` — key length in bits
- `-validity 10000` — days the key is valid (~27 years, enough)
- `-alias upload` — the key alias you'll reference in config

The tool will ask for a password and some personal details (name, organisation, location). Fill them honestly or leave optional fields blank — it doesn't affect the output.

**Store this file somewhere safe.** If you lose your keystore, you lose the ability to publish updates to your app. Google Play has no recovery mechanism. The app is effectively dead.

---

## Step 3: Create key.properties

Flutter needs to know where your keystore lives and what credentials to use. Create this file at `android/key.properties`:

```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=upload
storeFile=../your-app.jks
```

Then immediately add both files to `.gitignore`:

```
android/key.properties
android/*.jks
```

Do this before your first commit. I know someone who accidentally pushed a credentials file to a public repo — rotating keys and cleaning git history is miserable work. Don't skip the gitignore step.

---

## Step 4: Configure build.gradle

Open `android/app/build.gradle` and add keystore loading before the `android {}` block:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then inside `android {}`, add the signing config and wire it to your release build type:

```groovy
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
    }
}
```

---

## Step 5: Bump your version

In `pubspec.yaml`, set the version before building:

```yaml
version: 1.0.0+1
```

The number before `+` is what users see. The number after `+` is the internal build number — it must increase with every Play Store upload. Play Console will reject builds with the same or lower build number.

For a first release, `1.0.0+1` is fine. For updates, increment accordingly.

---

## Step 6: Build the App Bundle

Play Store requires App Bundle format (`.aab`), not a plain APK. AAB is smaller for users because Google compresses it per-device.

```bash
flutter build appbundle --release
```

The output is at:

```
build/app/outputs/bundle/release/app-release.aab
```

If you want to test locally on a device first:

```bash
flutter build apk --release
```

That generates an APK you can sideload, but don't submit the APK to Play Store — use the AAB.

---

## Step 7: Set up Google Play Console

Go to [play.google.com/console](https://play.google.com/console). The one-time developer registration costs $25.

Create a new app, fill in the name and default language, then work through the setup checklist. The key sections:

**Store listing** — App name, short description (80 chars), full description (4000 chars), screenshots. Use all available space in the description. Screenshots matter: users make the install decision in 3 seconds.

**Content rating** — Complete the questionnaire. It takes 5 minutes. Skipping it blocks your release.

**Privacy policy** — Required if your app collects any data. Even if it doesn't, Play Store will ask. Keep a simple policy page on your site and link it here.

**App access** — If your app requires login, provide test credentials for reviewers. Without this, they can't test it and will likely reject the submission.

**Advertising ID declaration** — State whether you use the advertising ID. If you don't, say so explicitly.

---

## Step 8: Upload and submit

In Play Console, go to **Production → Create new release**. Drag your `.aab` file into the upload area. Play Console validates the signature automatically — if the key doesn't match a previous upload, you'll see an error here.

Add release notes (what's new in this version), then work through the pre-launch report warnings. Not all of them block release, but address the ones that do.

One practical observation from shipping multiple apps: **Flutter apps tend to move through the review queue faster than native apps.** I've noticed this consistently across my Play Store submissions. I can't give you a controlled comparison, but if you're timing a launch, factor in that Flutter reviews often complete within a few hours rather than the standard 1–3 days.

Once approved, you control when the app goes live. Use the **managed publishing** toggle if you want to time the launch — your app won't go public until you press the button, even after review clears.

---

## What gets first-time submissions rejected

Based on my Play Store submissions:

- **Missing privacy policy URL** — even for apps that collect no data
- **Incomplete store listing** — screenshots for wrong device sizes
- **Advertising ID not declared** — takes 2 minutes to fix, costs 3 days if you miss it
- **No test credentials for gated apps** — reviewers can't approve what they can't test
- **Bundle name starting with `com.example`** — Play Store flags this as a development artifact

Go through the checklist before submitting. It's faster than a rejection cycle.

---

Publishing the first app takes a full day. The second one takes an hour. By the third, you have a checklist in your head and move fast.

If you want help taking your Flutter app from code to Play Store, that's exactly what I cover in my [Play Store launch service](/services/play-store-launch). Or start with the [mobile app development](/services/mobile-app-development) page to see what a full build-to-launch engagement looks like.

Related: [Flutter vs Kotlin: what to choose in 2025](/blog/flutter-vs-kotlin-2025) · [How to build an MVP mobile app in 4 weeks](/blog/flutter-mvp-4-weeks)
