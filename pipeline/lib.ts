// Shared utilities for the Fotocopiatrice pipeline.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");

export const USER_AGENT =
  "Fotocopiatrice/1.0 (analisi emendamenti; contatto: progetto di ricerca)";

export const COST_PER_MILLION_INPUT = 0.042; // USD per 1M input tokens

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const paths = {
  rawDir: (attoId: string) => path.join(ROOT, "data", "raw", attoId),
  rawEmendamenti: (attoId: string) =>
    path.join(ROOT, "data", "raw", attoId, "emendamenti.json"),
  rawDeputati: () => path.join(ROOT, "data", "raw", "deputati.json"),
  analysisDir: (attoId: string) => path.join(ROOT, "data", "analysis", attoId),
  singoli: (attoId: string) =>
    path.join(ROOT, "data", "analysis", attoId, "singoli.json"),
  coppie: (attoId: string) =>
    path.join(ROOT, "data", "analysis", attoId, "coppie.json"),
  usage: (attoId: string) =>
    path.join(ROOT, "data", "analysis", attoId, "usage.json"),
  publicDir: (attoId: string) =>
    path.join(ROOT, "public", "data", attoId),
  publicIndex: () => path.join(ROOT, "public", "data", "index.json"),
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

export type CliArgs = Record<string, string | boolean>;

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq >= 0) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else {
      out[a.slice(2)] = true;
    }
  }
  return out;
}

export function argStr(args: CliArgs, key: string): string | undefined {
  const v = args[key];
  return typeof v === "string" ? v : undefined;
}

export function argInt(args: CliArgs, key: string, dflt?: number): number | undefined {
  const v = args[key];
  if (v === undefined) return dflt;
  const n = parseInt(String(v), 10);
  if (Number.isNaN(n)) throw new Error(`--${key} deve essere un intero, ricevuto "${v}"`);
  return n;
}

// ---------------------------------------------------------------------------
// JSON IO
// ---------------------------------------------------------------------------

export function readJson<T>(file: string): T | undefined {
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}

