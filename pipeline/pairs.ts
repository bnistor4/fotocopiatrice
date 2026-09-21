// Confronto a coppie: fotocopie esatte via normHash (in codice, gratis) e
// candidati semantici via Jaccard sui token, poi Jev su pairQuestions.
//
// Uso:
//   tsx pipeline/pairs.ts --atto 2112-bis [--max-pairs 5000] [--threshold 0.35] [--concurrency 8]

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { pairQuestions, type PairAnswers } from "./questions";
import {
  addUsage,
  argInt,
  argStr,
  candidatePairs,
  jaccardFromCounts,
  normHash,
  parseArgs,
  paths,
  readJson,
  runPool,
  tokenize,
  writeJson,
} from "./lib";
import type { Emendamento } from "./scrape";

type RawFile = { attoId: string; emendamenti: Emendamento[] };
type SingoliFile = { emendamenti: Record<string, { normHash: string }> };

export type PairRecord = {
  a: string;
  b: string;
  jaccard: number;
  hashA: string;
  hashB: string;
  answers: PairAnswers;
  identMarkedByCamera: boolean;
  model: string;
};

type CoppieFile = {
  attoId: string;
  updatedAt: string;
  exactGroups: string[][]; // ids con lo stesso normHash (gruppi di size >= 2)
  pairs: Record<string, PairRecord>;
};

