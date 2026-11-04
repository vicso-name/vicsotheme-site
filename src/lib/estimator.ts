/**
 * Product scope estimator logic, ported unchanged from the v1 homepage
 * component. Shared by the page (initial render) and its client script.
 */
export const productTypes = [
  { value: 'ai', label: 'AI tool or AI-powered product' },
  { value: 'saas', label: 'SaaS platform or web app' },
  { value: 'mobile', label: 'Mobile app' },
  { value: 'cms', label: 'CMS / content platform' },
  { value: 'edtech', label: 'EdTech or learning product' },
  { value: 'internal', label: 'Internal dashboard or business tool' },
] as const;

export const stages = [
  { value: 'idea', label: 'Idea / early concept' },
  { value: 'mvp', label: 'MVP scope is roughly defined' },
  { value: 'existing', label: 'Existing product needs improvement' },
  { value: 'scale', label: 'Product is growing and needs better architecture' },
] as const;

export const requirements = [
  { value: 'auth', label: 'Authentication' },
  { value: 'ai', label: 'AI integration' },
  { value: 'payments', label: 'Payments / subscriptions' },
  { value: 'cms', label: 'CMS / content management' },
  { value: 'dashboard', label: 'Admin dashboard' },
  { value: 'mobile', label: 'Mobile support' },
] as const;

export const priorities = [
  { value: 'launch', label: 'Launch quickly' },
  { value: 'ux', label: 'Improve UX and product clarity' },
  { value: 'automation', label: 'Automate workflows' },
  { value: 'performance', label: 'Improve performance / SEO' },
  { value: 'monetization', label: 'Improve monetization' },
  { value: 'architecture', label: 'Clean up architecture' },
] as const;

const directions: Record<string, { title: string; stack: string }> = {
  ai: { title: 'Lean AI Product MVP', stack: 'AI workflow design, backend API, OpenAI or Claude integration, structured prompts, and a focused web interface.' },
  saas: { title: 'SaaS Platform Foundation', stack: 'Next.js, backend API, authentication, PostgreSQL, dashboard flows, and production-ready deployment.' },
  mobile: { title: 'Cross-Platform Mobile Product', stack: 'Flutter, backend integration, authentication, analytics, subscription logic, and launch preparation.' },
  cms: { title: 'Structured Content Platform', stack: 'Strapi or WordPress architecture, reusable content models, SEO structure, frontend integration, and publishing workflows.' },
  edtech: { title: 'Learning System MVP', stack: 'Learning flow, spaced repetition logic, content architecture, progress tracking, and mobile-first UX.' },
  internal: { title: 'Internal Operations Tool', stack: 'Admin dashboard, authentication, role-based access, workflow automation, reporting, and data management.' },
};

const notes: Record<string, string> = {
  launch: 'Avoid building the full platform first. Launch a focused version that proves the product workflow.',
  ux: 'The first improvement should simplify the user journey and remove unclear product decisions.',
  automation: 'Automation should start from a repeated manual workflow with clear business value.',
  performance: 'Performance work should focus on measurable bottlenecks, not cosmetic optimization.',
  monetization: 'Monetization should connect paywall, feature value, onboarding, and retention.',
  architecture: 'Architecture cleanup should be prioritized around maintainability and future product changes.',
};

function complexity(reqs: string[], stage: string) {
  let score = reqs.length;
  if (reqs.includes('ai')) score += 1;
  if (reqs.includes('payments')) score += 1;
  if (reqs.includes('mobile')) score += 1;
  if (stage === 'scale') score += 2;
  if (stage === 'existing') score += 1;
  if (score <= 2) return 'Low to medium';
  if (score <= 5) return 'Medium';
  return 'High';
}

function milestone(type: string, stage: string, priority: string) {
  if (stage === 'existing') return 'Audit the current product and define the highest-impact fixes';
  if (stage === 'scale') return 'Stabilize architecture and remove scaling bottlenecks';
  if (priority === 'launch') return 'Build the smallest useful MVP workflow';
  if (priority === 'automation') return 'Map the manual workflow and automate one critical path';
  if (priority === 'performance') return 'Audit performance, SEO, and frontend delivery';
  if (priority === 'monetization') return 'Validate premium feature logic and conversion flow';
  if (type === 'edtech') return 'Validate the core learning loop';
  return 'Validate the core product workflow';
}

export interface EstimatorInput { type: string; stage: string; priority: string; reqs: string[] }
export interface EstimatorResult { title: string; complexity: string; milestone: string; stack: string; note: string }

export function estimate({ type, stage, priority, reqs }: EstimatorInput): EstimatorResult {
  const d = directions[type] ?? directions.ai;
  return {
    title: d.title,
    complexity: complexity(reqs, stage),
    milestone: milestone(type, stage, priority),
    stack: d.stack,
    note: notes[priority] ?? notes.launch,
  };
}

export const defaults: EstimatorInput = { type: 'ai', stage: 'idea', priority: 'launch', reqs: [] };
