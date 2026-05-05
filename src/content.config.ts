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

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    headline: z.string(),
    description: z.string(),
    category: z.string(),
    accent: z.string(),
    icon: z.string(),
    badge: z.string(),
    stack: z.array(z.string()),
    timeline: z.string(),
    priceRange: z.string(),
    deliverables: z.array(z.object({
      icon: z.string(),
      title: z.string(),
      desc: z.string(),
    })),
    process: z.array(z.object({
      step: z.number(),
      title: z.string(),
      desc: z.string(),
    })),
    faq: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })),
    caseStudy: z.object({
      title: z.string(),
      desc: z.string(),
      link: z.string().optional(),
      result: z.string(),
    }).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, services };
