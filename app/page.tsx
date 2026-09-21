import Link from "next/link";
import { Card, Kpi, Row, Spiega, Termine } from "./components";
import {
  fmtData,
  fmtEuro,
  fmtNum,
  getEmendamenti,
  getLatestAtto,
  getSummary,
} from "@/lib/data";
import { COSA_STAI_GUARDANDO, evidenze, nomeAmbito, nomeEsito, nomeGruppo } from "@/lib/testi";

const ATTO_URL = "https://www.camera.it/leg19/126?leg=19&idDocumento=2112bis&sede=&tipo=";

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
  const maxAmbito = Math.max(...Object.values(s.per_ambito), 1);
  const maxEsito = Math.max(...Object.values(s.per_esito), 1);
  const sedute = [...new Set(emendamenti.map((e) => e.seduta))].sort();
  const gruppi = Object.entries(s.per_gruppo).sort((a, b) => b[1].n - a[1].n);
  const maxQuota = Math.max(...gruppi.map(([, r]) => r.n / s.totale_emendamenti), 0.01);

  const esitoTone = (k: string) =>
    k === "approvato" ? "ok" : k === "inammissibile" ? "accent" : "faded";

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow">
            Legge di bilancio 2025 · Camera dei deputati · Commissione Bilancio
          </p>
          <h1 className="display mt-2 text-[40px] leading-tight">
            {fmtNum(s.totale_emendamenti)} proposte di modifica, lette una per
            una
          </h1>
          <p className="mt-2 text-[17px] text-(--color-ink-soft)">
            {s.titolo} — pubblicati nelle sedute del {sedute.map(fmtData).join(", ")}
            {s.occorrenze_bollettino
              ? `; ${fmtNum(s.occorrenze_bollettino)} righe negli elenchi, ripubblicazioni incluse`
              : ""}
            .
          </p>
        </div>
        <a
          href={ATTO_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden shrink-0 text-sm font-medium text-(--color-accent) underline underline-offset-4 lg:block"
        >
          Apri l'atto su camera.it ↗
        </a>
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-(--color-line) bg-(--color-line) lg:grid-cols-4">
        <div className="bg-(--color-card) p-5">
          <Kpi
            label={<Termine id="emendamento">Proposte di modifica</Termine>}
            value={fmtNum(s.totale_emendamenti)}
          />
        </div>
        <div className="bg-(--color-card) p-5">
          <Kpi
            label={<Termine id="fotocopia-esatta">Fotocopie esatte</Termine>}
            value={fmtNum(s.fotocopie_esatte)}
            sub={`${fmtNum(s.fotocopie_esatte_tra_gruppi)} tra partiti diversi`}
          />
        </div>
        <div className="bg-(--color-card) p-5">
          <Kpi
            label={<Termine id="copia-riscritta">Copie riscritte</Termine>}
            value={fmtNum(s.fotocopie_semantiche)}
            sub="testo diverso, stesso risultato"
          />
        </div>
        <div className="bg-(--color-card) p-5">
          <Kpi
            label={<Termine id="esito">Diventate legge</Termine>}
            value={fmtNum((s.per_esito.approvato ?? 0))}
            sub={`${fmtNum((s.per_esito.inammissibile ?? 0))} scartate prima del voto`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card title={COSA_STAI_GUARDANDO.titolo} className="lg:col-span-7">
          <ol className="space-y-5">
            {COSA_STAI_GUARDANDO.passi.map((p, i) => (
              <li key={p.titolo} className="flex gap-3.5">
                <span className="display flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-navy) text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{p.titolo.replace(/^\d+\.\s*/, "")}</p>
                  <p className="mt-0.5 leading-relaxed text-(--color-ink-soft)">{p.testo}</p>
                  {p.id && (
                    <Link
                      href={`/glossario#${p.id}`}
                      className="mt-1 inline-block text-[13px] font-medium text-(--color-accent)"
                    >
                      → approfondisci
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {s.esempio_fotocopia && (
          <Card title="Un esempio concreto" className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              {[s.esempio_fotocopia.a, s.esempio_fotocopia.b].map((l) => (
                <Link
                  key={l.key}
                  href={`/emendamento/${encodeURIComponent(l.key)}?atto=${atto.attoId}`}
                  className="rounded-md border border-(--color-line) p-3 hover:border-(--color-accent)"
                >
                  <p className="text-sm font-semibold">Em. {l.id}</p>
                  <p className="mt-0.5 text-[13px] text-(--color-ink-soft)">{l.nome}</p>
                  <p className="text-[13px] text-(--color-faded)">{nomeGruppo(l.gruppo)}</p>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              hanno depositato questo stesso testo, parola per parola:
            </p>
            <p className="mt-2 border-l-2 border-(--color-accent) pl-3 text-sm italic leading-relaxed text-(--color-ink-soft)">
              «{s.esempio_fotocopia.testo}»
            </p>
            <p className="mt-3 text-sm text-(--color-ink-soft)">
              Tradotto: due deputati di partiti diversi chiedono, con le stesse identiche
              parole,
              {s.esempio_fotocopia.importoEuro
                ? ` ${fmtEuro(s.esempio_fotocopia.importoEuro)} di soldi pubblici`
                : " soldi pubblici"}{" "}
              per un destinatario preciso. È molto probabile che il testo l'abbia scritto
              qualcun altro e l'abbia consegnato a entrambi.
            </p>
            <Link
              href="/coppie"
              className="mt-4 inline-block text-sm font-medium text-(--color-accent)"
            >
              Vedi tutte le coppie →
            </Link>
          </Card>
        )}
      </div>

      <section>
        <h2 className="display text-2xl">Quattro cose da sapere</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {evidenze(s).map((e) => (
            <div key={e.id} className="card">
              <p className="display num text-4xl">{e.numero}</p>
              <p className="mt-2 text-sm leading-snug text-(--color-ink-soft)">{e.testo}</p>
              <Link
                href={`/glossario#${e.id}`}
                className="mt-2 inline-block text-[13px] font-medium text-(--color-accent)"
              >
                cos'è →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Card title="Per partito">
        <div className="overflow-x-auto">
          <table className="tbl text-sm">
            <thead>
              <tr>
                <th>Partito</th>
                <th className="num">Proposte</th>
                <th>% sul totale</th>
                <th className="num">Per un luogo preciso</th>
                <th className="num">Su misura</th>
                <th className="num">Mancette</th>
                <th className="num">Euro nei testi (n)</th>
              </tr>
            </thead>
            <tbody>
              {gruppi.map(([g, r]) => {
                const quota = r.n / s.totale_emendamenti;
                return (
                  <tr key={g}>
                    <td>
                      <span className="font-semibold">{nomeGruppo(g)}</span>
                      <span className="block text-xs text-(--color-faded)">{g}</span>
                    </td>
                    <td className="num">{r.n}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="meter-track w-[120px] shrink-0">
                          <div
                            className="meter-fill navy"
                            style={{ width: `${(quota / maxQuota) * 100}%` }}
                          />
                        </div>
                        <span className="num text-sm whitespace-nowrap">
                          {quota.toLocaleString("it-IT", {
                            style: "percent",
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="num">{r.localistici}</td>
                    <td className="num">{r.mirati}</td>
                    <td className="num">{r.mance}</td>
                    <td className="num">
                      {r.euro ? `${fmtEuro(r.euro)} (${r.n_con_importo})` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-(--color-faded)">
          I partiti grandi depositano più emendamenti: guarda le proporzioni, non solo i
          totali.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Di cosa parlano">
          {Object.entries(s.per_ambito)
            .sort((a, b) => b[1] - a[1])
            .map(([ambito, n]) => (
              <Row
                key={ambito}
                label={nomeAmbito(ambito)}
                value={fmtNum(n)}
                pct={n / s.totale_emendamenti}
                bar={n / maxAmbito}
              />
            ))}
        </Card>
        <Card title="Che fine hanno fatto">
          {Object.entries(s.per_esito)
            .sort((a, b) => b[1] - a[1])
            .map(([esito, n]) => (
              <Row
                key={esito}
                label={nomeEsito(esito)}
                value={fmtNum(n)}
                pct={n / s.totale_emendamenti}
                bar={n / maxEsito}
                tone={esitoTone(esito)}
              />
            ))}
        </Card>
      </div>

      <Card title="Euro richiesti (stima grezza)">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <Kpi
            label="Totale delle cifre massime citate"
            value={fmtEuro(s.euro_richiesti_stima)}
            sub={`in ${fmtNum(s.n_con_importo)} testi su ${fmtNum(s.totale_emendamenti)}`}
          />
          <div className="max-w-xl grow">
            <Spiega id="euro-richiesti" />
          </div>
        </div>
        <div className="mt-5">
          {topEuro.map((e) => (
            <div
              key={e.key}
              className="flex items-baseline gap-4 border-b border-(--color-line) py-2.5 last:border-b-0"
            >
              <Link
                href={`/emendamento/${encodeURIComponent(e.key)}?atto=${atto.attoId}`}
                className="w-20 shrink-0 text-sm font-semibold hover:text-(--color-accent)"
              >
                Em. {e.id}
              </Link>
              <p className="min-w-0 grow truncate text-sm text-(--color-ink-soft)">{e.testo}</p>
              <span className="num shrink-0 text-sm font-semibold">
                {e.importoEuro ? fmtEuro(e.importoEuro) : ""}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-(--color-ink-soft)">
          Due emendamenti affiancati, con le firme e il giudizio del programma.
        </p>
        <Link
          href="/coppie"
          className="rounded-md bg-(--color-navy) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-ink)"
        >
          Guarda le coppie →
        </Link>
      </section>
    </div>
  );
}