const pairKey = (a: string, b: string) => `${a}|${b}`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const attoId = argStr(args, "atto");
  if (!attoId) {
    console.error(
      "Uso: tsx pipeline/pairs.ts --atto <id> [--max-pairs 5000] [--threshold 0.35] [--concurrency 8]",
    );
    process.exit(1);
  }
  const maxPairs = argInt(args, "max-pairs", 5000)!;
  const threshold = parseFloat(argStr(args, "threshold") ?? "0.35");
  const concurrency = argInt(args, "concurrency", 8)!;

  const raw = readJson<RawFile>(paths.rawEmendamenti(attoId));
  const singoli = readJson<SingoliFile>(paths.singoli(attoId));
  if (!raw || !singoli) {
    console.error("Mancano i dati grezzi o l'analisi — esegui scrape + analyze prima.");
    process.exit(1);
  }

  // Exact duplicates over ALL scraped amendments (hash only — no Jev needed)
  const byHash = new Map<string, Emendamento[]>();
  for (const e of raw.emendamenti) {
    const h = normHash(e.testo);
    const arr = byHash.get(h);
    if (arr) arr.push(e);
    else byHash.set(h, [e]);
  }
  // un gruppo vale se contiene >=2 emendamenti DISTINTI: numero diverso o
  // firmatari diversi (le ripubblicazioni dello stesso numero+firmatari sono
  // gia' fuse in scrape.ts, ma lo verifichiamo comunque)
  const distinctness = (e: Emendamento) =>
    `${e.id}|${[...new Set(e.firmatari.map((f) => f.idPersona || f.nome))].sort().join("|")}`;
  const exactGroups = [...byHash.values()]
    .filter((g) => new Set(g.map(distinctness)).size >= 2)
    .map((g) => g.map((e) => e.key));
  const inExactGroup = new Set(exactGroups.flat());
  console.log(
    `Fotocopie esatte: ${exactGroups.length} gruppi, ${inExactGroup.size} emendamenti`,
  );

  // Jaccard candidates among the ANALYZED subset (what we sent to Jev)
  const analyzed = raw.emendamenti.filter((e) => singoli.emendamenti[e.key]);
  const tokenSets = analyzed.map((e) => tokenize(e.testo));
  const hashOf = analyzed.map((e) => singoli.emendamenti[e.key].normHash);
  console.log(`Genero candidati Jaccard >= ${threshold} su ${analyzed.length} analizzati...`);
  const t0 = Date.now();
  // escluse le fotocopie esatte (stesso normHash) e le riformulazioni (stesso numero)
  let candidates = candidatePairs(
    tokenSets,
    threshold,
    (i, j) => hashOf[i] === hashOf[j] || analyzed[i].id === analyzed[j].id,
  );
  console.log(`  ${candidates.length} coppie candidate in ${Date.now() - t0}ms`);

  // L'indice ignora i token presenti in >500 testi: due testi con lo STESSO
  // insieme di token (template con solo numeri diversi) sono comunque
  // candidati (Jaccard 1.0) anche se ogni token e' ultra-comune.
  const byTokenSig = new Map<string, number[]>();
  analyzed.forEach((e, i) => {
    const sig = [...tokenSets[i]].sort().join(" ");
    const arr = byTokenSig.get(sig);
    if (arr) arr.push(i);
    else byTokenSig.set(sig, [i]);
  });
  const seenCand = new Set(candidates.map(([i, j]) => `${i}|${j}`));
  let added = 0;
  for (const idxs of byTokenSig.values()) {
    if (idxs.length < 2) continue;
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        const i = idxs[a];
        const j = idxs[b];
        if (hashOf[i] === hashOf[j] || analyzed[i].id === analyzed[j].id) continue;
        if (seenCand.has(`${i}|${j}`)) continue;
        seenCand.add(`${i}|${j}`);
        candidates.push([i, j, 1]);
        added++;
      }
    }
  }
  if (added) console.log(`  +${added} coppie con insieme di token identico`);

  candidates.sort((x, y) => y[2] - x[2]);
  if (candidates.length > maxPairs) {
    candidates = candidates.slice(0, maxPairs);
    console.log(`  -> tagliate a ${maxPairs} (le più simili)`);
  }

  // Coppie marcate "ident." dalla Camera: sempre inviate a Jev, anche se
  // fotocopie esatte — sono la verita' di controllo in valutazione.json.
  // identKeys sono gia' risolte a chiavi canoniche in scrape.ts.
  const indexByKey = new Map(analyzed.map((e, i) => [e.key, i]));
  const seenPair = new Set(candidates.map(([i, j]) => `${i}|${j}`));
  let identAdded = 0;
  analyzed.forEach((e, i) => {
    for (const x of e.identKeys) {
      const j = indexByKey.get(x);
      if (j === undefined || j === i || seenPair.has(`${i}|${j}`) || seenPair.has(`${j}|${i}`)) continue;
      seenPair.add(`${i}|${j}`);
      let inter = 0;
      for (const t of tokenSets[i]) if (tokenSets[j].has(t)) inter++;
      candidates.push([i, j, jaccardFromCounts(inter, tokenSets[i].size, tokenSets[j].size)]);
      identAdded++;
    }
  });
  console.log(`  +${identAdded} coppie "ident." incluse per la valutazione`);

  const cache = readJson<CoppieFile>(paths.coppie(attoId)) ?? {
    attoId,
    updatedAt: "",
    exactGroups: [],
    pairs: {},
  };
  cache.exactGroups = exactGroups;

  const toSend: { i: number; j: number; jaccard: number; key: string }[] = [];
  const isIdentMarked = (a: Emendamento, b: Emendamento) =>
    a.identKeys.includes(b.key) || b.identKeys.includes(a.key);
  for (const [i, j, jaccard] of candidates) {
    const a = analyzed[i];
    const b = analyzed[j];
    const key = pairKey(a.key, b.key);
    const rec = cache.pairs[key];
    if (rec && rec.hashA === hashOf[i] && rec.hashB === hashOf[j]) {
      rec.identMarkedByCamera = isIdentMarked(a, b);
      continue;
    }
    toSend.push({ i, j, jaccard, key });
  }
  console.log(`Da inviare a Jev: ${toSend.length} (cache hit: ${candidates.length - toSend.length})`);

  if (toSend.length > 0 && !process.env.TYPESAFE_API_KEY) {
    console.error("TYPESAFE_API_KEY non impostata — stop.");
    process.exit(1);
  }

  // il client serve solo se c'e' qualcosa da inviare (con cache piena gira senza chiave)
  const client = toSend.length ? new TypeSafeClient() : null;
  let calls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let done = 0;
  const t1 = Date.now();

  await runPool(toSend, concurrency, async ({ i, j, jaccard, key }) => {
    const a = analyzed[i];
    const b = analyzed[j];
    const state = {
      a: { id: a.id, articolo: a.articolo, testo: a.testo, gruppi: a.gruppi },
      b: { id: b.id, articolo: b.articolo, testo: b.testo, gruppi: b.gruppi },
    };
    const res = await client!.systemOne({ state, questions: pairQuestions });
    cache.pairs[key] = {
      a: a.key,
      b: b.key,
      jaccard,
      hashA: hashOf[i],
      hashB: hashOf[j],
      answers: {
        stesso_effetto: res.answers.stesso_effetto.noul,
        stessa_matrice: res.answers.stessa_matrice.noul,
        differenza_solo_numerica: res.answers.differenza_solo_numerica.noul,
      },
      identMarkedByCamera: isIdentMarked(a, b),
      model: res.model,
    };
    calls++;
    inputTokens += res.usage.input_tokens;
    outputTokens += res.usage.output_tokens;
    done++;
    if (done % 100 === 0) {
      const rate = (done / (Date.now() - t1)) * 1000;
      console.log(`  ${done}/${toSend.length} (${rate.toFixed(1)}/s, ${inputTokens} token in)`);
      cache.updatedAt = new Date().toISOString();
      writeJson(paths.coppie(attoId), cache);
    }
  });

  cache.updatedAt = new Date().toISOString();
  writeJson(paths.coppie(attoId), cache);
  const usage = addUsage(attoId, "pairs", calls, inputTokens, outputTokens);
  const secs = ((Date.now() - t1) / 1000).toFixed(1);
  console.log(
    `Fatto: ${calls} chiamate in ${secs}s — input ${inputTokens} token, ` +
      `cumulato ${usage.totalInputTokens} (~$${usage.estimatedCostUSD.toFixed(4)})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
