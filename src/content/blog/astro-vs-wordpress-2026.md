---
title: "Astro and Next.js vs WordPress: Why We're Changing the Stack in 2026"
description: "WordPress powers 43% of the web and I still build client sites on it. Here's why I choose Astro or Next.js for every new project — and when WordPress still makes sense."
date: 2026-05-06
tags: ["web app development", "wordpress", "astro"]
draft: false
---

I build WordPress sites for clients. I also built my own portfolio on Astro and wouldn't touch WordPress for a new personal project. These two facts coexist without contradiction — and understanding why tells you more about web development in 2026 than any "X is dead" take.

## Key takeaways

- WordPress is the world's most popular CMS and it's genuinely painful to scale beyond a few hundred pages
- Astro and Next.js aren't replacements for WordPress — they solve different problems for different clients
- Static sites load faster, cost less to host, and have a fundamentally smaller attack surface
- The real argument isn't about technology — it's about workflow and who manages the content
- Switching stacks without switching your content workflow solves nothing

---

## The WordPress reality check

WordPress runs 43% of the internet. That number is both impressive and slightly terrifying. It became dominant because it lowered the barrier for non-technical people to publish content — and it succeeded completely at that goal.

The problem is that the web it was built for no longer exists.

A WordPress site out of the box loads in 4–8 seconds. With serious optimisation — caching plugins, CDN, image compression, query optimisation, custom code to override theme bloat — you can get to 2–3 seconds. With heroic effort and a lean custom theme, sometimes under 2. Google considers anything over 2.5 seconds a performance problem. The Core Web Vitals bar keeps rising.

You're fighting the architecture the whole way.

I've done this work on client sites — casino review sites, directories, content-heavy portfolios. I know what it takes. You spend days on performance work that a statically generated site gets for free on day one.

## What static generation actually means

"Static" sounds like 1999 — flat HTML files, no updates, frozen content. That's not what Astro or Next.js static export does.

These frameworks pull data at build time from wherever it lives: a headless CMS, a database, a REST API, local markdown files, a Google Sheet. They process that data, run your components, and output pure HTML, CSS, and JavaScript. That output gets deployed to a CDN with points of presence worldwide.

The result: a request to your site hits a CDN node a few milliseconds from the user. No PHP execution, no database query, no plugin stack. The file is just there.

This site — vicsotheme.com — runs on Astro deployed to GitHub Pages. Lighthouse score above 98. Zero hosting costs. No server to maintain or secure.

## The security argument nobody talks about enough

WordPress sites get hacked constantly. Not because WordPress is badly written — because a PHP application with database access is an inherently larger attack surface than a folder of HTML files.

There's nothing to inject on a static site. No admin panel exposed to the internet. No database connection to exploit. No plugin with an unpatched vulnerability. The worst thing an attacker can do is overwhelm your CDN, and CDNs are built to absorb that.

For clients handling sensitive data or operating in industries with compliance requirements, this matters more than load time.

## When the workflow breaks down

The real problem with WordPress at scale isn't load time. It's the content management loop.

To update one article in a typical WordPress setup: log into admin, navigate the content tree, find the article, open the editor, make the change, save, clear the cache. If a URL changed anywhere, manually hunt down every page that linked to it and fix those too.

Now do that for 500 pages. Or coordinate it across a team of five people. Or try to automate it.

This is the workflow that static generators break completely. Content lives in markdown files or a headless CMS. Changes go through git. Deployments are automated. Internal links can be validated at build time. A broken link fails the build before it reaches production.

## Where Next.js fits

Astro is optimal for sites where most content is static: marketing sites, portfolios, blogs, documentation, landing pages. It ships zero JavaScript by default — components are rendered on the server and the HTML is what users get.

Next.js is the right call when you need real-time data: user accounts, live inventory, personalised content, anything that changes faster than you'd want to trigger a rebuild. Next.js can statically generate pages that don't need real-time data and server-render the ones that do, in the same application.

For a product with a logged-in user experience, Astro isn't the answer. For a content-heavy site that updates a few times a day, Astro is faster, cheaper, and easier to maintain than Next.js.

## When WordPress still makes sense

I'm not going to pretend this is a clean story where WordPress is simply wrong. Here's where it still wins:

**Non-technical content editors.** The WordPress admin is familiar. A client who needs to update their own content three times a week, without a developer, without touching a terminal, without understanding git — WordPress gives them that. A headless CMS like Sanity or Contentful can replace this, but it adds cost and onboarding.

**Existing WordPress ecosystem.** A client with 5 years of WordPress content, established plugins, developer muscle memory, and no pressing performance problem doesn't need to migrate. The disruption cost exceeds the benefit.

**Quick turnarounds on familiar projects.** I can spin up a WordPress site with ACF blocks, a custom theme, and client-managed content faster than I can spec a Astro + headless CMS setup. For some projects, that speed matters more than the architecture.

## The honest comparison

| | WordPress | Astro | Next.js |
|---|---|---|---|
| Load time | 2–8s (optimised) | <1s | 1–3s |
| Hosting cost | $20–200/mo | Free–$20/mo | $20–100/mo |
| Security surface | Large | Minimal | Medium |
| Content editors | Excellent | Needs headless CMS | Needs headless CMS |
| Scale to 10K pages | Painful | Manageable | Manageable |
| Real-time data | Possible (slow) | Limited | Excellent |

## What 2026 actually requires

The comment that stuck with me from a developer discussion on this topic: "WordPress is like a popular grandfather. Respected, everywhere, and increasingly out of place at the table."

That's not quite right either. WordPress isn't out of place — it's just not the default answer anymore. In 2016, the question was "what CMS?" In 2026, the question is "what does this specific project need?"

For a new content site with a developer maintaining it, Astro. For a product with user accounts and live data, Next.js. For a non-technical client who needs to self-manage content on a modest budget, WordPress with a lean theme and serious performance work.

The mistake is treating any of these as a universal answer.

---

If you're deciding between these stacks for a specific project, I can give you a direct recommendation based on your requirements and team. [Get in touch](/contact) or read more about my approach to [web application development](/services/web-app-development) and [WordPress development](/services/wordpress-development).

Related: [Astro vs Next.js: which to choose and when](/blog/astro-vs-nextjs) · [How to build a PWA that actually gets installed](/blog/how-to-build-pwa)