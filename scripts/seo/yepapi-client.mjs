// Minimal YepAPI client for vicsotheme SEO research: caches every response by a hash of
// the request body, logs every paid call to a spend ledger, and refuses to go
// past a hard cost cap.
//
// Never call a paid provider without the owner's explicit approval and a
// stated cost cap. Cached hits are free and never re-billed.
//
// Key: ~/.config/yepapi/key (x-api-key header).
// Docs: https://docs.yepapi.com/llms-full.txt   Base: https://api.yepapi.com

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const BASE = 'https://api.yepapi.com';
const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const CACHE_DIR = resolve(ROOT, 'docs/seo/research/responses');
const LEDGER = resolve(ROOT, 'docs/seo/research/spend.csv');

let apiKey = null;
async function key() {
  if (!apiKey) apiKey = (await readFile(resolve(homedir(), '.config/yepapi/key'), 'utf8')).trim();
  return apiKey;
}

const cacheKey = (endpoint, body) =>
  createHash('sha256').update(endpoint + '\n' + JSON.stringify(body)).digest('hex').slice(0, 16);

/** Free, never billed — the ground truth for what a session actually spent. */
export async function balanceUsd() {
  const res = await fetch(`${BASE}/v1/account/balance`, { headers: { 'x-api-key': await key() } });
  const json = await res.json();
  if (!json.ok) throw new Error(`balance failed: ${JSON.stringify(json.error)}`);
  return json.data.balanceUsd ?? json.data.balanceCents / 100;
}

const csvEscape = (v) => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

async function logSpend(ledger, { endpoint, paramsSummary, costUsd, note }) {
  const row = [new Date().toISOString(), endpoint, paramsSummary, costUsd.toFixed(4), note];
  await appendFile(ledger, row.map(csvEscape).join(',') + '\n');
}

export class SpendCapExceeded extends Error {}

/**
 * POSTs `body` to `endpoint`, serving from cache when possible. `cacheDir` and
 * `ledger` default to docs/seo/research; `spentUsd` carries spend already made
 * under the same cap by another provider.
 * `estimateCost(data)` returns the USD price of a live call from its response,
 * so the ledger records the published-price estimate for what was returned.
 */
export function createCaller({ capUsd, onSpend, cacheDir = CACHE_DIR, ledger = LEDGER, spentUsd = 0 }) {
  let spent = spentUsd;
  return {
    get spent() { return spent; },
    async call(endpoint, body, { note = '', paramsSummary = JSON.stringify(body), estimateCost }) {
      await mkdir(cacheDir, { recursive: true });
      const path = resolve(cacheDir, `${cacheKey(endpoint, body)}.json`);
      try {
        const hit = JSON.parse(await readFile(path, 'utf8'));
        return { data: hit.data, cached: true, cost: 0 };
      } catch { /* cache miss — fall through to a paid call */ }

      // Price the call before making it; a call that would breach the cap is never sent.
      const worstCase = estimateCost.worstCase ?? 0.15;
      if (spent + worstCase > capUsd + 1e-9) {
        throw new SpendCapExceeded(
          `refusing ${endpoint}: $${spent.toFixed(4)} spent + $${worstCase.toFixed(4)} worst case would exceed the $${capUsd.toFixed(2)} cap`,
        );
      }

      // Upstream 5xx is transient and never billed — retry with backoff.
      let res, json;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt) await new Promise((r) => setTimeout(r, 2000 * attempt));
        res = await fetch(`${BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'x-api-key': await key(), 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        json = await res.json();
        if (res.status < 500) break;
      }
      // Failed calls are never charged (docs: "Failed requests (non-2xx) are never charged").
      if (!res.ok || !json.ok) {
        throw new Error(`${endpoint} ${res.status}: ${JSON.stringify(json.error ?? json).slice(0, 300)}`);
      }

      const cost = estimateCost.price(json.data);
      spent += cost;
      await writeFile(path, JSON.stringify(json, null, 1));
      await logSpend(ledger, { endpoint, paramsSummary, costUsd: cost, note });
      onSpend?.(endpoint, cost, spent);
      return { data: json.data, cached: false, cost };
    },
  };
}

/** $0.03 per call + $0.03 per 100 keywords returned, rounded up to the cent. */
export const overviewPricing = {
  worstCase: 0.25,
  price: (data) => Math.ceil((0.03 + 0.03 * ((data.keywords?.length ?? 0) / 100)) * 100) / 100,
};

/** $0.01 per 10 results of depth. */
export const serpPricing = (depth) => ({
  worstCase: Math.ceil(depth / 10) * 0.01,
  price: () => Math.ceil(depth / 10) * 0.01,
});

/** $0.03 per call + $0.03 per 100 keywords returned — ideas, related, domain/keywords. */
export const perKeywordPricing = (limit) => ({
  worstCase: Math.ceil((0.03 + 0.03 * (limit / 100)) * 100) / 100,
  price: (data) => Math.ceil((0.03 + 0.03 * ((data.keywords?.length ?? 0) / 100)) * 100) / 100,
});

/**
 * Spend so far, summed from the ledger (TOTAL rows excluded). `notePrefix`
 * limits the sum to one research step (e.g. "R1") so each step keeps its own cap.
 */
export async function ledgerSpent(ledger = LEDGER, { notePrefix = '' } = {}) {
  try {
    return (await readFile(ledger, 'utf8')).trim().split('\n').slice(1)
      .map((l) => l.match(/,(\d+\.\d{4}),("[^"]*"|[^,]*)$/))
      .filter((m) => m && m[2].replace(/^"/, '').startsWith(notePrefix))
      .reduce((sum, m) => sum + Number(m[1]), 0);
  } catch { return 0; }
}

/** $0.03 per call + $0.03 per 100 domains returned — competitors/serp, competitors/domain. */
export const perDomainPricing = (limit) => ({
  worstCase: Math.ceil((0.03 + 0.03 * (limit / 100)) * 100) / 100,
  price: (data) => Math.ceil((0.03 + 0.03 * ((data.competitors?.length ?? 0) / 100)) * 100) / 100,
});
