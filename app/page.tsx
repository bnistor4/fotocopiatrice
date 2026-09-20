import Link from "next/link";
import { HBar, Stat } from "./components";
import {
  fmtData,
  fmtEuro,
  getEmendamenti,
  getLatestAtto,
  getSummary,
} from "@/lib/data";

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
        <p className="label">L'atto esaminato</p>
        <h1 className="masthead-title mt-1 text-3xl sm:text-4xl leading-tight">{s.titolo}</h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          Sedute di pubblicazione: {sedute.map(fmtData).join(", ")} · {s.totale_emendamenti.toLocaleString("it-IT")}{" "}
          proposte emendative, {s.analizzati.toLocaleString("it-IT")} analizzate dal modello.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={s.totale_emendamenti.toLocaleString("it-IT")} label="emendamenti" />
        <Stat value={s.fotocopie_esatte.toLocaleString("it-IT")} label="fotocopie esatte" sub={`${s.gruppi_fotocopia_esatta} gruppi identici`} />
        <Stat value={s.fotocopie_semantiche.toLocaleString("it-IT")} label="copie semantiche" sub="stesso effetto ≥ 80%" />
        <Stat value={s.localistici.toLocaleString("it-IT")} label="localistici" sub="territorio o ente specifico" />
        <Stat value={s.mance.toLocaleString("it-IT")} label="mancette" sub="p(handout) ≥ 50%" />
        <Stat value={fmtEuro(s.euro_richiesti_totale)} label="euro richiesti" sub="somma degli importi nel testo" />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">Per gruppo politico</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="label border-b border-(--color-line) text-left">
                <th className="py-1 font-normal">Gruppo</th>
                <th className="py-1 text-right font-normal">Emend.</th>
                <th className="py-1 text-right font-normal">Localist.</th>
                <th className="py-1 text-right font-normal">Mancette</th>
                <th className="py-1 text-right font-normal">Euro</th>
                <th className="w-2/5 py-1 font-normal" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(s.per_gruppo)
                .sort((a, b) => b[1].n - a[1].n)
                .map(([g, r]) => (
                  <tr key={g} className="border-b border-(--color-line)">
                    <td className="py-1.5 pr-2 font-semibold">{g}</td>
                    <td className="num py-1.5 text-right">{r.n}</td>
                    <td className="num py-1.5 text-right">{r.localistici}</td>
                    <td className="num py-1.5 text-right">{r.mance}</td>
                    <td className="num py-1.5 text-right">{r.euro ? fmtEuro(r.euro) : "—"}</td>
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
          <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">Per ambito</h2>
          <div className="mt-3">
            {Object.entries(s.per_ambito)
              .sort((a, b) => b[1] - a[1])
              .map(([ambito, n]) => (
                <HBar key={ambito} label={ambito.replace(/_/g, " ")} value={n} max={maxAmbito} />
              ))}
          </div>
          <h2 className="masthead-title mt-8 border-b border-(--color-line) pb-2 text-2xl">Esiti</h2>
          <div className="mt-3">
            {Object.entries(s.per_esito)
              .sort((a, b) => b[1] - a[1])
              .map(([esito, n]) => (
                <HBar key={esito} label={esito} value={n} max={Math.max(...Object.values(s.per_esito))} />
              ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
          Le cifre più alte nel testo
        </h2>
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
          Sfoglia le coppie di emendamenti più simili →
        </Link>
      </section>
    </div>
  );
}
