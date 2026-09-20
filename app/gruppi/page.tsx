import { getGruppiMatrix, getLatestAtto } from "@/lib/data";

export default function GruppiPage() {
  const atto = getLatestAtto();
  if (!atto) return <p className="text-(--color-faded)">Nessun dato pubblicato.</p>;
  const m = getGruppiMatrix(atto.attoId);
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
          Matrice dei gruppi politici: ogni cella conta le coppie di emendamenti dei due gruppi
          con probabilità di stesso effetto o stessa matrice ≥ {Math.round(m.soglia * 100)}%.
          La diagonale conta le copie interne allo stesso gruppo. Gruppo = quello del primo
          firmatario alla data della seduta.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="label p-1 text-left font-normal">da \ contro</th>
              {m.gruppi.map((g) => (
                <th key={g} className="label p-1 font-normal" style={{ writingMode: "vertical-rl" }}>
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.gruppi.map((a) => (
              <tr key={a}>
                <td className="label p-1 pr-2 text-right whitespace-nowrap">{a}</td>
                {m.gruppi.map((b) => {
                  const v = m.counts[a]?.[b] ?? 0;
                  const intensity = a === b ? 0 : Math.min(v / max, 1);
                  return (
                    <td
                      key={b}
                      className="cell"
                      title={`${a} ↔ ${b}: ${v} coppie`}
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
      <p className="text-xs text-(--color-faded)">
        {totale} coppie sopra soglia · {m.note}
      </p>
    </div>
  );
}
