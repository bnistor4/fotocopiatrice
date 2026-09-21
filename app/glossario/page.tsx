import { Card } from "@/app/components";
import { COSA_NON_DICE, GLOSSARIO } from "@/lib/testi";

export const metadata = { title: "Le parole, spiegate — Fotocopiatrice" };

export default function GlossarioPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Glossario</p>
        <h1 className="display mt-1 text-4xl">Le parole, spiegate</h1>
        <p className="mt-2 max-w-3xl text-(--color-ink-soft)">
          Tutto quello che c'è da sapere per leggere questo sito, in ordine di apparizione.
          Nessuna conoscenza richiesta.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="card sticky top-6">
            <p className="eyebrow mb-3">Indice</p>
            <ul className="space-y-1.5">
              {GLOSSARIO.map((v) => (
                <li key={v.id}>
                  <a
                    href={`#${v.id}`}
                    className="text-[13px] text-(--color-ink-soft) hover:text-(--color-accent)"
                  >
                    {v.titolo}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#cosa-non-dice"
                  className="text-[13px] font-medium text-(--color-accent)"
                >
                  Cosa questo sito NON dice
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="space-y-5 lg:col-span-9">
          {GLOSSARIO.map((v) => (
            <Card key={v.id} className="scroll-mt-24" title={v.titolo}>
              <span id={v.id} className="block scroll-mt-24" />
              <p className="leading-relaxed">{v.spiegazione}</p>
              {v.perche && (
                <div className="mt-4 rounded-md border-l-4 border-(--color-accent) bg-(--color-accent-soft) p-4">
                  <p className="eyebrow">Perché ti riguarda</p>
                  <p className="mt-1 text-sm leading-relaxed">{v.perche}</p>
                </div>
              )}
            </Card>
          ))}

          <Card title="Cosa questo sito NON dice" className="scroll-mt-24">
            <span id="cosa-non-dice" className="block scroll-mt-24" />
            <ul className="list-disc space-y-2 pl-5">
              {COSA_NON_DICE.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
