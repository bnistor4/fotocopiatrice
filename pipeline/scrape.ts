// Scrape degli emendamenti della Camera dei deputati.
//
// Fonte primaria: il contenitore XML pubblico
//   https://documenti.camera.it/leg19/emendamenti/xml/leg.19.eme.ac.<ATTO>.xml
// e' lo stesso documento che l'applicazione web trasforma via XSL per le pagine
// getProposteEmendativeSeduta / getPropostaEmendativa: contiene per ogni
// proposta testo integrale, firmatari, esito, note "ident." e "nuova
// formulazione", seduta e commissione. Un solo download invece di migliaia di
// richieste alle pagine di dettaglio. Le pagine HTML di lista vengono comunque
// scaricate (una per seduta) per verifica incrociata dei conteggi.
//
// Uso:
//   tsx pipeline/scrape.ts --atto 2112 [--commissione 05] [--sede referente]
//                          [--dates 20241115,20241204] [--no-check]
//                          [--refresh-deputati] [--skip-deputati]

import * as cheerio from "cheerio";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  argStr,
  fetchStatus,
  fetchText,
  gruppoAt,
  normaliseText,
  normHash,
  parseArgs,
  paths,
  readJson,
  sleep,
  writeJson,
  type DeputatiMap,
} from "./lib";

const BASE = "https://documenti.camera.it";
const LIST_URL = (
  container: string,
  dataSeduta: string,
  sede: string,
  urn: string,
) =>
  `${BASE}/apps/emendamenti/getProposteEmendativeSeduta.aspx?contenitorePortante=${container}` +
  `&dataSeduta=${dataSeduta}&sedeEsame=${sede}&tipoListaEmendamenti=1&tipoSeduta=1` +
  `&urnTestoRiferimento=${encodeURIComponent(urn)}`;

