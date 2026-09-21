import Link from "next/link";
import { HBar, Spiega, Stat, Termine } from "./components";
import {
  fmtData,
  fmtEuro,
  getEmendamenti,
  getLatestAtto,
  getSummary,
} from "@/lib/data";
import { evidenze, IN_DUE_PAROLE, nomeAmbito, nomeEsito, nomeGruppo } from "@/lib/testi";

export default function Home() {
  const atto = getLatestAtto();
  if (!atto) {
    return (
      <p className="text-(--color-faded)">
        Nessun dato ancora pubblicato. La pipeline produce i JSON in public/data/.
      </p>
    );
  }
  const s = getSummary(atto.attoId);
  const emendamenti = getEmendamenti(atto.attoId);
  const topEuro = [...emendamenti]
    .filter((e) => e.importoEuro)
    .sort((a, b) => (b.importoEuro ?? 0) - (a.importoEuro ?? 0))
    .slice(0, 8);
  const maxGruppo = Math.max(...Object.values(s.per_gruppo).map((g) => g.n), 1);
  const maxAmbito = Math.max(...Object.values(s.per_ambito), 1);
  const sedute = [...new Set(emendamenti.map((e) => e.seduta))].sort();

  return (
    <div className="space-y-10">
      <section>
        <p className="label">
          <Termine id="legge-di-bilancio">La legge di bilancio 2025</Termine>
        </p>
        <h1 className="masthead-title mt-1 text-3xl sm:text-4xl leading-tight">{s.titolo}</h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          Pubblicati nelle sedute del {sedute.map(fmtData).join(", ")} ·{" "}
          {s.totale_emendamenti.toLocaleString("it-IT")} proposte distinte
          {s.occorrenze_bollettino
            ? ` (${s.occorrenze_bollettino.toLocaleString("it-IT")} righe negli elenchi, ripubblicazioni incluse)`
            : ""}
          , tutte lette dal programma.
        </p>
      </section>

      <section className="border border-(--color-line) bg-white/40 p-5">
        <h2 className="label">In due parole</h2>
        <div className="mt-3 max-w-3xl space-y-2 text-[1.02rem] leading-relaxed">
          {IN_DUE_PAROLE.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
          Quattro cose da sapere
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {evidenze(s).map((e) => (
            <div key={e.id} className="border-l border-(--color-line) pl-4">
              <div className="masthead-title num text-4xl">{e.numero}</div>
              <p className="mt-1 text-sm text-(--color-ink-soft)">{e.testo}</p>
              <Link
                href={`/glossario#${e.id}`}
                className="mt-1 inline-block text-xs text-(--color-accent) underline underline-offset-4"
              >
                cos'è →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          value={s.totale_emendamenti.toLocaleString("it-IT")}
          label={<Termine id="emendamento">proposte di modifica</Termine>}
        />
        <Stat
          value={s.fotocopie_esatte.toLocaleString("it-IT")}
          label={<Termine id="fotocopia-esatta">fotocopie esatte</Termine>}
          sub={`stesso testo, firme diverse; ${s.fotocopie_esatte_tra_gruppi.toLocaleString("it-IT")} tra partiti diversi`}
        />
        <Stat
          value={s.fotocopie_semantiche.toLocaleString("it-IT")}
          label={<Termine id="copia-riscritta">copie riscritte</Termine>}
          sub="testo diverso, stesso risultato (≥ 80%)"
        />
        <Stat
          value={s.localistici.toLocaleString("it-IT")}
          label={<Termine id="territorio-preciso">per un luogo o ente preciso</Termine>}
        />
        <Stat
          value={s.mirati.toLocaleString("it-IT")}
          label={<Termine id="su-misura">su misura</Termine>}
          sub={
            <>
              di cui <Termine id="mancetta">mancette</Termine>:{" "}
              {s.mance.toLocaleString("it-IT")}
            </>
          }
        />
        <Stat
          value={fmtEuro(s.euro_richiesti_stima)}
          label={<Termine id="euro-richiesti">euro richiesti</Termine>}
          sub="somma grezza delle cifre nei testi, non una spesa"
        />
      </section>
      <div className="-mt-6">
        <Spiega id="euro-richiesti" />
      </div>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
            Per partito
          </h2>
          <p className="mt-2 text-xs text-(--color-faded)">
            I partiti grandi depositano più emendamenti: guarda le proporzioni, non solo i
            totali.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="label border-b border-(--color-line) text-left">
                <th className="py-1 font-normal">Partito</th>
                <th className="py-1 text-right font-normal">Proposte</th>
                <th className="py-1 text-right font-normal">Per un luogo preciso</th>
                <th className="py-1 text-right font-normal">Su misura</th>
                <th className="py-1 text-right font-normal">Mancette</th>
                <th className="py-1 text-right font-normal">Euro nei testi (quante)</th>
                <th className="w-2/5 py-1 font-normal" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(s.per_gruppo)
                .sort((a, b) => b[1].n - a[1].n)
                .map(([g, r]) => (
                  <tr key={g} className="border-b border-(--color-line)">
                    <td className="py-1.5 pr-2">
                      <span className="font-semibold">{nomeGruppo(g)}</span>
                      <span className="block text-xs text-(--color-faded)">{g}</span>
                    </td>
                    <td className="num py-1.5 text-right">{r.n}</td>
                    <td className="num py-1.5 text-right">{r.localistici}</td>
                    <td className="num py-1.5 text-right">{r.mirati}</td>
                    <td className="num py-1.5 text-right">{r.mance}</td>
                    <td className="num py-1.5 text-right">
                      {r.euro ? `${fmtEuro(r.euro)} (${r.n_con_importo})` : "—"}
                    </td>
                    <td className="py-1.5 pl-3">
                      <div className="h-3 bg-(--color-paper-dark)">
                        <div className="bar-fill h-full" style={{ width: `${(r.n / maxGruppo) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
            Di cosa parlano
          </h2>
          <div className="mt-3">
            {Object.entries(s.per_ambito)
              .sort((a, b) => b[1] - a[1])
              .map(([ambito, n]) => (
                <HBar key={ambito} label={nomeAmbito(ambito)} value={n} max={maxAmbito} />
              ))}
          </div>
          <h2 className="masthead-title mt-8 border-b border-(--color-line) pb-2 text-2xl">
            Che fine hanno fatto
          </h2>
          <div className="mt-3">
            {Object.entries(s.per_esito)
              .sort((a, b) => b[1] - a[1])
              .map(([esito, n]) => (
                <HBar
                  key={esito}
                  label={nomeEsito(esito)}
                  value={n}
                  max={Math.max(...Object.values(s.per_esito))}
                />
              ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
          Le richieste più grandi scritte nei testi
        </h2>
        <div className="mt-1">
          <Spiega id="euro-richiesti" />
        </div>
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {topEuro.map((e) => (
            <div key={e.key} className="border-b border-(--color-line) pb-2">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/emendamento/${encodeURIComponent(e.key)}?atto=${atto.attoId}`}
                  className="font-semibold hover:text-(--color-accent)"
                >
                  Em. {e.id}
                </Link>
                <span className="num text-lg font-semibold text-(--color-accent)">
                  {e.importoEuro ? fmtEuro(e.importoEuro) : ""}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-(--color-ink-soft)">{e.testo}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rule-thin pt-4 text-sm">
        <Link href="/coppie" className="text-(--color-accent) underline underline-offset-4">
          Guarda le coppie di emendamenti che si somigliano →
        </Link>
      </section>
    </div>
  );
}
