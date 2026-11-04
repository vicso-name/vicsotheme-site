/**
 * App cost calculator: pure functions shared by the page (server render) and
 * its client script. Prices and weeks live in site.estimator.
 *
 * `parse` is the keyword fallback. An AI parser (e.g. a Cloudflare Worker)
 * can replace it as long as it returns the same `Detection[]` shape.
 */
import { site } from '../config/site';

const model = site.estimator;

export type FeatureId = (typeof model.features)[number]['id'];
export type Feature = (typeof model.features)[number];

export interface Detection {
  id: FeatureId;
  detected: boolean;
  /** The words in the text that triggered (or, for `design`, ruled out) the feature. */
  match: string | null;
}

export type Parser = (text: string) => Detection[] | Promise<Detection[]>;

/** Keyword rules from the design. `design` is on unless ready designs are mentioned. */
const rules: Record<Exclude<FeatureId, 'design'>, RegExp> = {
  both: /\b(both|cross[- ]platform|flutter|ios and android|android and ios|iphone and android)\b/i,
  auth: /\b(login|log in|sign ?in|accounts?|profiles?|users)\b/i,
  pay: /\b(subscriptions?|payments?|premium|paywall|checkout|paid)\b/i,
  ai: /\b(ai|gpt|llm|chatbot|assistant|tutor|coach|generat\w*)\b/i,
  admin: /\b(admin|cms|dashboard|marketplace|content|catalog)\b/i,
  push: /\b(notifications?|reminders?|streaks?|habits?|daily)\b/i,
  offline: /\b(offline)\b/i,
};
const designReady = /\b(figma|designs? ready|have (a )?design)\b/i;

export function parse(text: string): Detection[] {
  return model.features.map((f) => {
    if (f.id === 'design') {
      const m = text.match(designReady);
      return { id: f.id, detected: !m, match: m ? m[0] : null };
    }
    const m = text.match(rules[f.id]);
    return { id: f.id, detected: !!m, match: m ? m[0] : null };
  });
}

export type Overrides = Partial<Record<FeatureId, boolean>>;

export interface SpecRow extends Feature {
  on: boolean;
  reason: string;
}

/** Detections + the user's manual toggles → the spec rows shown in the UI. */
export function spec(detections: Detection[], overrides: Overrides = {}): SpecRow[] {
  return model.features.map((f) => {
    const d = detections.find((x) => x.id === f.id);
    const detected = d?.detected ?? false;
    const ov = overrides[f.id];
    const on = ov ?? detected;
    let reason: string;
    if (ov !== undefined) reason = on ? 'added by you' : 'removed by you';
    else if (f.id === 'design') reason = detected ? 'no designs mentioned → included' : 'you mentioned ready designs';
    else reason = d?.match ? `detected: “${d.match}”` : 'not mentioned';
    return { ...f, on, reason };
  });
}

export const selected = (rows: SpecRow[]): FeatureId[] => rows.filter((r) => r.on).map((r) => r.id);

const byId = (ids: FeatureId[]) => model.features.filter((f) => ids.includes(f.id));
const round100 = (n: number) => Math.round(n / 100) * 100;
export const eur = (n: number) => `€${Math.round(n).toLocaleString('en-US')}`;

export function price(selection: FeatureId[]) {
  const total = model.base.price + byId(selection).reduce((s, f) => s + f.price, 0);
  const low = round100(total);
  const high = round100(total * model.highMultiplier);
  return { total, low, high, text: `${eur(low)}–${eur(high).slice(1)}` };
}

export interface Phase { name: string; start: number; len: number; ai: boolean }

/** Week range plus Gantt phases (start/len in weeks, `span` = chart width in weeks). */
export function timeline(selection: FeatureId[]) {
  const has = (id: FeatureId) => selection.includes(id);
  const weeks = Math.ceil(model.base.weeks + byId(selection).reduce((s, f) => s + f.weeks, 0));
  const weeksMax = weeks + model.extraWeeks;

  const scope = has('design') ? 2 : 1;
  const phases: Phase[] = [{ name: 'Scope & UI', start: 0, len: scope, ai: false }];
  let cursor = scope;
  const core = Math.max(2, weeks - scope - 1 - (has('pay') ? 1 : 0) - (has('ai') ? 1.5 : 0));
  phases.push({ name: 'Core build', start: cursor, len: core, ai: false });
  cursor += core;
  if (has('ai')) { phases.push({ name: 'AI feature', start: cursor - 1, len: 2.5, ai: true }); cursor += 1.5; }
  if (has('pay')) { phases.push({ name: 'Payments', start: cursor, len: 1, ai: false }); cursor += 1; }
  phases.push({ name: 'Store release', start: cursor, len: 1, ai: false });

  return { weeks, weeksMax, text: `${weeks}–${weeksMax} weeks`, span: Math.max(cursor + 1, weeks), phases };
}

export const bestFit = (selection: FeatureId[]) => (selection.includes('ai') ? 'AI MVP' : 'Mobile MVP');

/** Terminal lines for the "$ analyze" panel. */
export function logLines(detections: Detection[], rows: SpecRow[]): string[] {
  const label = (id: FeatureId) => model.features.find((f) => f.id === id)!.label.toLowerCase();
  const lines = detections
    .filter((d) => d.id !== 'design' && d.detected && d.match)
    .map((d) => `${label(d.id)}  ← “${d.match}”`);
  if (!rows.find((r) => r.id === 'both')?.on) lines.unshift('platform: one store (say “iOS and Android” for both)');
  const design = detections.find((d) => d.id === 'design');
  lines.push(`ui design: ${design?.detected ? 'included' : 'provided by you'}`);
  return lines;
}

export const shortText = (t: string) => (t.length > 48 ? `${t.slice(0, 48)}…` : t);

export const examples = [
  { label: 'Language app + AI tutor', text: 'A language learning app for iOS and Android with daily streaks, subscriptions and an AI tutor that explains mistakes' },
  { label: 'Fitness coach', text: 'An iOS app where users log workouts and an AI coach generates weekly plans, with premium subscription' },
  { label: 'Tutor marketplace', text: 'A marketplace app for Android and iOS where parents find local tutors, with accounts, payments and an admin panel' },
];