const DETAIL_URL = (
  container: string,
  dataSeduta: string,
  sede: string,
  urn: string,
  id: string,
) =>
  `${BASE}/apps/emendamenti/getPropostaEmendativa.aspx?contenitorePortante=${container}` +
  `&tipoSeduta=1&sedeEsame=${sede}&urnTestoRiferimento=${encodeURIComponent(urn)}` +
  `&dataSeduta=${dataSeduta}&idPropostaEmendativa=${encodeURIComponent(id)}&position=${dataSeduta}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Firmatario = { nome: string; idPersona: string };

export type Emendamento = {
  /** Chiave unica: <primaSeduta>:<numero>. Stesso numero + stesso testo + stessi
   *  firmatari in sedute successive = la stessa proposta ripubblicata (merge). */
  key: string;
  id: string;
  numeroPubblicato: string;
  tipo: string; // "emendamento" | "articoloAggiuntivo" | ...
  articolo: string;
  testo: string;
  firmatari: Firmatario[];
  gruppi: string[];
  esito: string | null;
  esitoAnnotazione: string | null;
  stato: string | null;
  nuovaFormulazione: boolean;
  identTo: string[];
  /** identTo risolto a chiavi canoniche (la nota usa la numerazione della seduta). */
  identKeys: string[];
  /** Se e' una nuova formulazione di un numero gia' pubblicato: chiave del precedente. */
  riformulaDi: string | null;
  /** Prima seduta di pubblicazione (quella della key). */
  seduta: string;
  /** Tutte le sedute in cui la proposta compare. */
  sedute: string[];
  commissione: string;
  sourceUrl: string;
};

/** Una riga del bollettino: la stessa proposta puo' comparire in piu' sedute. */
type Occurrence = Omit<Emendamento, "key" | "sedute" | "identKeys" | "riformulaDi">;

/**
 * Unisce le ripubblicazioni: stesso numero + stesso normHash + stesso set di
 * idPersona dei firmatari = la stessa proposta. Stesso numero con testo
 * diverso = nuova formulazione (record separato, `riformulaDi` al precedente).
 */
function mergeOccorrenze(occorrenze: Occurrence[]): Emendamento[] {
  const byId = new Map<string, Occurrence[]>();
  for (const o of occorrenze) {
    const arr = byId.get(o.id);
    if (arr) arr.push(o);
    else byId.set(o.id, [o]);
  }

  const firmatariKey = (o: Occurrence): string => {
    const ids = [...new Set(o.firmatari.map((f) => f.idPersona).filter(Boolean))].sort();
    if (ids.length) return ids.join("|");
    // proponenti collegiali senza idPersona: confronta il primo nome
    return `N:${normaliseText(o.firmatari[0]?.nome ?? "")}`;
  };

  const canonici: Emendamento[] = [];
  // occorrenza -> chiave canonica; lo stesso numero puo' comparire due volte
  // nella stessa seduta (formulazione originale + nuova formulazione)
  const keyOfOccurrence = new Map<Occurrence, string>();
  const usedKeys = new Set<string>();
  const orderOf = new Map<string, number>();
  const occIndex = new Map(occorrenze.map((o, i) => [o, i]));

  for (const [id, occs] of byId) {
    occs.sort((a, b) => a.seduta.localeCompare(b.seduta));
    // cluster per (normHash, firmatari): un'occorrenza entra nel cluster che
    // corrisponde, anche se nel frattempo e' comparsa una riformulazione
    const clusters: { hash: string; firma: string; occs: Occurrence[] }[] = [];
    for (const o of occs) {
      const h = normHash(o.testo);
      const f = firmatariKey(o);
      const hit = clusters.find((c) => c.hash === h && c.firma === f);
      if (hit) hit.occs.push(o);
      else clusters.push({ hash: h, firma: f, occs: [o] });
    }
    let prev: { key: string; hash: string } | null = null;
    const seenHashes = new Set<string>();
    for (const cluster of clusters) {
      const first = cluster.occs[0];
      let key = `${first.seduta}:${id}`;
      if (usedKeys.has(key)) {
        // stesso numero pubblicato due volte nella stessa seduta
        let n = 2;
        while (usedKeys.has(`${key}#${n}`)) n++;
        key = `${key}#${n}`;
      }
      usedKeys.add(key);
      // esito: dalla piu' recente occorrenza che ne ha uno
      const latestWithEsito = [...cluster.occs]
        .sort((a, b) => b.seduta.localeCompare(a.seduta))
        .find((o) => o.esito);
      canonici.push({
        ...first,
        key,
        esito: latestWithEsito?.esito ?? null,
        esitoAnnotazione: latestWithEsito?.esitoAnnotazione ?? null,
        stato: latestWithEsito?.stato ?? first.stato,
        nuovaFormulazione: cluster.occs.some((o) => o.nuovaFormulazione),
        identTo: [...new Set(cluster.occs.flatMap((o) => o.identTo))],
        identKeys: [], // risolti sotto
        // stesso numero, testo MAI visto prima = riformulazione; stesso testo
        // con firmatari diversi = copia tra firmatari, non riformulazione
        riformulaDi: prev && !seenHashes.has(cluster.hash) ? prev.key : null,
        sedute: [...new Set(cluster.occs.map((o) => o.seduta))].sort(),
      });
      orderOf.set(key, Math.min(...cluster.occs.map((o) => occIndex.get(o)!)));
      for (const o of cluster.occs) keyOfOccurrence.set(o, key);
      seenHashes.add(cluster.hash);
      prev = { key, hash: cluster.hash };
    }
  }

  // identTo usa la numerazione della seduta in cui la nota appare; se il numero
  // ha piu' cluster in quella seduta si risolve al primo
  const canonByKey = new Map(canonici.map((e) => [e.key, e]));
  const canonAt = new Map<string, string>(); // "seduta:numero" -> prima chiave canonica
  for (const e of canonici) {
    for (const s of e.sedute) {
      const k = `${s}:${e.id}`;
      if (!canonAt.has(k)) canonAt.set(k, e.key);
    }
  }
  for (const o of occorrenze) {
    const srcKey = keyOfOccurrence.get(o);
    const src = srcKey ? canonByKey.get(srcKey) : undefined;
    if (!src) continue;
    for (const x of o.identTo) {
      const targetKey = canonAt.get(`${o.seduta}:${x}`);
      if (targetKey && targetKey !== src.key && !src.identKeys.includes(targetKey)) {
        src.identKeys.push(targetKey);
      }
    }
  }

  // ordine di pubblicazione: seduta della prima occorrenza, poi ordine documento
  canonici.sort(
    (a, b) => a.seduta.localeCompare(b.seduta) || (orderOf.get(a.key) ?? 0) - (orderOf.get(b.key) ?? 0),
  );
  return canonici;
}

