import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const serviceCapabilitySchema = z.object({
  title: z.string(),
  desc: z.string(),
});

const servicePrincipleSchema = z.object({
  title: z.string(),
  desc: z.string(),
});

const serviceProcessSchema = z.object({
  step: z.number(),
  title: z.string(),
  desc: z.string(),
});

const serviceFaqSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const serviceCaseStudySchema = z.object({
  title: z.string(),
  desc: z.string(),
  link: z.string().optional(),
  result: z.string().optional(),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    /**
     * Core service page metadata
     */
    title: z.string(),
    headline: z.string(),
    description: z.string(),
    category: z.string(),

    /**
     * New AI-era service model
     */
    stack: z.array(z.string()).optional().default([]),
    capabilities: z.array(serviceCapabilitySchema).optional().default([]),
    principles: z.array(servicePrincipleSchema).optional().default([]),
    process: z.array(serviceProcessSchema).optional().default([]),
    faq: z.array(serviceFaqSchema).optional().default([]),
    caseStudy: serviceCaseStudySchema.optional(),

    /**
     * Legacy fields from the old service-card model.
     * Kept optional during migration so older service markdown files
     * do not break the dev server or production build.
     */
    accent: z.string().optional(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    timeline: z.string().optional(),
    priceRange: z.string().optional(),
    deliverables: z.array(z.object({
      icon: z.string().optional(),
      title: z.string(),
      desc: z.string(),
    })).optional().default([]),

    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, services };