export function writeJson(file: string, data: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// HTTP (polite: sequential by caller, retry once, fixed delay helper)
// ---------------------------------------------------------------------------

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchText(url: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xml,*/*" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} per ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1500);
    }
  }
  throw new Error("unreachable");
}

export async function fetchStatus(url: string): Promise<number> {
  const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
  return res.status;
}

// ---------------------------------------------------------------------------
// Text normalisation / hashes / amounts
// ---------------------------------------------------------------------------

/** Lowercase, collapse punctuation and whitespace — the dedup key. */
export function normaliseText(testo: string): string {
  return testo
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normHash(testo: string): string {
  return createHash("sha1").update(normaliseText(testo)).digest("hex");
}

/**
 * Tokens for Jaccard: lowercase word chars, >= 4 chars, digits collapsed to
 * "<num>" so that "500.000 euro" and "700.000 euro" still match.
 */
export function tokenize(testo: string): Set<string> {
  const tokens = new Set<string>();
  const norm = testo.toLowerCase().replace(/\d[\d.,]*/g, "<num>");
  for (const m of norm.matchAll(/[\p{L}<][\p{L}'-]*/gu)) {
    const t = m[0].replace(/['-]+$/, "");
    if (t === "<num>" || t.length >= 4) tokens.add(t);
  }
  return tokens;
}

/**
 * Extract euro amounts from Italian legal text; returns the max found or null.
 * Handles: "500.000 euro", "euro 200.000", "5 milioni di euro",
 * "1,5 milioni di euro", "200 mila euro", "1,2 miliardi di euro".
 */
export function importoEuro(testo: string): number | null {
  const amounts: number[] = [];
  const num = "(\\d{1,3}(?:\\.\\d{3})+|\\d+(?:,\\d+)?)";
  const mult: RegExp = new RegExp(
    `${num}\\s*(milioni|miliardi|mila|milione|miliardo)?\\s*(?:di\\s*)?euro`,
    "gi",
  );
  const euroFirst = new RegExp(`euro\\s*${num}\\s*(milioni|miliardi|mila)?`, "gi");
  const parse = (n: string, unit?: string): number => {
    const v = parseFloat(n.replace(/\./g, "").replace(",", "."));
    const u = (unit ?? "").toLowerCase();
    if (u.startsWith("miliard")) return v * 1e9;
    if (u.startsWith("milion")) return v * 1e6;
    if (u === "mila") return v * 1e3;
    return v;
  };
  for (const m of testo.matchAll(mult)) amounts.push(parse(m[1], m[2]));
  for (const m of testo.matchAll(euroFirst)) amounts.push(parse(m[1], m[2]));
  // oltre 100 mld e' quasi sempre un artefatto del testo sorgente
  // (es. "196.453.669 milioni di euro" nei PDF del bollettino)
  const valid = amounts.filter((a) => Number.isFinite(a) && a > 0 && a <= 100e9);
  return valid.length ? Math.max(...valid) : null;
}

// ---------------------------------------------------------------------------
// Jaccard candidate generation (token inverted index)
// ---------------------------------------------------------------------------

export function jaccardFromCounts(shared: number, sizeA: number, sizeB: number): number {
  const union = sizeA + sizeB - shared;
  return union === 0 ? 0 : shared / union;
}

/**
 * All unordered pairs with Jaccard >= threshold, computed via inverted index.
 * `items` must expose a token Set. Returns [i, j, jaccard] sorted desc.
 */
export function candidatePairs(
  tokenSets: Set<string>[],
  threshold: number,
  excludePair?: (i: number, j: number) => boolean,
): [number, number, number][] {
  // inverted index: token -> item indices
  const index = new Map<string, number[]>();
  tokenSets.forEach((set, i) => {
    for (const t of set) {
      const arr = index.get(t);
      if (arr) arr.push(i);
      else index.set(t, [i]);
    }
  });
  // count shared tokens per pair
  const shared = new Map<number, number>();
  for (const items of index.values()) {
    if (items.length > 500) continue; // ultra-common tokens carry no signal
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const key = items[a] * 1_000_000 + items[b];
        shared.set(key, (shared.get(key) ?? 0) + 1);
      }
    }
  }
  const out: [number, number, number][] = [];
  for (const [key, count] of shared) {
    const i = Math.floor(key / 1_000_000);
    const j = key % 1_000_000;
    if (excludePair && excludePair(i, j)) continue;
    const jac = jaccardFromCounts(count, tokenSets[i].size, tokenSets[j].size);
    if (jac >= threshold) out.push([i, j, jac]);
  }
  out.sort((x, y) => y[2] - x[2]);
  return out;
}

// ---------------------------------------------------------------------------
// Concurrency pool
// ---------------------------------------------------------------------------

export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(lanes);
}

// ---------------------------------------------------------------------------
// Deputati (mappa idPersona -> gruppo parlamentare nel tempo)
// ---------------------------------------------------------------------------

export type DeputatoStoria = {
  sigla: string;
  gruppo: string;
  start: string;
  end: string | null;
};

export type Deputato = {
  nome: string;
  cognome: string;
  gruppo: string;
  sigla: string;
  storia: DeputatoStoria[];
};

export type DeputatiMap = Record<string, Deputato>;

/** Gruppo (sigla) del deputato alla data indicata (YYYYMMDD). */
export function gruppoAt(d: Deputato | undefined, date: string): string | null {
  if (!d) return null;
  const hit = d.storia.find((s) => s.start <= date && (s.end === null || s.end >= date));
  return (hit ?? d.storia[d.storia.length - 1])?.sigla || null;
}

// ---------------------------------------------------------------------------
// Usage accounting
// ---------------------------------------------------------------------------

export type UsageFile = {
  totalInputTokens: number;
  totalOutputTokens: number;
  calls: number;
  estimatedCostUSD: number;
  runs: { script: string; at: string; calls: number; inputTokens: number; outputTokens: number }[];
  updatedAt: string;
};

export function addUsage(
  attoId: string,
  script: string,
  calls: number,
  inputTokens: number,
  outputTokens: number,
): UsageFile {
  const file = paths.usage(attoId);
  const cur = readJson<UsageFile>(file) ?? {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    calls: 0,
    estimatedCostUSD: 0,
    runs: [],
    updatedAt: "",
  };
  cur.totalInputTokens += inputTokens;
  cur.totalOutputTokens += outputTokens;
  cur.calls += calls;
  cur.estimatedCostUSD = (cur.totalInputTokens * COST_PER_MILLION_INPUT) / 1e6;
  cur.runs.push({
    script,
    at: new Date().toISOString(),
    calls,
    inputTokens,
    outputTokens,
  });
  cur.updatedAt = new Date().toISOString();
  writeJson(file, cur);
  return cur;
}