// ---------------------------------------------------------------------------
// Deputati via SPARQL (dati.camera.it)
// ---------------------------------------------------------------------------

const SPARQL_ENDPOINT = "https://dati.camera.it/sparql";
const DEPUTATI_QUERY = `
PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?idPersona ?cognome ?nome ?sigla ?gruppo ?start ?end WHERE {
  ?d a ocd:deputato ;
     ocd:rif_leg <http://dati.camera.it/ocd/legislatura.rdf/repubblica_19> ;
     ocd:aderisce ?a .
  OPTIONAL { ?d foaf:surname ?cognome }
  OPTIONAL { ?d foaf:firstName ?nome }
  ?a ocd:rif_gruppoParlamentare ?g ;
     ocd:startDate ?start .
  OPTIONAL { ?a ocd:endDate ?end }
  ?g dc:title ?gruppo ;
     dct:alternative ?sigla .
  BIND(REPLACE(STR(?d), '^.*/d([0-9]+)_19$', '$1') AS ?idPersona)
}
ORDER BY ?idPersona ?start
`;

async function fetchDeputati(): Promise<DeputatiMap> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(DEPUTATI_QUERY)}&format=${encodeURIComponent("application/sparql-results+json")}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Fotocopiatrice/1.0", Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
  const json = (await res.json()) as {
    results: {
      bindings: {
        idPersona?: { value: string };
        cognome?: { value: string };
        nome?: { value: string };
        sigla?: { value: string };
        gruppo?: { value: string };
        start?: { value: string };
        end?: { value: string };
      }[];
    };
  };
  const map: DeputatiMap = {};
  for (const b of json.results.bindings) {
    const id = b.idPersona?.value;
    if (!id) continue;
    const entry = (map[id] ??= {
      nome: "",
      cognome: "",
      gruppo: "",
      sigla: "",
      storia: [],
    });
    if (b.cognome) entry.cognome = b.cognome.value;
    if (b.nome) entry.nome = b.nome.value;
    const gruppoNome = (b.gruppo?.value ?? "").replace(/\s*\([^)]*\)\s*\(\d{2}\.\d{2}\.\d{4}.*$/, "").trim();
    entry.storia.push({
      sigla: b.sigla?.value ?? "",
      gruppo: gruppoNome,
      start: b.start?.value ?? "",
      end: b.end?.value ?? null,
    });
  }
  // "current" group = membership without end date (or the latest one)
  for (const d of Object.values(map)) {
    d.storia.sort((a, b) => a.start.localeCompare(b.start));
    const cur = d.storia.find((s) => s.end === null) ?? d.storia[d.storia.length - 1];
    if (cur) {
      d.gruppo = cur.gruppo;
      d.sigla = cur.sigla;
    }
    d.nome = `${d.nome} ${d.cognome}`.trim();
  }
  return map;
}

// ---------------------------------------------------------------------------
// Container resolution
// ---------------------------------------------------------------------------

