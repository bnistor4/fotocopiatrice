// Aggrega raw + analysis -> public/data/<attoId>/*.json + public/data/index.json
//
// Uso:
//   tsx pipeline/build.ts --atto 2112-bis [--title "Bilancio di previsione ..."]

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  argStr,
  COST_PER_MILLION_INPUT,
  gruppoAt,
  importoEuro,
  normHash,
  parseArgs,
  paths,
  readJson,
  ROOT,
  writeJson,
  type DeputatiMap,
} from "./lib";
import type { Emendamento } from "./scrape";
import type { PairRecord } from "./pairs";
import { pairQuestions, singleQuestions, type SingleAnswers } from "./questions";

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

  // un esempio concreto da mostrare in home: fotocopia esatta tra partiti
  // "veri" (niente Misto/ND), testo abbastanza lungo da essere interessante
  let esempioFotocopia: {
    a: { key: string; id: string; nome: string; gruppo: string };
    b: { key: string; id: string; nome: string; gruppo: string };
    testo: string;
    importoEuro: number | null;
  } | null = null;
  let esempioScore = -1;
  for (const p of allPairs) {
    if (p.hashA !== p.hashB) continue;
    const ea = byId.get(p.a);
    const eb = byId.get(p.b);
    const fa = ea?.firmatari[0];
    const fb = eb?.firmatari[0];
    if (!ea || !eb || !fa?.nome || !fb?.nome) continue;
    const ga = primoGruppo(ea);
    const gb = primoGruppo(eb);
    if (ga === gb || ga === "ND" || gb === "ND" || ga === "MISTO" || gb === "MISTO") continue;
    if (ea.testo.length < 200 || ea.testo.length > 700) continue;
    const ans = singoli.emendamenti[ea.key]?.answers;
    if (!ans || ans.soppressivo >= 0.5 || ans.articolo_aggiuntivo < 0.5) continue;
    const euro = importoEuro(ea.testo);
    if (!euro) continue;
    const score = ans.localistico + ans.beneficiario_identificabile;
    if (score > esempioScore) {
      esempioScore = score;
      esempioFotocopia = {
        a: { key: ea.key, id: ea.id, nome: fa.nome, gruppo: ga },
        b: { key: eb.key, id: eb.id, nome: fb.nome, gruppo: gb },
        testo: ea.testo,
        importoEuro: euro,
      };
    }
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
    esempio_fotocopia: esempioFotocopia,
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
    const lato = (e: Emendamento | undefined, key: string) => ({
      key,
      id: e?.id ?? key,
      articolo: e?.articolo ?? "",
      testo: e?.testo ?? "",
      gruppi: e?.gruppi ?? [],
      primoFirmatario: e?.firmatari[0] ?? null,
      nFirmatari: e?.firmatari.length ?? 0,
      gruppo: e ? primoGruppo(e) : "ND",
    });
    return {
      a: lato(ea, p.a),
      b: lato(eb, p.b),
      jaccard: p.jaccard,
      probabilita: p.answers,
      identMarkedByCamera: p.identMarkedByCamera,
      esatta: p.hashA === p.hashB,
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

  // ---- chi_firma: deputati che firmano per primi piu' fotocopie esatte ----
  type ChiFirmaRec = {
    idPersona: string;
    nome: string;
    gruppo: string;
    n_identici: number;
    n_depositati: number;
    ultimaSeduta: string;
  };
  const firma = new Map<string, ChiFirmaRec>();
  const recOf = (idp: string) => {
    let r = firma.get(idp);
    if (!r) {
      r = { idPersona: idp, nome: "", gruppo: "", n_identici: 0, n_depositati: 0, ultimaSeduta: "" };
      firma.set(idp, r);
    }
    return r;
  };
  for (const e of raw.emendamenti) {
    const f = e.firmatari[0];
    if (!f) continue;
    const r = recOf(f.idPersona || f.nome);
    r.n_depositati++;
    if (e.seduta >= r.ultimaSeduta) {
      r.ultimaSeduta = e.seduta;
      r.nome = f.nome;
      r.gruppo = primoGruppo(e);
      r.idPersona = f.idPersona;
    }
    if (exactSet.has(e.key)) r.n_identici++;
  }
  const chiFirma = [...firma.values()]
    .filter((r) => r.n_identici > 0)
    .sort((a, b) => b.n_identici - a.n_identici || b.n_depositati - a.n_depositati);
  const chiFirmaOut = {
    deputati: chiFirma
      .slice(0, 40)
      .map(({ ultimaSeduta: _u, ...r }) => r),
    totale_deputati_con_identici: chiFirma.length,
  };

  // ---- export/ per il riuso esterno (struttura in DATI.md) ------------------
  const exportDir = path.join(ROOT, "export", attoId);
  const cmpKey = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  const writeJsonl = (file: string, rows: object[]) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  };

  // key -> le chiavi del suo gruppo di fotocopie esatte
  const groupOfKey = new Map<string, string[]>();
  for (const g of coppie.exactGroups) for (const k of g) groupOfKey.set(k, g);
  const primoId = (key: string) => byId.get(key)?.firmatari[0]?.idPersona ?? "";
  const primoGrp = (key: string) => {
    const e = byId.get(key);
    return e ? primoGruppo(e) : "ND";
  };
  // flags per emendamento: il suo gruppo esatto contiene un primo firmatario
  // di un'altra persona / di un altro gruppo parlamentare?
  const flagsIdentici = (e: Emendamento) => {
    const grp = groupOfKey.get(e.key);
    const out = { altro: false, altroGruppo: false };
    if (!grp) return out;
    const me = primoGruppo(e);
    const myId = e.firmatari[0]?.idPersona ?? "";
    for (const k of grp) {
      if (k === e.key) continue;
      if (primoId(k) !== myId) out.altro = true;
      if (primoGrp(k) !== me) out.altroGruppo = true;
      if (out.altro && out.altroGruppo) break;
    }
    return out;
  };

  // emendamenti.jsonl: osservato + testoHash/importoEuroEstratto deterministici
  const emendamentiRows = [...raw.emendamenti]
    .sort((x, y) => cmpKey(x.key, y.key))
    .map((e) => ({
      key: e.key,
      id: e.id,
      numeroPubblicato: e.numeroPubblicato,
      articolo: e.articolo,
      testo: e.testo,
      testoHash: normHash(e.testo),
      firmatari: e.firmatari,
      primoFirmatario: e.firmatari[0] ?? null,
      gruppi: e.gruppi,
      gruppo: primoGruppo(e),
      esito: e.esito,
      esitoAnnotazione: e.esitoAnnotazione,
      nuovaFormulazione: e.nuovaFormulazione,
      riformulaDi: e.riformulaDi,
      identTo: e.identTo,
      seduta: e.seduta,
      sedute: e.sedute,
      sourceUrl: e.sourceUrl,
      importoEuroEstratto: importoEuro(e.testo),
    }));
  writeJsonl(`${exportDir}/emendamenti.jsonl`, emendamentiRows);

  // fotocopie_esatte.json: un oggetto per testoHash con >= 2 emendamenti
  const fotocopie = coppie.exactGroups
    .map((g) => {
      const keys = [...g].sort(cmpKey);
      const set = new Set(keys);
      const gruppiParlamentari = [...new Set(keys.map(primoGrp))].sort(cmpKey);
      const annotatoDallaCamera = keys.some((k) => {
        const e = byId.get(k);
        if (!e) return false;
        return (
          e.identKeys.some((ik) => set.has(ik)) ||
          e.identTo.some((n) => keys.some((k2) => k2 !== k && byId.get(k2)?.id === n))
        );
      });
      return {
        testoHash: normHash(byId.get(keys[0])?.testo ?? ""),
        n: keys.length,
        emendamenti: keys,
        gruppiParlamentari,
        traGruppiDiversi: gruppiParlamentari.length > 1,
        annotatoDallaCamera,
        testo: byId.get(keys[0])?.testo ?? "",
      };
    })
    .sort((x, y) => y.n - x.n || cmpKey(x.testoHash, y.testoHash));
  writeJson(`${exportDir}/fotocopie_esatte.json`, fotocopie);

  // per_deputato.jsonl: tutti i primi firmatari, conteggi deterministici
  type DepRec = {
    idPersona: string;
    nome: string;
    gruppiCount: Record<string, number>;
    ultimaSeduta: string;
    depositati: number;
    identiciAdAltro: number;
    identiciAdAltroGruppo: number;
    approvati: number;
  };
  const depMap = new Map<string, DepRec>();
  for (const e of raw.emendamenti) {
    const f = e.firmatari[0];
    if (!f) continue;
    const idp = f.idPersona || f.nome;
    let r = depMap.get(idp);
    if (!r) {
      r = {
        idPersona: idp,
        nome: "",
        gruppiCount: {},
        ultimaSeduta: "",
        depositati: 0,
        identiciAdAltro: 0,
        identiciAdAltroGruppo: 0,
        approvati: 0,
      };
      depMap.set(idp, r);
    }
    r.depositati++;
    const g = primoGruppo(e);
    r.gruppiCount[g] = (r.gruppiCount[g] ?? 0) + 1;
    if (e.seduta >= r.ultimaSeduta) {
      r.ultimaSeduta = e.seduta;
      r.nome = f.nome;
      r.idPersona = f.idPersona;
    }
    if (e.esito === "approvato") r.approvati++;
    const fl = flagsIdentici(e);
    if (fl.altro) r.identiciAdAltro++;
    if (fl.altroGruppo) r.identiciAdAltroGruppo++;
  }
  const perDeputatoRows = [...depMap.values()]
    .map((r) => ({
      idPersona: r.idPersona,
      nome: r.nome,
      gruppo:
        Object.entries(r.gruppiCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ND",
      depositati: r.depositati,
      identiciAdAltro: r.identiciAdAltro,
      identiciAdAltroGruppo: r.identiciAdAltroGruppo,
      approvati: r.approvati,
    }))
    .sort((x, y) => cmpKey(x.idPersona, y.idPersona));
  writeJsonl(`${exportDir}/per_deputato.jsonl`, perDeputatoRows);

  // per_gruppo.json: conteggi per sigla + matrice delle sole fotocopie esatte
  const pg: Record<
    string,
    {
      n: number;
      approvati: number;
      inammissibili: number;
      senzaEsito: number;
      identiciAdAltro: number;
      identiciAdAltroGruppo: number;
    }
  > = {};
  for (const e of raw.emendamenti) {
    const f = e.firmatari[0];
    if (!f) continue;
    const g = primoGruppo(e);
    const r = (pg[g] ??= {
      n: 0,
      approvati: 0,
      inammissibili: 0,
      senzaEsito: 0,
      identiciAdAltro: 0,
      identiciAdAltroGruppo: 0,
    });
    r.n++;
    if (e.esito === "approvato") r.approvati++;
    else if (e.esito === "inammissibile") r.inammissibili++;
    else if (e.esito === null) r.senzaEsito++;
    const fl = flagsIdentici(e);
    if (fl.altro) r.identiciAdAltro++;
    if (fl.altroGruppo) r.identiciAdAltroGruppo++;
  }
  const matriceEsatte: Record<string, Record<string, number>> = {};
  for (const grp of coppie.exactGroups) {
    for (let i = 0; i < grp.length; i++) {
      for (let j = i + 1; j < grp.length; j++) {
        const ga = primoGrp(grp[i]);
        const gb = primoGrp(grp[j]);
        (matriceEsatte[ga] ??= {})[gb] = (matriceEsatte[ga][gb] ?? 0) + 1;
        if (ga !== gb)
          (matriceEsatte[gb] ??= {})[ga] = (matriceEsatte[gb][ga] ?? 0) + 1;
      }
    }
  }
  writeJson(`${exportDir}/per_gruppo.json`, { ...pg, matrice: matriceEsatte });

  // modello/letture.jsonl e modello/coppie.jsonl: sole uscite di Jev
  const lettureRows = raw.emendamenti
    .filter((e) => singoli.emendamenti[e.key])
    .sort((x, y) => cmpKey(x.key, y.key))
    .map((e) => {
      const s = singoli.emendamenti[e.key];
      return { key: e.key, testoHash: s.normHash, ...s.answers };
    });
  writeJsonl(`${exportDir}/modello/letture.jsonl`, lettureRows);

  const coppieRows = allPairs
    .map((p) => {
      const [a, b] = [p.a, p.b].sort(cmpKey);
      return {
        a,
        b,
        esatta: p.hashA === p.hashB,
        identMarkedByCamera: p.identMarkedByCamera,
        jaccard: p.jaccard,
        ...p.answers,
      };
    })
    .sort((x, y) => cmpKey(x.a, y.a) || cmpKey(x.b, y.b));
  writeJsonl(`${exportDir}/modello/coppie.jsonl`, coppieRows);

  // provenance.json
  const containerPath = path.join(paths.rawDir(attoId), "container.xml");
  const sha256Xml = existsSync(containerPath)
    ? createHash("sha256").update(readFileSync(containerPath)).digest("hex")
    : null;
  const acqPath = existsSync(containerPath)
    ? containerPath
    : paths.rawEmendamenti(attoId);
  const acquisitoIl = existsSync(acqPath)
    ? statSync(acqPath).mtime.toISOString()
    : null;
  writeJson(`${exportDir}/provenance.json`, {
    attoId,
    titolo,
    fonte: {
      titolare: "Camera dei deputati",
      xml: `https://documenti.camera.it/leg19/emendamenti/xml/${raw.container}.xml`,
      pagineEmendamento:
        "https://documenti.camera.it/apps/emendamenti/getPropostaEmendativa.aspx",
      gruppiDeputati: "https://dati.camera.it/sparql",
      sha256Xml,
      acquisitoIl,
    },
    sedute: raw.sedute,
    conteggi: {
      occorrenzeBollettino: raw.occorrenze ?? null,
      emendamentiUnici: raw.count,
      ripubblicazioni: raw.emendamenti.filter((e) => e.sedute.length > 1)
        .length,
    },
    modello: {
      fornitore: "TypeSafe",
      nome: "Jev",
      domandeSingole: Object.keys(singleQuestions),
      domandeCoppia: Object.keys(pairQuestions),
      chiamate: usage?.calls ?? null,
      tokenInput: usage?.totalInputTokens ?? null,
      costoUsdStimato: usage?.estimatedCostUSD ?? null,
      definizioni: "pipeline/questions.ts",
    },
    soglie: {
      copiaRiscritta: 0.8,
      mancetta: { livello: 3, probabilitaMinima: 0.5 },
      jaccardCandidati: 0.35,
    },
    generatoIl: new Date().toISOString(),
    licenzaDatiDerivati: "CC-BY-4.0",
  });

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
  writeJson(`${dir}/chi_firma.json`, chiFirmaOut);

  const index =
    readJson<{ attoId: string; titolo: string; n: number; updatedAt: string }[]>(
      paths.publicIndex(),
    ) ?? [];
  const rest = index.filter((i) => i.attoId !== attoId);
  rest.push({ attoId, titolo, n: raw.count, updatedAt: new Date().toISOString() });
  writeJson(paths.publicIndex(), rest);

  console.log(`Scritti 6 file + index in ${dir}`);
  console.log(`Export per il riuso in ${exportDir} (7 file)`);
  console.log(
    `  totale=${raw.count} analizzati=${analyzedIds.size} esatte=${exactSet.size} semantiche=${semanticSet.size} coppie=${allPairs.length}`,
  );
}

main();
