import { Card } from "@/app/components";
import { fmtNum, getChiFirma, getGruppiMatrix, getLatestAtto } from "@/lib/data";
import { CHI_FIRMA, nomeGruppo, NOTA_MATRICE_DIAGONALE } from "@/lib/testi";

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
    <div className="space-y-8">
      <header>
        <p className="eyebrow">I gruppi parlamentari a confronto</p>
        <h1 className="display mt-1 text-4xl">Chi copia chi</h1>
        <p className="mt-2 max-w-3xl text-(--color-ink-soft)">
          Ogni riga e ogni colonna è un partito. Il numero nella casella dice quante coppie di
          emendamenti «gemelli» (stesso risultato o stessa bozza, con almeno{" "}
          {Math.round(m.soglia * 100)}% di sicurezza) hanno un emendamento di un partito e uno
          dell'altro. Più la casella è scura, più i due partiti hanno depositato testi uguali.
          La diagonale (grigia) conta le copie interne a uno stesso partito. Come leggerla:
          prendi la riga di un partito e scorri — le caselle scure sono i partiti con cui
          condivide più testi.
        </p>
      </header>

      <Card title="Matrice delle coppie tra partiti">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="overflow-x-auto lg:col-span-8">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="eyebrow p-1 text-left align-bottom font-normal">
                    un testo di \ e uno di
                  </th>
                  {m.gruppi.map((g) => (
                    <th
                      key={g}
                      className="eyebrow p-1 align-bottom font-normal"
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
                    <td className="p-1 pr-3 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold">{nomeGruppo(a)}</span>{" "}
                      <span className="eyebrow">{a}</span>
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
                                ? "var(--color-bg)"
                                : `color-mix(in srgb, var(--color-accent) ${Math.round(intensity * 90)}%, var(--color-card))`,
                            color:
                              intensity > 0.5 ? "var(--color-card)" : "var(--color-ink)",
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
            <div className="mt-3 flex items-center gap-2 text-[13px] text-(--color-faded)">
              <span>meno</span>
              <span
                className="h-2.5 w-32 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-card), var(--color-accent))",
                  border: "1px solid var(--color-line)",
                }}
              />
              <span>più coppie</span>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-md border-l-4 border-(--color-accent) bg-(--color-accent-soft) p-4">
              <p className="eyebrow">Cosa significa</p>
              <p className="mt-2 text-sm leading-relaxed">
                Le fotocopie tra partiti diversi nascono di solito da un testo scritto fuori
                dal Parlamento — associazioni, categorie, gruppi di interesse — e consegnato
                a più deputati. Non è illegale, ma dice chi scrive davvero le leggi.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-ink-soft)">
                {NOTA_MATRICE_DIAGONALE}
              </p>
            </div>
            <p className="mt-4 text-[13px] text-(--color-faded)">
              {fmtNum(totale)} coppie sopra soglia · {m.note}
            </p>
          </aside>
        </div>
      </Card>

      <Card title={CHI_FIRMA.titolo}>
        <p className="mb-4 max-w-3xl text-sm text-(--color-ink-soft)">{CHI_FIRMA.intro}</p>
        <div className="overflow-x-auto">
          <table className="tbl text-sm">
            <thead>
              <tr>
                {CHI_FIRMA.colonne.map((c, i) => (
                  <th key={c} className={i >= 2 ? "num" : undefined}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chi.deputati.map((d) => {
                const quota = d.n_depositati ? d.n_identici / d.n_depositati : 0;
                return (
                  <tr key={d.idPersona || d.nome}>
                    <td className="font-semibold">{d.nome}</td>
                    <td>
                      {nomeGruppo(d.gruppo)}{" "}
                      <span className="text-xs text-(--color-faded)">{d.gruppo}</span>
                    </td>
                    <td className="num">{d.n_identici}</td>
                    <td className="num">{d.n_depositati}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <div className="meter-track w-[100px]">
                          <div
                            className="meter-fill navy"
                            style={{ width: `${Math.round(quota * 100)}%` }}
                          />
                        </div>
                        <span className="num w-10 text-right text-sm whitespace-nowrap">
                          {Math.round(quota * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-(--color-ink-soft)">
          {chi.totale_deputati_con_identici} deputati hanno firmato per primi almeno un testo
          identico a un altro.
        </p>
      </Card>
    </div>
  );
}
