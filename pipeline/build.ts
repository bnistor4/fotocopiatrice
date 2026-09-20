// Aggrega raw + analysis -> public/data/<attoId>/*.json + public/data/index.json
//
// Uso:
//   tsx pipeline/build.ts --atto 2112-bis [--title "Bilancio di previsione ..."]

import {
  argStr,
  COST_PER_MILLION_INPUT,
  gruppoAt,
  importoEuro,
  parseArgs,
  paths,
  readJson,
  writeJson,
  type DeputatiMap,
} from "./lib";
import type { Emendamento } from "./scrape";
import type { PairRecord } from "./pairs";
import type { SingleAnswers } from "./questions";

type RawFile = {
  attoId: string;
  container: string;
  sedute: string[];
  count: number;
  occorrenze?: number;
  emendamenti: Emendamento[];
};
type SingoliFile = {
  emendamenti: Record<string, { normHash: string; importoEuro: number | null; answers: SingleAnswers }>;
};
type CoppieFile = { exactGroups: string[][]; pairs: Record<string, PairRecord> };
type UsageFile = {
  totalInputTokens: number;
  totalOutputTokens: number;
  calls: number;
  estimatedCostUSD: number;
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const attoId = argStr(args, "atto");
  if (!attoId) {
    console.error("Uso: tsx pipeline/build.ts --atto <id> [--title \"...\"]");
    process.exit(1);
  }
  const titolo = argStr(args, "title") ?? `Atto Camera ${attoId}`;

  const raw = readJson<RawFile>(paths.rawEmendamenti(attoId));
  const singoli = readJson<SingoliFile>(paths.singoli(attoId)) ?? { emendamenti: {} };
  const coppie = readJson<CoppieFile>(paths.coppie(attoId)) ?? {
    exactGroups: [],
    pairs: {},
  };
  const usage = readJson<UsageFile>(paths.usage(attoId));
  const deputati = readJson<DeputatiMap>(paths.rawDeputati()) ?? {};
  if (!raw) {
    console.error("Manca data/raw — esegui prima lo scrape.");
    process.exit(1);
  }

  const analyzedIds = new Set(Object.keys(singoli.emendamenti));
  const byId = new Map(raw.emendamenti.map((e) => [e.key, e]));
  const primoGruppo = (e: Emendamento) =>
    gruppoAt(deputati[e.firmatari[0]?.idPersona ?? ""], e.seduta) ?? "ND";

  // ---- summary -----------------------------------------------------------
  const perEsito: Record<string, number> = {};
  let euroStima = 0;
  let nConImporto = 0;
  let nArticoliAgg = 0;
  let nSoppressivi = 0;
  let nLocalistici = 0;
  let nMance = 0;
  let nMirati = 0;
  const perGruppo: Record<
    string,
    {
      n: number;
      localistici: number;
      mirati: number;
      mance: number;
      euro: number;
      n_con_importo: number;
    }
  > = {};
  const perAmbito: Record<string, number> = {};

  const bumpGruppo = (e: Emendamento) => {
    const g = primoGruppo(e);
    const rec = (perGruppo[g] ??= {
      n: 0,
      localistici: 0,
      mirati: 0,
      mance: 0,
      euro: 0,
      n_con_importo: 0,
    });
    rec.n++;
    return rec;
  };

  for (const e of raw.emendamenti) {
    perEsito[e.esito ?? "non_indicato"] = (perEsito[e.esito ?? "non_indicato"] ?? 0) + 1;
    const rec = bumpGruppo(e);
    const s = singoli.emendamenti[e.key];
    if (!s) continue;
    const a = s.answers;
    // stima grezza: solo analizzati, non soppressivi, con importo nel testo
    const euro = importoEuro(e.testo);
    if (euro && a.soppressivo < 0.5) {
      euroStima += euro;
      nConImporto++;
      rec.euro += euro;
      rec.n_con_importo++;
    }
    if (a.articolo_aggiuntivo >= 0.5) nArticoliAgg++;
    if (a.soppressivo >= 0.5) nSoppressivi++;
    if (a.localistico >= 0.5) {
      nLocalistici++;
      rec.localistici++;
    }
    // "mancetta" = >50% sul livello 3 ("somma a un ente/evento/luogo nominato");
    // "mirato" = livello 2 o 3 combinati
    const p = a.micro_intervento.probabilities;
    if ((p["3"] ?? 0) >= 0.5) {
      nMance++;
      rec.mance++;
    }
    if ((p["2"] ?? 0) + (p["3"] ?? 0) >= 0.5) {
      nMirati++;
      rec.mirati++;
    }
    perAmbito[a.ambito.choice] = (perAmbito[a.ambito.choice] ?? 0) + 1;
  }

  const exactSet = new Set(coppie.exactGroups.flat());
  const semanticSet = new Set<string>();
  const allPairs = Object.values(coppie.pairs);
  for (const p of allPairs) {
    if (p.answers.stesso_effetto >= 0.8 && p.hashA !== p.hashB) {
      semanticSet.add(p.a);
      semanticSet.add(p.b);
    }
  }

  // fotocopie esatte divise per chi firma: interessanti quelle tra gruppi diversi
  const gruppiOf = (key: string) => {
    const e = byId.get(key);
    return e ? new Set([primoGruppo(e)]) : new Set<string>();
  };
  let esatteTraGruppi = 0;
  let esatteStessoGruppo = 0;
  for (const g of coppie.exactGroups) {
    const allG = new Set(g.flatMap((k) => [...gruppiOf(k)]));
    if (allG.size >= 2) esatteTraGruppi += g.length;
    else esatteStessoGruppo += g.length;
  }

  const summary = {
    attoId,
    titolo,
    totale_emendamenti: raw.count,
    occorrenze_bollettino: raw.occorrenze,
    analizzati: analyzedIds.size,
    per_esito: perEsito,
    articoli_aggiuntivi: nArticoliAgg,
    soppressivi: nSoppressivi,
    localistici: nLocalistici,
    mirati: nMirati,
    mance: nMance,
    fotocopie_esatte: exactSet.size,
    fotocopie_esatte_tra_gruppi: esatteTraGruppi,
    fotocopie_esatte_stesso_gruppo: esatteStessoGruppo,
    gruppi_fotocopia_esatta: coppie.exactGroups.length,
    fotocopie_semantiche: semanticSet.size,
    euro_richiesti_stima: euroStima,
    n_con_importo: nConImporto,
    per_gruppo: perGruppo,
    per_ambito: perAmbito,
    updatedAt: new Date().toISOString(),
  };

  // ---- coppie (top 500 by each measure) ----------------------------------
  const pairOut = (p: PairRecord) => {
    const ea = byId.get(p.a);
    const eb = byId.get(p.b);
    return {
      a: { key: p.a, id: ea?.id ?? p.a, articolo: ea?.articolo ?? "", testo: ea?.testo ?? "", gruppi: ea?.gruppi ?? [] },
      b: { key: p.b, id: eb?.id ?? p.b, articolo: eb?.articolo ?? "", testo: eb?.testo ?? "", gruppi: eb?.gruppi ?? [] },
      jaccard: p.jaccard,
      probabilita: p.answers,
      identMarkedByCamera: p.identMarkedByCamera,
    };
  };
  const byEffetto = [...allPairs]
    .sort((x, y) => y.answers.stesso_effetto - x.answers.stesso_effetto)
    .slice(0, 500)
    .map(pairOut);
  const byMatrice = [...allPairs]
    .sort((x, y) => y.answers.stessa_matrice - x.answers.stessa_matrice)
    .slice(0, 500)
    .map(pairOut);

  // ---- gruppi matrix ------------------------------------------------------
  const matrix: Record<string, Record<string, number>> = {};
  for (const p of allPairs) {
    if (p.answers.stesso_effetto < 0.8 && p.answers.stessa_matrice < 0.8) continue;
    const ea = byId.get(p.a);
    const eb = byId.get(p.b);
    if (!ea || !eb) continue;
    const ga = primoGruppo(ea);
    const gb = primoGruppo(eb);
    (matrix[ga] ??= {})[gb] = ((matrix[ga][gb] ?? 0) + 1);
    if (ga !== gb) (matrix[gb] ??= {})[ga] = (matrix[gb][ga] ?? 0) + 1;
  }
  const gruppiMatrix = {
    gruppi: Object.keys(matrix).sort(),
    counts: matrix,
    soglia: 0.8,
    note: "Coppie con stesso_effetto >= 0.8 oppure stessa_matrice >= 0.8; matrice simmetrica, gruppo del primo firmatario.",
  };

  // ---- emendamenti (detail pages) ----------------------------------------
  const emendamentiOut = raw.emendamenti.map((e) => {
    const s = singoli.emendamenti[e.key];
    return {
      key: e.key,
      id: e.id,
      numeroPubblicato: e.numeroPubblicato,
      articolo: e.articolo,
      testo: e.testo,
      firmatari: e.firmatari,
      gruppi: e.gruppi,
      esito: e.esito,
      esitoAnnotazione: e.esitoAnnotazione,
      nuovaFormulazione: e.nuovaFormulazione,
      riformulaDi: e.riformulaDi,
      identTo: e.identTo,
      identKeys: e.identKeys,
      seduta: e.seduta,
      sedute: e.sedute,
      sourceUrl: e.sourceUrl,
      importoEuro: importoEuro(e.testo),
      analizzato: !!s,
      answers: s?.answers ?? null,
    };
  });

  // ---- valutazione ---------------------------------------------------------
  const stats = (vals: number[]) =>
    vals.length
      ? {
          n: vals.length,
          media: vals.reduce((a, b) => a + b, 0) / vals.length,
          quota_ge_08: vals.filter((v) => v >= 0.8).length / vals.length,
          quota_ge_05: vals.filter((v) => v >= 0.5).length / vals.length,
        }
      : { n: 0, media: null, quota_ge_08: null, quota_ge_05: null };

  const identPairs = allPairs.filter((p) => p.identMarkedByCamera);
  const highJacPairs = allPairs.filter((p) => p.jaccard >= 0.9);
  const valutazione = {
    attoId,
    coppie_inviate: allPairs.length,
    coppie_ident_camera: {
      ...stats(identPairs.map((p) => p.answers.stesso_effetto)),
      descrizione:
        "Coppie che la Camera stessa marca come identiche (nota 'ident.'): distribuzione di stesso_effetto di Jev",
    },
    coppie_jaccard_alto: {
      ...stats(highJacPairs.map((p) => p.answers.stesso_effetto)),
      descrizione: "Coppie con similarita' Jaccard >= 0.9: distribuzione di stesso_effetto",
    },
    fotocopie_esatte: {
      gruppi: coppie.exactGroups.length,
      emendamenti: exactSet.size,
      descrizione: "Gruppi con testo identico dopo normalizzazione (sha1), calcolato in codice",
    },
    usage: usage
      ? {
          chiamate: usage.calls,
          input_tokens: usage.totalInputTokens,
          output_tokens: usage.totalOutputTokens,
          costo_stimato_usd: usage.estimatedCostUSD,
          tariffa_input_per_milione: COST_PER_MILLION_INPUT,
        }
      : null,
    updatedAt: new Date().toISOString(),
  };

  // ---- write ---------------------------------------------------------------
  const dir = paths.publicDir(attoId);
  writeJson(`${dir}/summary.json`, summary);
  writeJson(`${dir}/coppie.json`, {
    byStessoEffetto: byEffetto,
    byStessaMatrice: byMatrice,
    totaleCoppie: allPairs.length,
  });
  writeJson(`${dir}/gruppi_matrix.json`, gruppiMatrix);
  writeJson(`${dir}/emendamenti.json`, emendamentiOut);
  writeJson(`${dir}/valutazione.json`, valutazione);

  const index =
    readJson<{ attoId: string; titolo: string; n: number; updatedAt: string }[]>(
      paths.publicIndex(),
    ) ?? [];
  const rest = index.filter((i) => i.attoId !== attoId);
  rest.push({ attoId, titolo, n: raw.count, updatedAt: new Date().toISOString() });
  writeJson(paths.publicIndex(), rest);

  console.log(`Scritti 5 file + index in ${dir}`);
  console.log(
    `  totale=${raw.count} analizzati=${analyzedIds.size} esatte=${exactSet.size} semantiche=${semanticSet.size} coppie=${allPairs.length}`,
  );
}

main();
