import { getChiFirma, getGruppiMatrix, getLatestAtto } from "@/lib/data";
import { CHI_FIRMA, nomeGruppo } from "@/lib/testi";

export default function GruppiPage() {
  const atto = getLatestAtto();
  if (!atto) return <p className="text-(--color-faded)">Nessun dato pubblicato.</p>;
  const m = getGruppiMatrix(atto.attoId);
  const chi = getChiFirma(atto.attoId);
  const max = Math.max(
    ...m.gruppi.flatMap((a) => m.gruppi.map((b) => (a === b ? 0 : m.counts[a]?.[b] ?? 0))),
    1,
  );
  const totale = m.gruppi.reduce(
    (acc, a) => acc + m.gruppi.reduce((x, b) => x + (m.counts[a]?.[b] ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="masthead-title text-3xl">Chi copia chi</h1>
        <p className="mt-1 max-w-3xl text-sm text-(--color-ink-soft)">
          Ogni riga e ogni colonna è un partito. Il numero nella casella dice quante coppie di
          emendamenti «gemelli» (stesso risultato o stessa bozza, con almeno{" "}
          {Math.round(m.soglia * 100)}% di sicurezza) hanno un emendamento di un partito e uno
          dell'altro. Più la casella è scura, più i due partiti hanno depositato testi uguali.
          La diagonale (grigia) conta le copie interne a uno stesso partito.
        </p>
        <p className="mt-1 max-w-3xl text-sm text-(--color-ink-soft)">
          Come leggerla: prendi la riga di un partito e scorri — le caselle scure sono i partiti
          con cui condivide più testi.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="label p-1 text-left font-normal">un testo di \ e uno di</th>
              {m.gruppi.map((g) => (
                <th
                  key={g}
                  className="label p-1 font-normal"
                  style={{ writingMode: "vertical-rl" }}
                  title={nomeGruppo(g)}
                >
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.gruppi.map((a) => (
              <tr key={a}>
                <td className="p-1 pr-2 text-right whitespace-nowrap">
                  <span className="text-sm font-semibold">{nomeGruppo(a)}</span>{" "}
                  <span className="label">{a}</span>
                </td>
                {m.gruppi.map((b) => {
                  const v = m.counts[a]?.[b] ?? 0;
                  const intensity = a === b ? 0 : Math.min(v / max, 1);
                  return (
                    <td
                      key={b}
                      className="cell"
                      title={`${nomeGruppo(a)} ↔ ${nomeGruppo(b)}: ${v} coppie`}
                      style={{
                        background:
                          a === b
                            ? "var(--color-paper-dark)"
                            : `color-mix(in srgb, var(--color-accent) ${Math.round(intensity * 90)}%, var(--color-paper))`,
                        color: intensity > 0.5 ? "var(--color-paper)" : "var(--color-ink)",
                      }}
                    >
                      {v || ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-w-3xl border-l-2 border-(--color-accent) bg-white/40 py-2 pl-4">
        <p className="label">Cosa significa</p>
        <p className="mt-1 text-sm">
          Le fotocopie tra partiti diversi nascono di solito da un testo scritto fuori dal
          Parlamento — associazioni, categorie, gruppi di interesse — e consegnato a più
          deputati. Non è illegale, ma dice chi scrive davvero le leggi.
        </p>
      </div>

      <p className="text-xs text-(--color-faded)">
        {totale.toLocaleString("it-IT")} coppie sopra soglia · {m.note}
      </p>

      <section className="pt-6">
        <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
          {CHI_FIRMA.titolo}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-(--color-ink-soft)">{CHI_FIRMA.intro}</p>
        <table className="mt-3 w-full max-w-3xl text-sm">
          <thead>
            <tr className="label border-b border-(--color-line) text-left">
              <th className="py-1 font-normal">{CHI_FIRMA.colonne[0]}</th>
              <th className="py-1 font-normal">{CHI_FIRMA.colonne[1]}</th>
              <th className="py-1 text-right font-normal">{CHI_FIRMA.colonne[2]}</th>
              <th className="py-1 text-right font-normal">{CHI_FIRMA.colonne[3]}</th>
              <th className="py-1 text-right font-normal">%</th>
            </tr>
          </thead>
          <tbody>
            {chi.deputati.map((d) => (
              <tr key={d.idPersona || d.nome} className="border-b border-(--color-line)">
                <td className="py-1.5 pr-2 font-semibold">{d.nome}</td>
                <td className="py-1.5 pr-2">
                  {nomeGruppo(d.gruppo)}{" "}
                  <span className="text-xs text-(--color-faded)">{d.gruppo}</span>
                </td>
                <td className="num py-1.5 text-right">{d.n_identici}</td>
                <td className="num py-1.5 text-right">{d.n_depositati}</td>
                <td className="num py-1.5 text-right">
                  {d.n_depositati ? Math.round((d.n_identici / d.n_depositati) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 max-w-3xl text-sm text-(--color-ink-soft)">
          {chi.totale_deputati_con_identici} deputati hanno firmato per primi almeno un testo
          identico a un altro.
        </p>
      </section>
    </div>
  );
}
