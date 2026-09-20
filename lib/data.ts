// Lettura dei JSON prodotti dalla pipeline (public/data/). Usata solo lato
// server durante il build: il sito e' statico e non chiama mai l'API TypeSafe.
import { readFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function read<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, ...parts), "utf-8")) as T;
}

export type AttoIndex = { attoId: string; titolo: string; n: number; updatedAt: string };

export type Summary = {
  attoId: string;
  titolo: string;
  totale_emendamenti: number;
  analizzati: number;
  per_esito: Record<string, number>;
  articoli_aggiuntivi: number;
  soppressivi: number;
  localistici: number;
  mance: number;
  fotocopie_esatte: number;
  gruppi_fotocopia_esatta: number;
  fotocopie_semantiche: number;
  euro_richiesti_totale: number;
  per_gruppo: Record<string, { n: number; localistici: number; mance: number; euro: number }>;
  per_ambito: Record<string, number>;
  updatedAt: string;
};

export type PairProbs = {
  stesso_effetto: number;
  stessa_matrice: number;
  differenza_solo_numerica: number;
};

export type Coppia = {
  a: { key: string; id: string; articolo: string; testo: string; gruppi: string[] };
  b: { key: string; id: string; articolo: string; testo: string; gruppi: string[] };
  jaccard: number;
  probabilita: PairProbs;
  identMarkedByCamera: boolean;
};

export type CoppieFile = {
  byStessoEffetto: Coppia[];
  byStessaMatrice: Coppia[];
  totaleCoppie: number;
};

export type GruppiMatrix = {
  gruppi: string[];
  counts: Record<string, Record<string, number>>;
  soglia: number;
  note: string;
};

export type SingleAnswers = {
  articolo_aggiuntivo: number;
  soppressivo: number;
  localistico: number;
  beneficiario_identificabile: number;
  copertura_indicata: number;
  ambito: { choice: string; probabilities: Record<string, number>; confidence: number };
  micro_intervento: { score: number; probabilities: Record<string, number>; confidence: number };
};

export type Emendamento = {
  /** seduta:numero — unico dentro il contenitore (il numero si ripete tra sedute). */
  key: string;
  id: string;
  numeroPubblicato: string;
  articolo: string;
  testo: string;
  firmatari: { nome: string; idPersona: string }[];
  gruppi: string[];
  esito: string | null;
  esitoAnnotazione: string | null;
  nuovaFormulazione: boolean;
  identTo: string[];
  seduta: string;
  sourceUrl: string;
  importoEuro: number | null;
  analizzato: boolean;
  answers: SingleAnswers | null;
};

export type Valutazione = {
  attoId: string;
  coppie_inviate: number;
  coppie_ident_camera: {
    n: number;
    media: number | null;
    quota_ge_08: number | null;
    quota_ge_05: number | null;
    descrizione: string;
  };
  coppie_jaccard_alto: {
    n: number;
    media: number | null;
    quota_ge_08: number | null;
    quota_ge_05: number | null;
    descrizione: string;
  };
  fotocopie_esatte: { gruppi: number; emendamenti: number; descrizione: string };
  usage: {
    chiamate: number;
    input_tokens: number;
    output_tokens: number;
    costo_stimato_usd: number;
    tariffa_input_per_milione: number;
  } | null;
  updatedAt: string;
};

export function getAtti(): AttoIndex[] {
  try {
    return read<AttoIndex[]>("index.json");
  } catch {
    return [];
  }
}

export function getLatestAtto(): AttoIndex | undefined {
  const atti = getAtti();
  return atti.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export const getSummary = (attoId: string) => read<Summary>(attoId, "summary.json");
export const getCoppie = (attoId: string) => read<CoppieFile>(attoId, "coppie.json");
export const getGruppiMatrix = (attoId: string) => read<GruppiMatrix>(attoId, "gruppi_matrix.json");
export const getEmendamenti = (attoId: string) => read<Emendamento[]>(attoId, "emendamenti.json");
export const getValutazione = (attoId: string) => read<Valutazione>(attoId, "valutazione.json");

export function getEmendamento(attoId: string, key: string): Emendamento | undefined {
  return getEmendamenti(attoId).find((e) => e.key === key || e.id === key);
}

export const pct = (p: number) => `${Math.round(p * 100)}%`;

export const fmtEuro = (n: number) =>
  n >= 1e9
    ? `${(n / 1e9).toLocaleString("it-IT", { maximumFractionDigits: 2 })} mld €`
    : n >= 1e6
      ? `${(n / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 1 })} mln €`
      : `${n.toLocaleString("it-IT")} €`;

export const fmtData = (yyyymmdd: string) =>
  `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`;