async function resolveContainer(atto: string): Promise<string> {
  const candidates = atto.includes("-") ? [atto] : [atto, `${atto}-bis`];
  for (const c of candidates) {
    const url = `${BASE}/leg19/emendamenti/xml/leg.19.eme.ac.${c}.xml`;
    if ((await fetchStatus(url)) === 200) return c;
    await sleep(300);
  }
  throw new Error(
    `Nessun contenitore emendamenti trovato per l'atto ${atto} (provati: ${candidates.join(", ")})`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const attoArg = argStr(args, "atto");
  if (!attoArg) {
    console.error("Uso: tsx pipeline/scrape.ts --atto <id> [--commissione 05] [--sede referente] [--dates a,b,c] [--no-check] [--refresh-deputati] [--skip-deputati]");
    process.exit(1);
  }
  const commissione = argStr(args, "commissione");
  const sede = argStr(args, "sede") ?? "referente";
  const dates = argStr(args, "dates")?.split(",").map((d) => d.trim());
  const doCheck = args["no-check"] !== true;
  const skipDeputati = args["skip-deputati"] === true;
  const refreshDeputati = args["refresh-deputati"] === true;

  // 1. Deputati map
  const depFile = paths.rawDeputati();
  let deputati = readJson<DeputatiMap>(depFile);
  if (skipDeputati && !deputati) {
    console.warn("--skip-deputati ma data/raw/deputati.json non esiste: i gruppi saranno vuoti");
    deputati = {};
  }
  if (!skipDeputati && (!deputati || refreshDeputati)) {
    console.log("Scarico deputati da dati.camera.it (SPARQL)...");
    deputati = await fetchDeputati();
    writeJson(depFile, deputati);
    console.log(`  ${Object.keys(deputati).length} deputati salvati in ${depFile}`);
  }
  deputati ??= {};

  // 2. Resolve container + download XML
  const container = await resolveContainer(attoArg);
  const attoId = container; // e.g. "2112-bis"
  console.log(`Contenitore: leg.19.eme.ac.${container}`);
  const xmlUrl = `${BASE}/leg19/emendamenti/xml/leg.19.eme.ac.${container}.xml`;
  const xmlPath = path.join(paths.rawDir(attoId), "container.xml");
  let xml: string;
  if (existsSync(xmlPath) && args["refetch"] !== true) {
    xml = readFileSync(xmlPath, "utf-8");
    console.log("  (uso il container.xml già scaricato; --refetch per riscaricare)");
  } else {
    console.log(`Scarico ${xmlUrl} ...`);
    xml = await fetchText(xmlUrl, 2);
    mkdirSync(path.dirname(xmlPath), { recursive: true });
    writeFileSync(xmlPath, xml);
  }
  console.log(`  XML: ${(xml.length / 1e6).toFixed(1)} MB`);

  // 3. Parse
  const $ = cheerio.load(xml, { xml: true });
  const [base, suffix] = attoId.includes("-")
    ? [attoId.split("-")[0], attoId.split("-").slice(1).join("-")]
    : [attoId, "null"];
  const occorrenze: Occurrence[] = [];
  const seduteViste = new Set<string>();
  const perSeduta = new Map<string, number>();

  $("proposteEmendativeInSeduta").each((_, block) => {
    const $b = $(block);
    const sedutaData = $b.find("seduta").first().attr("data") ?? "";
    const sedeEsame = $b.find("commissioni").first().attr("sedeEsame") ?? "";
    const comms = $b
      .find("commissioni > commissione")
      .map((_, c) => $(c).attr("idCommissione") ?? "")
      .get();
    const urn =
      $b.find("testoRiferimento > urn").first().text().trim() ||
      `urn:leg:19:${base}:${suffix}:null:com:${comms[0] ?? commissione ?? "05"}:${sedeEsame}`;

    if (sedeEsame !== sede) return;
    if (commissione && !comms.includes(commissione)) return;
    if (dates && !dates.includes(sedutaData)) return;

    seduteViste.add(sedutaData);

    $b.find("propostaEmendativa").each((_, el) => {
      const $p = $(el);
      const numero = $p.attr("numero") ?? "";
      if (!numero) return;
      const testo = $p
        .find("testoPropostaEmendativa > xhtml")
        .text()
        .replace(/\s+/g, " ")
        .trim();
      const firmatari: Firmatario[] = $p
        .find("proponenti > proponente")
        .map((_, pr) => {
          const $pr = $(pr);
          const tipo = $pr.attr("tipoProponente");
          if (tipo === "deputato") {
            const cognome = $pr.find("cognome").text().trim();
            const nome = $pr.find("nome").text().trim();
            return {
              nome: `${nome} ${cognome}`.trim(),
              idPersona: $pr.attr("idProponente") ?? "",
            };
          }
          // proponente collegiale (organo, governo, gruppo): nessun idPersona
          const label =
            $pr.find("organo").text().trim() ||
            $pr.text().replace(/\s+/g, " ").trim();
          return label ? { nome: label, idPersona: "" } : null;
        })
        .get()
        .filter((f): f is Firmatario => f !== null && f.nome !== "");
      const gruppi = [
        ...new Set(
          firmatari
            .map((f) => gruppoAt(deputati?.[f.idPersona], sedutaData))
            .filter((g): g is string => g !== null),
        ),
      ];
      const identTo = $p
        .find("proposteEmendativeIdentiche > propostaEmendativaIdentica")
        .map((_, i) => $(i).text().trim())
        .get()
        .filter((i) => i && i !== numero);
      const esito = $p.find("esitoPropostaEmendativa > esito").first().text().trim();
      const annotazione = $p
        .find("esitoPropostaEmendativa > annotazione")
        .first()
        .text()
        .trim();
      occorrenze.push({
        id: numero,
        numeroPubblicato: $p.attr("numeroPubblicato") ?? numero,
        tipo: $p.attr("tipo") ?? "emendamento",
        articolo: $p.find("partizione > numero").first().text().trim(),
        testo,
        firmatari,
        gruppi,
        esito: esito || null,
        esitoAnnotazione: annotazione || null,
        stato: $p.find("iter > stato").first().text().trim() || null,
        nuovaFormulazione:
          $p.find('riformulazione[tipo^="nuovaFormulazione"]').length > 0,
        identTo,
        seduta: sedutaData,
        commissione: comms[0] ?? commissione ?? "",
        sourceUrl: DETAIL_URL(
          `leg.19.eme.ac.${container}`,
          sedutaData,
          sedeEsame,
          urn,
          numero,
        ),
      });
      perSeduta.set(sedutaData, (perSeduta.get(sedutaData) ?? 0) + 1);
    });
  });

  console.log(`Occorrenze estratte (righe del bollettino): ${occorrenze.length}`);
  const emendamenti = mergeOccorrenze(occorrenze);
  console.log(`Emendamenti canonici: ${emendamenti.length}`);
  for (const [d, n] of [...perSeduta.entries()].sort()) {
    console.log(`  seduta ${d}: ${n} occorrenze`);
  }

  // 4. Cross-check against the HTML list pages (one request per seduta)
  if (doCheck) {
    for (const data of [...seduteViste].sort()) {
      const urn = `urn:leg:19:${base}:${suffix}:null:com:${commissione ?? "05"}:${sede}`;
      const url = LIST_URL(`leg.19.eme.ac.${container}`, data, sede, urn);
      try {
        const html = await fetchText(url);
        const m = html.match(/idPropostaEmendativa=/g);
        const htmlCount = m ? m.length : 0;
        const xmlCount = perSeduta.get(data) ?? 0;
        const flag = htmlCount === xmlCount ? "OK" : "DISCREPANZA";
        console.log(`  check ${data}: lista HTML=${htmlCount} XML=${xmlCount} ${flag}`);
      } catch (e) {
        console.warn(`  check ${data}: fallita (${(e as Error).message})`);
      }
      await sleep(300);
    }
  }

  // 5. Write
  const out = {
    attoId,
    container: `leg.19.eme.ac.${container}`,
    sede,
    commissione: commissione ?? null,
    sedute: [...seduteViste].sort(),
    count: emendamenti.length,
    occorrenze: occorrenze.length,
    fetchedAt: new Date().toISOString(),
    emendamenti,
  };
  writeJson(paths.rawEmendamenti(attoId), out);
  console.log(`Scritto ${paths.rawEmendamenti(attoId)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
