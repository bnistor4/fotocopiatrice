"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Coppia, CoppieFile, PairProbs } from "@/lib/data";
import { nomeGruppo, voce } from "@/lib/testi";

const MEASURES: { key: keyof PairProbs; label: string; voceId: string }[] = [
  { key: "stesso_effetto", label: "stesso risultato", voceId: "stesso-risultato" },
  { key: "stessa_matrice", label: "stessa bozza", voceId: "stessa-bozza" },
  { key: "differenza_solo_numerica", label: "cambia solo un numero", voceId: "solo-un-numero" },
];

const pct = (p: number) => `${Math.round(p * 100)}%`;

function MiniBar({ p, label }: { p: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label w-36 shrink-0">{label}</span>
      <div className="prob-track grow">
        <div className="prob-fill" style={{ width: `${Math.round(p * 100)}%` }} />
      </div>
      <span className="num w-9 text-right text-xs">{pct(p)}</span>
    </div>
  );
}

function PairCard({ c, attoId }: { c: Coppia; attoId: string }) {
  const lato = (e: Coppia["a"]) => (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <Link
          href={`/emendamento/${encodeURIComponent(e.key)}?atto=${attoId}`}
          className="font-semibold hover:text-(--color-accent)"
        >
          Em. {e.id}
        </Link>
        <span className="label">art. {e.articolo}</span>
        <span className="label" title={e.gruppi.map(nomeGruppo).join(" · ")}>
          {e.gruppi.join(" · ") || "—"}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-(--color-ink-soft)">
        {e.testo}
      </p>
    </div>
  );
  return (
    <article className="border border-(--color-line) bg-white/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {MEASURES.map((m) => (
          <div key={m.key} className="w-52">
            <MiniBar p={c.probabilita[m.key]} label={m.label} />
          </div>
        ))}
        <span className="label" title={voce("parole-in-comune")?.breve}>
          parole in comune {Math.round(c.jaccard * 100)}%
        </span>
        {c.identMarkedByCamera && (
          <span
            className="border border-(--color-accent) px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-(--color-accent)"
            title={voce("segnalato-identico")?.breve}
          >
            La Camera stessa li segna come identici
          </span>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {lato(c.a)}
        <div className="border-t border-(--color-line) pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
          {lato(c.b)}
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
      c.a.gruppi.forEach((g) => s.add(g));
      c.b.gruppi.forEach((g) => s.add(g));
    }
    return [...s].sort();
  }, [data]);

  const lista = useMemo(() => {
    if (!data) return [];
    const base =
      measure === "stessa_matrice" ? data.byStessaMatrice : data.byStessoEffetto;
    return base
      .filter((c) => c.probabilita[measure] * 100 >= minProb)
      .filter((c) => !gruppo || c.a.gruppi.includes(gruppo) || c.b.gruppi.includes(gruppo))
      .filter((c) => !soloCamera || c.identMarkedByCamera);
  }, [data, measure, minProb, gruppo, soloCamera]);

  if (error) return <p className="text-(--color-accent)">Errore nel caricamento: {error}</p>;
  if (!data) return <p className="text-(--color-faded)">Caricamento delle coppie…</p>;

  const glossLink = (id: string, testo: string) => (
    <Link href={`/glossario#${id}`} title={voce(id)?.breve} className="termine">
      {testo}
    </Link>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="masthead-title text-3xl">Copie a confronto</h1>
        <p className="mt-1 max-w-3xl text-sm text-(--color-ink-soft)">
          Qui vedi due emendamenti affiancati ({titolo}). Sopra, tre barre dicono quanto il
          programma è sicuro che abbiano lo{" "}
          {glossLink("stesso-risultato", "stesso risultato")}, che vengano dalla{" "}
          {glossLink("stessa-bozza", "stessa bozza")}, o che{" "}
          {glossLink("solo-un-numero", "cambi solo un numero")}. Le barre sono{" "}
          {glossLink("probabilita", "percentuali")}, non verdetti. Le parole sottolineate
          portano alla spiegazione.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 border-y border-(--color-line) py-3">
        <label className="block">
          <span className="label block">Cosa confrontare</span>
          <select
            className="mt-1 border border-(--color-line) bg-transparent px-2 py-1 text-sm"
            value={measure}
            onChange={(e) => setMeasure(e.target.value as keyof PairProbs)}
          >
            {MEASURES.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label block">
            Quanto deve essere sicuro il programma: {minProb}%
          </span>
          <input
            type="range" min={0} max={100} step={5} value={minProb}
            onChange={(e) => setMinProb(Number(e.target.value))}
            className="mt-2 w-44 accent-(--color-accent)"
          />
        </label>
        <label className="block">
          <span className="label block">Partito</span>
          <select
            className="mt-1 border border-(--color-line) bg-transparent px-2 py-1 text-sm"
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox" checked={soloCamera}
            onChange={(e) => setSoloCamera(e.target.checked)}
            className="accent-(--color-accent)"
          />
          solo le coppie che la Camera segna come identiche
        </label>
        <span className="label ml-auto">{lista.length} coppie</span>
      </div>

      <div className="space-y-4">
        {lista.slice(0, 100).map((c) => (
          <PairCard key={`${c.a.key}|${c.b.key}`} c={c} attoId={attoId} />
        ))}
        {lista.length > 100 && (
          <p className="text-sm text-(--color-faded)">
            Mostrate le prime 100 di {lista.length} coppie — alza la soglia o filtra per
            partito.
          </p>
        )}
        {lista.length === 0 && (
          <p className="text-(--color-faded)">Nessuna coppia sopra la soglia scelta.</p>
        )}
      </div>
    </div>
  );
}
