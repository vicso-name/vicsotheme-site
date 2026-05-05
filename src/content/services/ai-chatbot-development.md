---
title: "AI Chatbot Development"
headline: "AI Chatbots That\nActually Convert"
description: "Conversational AI assistants powered by Claude or GPT — for customer support, lead qualification, and internal tools. Built with real sales psychology, not just API wrappers."
category: "AI & Automation"
accent: "#7c3aed"
icon: "🤖"
badge: "Claude · OpenAI"
stack: ["Claude API", "OpenAI API", "Cloudflare Workers", "Python", "Django", "Next.js"]
timeline: "2–5 weeks"
priceRange: "$2,000–$8,000"
deliverables:
  - icon: "💬"
    title: "Conversational flow"
    desc: "Structured conversation design — qualification questions, quick replies, and natural fallbacks."
  - icon: "🎯"
    title: "Lead capture"
    desc: "Email capture integrated with your CRM or Formspree. Full conversation transcript delivered with each lead."
  - icon: "🔐"
    title: "Secure API proxy"
    desc: "Your API key never exposed in the browser. Cloudflare Workers proxy keeps costs and keys protected."
  - icon: "📊"
    title: "System prompt engineering"
    desc: "Carefully crafted system prompt that knows your business, services, pricing, and tone of voice."
process:
  - step: 1
    title: "Conversation design"
    desc: "Map the qualification flow — what to ask, in what order, and how to handle edge cases without frustrating users."
  - step: 2
    title: "System prompt engineering"
    desc: "Detailed prompt that gives the AI full context about your business. This is where most chatbots fail — I get it right."
  - step: 3
    title: "Secure integration"
    desc: "Cloudflare Workers proxy so API keys stay server-side. Frontend widget built for your site's design language."
  - step: 4
    title: "Lead pipeline setup"
    desc: "Email notifications, CRM integration, and conversation logging so no lead falls through the cracks."
faq:
  - q: "Claude or GPT — which is better for a sales chatbot?"
    a: "Claude follows complex instructions more reliably, which matters for staying on-topic in sales flows. GPT-4 has a larger plugin ecosystem. I'll recommend based on your specific requirements and budget."
  - q: "How do I keep my API key secure?"
    a: "Never put it in frontend code. I use Cloudflare Workers as a proxy — requests go from browser to Worker to API. Your key lives only in Cloudflare's encrypted environment variables."
  - q: "Can the chatbot book meetings or send emails?"
    a: "Yes — with tool use / function calling, the AI can trigger actions like creating Calendly links, sending form submissions, or calling your CRM API."
  - q: "What's the cost per conversation?"
    a: "Claude Sonnet costs roughly $0.003–0.015 per conversation depending on length. For most sites, monthly API costs stay under $20–50 at realistic traffic volumes."
  - q: "Can I see an example of what you've built?"
    a: "Yes — the chatbot on this site is built exactly this way. Click the green button in the bottom right corner and try it."
caseStudy:
  title: "VicsoThemes Sales Bot"
  desc: "Qualification chatbot on this site — built with Claude API, Cloudflare Workers proxy for security, quick reply buttons for guided flow, email capture via Formspree, and full conversation logging."
  result: "Claude API · Cloudflare proxy · Lead capture pipeline"
draft: false
---

Most AI chatbots are LLM wrappers with no conversation design. They answer questions randomly, go off-topic, and never capture a lead.

A good sales chatbot is a structured conversation — qualification questions, handled objections, and a clear path to contact. The AI makes it feel natural. The design makes it convert.
