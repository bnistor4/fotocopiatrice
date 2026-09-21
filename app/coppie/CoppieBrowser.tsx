"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fmtNum } from "@/lib/format";
import type { Coppia, CoppieFile, PairProbs } from "@/lib/data";
import { fraseCoppia, nomeGruppo, voce } from "@/lib/testi";

const MEASURES: { key: keyof PairProbs; label: string; voceId: string }[] = [
  { key: "stesso_effetto", label: "stesso risultato", voceId: "stesso-risultato" },
  { key: "stessa_matrice", label: "stessa bozza", voceId: "stessa-bozza" },
  { key: "differenza_solo_numerica", label: "cambia solo un numero", voceId: "solo-un-numero" },
];

const pct = (p: number) => `${Math.round(p * 100)}%`;
const PAGE = 30;

function MeterCell({ label, p, voceId }: { label: string; p: number; voceId: string }) {
  return (
    <div>
      <p className="eyebrow" title={voce(voceId)?.breve}>{label}</p>
      <div className="meter-track mt-1.5">
        <div className="meter-fill" style={{ width: `${Math.round(p * 100)}%` }} />
      </div>
      <p className="num mt-1 text-base font-semibold">{pct(p)}</p>
    </div>
  );
}

function Lato({ e, attoId }: { e: Coppia["a"]; attoId: string }) {
  const [aperto, setAperto] = useState(false);
  return (
    <div className="min-w-0">
      <Link
        href={`/emendamento/${encodeURIComponent(e.key)}?atto=${attoId}`}
        className="text-sm font-semibold hover:text-(--color-accent)"
      >
        Em. {e.id} <span className="font-normal text-(--color-faded)">· art. {e.articolo}</span>
      </Link>
      <p className="mt-0.5 text-[13px]">
        {e.primoFirmatario ? (
          <>
            Firmato da <strong>{e.primoFirmatario.nome}</strong> ({nomeGruppo(e.gruppo)})
            {e.nFirmatari > 1 && ` e altri ${e.nFirmatari - 1}`}
          </>
        ) : (
          <span className="text-(--color-faded)">Firmatari non disponibili</span>
        )}
      </p>
      <p
        className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-(--color-ink-soft) ${
          aperto ? "" : "line-clamp-8"
        }`}
      >
        {e.testo}
      </p>
      <button
        type="button"
        onClick={() => setAperto(!aperto)}
        className="mt-1 text-[13px] font-medium text-(--color-accent)"
      >
        {aperto ? "Riduci" : "Mostra tutto"}
      </button>
    </div>
  );
}

function PairCard({ c, attoId }: { c: Coppia; attoId: string }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="display max-w-2xl text-lg leading-snug">
          {fraseCoppia({
            esatta: c.esatta,
            stessoRisultato: c.probabilita.stesso_effetto,
            stessaBozza: c.probabilita.stessa_matrice,
            soloNumero: c.probabilita.differenza_solo_numerica,
          })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {c.esatta && (
            <span className="rounded-full bg-(--color-navy) px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              Testo identico
            </span>
          )}
          {c.identMarkedByCamera && (
            <span
              className="rounded-full border border-(--color-accent) px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-(--color-accent)"
              title={voce("segnalato-identico")?.breve}
            >
              La Camera li segna identici
            </span>
          )}
          {!c.esatta && (
            <span
              className="rounded-full border border-(--color-line) px-2.5 py-0.5 text-[11px] font-medium text-(--color-faded)"
              title={voce("parole-in-comune")?.breve}
            >
              parole in comune {Math.round(c.jaccard * 100)}%
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {MEASURES.map((m) => (
          <MeterCell key={m.key} label={m.label} p={c.probabilita[m.key]} voceId={m.voceId} />
        ))}
      </div>
      <div className="mt-4 grid gap-5 border-t border-(--color-line) pt-4 lg:grid-cols-2">
        <Lato e={c.a} attoId={attoId} />
        <div className="border-t border-(--color-line) pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
          <Lato e={c.b} attoId={attoId} />
        </div>
      </div>
    </article>
  );
}

export default function CoppieBrowser({ attoId, titolo }: { attoId: string; titolo: string }) {
  const [data, setData] = useState<CoppieFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [measure, setMeasure] = useState<keyof PairProbs>("stesso_effetto");
  const [minProb, setMinProb] = useState(50);
  const [gruppo, setGruppo] = useState("");
  const [soloCamera, setSoloCamera] = useState(false);
  const [soloIdentiche, setSoloIdentiche] = useState(false);
  const [soloPartitiDiversi, setSoloPartitiDiversi] = useState(false);
  const [visibili, setVisibili] = useState(PAGE);

  useEffect(() => {
    fetch(`/data/${attoId}/coppie.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [attoId]);

  const gruppi = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    for (const c of [...data.byStessoEffetto, ...data.byStessaMatrice]) {
      s.add(c.a.gruppo);
      s.add(c.b.gruppo);
    }
    return [...s].sort();
  }, [data]);

  const lista = useMemo(() => {
    if (!data) return [];
    const base =
      measure === "stessa_matrice" ? data.byStessaMatrice : data.byStessoEffetto;
    return base
      .filter((c) => c.probabilita[measure] * 100 >= minProb)
      .filter((c) => !gruppo || c.a.gruppo === gruppo || c.b.gruppo === gruppo)
      .filter((c) => !soloCamera || c.identMarkedByCamera)
      .filter((c) => !soloIdentiche || c.esatta)
      .filter((c) => !soloPartitiDiversi || c.a.gruppo !== c.b.gruppo);
  }, [data, measure, minProb, gruppo, soloCamera, soloIdentiche, soloPartitiDiversi]);

  useEffect(() => {
    setVisibili(PAGE);
  }, [measure, minProb, gruppo, soloCamera, soloIdentiche, soloPartitiDiversi]);

  const glossLink = (id: string, testo: string) => (
    <Link href={`/glossario#${id}`} title={voce(id)?.breve} className="termine">
      {testo}
    </Link>
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Emendamenti a confronto</p>
        <h1 className="display mt-1 text-4xl">Copie a confronto</h1>
        <p className="mt-2 max-w-3xl text-(--color-ink-soft)">
          Qui vedi due emendamenti affiancati ({titolo}). Sopra, tre barre dicono quanto il
          programma è sicuro che abbiano lo{" "}
          {glossLink("stesso-risultato", "stesso risultato")}, che vengano dalla{" "}
          {glossLink("stessa-bozza", "stessa bozza")}, o che{" "}
          {glossLink("solo-un-numero", "cambi solo un numero")}. Le barre sono{" "}
          {glossLink("probabilita", "percentuali")}, non verdetti. Le parole sottolineate
          portano alla spiegazione. Sotto ogni emendamento c'è chi lo ha firmato per primo e
          il suo partito.
        </p>
      </header>

      {error && <p className="card text-(--color-accent)">Errore nel caricamento: {error}</p>}
      {!data && !error && (
        <p className="card text-(--color-faded)">Caricamento delle coppie…</p>
      )}

      {data && (
        <>
          <div className="card sticky top-0 z-10 flex flex-wrap items-end gap-x-6 gap-y-3">
            <label className="block w-full sm:w-auto">
              <span className="eyebrow block">Cosa confrontare</span>
              <select
                className="mt-1 w-full rounded-md border border-(--color-line-strong) bg-(--color-card) px-2 py-1.5 text-sm sm:w-auto"
                value={measure}
                onChange={(e) => setMeasure(e.target.value as keyof PairProbs)}
              >
                {MEASURES.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow block">
                Quanto deve essere sicuro il programma: {minProb}%
              </span>
              <input
                type="range" min={0} max={100} step={5} value={minProb}
                onChange={(e) => setMinProb(Number(e.target.value))}
                className="mt-2.5 w-44 accent-(--color-accent)"
              />
            </label>
            <label className="block w-full sm:w-auto">
              <span className="eyebrow block">Partito</span>
              <select
                className="mt-1 w-full rounded-md border border-(--color-line-strong) bg-(--color-card) px-2 py-1.5 text-sm sm:w-auto"
                value={gruppo}
                onChange={(e) => setGruppo(e.target.value)}
              >
                <option value="">tutti</option>
                {gruppi.map((g) => (
                  <option key={g} value={g}>
                    {nomeGruppo(g)} ({g})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1.5 text-[13px]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox" checked={soloIdentiche}
                  onChange={(e) => setSoloIdentiche(e.target.checked)}
                  className="accent-(--color-accent)"
                />
                solo testi identici parola per parola
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox" checked={soloPartitiDiversi}
                  onChange={(e) => setSoloPartitiDiversi(e.target.checked)}
                  className="accent-(--color-accent)"
                />
                solo tra partiti diversi
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox" checked={soloCamera}
                  onChange={(e) => setSoloCamera(e.target.checked)}
                  className="accent-(--color-accent)"
                />
                solo le coppie che la Camera segna come identiche
              </label>
            </div>
            <span className="ml-auto rounded-full bg-(--color-bg) px-3 py-1 text-[13px] font-semibold">
              {fmtNum(lista.length)} coppie
            </span>
          </div>

          <div className="space-y-5">
            {lista.slice(0, visibili).map((c) => (
              <PairCard key={`${c.a.key}|${c.b.key}`} c={c} attoId={attoId} />
            ))}
            {lista.length === 0 && (
              <p className="card text-(--color-faded)">
                Nessuna coppia sopra la soglia scelta.
              </p>
            )}
          </div>

          {lista.length > visibili && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setVisibili((v) => v + PAGE)}
                className="rounded-md border border-(--color-line-strong) bg-(--color-card) px-5 py-2.5 text-sm font-semibold hover:border-(--color-ink)"
              >
                Mostra altre {PAGE}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
