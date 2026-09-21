import { COSA_NON_DICE, GLOSSARIO } from "@/lib/testi";

export const metadata = { title: "Le parole, spiegate — Fotocopiatrice" };

export default function GlossarioPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="masthead-title text-3xl">Le parole, spiegate</h1>
        <p className="mt-1 text-sm text-(--color-ink-soft)">
          Tutto quello che c'è da sapere per leggere questo sito, in ordine di apparizione.
          Nessuna conoscenza richiesta.
        </p>
      </header>

      {GLOSSARIO.map((v) => (
        <section key={v.id} id={v.id} className="scroll-mt-24">
          <h2 className="masthead-title border-b border-(--color-line) pb-1 text-2xl">
            {v.titolo}
          </h2>
          <p className="mt-2">{v.spiegazione}</p>
          {v.perche && (
            <div className="mt-3 border-l-2 border-(--color-accent) bg-white/40 py-2 pl-4">
              <p className="label">Perché ti riguarda</p>
              <p className="mt-1 text-sm">{v.perche}</p>
            </div>
          )}
        </section>
      ))}

      <section className="scroll-mt-24" id="cosa-non-dice">
        <h2 className="masthead-title border-b border-(--color-line) pb-1 text-2xl">
          Cosa questo sito NON dice
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {COSA_NON_DICE.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
