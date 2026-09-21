// Analisi dei singoli emendamenti con Jev (TypeSafe System One).
// Cache in data/analysis/<attoId>/singoli.json keyed by emendamento id;
// un emendamento viene re-inviato solo se il suo normHash e' cambiato.
//
// Uso:
//   tsx pipeline/analyze.ts --atto 2112-bis [--limit 400] [--concurrency 8]

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { singleQuestions, type SingleAnswers } from "./questions";
import {
  addUsage,
  argInt,
  argStr,
  importoEuro,
  normHash,
  parseArgs,
  paths,
  readJson,
  runPool,
  writeJson,
} from "./lib";
import type { Emendamento } from "./scrape";

type RawFile = { attoId: string; emendamenti: Emendamento[] };

type SingoloRecord = {
  normHash: string;
  importoEuro: number | null;
  answers: SingleAnswers;
  model: string;
};

type SingoliFile = {
  attoId: string;
  updatedAt: string;
  emendamenti: Record<string, SingoloRecord>;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const attoId = argStr(args, "atto");
  if (!attoId) {
    console.error("Uso: tsx pipeline/analyze.ts --atto <id> [--limit N] [--concurrency 8]");
    process.exit(1);
  }
  const limit = argInt(args, "limit");
  const concurrency = argInt(args, "concurrency", 8)!;

  const raw = readJson<RawFile>(paths.rawEmendamenti(attoId));
  if (!raw) {
    console.error(`Manca ${paths.rawEmendamenti(attoId)} — esegui prima pipeline:scrape`);
    process.exit(1);
  }

  const cache = readJson<SingoliFile>(paths.singoli(attoId)) ?? {
    attoId,
    updatedAt: "",
    emendamenti: {},
  };

  // publication order = seduta date, then document order inside the seduta
  const ordered = [...raw.emendamenti].sort((a, b) =>
    a.seduta === b.seduta ? 0 : a.seduta.localeCompare(b.seduta),
  );
  const scope = limit ? ordered.slice(0, limit) : ordered;
  console.log(
    `Emendamenti in scope: ${scope.length}${limit ? ` (limit ${limit})` : ""} su ${raw.emendamenti.length}`,
  );

  const toSend: Emendamento[] = [];
  let salvaged = 0;
  for (const e of scope) {
    const hash = normHash(e.testo);
    const euro = importoEuro(e.testo);
    let cached = cache.emendamenti[e.key];
    if (!cached || cached.normHash !== hash) {
      // la stessa proposta puo' essere stata analizzata sotto la chiave di una
      // seduta successiva (pre-canonicalizzazione): stesso normHash = riusabile
      for (const s of e.sedute.slice(1)) {
        const alt = cache.emendamenti[`${s}:${e.id}`];
        if (alt && alt.normHash === hash) {
          cache.emendamenti[e.key] = alt;
          cached = alt;
          salvaged++;
          break;
        }
      }
    }
    if (cached && cached.normHash === hash) {
      if (cached.importoEuro !== euro) cached.importoEuro = euro;
      continue;
    }
    toSend.push(e);
  }
  if (salvaged) console.log(`Cache riallineata su chiavi canoniche: ${salvaged} record`);
  console.log(`Da analizzare: ${toSend.length} (cache hit: ${scope.length - toSend.length})`);

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
  const t0 = Date.now();

  await runPool(toSend, concurrency, async (e) => {
    const state = {
      atto: attoId,
      articolo: e.articolo,
      id: e.id,
      testo: e.testo,
      firmatari: e.firmatari.map((f) => f.nome),
      gruppi: e.gruppi,
    };
    const res = await client!.systemOne({ state, questions: singleQuestions });
    const a = res.answers;
    const answers: SingleAnswers = {
      articolo_aggiuntivo: a.articolo_aggiuntivo.noul,
      soppressivo: a.soppressivo.noul,
      localistico: a.localistico.noul,
      beneficiario_identificabile: a.beneficiario_identificabile.noul,
      copertura_indicata: a.copertura_indicata.noul,
      ambito: {
        choice: a.ambito.choice,
        probabilities: a.ambito.probabilities,
        confidence: a.ambito.confidence,
      },
      micro_intervento: {
        score: a.micro_intervento.score,
        probabilities: a.micro_intervento.probabilities,
        confidence: a.micro_intervento.confidence,
      },
    };
    cache.emendamenti[e.key] = {
      normHash: normHash(e.testo),
      importoEuro: importoEuro(e.testo),
      answers,
      model: res.model,
    };
    calls++;
    inputTokens += res.usage.input_tokens;
    outputTokens += res.usage.output_tokens;
    done++;
    if (done % 50 === 0) {
      const rate = (done / (Date.now() - t0)) * 1000;
      console.log(
        `  ${done}/${toSend.length} (${rate.toFixed(1)}/s, ${inputTokens} token in)`,
      );
      cache.updatedAt = new Date().toISOString();
      writeJson(paths.singoli(attoId), cache);
    }
  });

  cache.updatedAt = new Date().toISOString();
  writeJson(paths.singoli(attoId), cache);
  const usage = addUsage(attoId, "analyze", calls, inputTokens, outputTokens);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `Fatto: ${calls} chiamate in ${secs}s — input ${inputTokens} token, ` +
      `cumulato ${usage.totalInputTokens} (~$${usage.estimatedCostUSD.toFixed(4)})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
